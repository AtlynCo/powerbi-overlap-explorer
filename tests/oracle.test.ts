import { expect, it } from "vitest";
import { analyze, MembershipRow } from "../src/engine";

// Independent oracle: arrays of membership names and Boolean vectors; it never
// reads implementation masks/entities, calls primitiveKey, or aggregates buckets.
function oracle(rows: MembershipRow[], maximum: number, inclusive: boolean, minimum: number, top: number) {
  const typed = (value: unknown): string | null | undefined => {
    if (value === null || value === undefined || (typeof value === "string" && value.length <= 256 && value.trim() === "")) return null;
    if (typeof value === "string" && value.length <= 256) return `s:${value}`;
    if (typeof value === "number" && Number.isFinite(value)) return `n:${value}`;
    if (typeof value === "boolean") return `b:${value}`;
    if (value instanceof Date && Number.isFinite(value.getTime())) return `d:${value.toISOString()}`;
    return undefined;
  };
  const entities = new Map<string, { memberships: Set<string>; highlighted: boolean }>();
  for (const row of rows.slice(0, 30000)) {
    const id = typed(row.entity);
    const set = typed(row.set);
    if (!id || set === undefined) continue;
    const entry = entities.get(id) ?? { memberships: new Set(), highlighted: false };
    if (set !== null) entry.memberships.add(set);
    entry.highlighted ||= row.highlighted;
    entities.set(id, entry);
  }
  const names = [...new Set([...entities.values()].flatMap(entity => [...entity.memberships]))];
  const sizes = names.map(key => ({ key, count: [...entities.values()].filter(entity => entity.memberships.has(key)).length }));
  sizes.sort((a, b) => b.count - a.count || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  const retained = sizes.slice(0, maximum);
  const vectors: boolean[][] = [[]];
  for (let index = 0; index < retained.length; index++) {
    const prior = vectors.splice(0);
    for (const vector of prior) vectors.push([...vector, false], [...vector, true]);
  }
  const combinations = vectors.filter(vector => !inclusive || vector.some(Boolean)).map(vector => {
    const matched = [...entities.values()].filter(entity => vector.every((required, index) => {
      const member = entity.memberships.has(retained[index]!.key);
      return inclusive ? !required || member : required === member;
    }));
    return {
      // Integer encoding is only for comparing the external result, not counting.
      mask: vector.reduce((code, present, index) => code + Number(present) * (2 ** index), 0),
      count: matched.length, highlighted: matched.filter(entity => entity.highlighted).length
    };
  }).filter(item => item.count >= minimum)
    .sort((a, b) => b.count - a.count || a.mask - b.mask).slice(0, top);
  return { universe: entities.size, sizes: retained, combinations };
}

function dataset(seed: number): MembershipRow[] {
  let state = seed;
  const next = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state; };
  const sets: unknown[] = ["A", "B", 1, "1", false, "A,B", " A", new Date("2024-02-29Z"), "Z", "ZZ", "omitted", "more"];
  const rows: MembershipRow[] = [];
  for (let entity = 0; entity < 50; entity++) {
    const id = entity % 3 ? entity : String(entity);
    const count = next() % 8;
    for (let membership = 0; membership < Math.max(1, count); membership++) {
      const row = { entity: id, set: count ? sets[next() % sets.length] : null,
        identityKeys: [`${entity}:${membership}`], highlighted: next() % 3 === 0 };
      rows.push(row);
      if (next() % 5 === 0) rows.push({ ...row, identityKeys: [`duplicate:${entity}:${membership}`] });
    }
  }
  rows.push({ entity: "valid", set: " ".repeat(257), identityKeys: [], highlighted: true },
    { entity: "", set: "A", identityKeys: [], highlighted: true },
    { entity: "valid", set: {}, identityKeys: [], highlighted: true },
    { entity: NaN, set: "A", identityKeys: [], highlighted: true });
  return rows;
}

for (let seed = 1; seed <= 12; seed++) {
  it(`matches independent entity-by-entity oracle for seed ${seed}, projection, filters and both modes`, () => {
    const input = dataset(seed);
    for (const maxSets of [1, 3, 6, 10]) for (const inclusive of [false, true]) {
      const minimum = seed % 4 + 1;
      const top = seed % 2 ? 7 : 50;
      const expected = oracle(input, maxSets, inclusive, minimum, top);
      const result = analyze(input, { maxSets, inclusive, minimum, top });
      expect(result.universe).toBe(expected.universe);
      expect(result.sets.map(set => ({ key: set.key, count: set.size }))).toEqual(expected.sizes);
      expect(result.combinations).toEqual(expected.combinations);
      const shuffled = [...input].reverse();
      expect(analyze(shuffled, { maxSets, inclusive, minimum, top }).combinations).toEqual(expected.combinations);
    }
  });
}

it("rejects overlong blank-set strings and disambiguates typed/model-formatted collisions", () => {
  const result = analyze([
    { entity: "a", set: " ".repeat(257), identityKeys: [], highlighted: true },
    { entity: 1, set: 1, entityLabel: "same", setLabel: "same", identityKeys: [], highlighted: false },
    { entity: "1", set: "1", entityLabel: "same", setLabel: "same", identityKeys: [], highlighted: false }
  ]);
  expect(result.invalid).toBe(1);
  expect(result.universe).toBe(2);
  expect(new Set(result.entities.map(entity => entity.label)).size).toBe(2);
  expect(new Set(result.sets.map(set => set.label)).size).toBe(2);
});

it("preserves all distinct identities in 30,000 duplicate membership observations", () => {
  const rows = Array.from({ length: 30000 }, (_, index) => ({
    entity: "one", set: "A", identityKeys: [`opaque-${index}`], highlighted: index === 29999
  }));
  const result = analyze(rows, { inclusive: true });
  expect(result.universe).toBe(1);
  expect(result.deduplicated).toBe(29999);
  expect(result.entities[0]!.identityKeys.size).toBe(30000);
  expect(result.combinations).toEqual([{ mask: 1, count: 1, highlighted: 1 }]);
});

it("counts sparse input slots as invalid rather than reporting complete valid data", () => {
  const result = analyze(Array<MembershipRow>(3));
  expect(result.processed).toBe(3);
  expect(result.invalid).toBe(3);
  expect(result.universe).toBe(0);
});

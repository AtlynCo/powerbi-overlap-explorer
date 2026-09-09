import { describe, expect, it } from "vitest";
import { analyze, contributors, LIMITS, MembershipRow, normalizeOptions, primitiveKey, selectionKeys } from "../src/engine";

function row(entity: unknown, set: unknown, identity = String(entity), highlighted = false): MembershipRow {
  return { entity, set, identityKeys: [identity], highlighted };
}

const ownership = [
  row("C1", "A"), row("C1", "B"), row("C2", "A"), row("C3", "B"),
  row("C4", "A"), row("C4", "B"), row("C4", "C"), row("C5", null)
];

describe("entity-level semantics", () => {
  it("counts distinct exclusive combinations including the explicit zero universe", () => {
    const result = analyze(ownership);
    expect(result.universe).toBe(5);
    expect(result.sets.map(set => [set.label, set.size])).toEqual([["A", 3], ["B", 3], ["C", 1]]);
    expect(result.zero).toBe(1);
    expect(result.combinations.reduce((sum, item) => sum + item.count, 0)).toBe(5);
    expect(contributors(result, 3).map(entity => entity.label)).toEqual(["C1"]);
  });

  it("inclusive intersections include supersets but not the empty intersection", () => {
    const result = analyze(ownership, { inclusive: true });
    expect(result.combinations.find(item => item.mask === 3)?.count).toBe(2);
    expect(result.combinations.find(item => item.mask === 1)?.count).toBe(3);
    expect(result.combinations.find(item => item.mask === 0)).toBeUndefined();
    expect(contributors(result, 3).map(entity => entity.label)).toEqual(["C1", "C4"]);
    expect(result.combinations.reduce((sum, item) => sum + item.count, 0)).toBeGreaterThan(result.universe);
  });

  it("deduplicates observations but retains every host identity and highlight", () => {
    const result = analyze([row("C1", "A", "id1"), row("C1", "A", "id2", true), row("C1", "B", "id3")]);
    expect(result.deduplicated).toBe(1);
    expect(result.universe).toBe(1);
    expect(selectionKeys(result.entities)).toEqual({ keys: ["id1", "id2", "id3"] });
    expect(result.combinations[0]?.highlighted).toBe(1);
  });

  it("blank membership does not override a positive membership", () => {
    const result = analyze([row("X", null), row("X", "A"), row("Y", " "), row("Y", "")]);
    expect(result.universe).toBe(2);
    expect(result.zero).toBe(1);
    expect(result.deduplicated).toBe(1);
  });

  it("rejects invalid entities and nonprimitive sets rather than merging labels", () => {
    const result = analyze([row("", "A"), row(null, "A"), row(NaN, "A"), row("valid", {}),
      row("x".repeat(257), "A"), row(1, "A"), row("1", "A"), row(true, "A")]);
    expect(result.invalid).toBe(5);
    expect(result.universe).toBe(3);
    expect(primitiveKey(new Date("invalid"))).toBeUndefined();
    expect(primitiveKey(new Date("2026-01-01T00:00:00Z"))).toBe("d:2026-01-01T00:00:00.000Z");
  });

  it("uses raw typed keys not potentially colliding formatted labels", () => {
    const result = analyze([{ ...row(1, 1), entityLabel: "same", setLabel: "same" },
      { ...row(2, 2), entityLabel: "same", setLabel: "same" }]);
    expect(result.universe).toBe(2);
    expect(result.sets).toHaveLength(2);
  });

  it("preserves safe 16-digit numbers, signed IDs and longer numeric text without coercion", () => {
    const result = analyze([
      row(1000000000000000, "A", "numeric-first"), row(1000000000000001, "A", "numeric-second"),
      row("9007199254740992", "A", "text-first"), row("9007199254740993", "A", "text-second"),
      row(-1000000000000001, "B", "negative"), row(0, "B", "zero"),
      row("1000000000000000", "B", "same-digits-as-number")
    ]);
    expect(result.invalid).toBe(0);
    expect(result.universe).toBe(7);
    expect(result.sets.map(set => set.size)).toEqual([4, 3]);
    expect(selectionKeys(result.entities).keys).toHaveLength(7);
    expect(primitiveKey(1000000000000001)).toBe("n:1000000000000001");
  });

  it("projects rather than silently excluding entities when sets are reduced", () => {
    const result = analyze(ownership, { maxSets: 1 });
    expect(result.omittedSets).toBe(2);
    expect(result.sets[0]?.label).toBe("A");
    expect(result.zero).toBe(2);
    expect(result.universe).toBe(5);
    expect(result.combinations.map(item => item.count)).toEqual([3, 2]);
  });

  it("top/minimum hide buckets without merging them into a misleading Other", () => {
    const result = analyze(ownership, { inclusive: true, top: 2, minimum: 2 });
    expect(result.combinations).toHaveLength(2);
    expect(result.hiddenCombinations).toBe(5);
    expect(result.universe).toBe(5);
  });

  it("empty and all-invalid inputs have zero denominators, not percentages of NaN", () => {
    expect(analyze([]).universe).toBe(0);
    expect(analyze([row(null, "A")]).combinations).toEqual([]);
    expect(analyze([row("A", null)], { inclusive: true }).combinations).toEqual([]);
  });

  it("bounds processing and reports received rows excluded from the snapshot", () => {
    const result = analyze(Array.from({ length: LIMITS.rows + 3 }, (_, index) => row(index, "A")));
    expect(result.received).toBe(30003);
    expect(result.processed).toBe(30000);
    expect(result.dropped).toBe(3);
    expect(result.universe).toBe(30000);
    expect(normalizeOptions({ maxSets: Infinity, top: 900, minimum: -2 })).toEqual({
      maxSets: 6, top: 50, minimum: 1, inclusive: false
    });
  });

  it("refuses missing and oversized native identity selections without a partial subset", () => {
    const missing = analyze([{ ...row("X", "A"), identityKeys: [] }, row("X", "A", "present")]);
    expect(selectionKeys(missing.entities)).toEqual({ keys: [], reason: "missing" });
    const large = analyze(Array.from({ length: 1001 }, (_, index) => row(index, "A")));
    expect(selectionKeys(large.entities)).toEqual({ keys: [], reason: "limit" });
    expect(selectionKeys(large.entities.slice(0, 1000)).keys).toHaveLength(1000);
  });

  it("recomputes filtered universes from only the current snapshot", () => {
    analyze(ownership);
    const filtered = analyze(ownership.filter(item => item.entity === "C1"));
    expect(filtered.universe).toBe(1);
    expect(filtered.sets.map(set => set.size)).toEqual([1, 1]);
    expect(filtered.combinations).toEqual([{ mask: 3, count: 1, highlighted: 0 }]);
  });
});

describe("exhaustive bounded properties", () => {
  for (let width = 1; width <= 7; width++) {
    it(`agrees with a brute-force oracle for all masks at ${width} sets`, () => {
      const rows: MembershipRow[] = [];
      for (let mask = 0; mask < 1 << width; mask++) {
        if (!mask) rows.push(row(mask, null));
        for (let bit = 0; bit < width; bit++) if (mask & (1 << bit)) rows.push(row(mask, `S${bit}`, `id${mask}`, mask % 2 === 0));
      }
      const exact = analyze(rows, { maxSets: 10, top: 50 });
      const inclusive = analyze(rows, { maxSets: 10, top: 50, inclusive: true });
      expect(exact.universe).toBe(1 << width);
      expect(exact.combinations.every(item => item.count === 1)).toBe(true);
      for (const bucket of inclusive.combinations) {
        const brute = inclusive.entities.filter(entity => (entity.mask & bucket.mask) === bucket.mask);
        expect(bucket.count).toBe(brute.length);
        expect(bucket.highlighted).toBe(brute.filter(entity => entity.highlighted).length);
        expect(contributors(inclusive, bucket.mask)).toEqual(brute);
      }
      const reversed = analyze([...rows].reverse(), { maxSets: 10, top: 50, inclusive: true });
      expect(reversed.sets).toEqual(inclusive.sets);
      expect(reversed.combinations).toEqual(inclusive.combinations);
      const doubled = analyze([...rows, ...rows], { maxSets: 10, top: 50, inclusive: true });
      expect(doubled.combinations).toEqual(inclusive.combinations);
      expect(doubled.universe).toBe(inclusive.universe);
    });
  }

  it("caps inclusive topology at 1023 combinations even for full 10-set membership", () => {
    const rows = Array.from({ length: 10 }, (_, bit) => row("all", `S${bit}`));
    const result = analyze(rows, { maxSets: 10, top: 50, inclusive: true });
    expect(result.combinations.length + result.hiddenCombinations).toBe(1023);
    expect(result.combinations.every(item => item.count === 1)).toBe(true);
  });
});

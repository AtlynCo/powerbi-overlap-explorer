export const LIMITS = Object.freeze({
  rows: 30000, sets: 10, combinations: 50, identities: 1000, details: 200, text: 256
});

export interface MembershipRow {
  entity: unknown;
  set: unknown;
  entityLabel?: string;
  setLabel?: string;
  identityKeys: string[];
  highlighted: boolean;
}

export interface AnalysisOptions {
  inclusive: boolean;
  maxSets: number;
  top: number;
  minimum: number;
}

export interface Entity {
  key: string;
  label: string;
  memberships: Set<string>;
  identityKeys: Set<string>;
  missingIdentity: boolean;
  highlighted: boolean;
  mask: number;
}

export interface MembershipSet { key: string; label: string; size: number }
export interface Combination { mask: number; count: number; highlighted: number }
export interface Analysis {
  entities: Entity[];
  sets: MembershipSet[];
  combinations: Combination[];
  universe: number;
  zero: number;
  received: number;
  processed: number;
  invalid: number;
  deduplicated: number;
  dropped: number;
  omittedSets: number;
  hiddenCombinations: number;
  options: AnalysisOptions;
}

export function boundedInteger(value: unknown, fallback: number, min: number, max: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(min, Math.min(max, Math.floor(value))) : fallback;
}

export function normalizeOptions(options: Partial<AnalysisOptions>): AnalysisOptions {
  return {
    inclusive: options.inclusive === true,
    maxSets: boundedInteger(options.maxSets, 6, 1, LIMITS.sets),
    top: boundedInteger(options.top, 20, 1, LIMITS.combinations),
    minimum: boundedInteger(options.minimum, 1, 1, LIMITS.rows)
  };
}

// Typed keys keep 1, "1", and true distinct; labels never serve as host identities.
export function primitiveKey(value: unknown): string | undefined {
  if (typeof value === "string")
    return value.trim().length > 0 && value.length <= LIMITS.text ? `s:${value}` : undefined;
  if (typeof value === "number") return Number.isFinite(value) ? `n:${value}` : undefined;
  if (typeof value === "boolean") return `b:${value}`;
  if (value instanceof Date && Number.isFinite(value.getTime())) return `d:${value.toISOString()}`;
  return undefined;
}

function isBlank(value: unknown): boolean {
  return value === null || value === undefined || (typeof value === "string" && !value.trim());
}

function label(value: unknown, formatted?: string): string {
  const raw = value instanceof Date ? value.toISOString() : String(value);
  return (formatted || raw).slice(0, LIMITS.text);
}

export function ordinal(a: string, b: string): number { return a < b ? -1 : a > b ? 1 : 0; }

export function analyze(rows: readonly MembershipRow[], options: Partial<AnalysisOptions> = {}, received = rows.length): Analysis {
  const config = normalizeOptions(options);
  const entities = new Map<string, Entity>();
  const sets = new Map<string, MembershipSet>();
  const seen = new Set<string>();
  let invalid = 0;
  let deduplicated = 0;
  const processed = Math.min(rows.length, LIMITS.rows);
  for (let index = 0; index < processed; index++) {
    const row = rows[index];
    if (!row) continue;
    const entityKey = primitiveKey(row.entity);
    const setKey = isBlank(row.set) ? null : primitiveKey(row.set);
    if (entityKey === undefined || setKey === undefined) { invalid++; continue; }
    let entity = entities.get(entityKey);
    if (!entity) {
      entity = { key: entityKey, label: label(row.entity, row.entityLabel), memberships: new Set(),
        identityKeys: new Set(), missingIdentity: false, highlighted: false, mask: 0 };
      entities.set(entityKey, entity);
    }
    // Duplicate membership observations must still contribute every represented host identity.
    row.identityKeys.forEach(key => entity.identityKeys.add(key));
    entity.missingIdentity ||= row.identityKeys.length === 0;
    entity.highlighted ||= row.highlighted;
    const membershipKey = JSON.stringify([entityKey, setKey]);
    if (seen.has(membershipKey)) { deduplicated++; continue; }
    seen.add(membershipKey);
    if (setKey !== null) {
      entity.memberships.add(setKey);
      const set = sets.get(setKey);
      if (set) set.size++;
      else sets.set(setKey, { key: setKey, label: label(row.set, row.setLabel), size: 1 });
    }
  }
  const retained = [...sets.values()].sort((a, b) => b.size - a.size || ordinal(a.key, b.key)).slice(0, config.maxSets);
  const members = [...entities.values()].sort((a, b) => ordinal(a.key, b.key));
  const exact = new Map<number, Combination>();
  for (const entity of members) {
    retained.forEach((set, bit) => { if (entity.memberships.has(set.key)) entity.mask |= 1 << bit; });
    const combination = exact.get(entity.mask);
    if (combination) { combination.count++; combination.highlighted += Number(entity.highlighted); }
    else exact.set(entity.mask, { mask: entity.mask, count: 1, highlighted: Number(entity.highlighted) });
  }
  const counts = new Map<number, Combination>();
  if (config.inclusive) {
    // At most 10 sets: enumerate subsets of observed exact masks, not an unbounded power set.
    // Aggregate exact buckets first, keeping work <= 3^10 rather than rows * 2^10.
    for (const combination of exact.values()) {
      for (let subset = combination.mask; subset > 0; subset = (subset - 1) & combination.mask) {
        const current = counts.get(subset);
        if (current) {
          current.count += combination.count;
          current.highlighted += combination.highlighted;
        } else counts.set(subset, { ...combination, mask: subset });
      }
    }
  } else {
    exact.forEach((combination, mask) => counts.set(mask, combination));
  }
  const ranked = [...counts.values()].filter(item => item.count >= config.minimum)
    .sort((a, b) => b.count - a.count || a.mask - b.mask);
  const combinations = ranked.slice(0, config.top);
  return {
    entities: members, sets: retained, combinations, universe: members.length,
    zero: exact.get(0)?.count ?? 0, received, processed, invalid, deduplicated,
    dropped: Math.max(0, received - processed), omittedSets: sets.size - retained.length,
    hiddenCombinations: counts.size - combinations.length, options: config
  };
}

export function contributors(analysis: Analysis, mask: number): Entity[] {
  return analysis.entities.filter(entity => analysis.options.inclusive
    ? mask !== 0 && (entity.mask & mask) === mask : entity.mask === mask);
}

export function selectionKeys(entities: readonly Entity[]): { keys: string[]; reason?: "missing" | "limit" } {
  if (entities.some(entity => entity.missingIdentity || entity.identityKeys.size === 0))
    return { keys: [], reason: "missing" };
  const keys = new Set<string>();
  for (const entity of entities) {
    for (const key of entity.identityKeys) {
      keys.add(key);
      if (keys.size > LIMITS.identities) return { keys: [], reason: "limit" };
    }
  }
  return { keys: [...keys] };
}

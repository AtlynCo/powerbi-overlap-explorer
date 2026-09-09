import powerbi from "powerbi-visuals-api";
import { valueFormatter } from "powerbi-visuals-utils-formattingutils";
import { LIMITS, MembershipRow, isEntityValue, isBlankSet } from "./engine";

export interface ParsedData {
  rows: MembershipRow[];
  identities: Map<string, powerbi.visuals.ISelectionId>;
  received: number;
  segmented: boolean;
  highlights: boolean;
  error?: "Binding" | "Shape";
}

export function parseData(
  view: powerbi.DataView | undefined,
  host: powerbi.extensibility.visual.IVisualHost
): ParsedData {
  const result: ParsedData = { rows: [], identities: new Map(), received: 0,
    segmented: view?.metadata.segment !== undefined, highlights: false };
  const categories = view?.categorical?.categories ?? [];
  const entities = categories.filter(column => column.source.roles?.entity);
  const sets = categories.filter(column => column.source.roles?.set);
  const signals = view?.categorical?.values?.filter(column => column.source.roles?.signal) ?? [];
  if (entities.length !== 1 || sets.length !== 1 || signals.length > 1 || categories.length !== 2 ||
      (view?.categorical?.values?.length ?? 0) !== signals.length) {
    result.error = "Binding";
    return result;
  }
  const entity = entities[0]!;
  const set = sets[0]!;
  const signal = signals[0];
  result.received = Math.max(entity.values.length, set.values.length);
  if (entity === set || entity.values.length !== set.values.length ||
      (signal && (signal.values.length !== entity.values.length ||
        (signal.highlights !== undefined && (!Array.isArray(signal.highlights) || signal.highlights.length !== entity.values.length))))) {
    result.error = "Shape";
    return result;
  }
  result.highlights = signal?.highlights !== undefined;
  const formatted = (value: powerbi.PrimitiveValue | undefined, format?: string): string | undefined => {
    // Text categories are already display text, not numeric measures. Avoid
    // formatter/key allocations for every repeated long-form membership row.
    if (typeof value === "string") return value;
    return !isEntityValue(value) ? undefined
      : valueFormatter.format(value, format, false, host.locale).slice(0, LIMITS.text);
  };
  for (let index = 0; index < Math.min(result.received, LIMITS.rows); index++) {
    const valid = isEntityValue(entity.values[index]) && (isBlankSet(set.values[index]) || isEntityValue(set.values[index]));
    if (!valid) {
      // Retain an invalid-row counter slot, not oversized values or arbitrary
      // objects in the resize cache after the host snapshot can be released.
      result.rows.push({ entity: undefined, set: undefined, identityKeys: [], highlighted: false });
      continue;
    }
    const keys: string[] = [];
    if (entity.identity?.[index]) {
      const id = host.createSelectionIdBuilder().withCategory(entity, index).createSelectionId();
      if (id.hasIdentity()) {
        const key = id.getKey();
        result.identities.set(key, id);
        keys.push(key);
      }
    }
    const highlight = signal?.highlights?.[index];
    result.rows.push({
      entity: entity.values[index], set: set.values[index], identityKeys: keys,
      entityLabel: formatted(entity.values[index], entity.source.format),
      setLabel: formatted(set.values[index], set.source.format),
      highlighted: typeof highlight === "number" && Number.isFinite(highlight) && highlight > 0
    });
  }
  return result;
}

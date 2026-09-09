import powerbi from "powerbi-visuals-api";
import { valueFormatter } from "powerbi-visuals-utils-formattingutils";
import { LIMITS, MembershipRow } from "./engine";

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
  if (entities.length !== 1 || sets.length !== 1 || signals.length > 1 || categories.length !== 2) {
    result.error = "Binding";
    return result;
  }
  const entity = entities[0]!;
  const set = sets[0]!;
  const signal = signals[0];
  result.received = Math.max(entity.values.length, set.values.length);
  if (entity === set || entity.values.length !== set.values.length ||
      (signal && (signal.values.length !== entity.values.length ||
        (signal.highlights && signal.highlights.length !== entity.values.length)))) {
    result.error = "Shape";
    return result;
  }
  result.highlights = signal?.highlights !== undefined;
  for (let index = 0; index < Math.min(result.received, LIMITS.rows); index++) {
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
      entityLabel: valueFormatter.format(entity.values[index], entity.source.format, false, host.locale),
      setLabel: valueFormatter.format(set.values[index], set.source.format, false, host.locale),
      highlighted: typeof highlight === "number" && Number.isFinite(highlight) && highlight > 0
    });
  }
  return result;
}

import { describe, expect, it, vi } from "vitest";
import powerbi from "powerbi-visuals-api";
import { parseData } from "../src/data";
import { analyze, selectionKeys } from "../src/engine";

// The browser suite exercises real native-shaped host methods against the packaged bundle.
vi.mock("powerbi-visuals-utils-formattingutils", () => ({
  valueFormatter: { format: (value: unknown, format?: string) => format === "0.00" ? Number(value).toFixed(2) : String(value ?? "") }
}));

function fixture(entity: powerbi.PrimitiveValue[] = ["C1", "C1"], set: powerbi.PrimitiveValue[] = ["A", "A"]): powerbi.DataView {
  return {
    metadata: { columns: [] },
    categorical: {
      categories: [
        { source: { displayName: "Entity", roles: { entity: true } }, values: entity, identity: entity.map((_, index) => ({ key: `opaque${index}` })) },
        { source: { displayName: "Set", roles: { set: true } }, values: set, identity: set.map((_, index) => ({ key: `set${index}` })) }
      ]
    }
  };
}

function hostMock() {
  const built: { column: powerbi.DataViewCategoryColumn; index: number }[] = [];
  const host = {
    locale: "en-US",
    createSelectionIdBuilder() {
      let key = "";
      return {
        withCategory(column: powerbi.DataViewCategoryColumn, index: number) {
          built.push({ column, index });
          const opaque = column.identity?.[index];
          key = opaque && "key" in opaque && typeof opaque.key === "string" ? opaque.key : "";
          return this;
        },
        createSelectionId() { return { hasIdentity: () => Boolean(key), getKey: () => key }; }
      };
    }
  };
  // Partial service fixture: parser only calls locale and createSelectionIdBuilder.
  return { host: host as powerbi.extensibility.visual.IVisualHost, built };
}

describe("categorical binding and native identities", () => {
  it("keeps duplicate contributors' opaque entity identities without building from labels", () => {
    const { host, built } = hostMock();
    const view = fixture();
    const data = parseData(view, host);
    expect(selectionKeys(analyze(data.rows).entities).keys).toEqual(["opaque0", "opaque1"]);
    expect([...data.identities.keys()]).toEqual(["opaque0", "opaque1"]);
    expect(built.every(item => item.column === view.categorical?.categories?.[0])).toBe(true);
  });
  it("does not invent identity when the host supplies none", () => {
    const view = fixture();
    delete view.categorical!.categories![0]!.identity;
    const data = parseData(view, hostMock().host);
    expect(data.identities.size).toBe(0);
    expect(selectionKeys(analyze(data.rows).entities).reason).toBe("missing");
  });
  it("rejects absent, duplicate and aliased roles", () => {
    const { host } = hostMock();
    expect(parseData(undefined, host).error).toBe("Binding");
    const view = fixture();
    view.categorical!.categories![1]!.source.roles = { entity: true };
    expect(parseData(view, host).error).toBe("Binding");
    view.categorical!.categories![0]!.source.roles = { entity: true, set: true };
    view.categorical!.categories![1]!.source.roles = {};
    expect(parseData(view, host).error).toBe("Shape");
  });
  it("rejects unequal lengths", () => {
    expect(parseData(fixture(["C1"], ["A", "B"]), hostMock().host).error).toBe("Shape");
  });
  it("uses only positive highlights and never aggregates signal values", () => {
    const view = fixture(["C1", "C2"], ["A", "A"]);
    const values = [{ source: { displayName: "Signal", roles: { signal: true } }, values: [800, 900], highlights: [2, 0] }];
    view.categorical!.values = Object.assign(values, { grouped: () => [] });
    const data = parseData(view, hostMock().host);
    expect(data.highlights).toBe(true);
    expect(analyze(data.rows).combinations).toEqual([{ mask: 1, count: 2, highlighted: 1 }]);
    values[0]!.highlights = [0, -2];
    expect(analyze(parseData(view, hostMock().host).rows).combinations[0]?.highlighted).toBe(0);
  });
  it("aggregate snapshots replace previous membership counts; overlap is not appended", () => {
    const { host } = hostMock();
    const view = fixture(["C1"], ["A"]);
    view.metadata.segment = {};
    expect(parseData(view, host).segmented).toBe(true);
    const next = parseData(fixture(["C1", "C1", "C2"], ["A", "B", "A"]), host);
    expect(analyze(next.rows).universe).toBe(2);
    expect(analyze(next.rows).combinations.reduce((sum, item) => sum + item.count, 0)).toBe(2);
    expect(next.segmented).toBe(false);
  });
  it("formats typed entity values using their native model format", () => {
    const view = fixture([1.5], ["A"]);
    view.categorical!.categories![0]!.source.format = "0.00";
    expect(parseData(view, hostMock().host).rows[0]?.entityLabel).toBe("1.50");
  });
});

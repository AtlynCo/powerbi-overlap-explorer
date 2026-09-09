import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, it } from "vitest";
import { analyze, contributors } from "../src/engine";

function sample(name: string) {
  return readFileSync(path.join("samples", name), "utf8").trim().split(/\r?\n/).slice(1).map(line => {
    const [entity, set] = line.split(",");
    return { entity, set: set || null, identityKeys: [], highlighted: false };
  });
}

it("customer-product sample matches documented exact, inclusive and projection counts", () => {
  const rows = sample("customer-product.csv");
  const exact = analyze(rows);
  expect(rows).toHaveLength(18);
  expect(exact.universe).toBe(10);
  expect(exact.sets.map(set => [set.label, set.size])).toEqual([["Atlas", 6], ["Beacon", 5], ["Cove", 4]]);
  expect(exact.deduplicated).toBe(1);
  expect(exact.zero).toBe(1);
  expect(exact.combinations.map(item => [item.mask, item.count])).toEqual([
    [1, 2], [3, 2], [0, 1], [2, 1], [4, 1], [5, 1], [6, 1], [7, 1]
  ]);
  const inclusive = analyze(rows, { inclusive: true });
  expect(inclusive.combinations.reduce((sum, item) => sum + item.count, 0)).toBe(23);
  expect(contributors(inclusive, 3).map(entity => entity.label)).toEqual(["C001", "C004", "C010"]);
  const reduced = analyze(rows, { maxSets: 2 });
  expect(reduced.zero).toBe(2);
  expect(reduced.combinations.map(item => [item.mask, item.count])).toEqual([[1, 3], [3, 3], [0, 2], [2, 2]]);
});

it("feature-adoption sample preserves the zero-membership universe during set reduction", () => {
  const rows = sample("feature-adoption.csv");
  const exact = analyze(rows);
  expect(rows).toHaveLength(22);
  expect(exact.universe).toBe(12);
  expect(exact.sets.map(set => [set.label, set.size])).toEqual([["Search", 7], ["Share", 6], ["Automate", 5], ["Export", 2]]);
  expect(exact.deduplicated).toBe(1);
  expect(exact.combinations).toHaveLength(10);
  expect(analyze(rows, { maxSets: 3 }).zero).toBe(2);
  const inclusive = analyze(rows, { inclusive: true });
  expect(contributors(inclusive, 3).map(entity => entity.label)).toEqual(["U001", "U004", "U010", "U012"]);
});

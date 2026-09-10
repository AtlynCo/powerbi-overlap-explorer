import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { prepareReportVersions } from "../scripts/prepare-sample.mjs";
import { validateSampleStructure } from "../scripts/validate-sample.mjs";

const model = "model Model\n\tculture: en-US\n\nref table Memberships\nref table FeatureAdoption\n";
const version = {
  $schema: "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/versionMetadata/1.0.0/schema.json",
  version: "2.0.0",
};
const artifact = {
  $schema: "https://developer.microsoft.com/json-schemas/fabric/item/report/definitionProperties/2.0.0/schema.json",
  version: "4.0",
  datasetReference: { byPath: { path: "../OverlapSample.SemanticModel" } },
};

describe("required sample structure before schema enumeration", () => {
  it("accepts root-level TMDL references and independently versioned report contracts", () => {
    expect(() => validateSampleStructure(model, version, artifact)).not.toThrow();
  });
  it("rejects the native-reported indented ReferenceObject shape", () => {
    expect(() => validateSampleStructure(model.replaceAll("\nref table", "\n\tref table"), version, artifact))
      .toThrow("must be at document root");
  });
  it("rejects missing table references", () => {
    expect(() => validateSampleStructure(model.replace("ref table Memberships\n", ""), version, artifact))
      .toThrow("table references are missing");
  });
  it("rejects missing version metadata rather than validating one fewer file", () => {
    expect(() => validateSampleStructure(model, undefined, artifact)).toThrow("version.json is missing");
  });
  it.each(["0.0.0", "4.0", "4.0.0"])("rejects unsupported report-definition version %s, including the native no-pages regression", value => {
    expect(() => validateSampleStructure(model, { ...version, version: value }, artifact))
      .toThrow("Unexpected report-definition version");
  });
  it("requires the artifact metadata separately", () => {
    expect(() => validateSampleStructure(model, version, undefined)).toThrow("definition.pbir is missing");
  });
  it.each(["2.0", "2.0.0", "4.0.0"])("rejects an incorrect artifact version %s", value => {
    expect(() => validateSampleStructure(model, version, { ...artifact, version: value }))
      .toThrow("Unexpected report artifact version");
  });
  it("rejects swapped version metadata documents", () => {
    expect(() => validateSampleStructure(model, artifact, version)).toThrow();
  });
  it("preserves the relative semantic model binding", () => {
    expect(() => validateSampleStructure(model, version, { ...artifact, datasetReference: {} })).toThrow();
  });
});

describe("report version generation", () => {
  it("creates both required metadata files and repairs stale versions deterministically", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "overlap-report-versions-"));
    const artifactPath = path.join(root, "definition.pbir");
    const versionPath = path.join(root, "definition", "version.json");
    try {
      await prepareReportVersions(root);
      const artifactBytes = await readFile(artifactPath, "utf8");
      const versionBytes = await readFile(versionPath, "utf8");
      expect(JSON.parse(artifactBytes)).toEqual(artifact);
      expect(JSON.parse(versionBytes)).toEqual(version);
      await writeFile(artifactPath, JSON.stringify({ ...artifact, version: "2.0.0" }));
      await writeFile(versionPath, JSON.stringify({ ...version, version: "4.0.0" }));
      await prepareReportVersions(root);
      expect(await readFile(artifactPath, "utf8")).toBe(artifactBytes);
      expect(await readFile(versionPath, "utf8")).toBe(versionBytes);
      await prepareReportVersions(root);
      expect(await readFile(artifactPath, "utf8")).toBe(artifactBytes);
      expect(await readFile(versionPath, "utf8")).toBe(versionBytes);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

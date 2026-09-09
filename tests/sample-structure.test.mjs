import { describe, expect, it } from "vitest";
import { validateSampleStructure } from "../scripts/validate-sample.mjs";

const model = "model Model\n\tculture: en-US\n\nref table Memberships\nref table FeatureAdoption\n";
const version = {
  $schema: "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/versionMetadata/1.0.0/schema.json",
  version: "4.0.0",
};

describe("required sample structure before schema enumeration", () => {
  it("accepts root-level TMDL references and explicit PBIR version metadata", () => {
    expect(() => validateSampleStructure(model, version)).not.toThrow();
  });
  it("rejects the native-reported indented ReferenceObject shape", () => {
    expect(() => validateSampleStructure(model.replaceAll("\nref table", "\n\tref table"), version))
      .toThrow("must be at document root");
  });
  it("rejects missing table references", () => {
    expect(() => validateSampleStructure(model.replace("ref table Memberships\n", ""), version))
      .toThrow("table references are missing");
  });
  it("rejects missing version metadata rather than validating one fewer file", () => {
    expect(() => validateSampleStructure(model, undefined)).toThrow("version.json is missing");
  });
  it("rejects an unexpected PBIR version", () => {
    expect(() => validateSampleStructure(model, { ...version, version: "0.0.0" })).toThrow("Unexpected PBIR");
  });
});

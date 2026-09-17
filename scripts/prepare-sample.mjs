import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { readPackage } from "./read-package.mjs";

export const sampleRoot = path.resolve("samples", "offline-pbip");
export const reportRoot = path.join(sampleRoot, "OverlapSample.Report");
const visualConfig = JSON.parse(await readFile("pbiviz.json", "utf8"));
export const visualGuid = visualConfig.visual.guid;
export const visualVersion = visualConfig.visual.version;
export const schemaRoot = "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/";
// Artifact and report-definition versions are separate Desktop contracts.
export const reportArtifactVersion = "4.0";
export const reportDefinitionVersion = "2.0.0";
export const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");
export const fixtures = [
  {
    page: "CustomerProducts", title: "Customer / product overlap", table: "Memberships",
    csv: "customer-product.csv", attribute: "Segment", signal: "Highlight signal",
    distinct: "Distinct entities", maxSets: 3, rows: 18, entities: 10,
    sizes: { Atlas: 6, Beacon: 5, Cove: 4 },
    exact: { Atlas: 2, Beacon: 1, Cove: 1, "Atlas|Beacon": 2, "Atlas|Cove": 1,
      "Beacon|Cove": 1, "Atlas|Beacon|Cove": 1, "(none)": 1 },
    inclusive: { Atlas: 6, Beacon: 5, Cove: 4, "Atlas|Beacon": 3, "Atlas|Cove": 2,
      "Beacon|Cove": 2, "Atlas|Beacon|Cove": 1 },
    notes: [
      "CHECK: 10 entities; Atlas 6 / Beacon 5 / Cove 4; no retained memberships 1. Duplicate C001 / Atlas counts once.",
      "EXACT (default): Atlas + Beacon only = 2. INCLUSIVE: switch Inclusive intersections on to include supersets = 3. Inclusive bars overlap; never sum them as a universe.",
      "PROJECTION: set Maximum retained sets to 2. Atlas + Beacon = 3, none = 2; universe stays 10. Omitted sets change what exact means.",
    ],
  },
  {
    page: "FeatureAdoption", title: "Feature adoption overlap", table: "FeatureAdoption",
    csv: "feature-adoption.csv", attribute: "Cohort", signal: "Feature highlight signal",
    distinct: "Feature distinct entities", maxSets: 4, rows: 22, entities: 12,
    sizes: { Search: 7, Share: 6, Automate: 5, Export: 2 },
    exact: { Search: 2, Share: 1, Automate: 1, Export: 1, "Search|Share": 2,
      "Automate|Search": 1, "Automate|Share": 1, "Automate|Search|Share": 1,
      "Automate|Export|Search|Share": 1, "(none)": 1 },
    inclusive: { Search: 7, Share: 6, Automate: 5, Export: 2, "Search|Share": 4 },
    notes: [
      "CHECK: 12 entities; Search 7 / Share 6 / Automate 5 / Export 2; no retained memberships 1. Duplicate U009 / Search counts once.",
      "EXACT (default): Search + Share only = 2. INCLUSIVE: switch Inclusive intersections on to include supersets = 4. Inclusive bars overlap; never sum them as a universe.",
      "PROJECTION: set Maximum retained sets to 3. Export is omitted; U011 joins U008 in none (2), and U012 joins U004 in the three-way intersection (2). Universe stays 12.",
    ],
  },
];

const literal = value => ({ expr: { Literal: { Value: typeof value === "string"
  ? `'${value.replaceAll("'", "''")}'` : typeof value === "number" ? `${value}D` : String(value) } } });
const properties = value => [{ properties: value }];
const visualId = (page, name) => sha256(`${page}:${name}`).slice(0, 20);
export const field = (table, name, kind = "Column") => ({
  field: { [kind]: { Expression: { SourceRef: { Entity: table } }, Property: name } },
  queryRef: `${table}.${name}`, nativeQueryRef: name,
});
const role = (...projections) => ({ projections });

function container(page, name, visualType, x, y, width, height, tabOrder, extra) {
  return {
    $schema: `${schemaRoot}visualContainer/2.5.0/schema.json`,
    name: visualId(page, name), position: { x, y, z: tabOrder, width, height, tabOrder },
    visual: { visualType, ...extra },
  };
}

function textbox(page, name, lines, y, height, width, size, tabOrder) {
  return container(page, name, "textbox", 24, y, width, height, tabOrder, {
    objects: { general: properties({ paragraphs: lines.map(value => ({
      textRuns: [{ value, textStyle: { fontFamily: "Segoe UI", fontSize: `${size}px`, color: "#172B4D" } }],
      horizontalTextAlignment: "left",
    })) }) },
    visualContainerObjects: { background: properties({ show: literal(false) }) },
  });
}

const titled = title => ({
  title: properties({ show: literal(true), text: literal(title), fontSize: literal(12) }),
});

export function authoredPage(fixture) {
  const { page, title, table, attribute, signal, distinct, maxSets, notes } = fixture;
  const entityField = field(table, "Entity ID");
  const setField = field(table, "Set Name");
  const signalField = field(table, signal, "Measure");
  const distinctField = field(table, distinct, "Measure");
  const visuals = [
    textbox(page, "heading", [title, "Synthetic inline data • exact, distinct-entity intersections • private local visual"], 16, 76, 1392, 24, 0),
    container(page, "explorer", visualGuid, 24, 104, 936, 520, 1, {
      query: { queryState: { entity: role(entityField), set: role(setField), signal: role(signalField) } },
      objects: {
        analysis: properties({ inclusive: literal(false), maxSets: literal(maxSets),
          top: literal(20), minimum: literal(1) }),
        appearance: properties({ fontSize: literal(12) }),
      },
    }),
    container(page, "universe", "cardVisual", 984, 104, 432, 150, 2, {
      query: { queryState: { Data: role(distinctField) } },
      objects: {
        value: [{ selector: { id: "default" }, properties: { fontSize: literal(32) } }],
        label: [{ selector: { id: "default" }, properties: { fontSize: literal(12) } }],
      },
      visualContainerObjects: titled("Distinct entities in current filter context"),
    }),
    container(page, "attribute", "clusteredBarChart", 984, 270, 432, 230, 3, {
      query: {
        queryState: { Category: role({ ...field(table, attribute), active: true }), Y: role(distinctField) },
        sortDefinition: { sort: [{ field: distinctField.field, direction: "Descending" }] },
      },
      visualContainerObjects: titled(`${attribute}: select a bar to request highlight`),
    }),
    container(page, "memberships", "tableEx", 984, 516, 432, 360, 4, {
      query: { queryState: { Values: role(entityField, setField, field(table, attribute), signalField) } },
      objects: { columnHeaders: properties({ autoSizeColumnWidth: literal(true), columnAdjustment: literal("growToFit") }) },
      visualContainerObjects: titled("Membership rows / highlight signal (not weights)"),
    }),
    textbox(page, "guide", [...notes,
      "PARTIAL IS NOT COMPLETE: a partial-data warning means counts describe only received rows. Top/minimum hide combinations; they do not redefine the observed universe.",
      "HOST CHECK: chart → explorer requests Highlight; table → explorer filters. Selection identities, highlighting, refresh, and rendering still require real Desktop validation.",
    ], 640, 236, 936, 15, 5),
  ];
  return {
    page: {
      $schema: `${schemaRoot}page/2.0.0/schema.json`, name: page, displayName: title,
      displayOption: "FitToPage", height: 900, width: 1440,
      visualInteractions: [
        { source: visualId(page, "attribute"), target: visualId(page, "explorer"), type: "HighlightFilter" },
        { source: visualId(page, "memberships"), target: visualId(page, "explorer"), type: "DataFilter" },
        { source: visualId(page, "explorer"), target: visualId(page, "memberships"), type: "DataFilter" },
      ],
    },
    visuals,
  };
}

export async function packageFiles(packaged) {
  assert.equal(packaged.metadata.visual.guid, visualGuid);
  assert.equal(packaged.resource.visual.guid, visualGuid);
  assert.equal(packaged.resource.apiVersion, "5.11.0");
  assert.equal(packaged.metadata.version, visualVersion);
  assert.equal(packaged.metadata.visual.version, visualVersion);
  assert.equal(packaged.resource.visual.version, visualVersion);
  const project = JSON.parse(await readFile("package.json", "utf8"));
  assert.equal(project.devDependencies["powerbi-visuals-api"], "5.11.1");
  const resourcePath = `resources/${visualGuid}.pbiviz.json`;
  const names = Object.values(packaged.zip.files).filter(entry => !entry.dir).map(entry => entry.name).sort();
  assert.deepEqual(names, ["package.json", resourcePath], "Unexpected package files; do not embed unrelated files or source maps");
  assert.deepEqual(packaged.metadata.resources, [{ resourceId: "rId0", sourceType: 5, file: resourcePath }]);
  const capabilities = JSON.parse(await readFile("capabilities.json", "utf8"));
  assert.deepEqual(packaged.resource.capabilities, capabilities, "Build the current capabilities before preparing the sample");
  return Promise.all(names.map(async name => ({ name, bytes: await packaged.zip.file(name).async("nodebuffer") })));
}

async function write(relative, value, root = sampleRoot) {
  const destination = path.join(root, relative);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, value);
}

const json = value => `${JSON.stringify(value, null, 2)}\n`;

export async function prepareReportVersions(destination = reportRoot) {
  await write("definition.pbir", json({
    $schema: "https://developer.microsoft.com/json-schemas/fabric/item/report/definitionProperties/2.0.0/schema.json",
    version: reportArtifactVersion,
    datasetReference: { byPath: { path: "../OverlapSample.SemanticModel" } },
  }), destination);
  await write(path.join("definition", "version.json"), json({
    $schema: `${schemaRoot}versionMetadata/1.0.0/schema.json`,
    version: reportDefinitionVersion,
  }), destination);
}

export async function prepareSample() {
  const packaged = await readPackage();
  const files = await packageFiles(packaged);
  const archive = path.join("package", `${visualGuid}.pbiviz`);
  await write(archive, packaged.bytes);
  const embeddedFiles = [];
  for (const { name, bytes } of files) {
    const relative = path.join("OverlapSample.Report", "CustomVisuals", visualGuid, ...name.split("/"));
    await write(relative, bytes);
    embeddedFiles.push({ path: relative.split(path.sep).join("/"), bytes: bytes.length, sha256: sha256(bytes) });
  }
  await write("package-manifest.json", json({
    formatVersion: 1, visualGuid, visualVersion: packaged.resource.visual.version,
    apiVersion: packaged.resource.apiVersion, sdkVersion: "5.11.1",
    sourcePackage: path.basename(packaged.absolute), archive: archive.split(path.sep).join("/"),
    bytes: packaged.bytes.length, sha256: sha256(packaged.bytes), embeddedFiles,
  }));
  const definition = path.join("OverlapSample.Report", "definition");
  await prepareReportVersions();
  await write(path.join(definition, "report.json"), json({
    $schema: `${schemaRoot}report/3.1.0/schema.json`,
    themeCollection: {},
    resourcePackages: [{
      name: visualGuid, type: "CustomVisual",
      items: [{ name: `${visualGuid}.pbiviz.json`, path: `${visualGuid}.pbiviz.json`, type: "CustomVisualMetadata" }],
    }],
    settings: { defaultFilterActionIsDataFilter: false, useStylableVisualContainerHeader: true },
  }));
  await rm(path.join(reportRoot, "definition", "pages", "Starter"), { recursive: true, force: true });
  await write(path.join(definition, "pages", "pages.json"), json({
    $schema: `${schemaRoot}pagesMetadata/1.0.0/schema.json`,
    pageOrder: fixtures.map(fixture => fixture.page), activePageName: fixtures[0].page,
  }));
  for (const fixture of fixtures) {
    const authored = authoredPage(fixture);
    const folder = path.join(definition, "pages", fixture.page);
    await write(path.join(folder, "page.json"), json(authored.page));
    for (const visual of authored.visuals) {
      await write(path.join(folder, "visuals", visual.name, "visual.json"), json(visual));
    }
  }
  console.log(`Prepared artifact ${reportArtifactVersion} / report definition ${reportDefinitionVersion}, 2 bound pages and exact local package SHA256 ${sha256(packaged.bytes)}`);
  console.log("Run node scripts/validate-sample.mjs. Desktop open/refresh/render remains a manual host gate.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await prepareSample();
}

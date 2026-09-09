import assert from "node:assert/strict";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import Ajv from "ajv";
import { readPackage } from "./read-package.mjs";
import { authoredPage, fixtures, packageFiles, reportRoot, sampleRoot, sha256, visualGuid } from "./prepare-sample.mjs";

const readJson = async file => JSON.parse(await readFile(file, "utf8"));
const cacheRoot = path.join(sampleRoot, ".schema-cache");
const publicPrefix = "https://developer.microsoft.com/json-schemas/";

async function loadSchema(url, offline, records) {
  assert.ok(url.startsWith(publicPrefix), `Unexpected schema host: ${url}`);
  const relative = new URL(url).pathname.slice("/json-schemas/".length);
  assert.ok(!relative.includes(".."));
  const destination = path.join(cacheRoot, ...relative.split("/"));
  const record = text => {
    const schema = JSON.parse(text);
    records.set(url, { url, sha256: sha256(text) });
    return schema;
  };
  try {
    return record(await readFile(destination, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  assert.ok(!offline, `Schema cache miss: ${url}. Run once without --offline to retrieve public schemas.`);
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  assert.ok(response.ok, `Schema retrieval failed: ${response.status} ${url}`);
  const text = await response.text();
  const schema = record(text);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, text);
  return schema;
}

async function walk(folder) {
  const result = [];
  for (const entry of (await readdir(folder, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name.startsWith(".")) continue;
    const file = path.join(folder, entry.name);
    if (entry.isDirectory()) result.push(...await walk(file));
    else result.push(file);
  }
  return result;
}

function countMemberships(rows) {
  const entities = new Map();
  for (const [entity, set] of rows) {
    if (!entities.has(entity)) entities.set(entity, new Set());
    if (set) entities.get(entity).add(set);
  }
  const sizes = {};
  const exact = {};
  for (const sets of entities.values()) {
    for (const set of sets) sizes[set] = (sizes[set] ?? 0) + 1;
    const key = [...sets].sort().join("|") || "(none)";
    exact[key] = (exact[key] ?? 0) + 1;
  }
  return { entities, sizes, exact };
}

async function validateModel() {
  for (const fixture of fixtures) {
    const source = await readFile(path.join(sampleRoot, "OverlapSample.SemanticModel", "definition", "tables", `${fixture.table}.tmdl`), "utf8");
    assert.match(source, /mode: import/);
    assert.match(source, /Source = #table\(/);
    assert.doesNotMatch(source, /(?:Web|File|Folder|Sql|OData|AzureStorage)\.\w+|https?:\/\//i, "Fixtures must remain inline and offline");
    const rows = [...source.matchAll(/^\s*\{("[^"]+"), (null|"[^"]*"), ("[^"]+")\},?\s*$/gm)]
      .map(match => JSON.parse(`[${match[1]},${match[2]},${match[3]}]`));
    const csv = (await readFile(path.join("samples", fixture.csv), "utf8")).trimEnd().split(/\r?\n/);
    assert.equal(csv.shift(), `Entity ID,Set Name,${fixture.attribute}`);
    const csvRows = csv.map(line => line.split(",").map((value, index) => index === 1 && value === "" ? null : value));
    assert.deepEqual(rows, csvRows, `${fixture.table}: inline TMDL must exactly match CSV`);
    assert.equal(rows.length, fixture.rows);
    assert.ok(source.includes(`measure '${fixture.signal}' = COUNTROWS('${fixture.table}')`));
    assert.ok(source.includes(`measure '${fixture.distinct}' = DISTINCTCOUNT('${fixture.table}'[Entity ID])`));
    const counts = countMemberships(rows);
    assert.equal(counts.entities.size, fixture.entities);
    assert.deepEqual(counts.sizes, fixture.sizes);
    assert.deepEqual(counts.exact, fixture.exact);
    for (const [key, expected] of Object.entries(fixture.inclusive)) {
      const sets = key.split("|");
      assert.equal([...counts.entities.values()].filter(entitySets => sets.every(set => entitySets.has(set))).length, expected);
    }
    const retained = Object.entries(counts.sizes).sort((a, b) => b[1] - a[1]).slice(0, fixture.maxSets - 1).map(([set]) => set);
    const projectedRows = rows.map(([entity, set, attribute]) => [entity, retained.includes(set) ? set : null, attribute]);
    const projected = countMemberships(projectedRows);
    assert.equal(projected.entities.size, fixture.entities);
    assert.equal(projected.exact["(none)"], 2);
    assert.equal(projected.exact[fixture.table === "Memberships" ? "Atlas|Beacon" : "Automate|Search|Share"], fixture.table === "Memberships" ? 3 : 2);
  }
}

async function validateBindings() {
  const metadata = await readJson(path.join(reportRoot, "definition", "pages", "pages.json"));
  assert.deepEqual(metadata.pageOrder, fixtures.map(fixture => fixture.page));
  assert.equal(metadata.activePageName, fixtures[0].page);
  for (const fixture of fixtures) {
    const expected = authoredPage(fixture);
    const folder = path.join(reportRoot, "definition", "pages", fixture.page);
    const page = await readJson(path.join(folder, "page.json"));
    assert.deepEqual(page, expected.page, `${fixture.page}: page / interactions differ from authored source`);
    const visualFiles = (await walk(path.join(folder, "visuals"))).filter(file => path.basename(file) === "visual.json");
    assert.equal(visualFiles.length, expected.visuals.length);
    for (const visual of expected.visuals) {
      const actual = await readJson(path.join(folder, "visuals", visual.name, "visual.json"));
      assert.deepEqual(actual, visual, `${fixture.page}/${visual.name}: stale or unbound visual; regenerate sample`);
      assert.ok(visual.position.x >= 0 && visual.position.y >= 0);
      assert.ok(visual.position.x + visual.position.width <= page.width);
      assert.ok(visual.position.y + visual.position.height <= page.height);
      for (const projection of Object.values(actual.visual.query?.queryState ?? {}).flatMap(role => role.projections)) {
        const [kind, expression] = Object.entries(projection.field)[0];
        assert.equal(expression.Expression.SourceRef.Entity, fixture.table);
        const allowed = kind === "Column" ? ["Entity ID", "Set Name", fixture.attribute] : [fixture.signal, fixture.distinct];
        assert.ok(allowed.includes(expression.Property), `Unknown ${kind}: ${expression.Property}`);
      }
    }
  }
}

async function validatePackage(embeddedOnly) {
  const manifest = await readJson(path.join(sampleRoot, "package-manifest.json"));
  assert.equal(manifest.visualGuid, visualGuid);
  assert.equal(manifest.archive, `package/${visualGuid}.pbiviz`);
  const packaged = await readPackage(path.join(sampleRoot, ...manifest.archive.split("/")));
  assert.equal(sha256(packaged.bytes), manifest.sha256, "Embedded archive SHA256 mismatch");
  assert.equal(packaged.bytes.length, manifest.bytes);
  assert.equal(manifest.visualVersion, "1.0.0.0");
  assert.equal(manifest.apiVersion, "5.11.0");
  assert.equal(manifest.sdkVersion, "5.11.1");
  const files = await packageFiles(packaged);
  assert.equal(manifest.embeddedFiles.length, files.length);
  const customRoot = path.join(reportRoot, "CustomVisuals", visualGuid);
  assert.equal((await walk(customRoot)).length, files.length, "Unexpected custom visual resources");
  for (const file of files) {
    const relative = `OverlapSample.Report/CustomVisuals/${visualGuid}/${file.name}`;
    const record = manifest.embeddedFiles.find(entry => entry.path === relative);
    assert.ok(record, `Missing resource hash for ${file.name}`);
    const embedded = await readFile(path.join(sampleRoot, ...relative.split("/")));
    assert.deepEqual(embedded, file.bytes, `Changed package payload: ${file.name}`);
    assert.equal(record.sha256, sha256(embedded));
    assert.equal(record.bytes, embedded.length);
  }
  if (!embeddedOnly) {
    const local = await readPackage();
    assert.deepEqual(packaged.bytes, local.bytes, "Sample is not the exact current dist package. Run node scripts/prepare-sample.mjs after the FINAL build.");
    assert.equal(manifest.sourcePackage, path.basename(local.absolute));
  }
  const report = await readJson(path.join(reportRoot, "definition", "report.json"));
  assert.ok(!report.publicCustomVisuals?.length, "Private visual must not request AppSource download");
  assert.ok(!report.organizationCustomVisuals?.length);
  assert.deepEqual(report.resourcePackages, [{
    name: visualGuid, type: "CustomVisual",
    items: [{ name: `${visualGuid}.pbiviz.json`, path: `${visualGuid}.pbiviz.json`, type: "CustomVisualMetadata" }],
  }]);
  return manifest.sha256;
}

export async function validateSample({ embeddedOnly = false, offline = false } = {}) {
  const hash = await validatePackage(embeddedOnly);
  await validateModel();
  await validateBindings();
  const modelReference = await readJson(path.join(reportRoot, "definition.pbir"));
  assert.deepEqual(modelReference.datasetReference, { byPath: { path: "../OverlapSample.SemanticModel" } });
  const schemaRecords = new Map();
  const ajv = new Ajv({
    allErrors: true, schemaId: "auto", validateSchema: true,
    loadSchema: url => loadSchema(url, offline, schemaRecords),
  });
  let validated = 0;
  const sourceFiles = (await walk(sampleRoot)).filter(file => /\.(json|pbip|pbir|pbism)$/.test(file)
    && !file.includes(`${path.sep}CustomVisuals${path.sep}`) && path.basename(file) !== "package-manifest.json");
  for (const file of sourceFiles) {
    const value = await readJson(file);
    assert.ok(value.$schema, `Missing public schema in ${file}`);
    const validate = await ajv.compileAsync({ $ref: value.$schema });
    assert.ok(validate(value), `${path.relative(sampleRoot, file)}: ${ajv.errorsText(validate.errors)}`);
    validated++;
  }
  const evidenceRoot = path.resolve(".tmp", "release-evidence", "final");
  await mkdir(evidenceRoot, { recursive: true });
  await writeFile(path.join(evidenceRoot, "sample-validation.json"), JSON.stringify({
    validatedAt: new Date().toISOString(), packageSha256: hash, matchesCurrentDist: !embeddedOnly,
    offlineSchemaCheck: offline, definitions: validated, pages: 2, visuals: 12,
    scope: "Local schema, binding, counts and package-byte checks; NOT native Power BI validation",
    schemas: [...schemaRecords.values()].sort((a, b) => a.url.localeCompare(b.url)),
  }, null, 2));
  console.log(`PASS: ${validated} JSON definitions against Microsoft schemas; 2 pages / 12 authored visuals; query bindings, CSV/TMDL parity, distinct/exact/inclusive/projection counts.`);
  console.log(`PASS: unmodified archive + custom visual resources SHA256 ${hash}${embeddedOnly ? " (embedded snapshot only; dist not checked)" : " (matches current dist)"}.`);
  console.log("NOT PROVEN: Desktop TMDL parsing, refresh, rendering, selection identities, native highlighting, save/reopen, or service behavior.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  assert.ok(args.every(arg => ["--embedded-only", "--offline"].includes(arg)), "Usage: node scripts/validate-sample.mjs [--embedded-only] [--offline]");
  await validateSample({ embeddedOnly: args.includes("--embedded-only"), offline: args.includes("--offline") });
}

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, readdir, writeFile, copyFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { readPackage } from "./read-package.mjs";
import { validateSample } from "./validate-sample.mjs";

const destination = process.argv[2];
if (!destination || !path.isAbsolute(destination)) throw new Error("Supply an absolute, NEW evidence folder outside the repository.");
const root = process.cwd();
assert.ok(!path.resolve(destination).toLowerCase().startsWith(path.resolve(root).toLowerCase() + path.sep),
  "Durable release evidence must be outside the worktree.");
assert.ok(!existsSync(destination), "Immutable evidence folder already exists; use a new revision folder.");
const git = (...args) => execFileSync("git", ["-c", "core.longpaths=true", ...args], { encoding: "utf8" }).trim();
assert.equal(git("status", "--porcelain"), "", "Commit all source/sample changes before sealing.");
const commit = git("rev-parse", "HEAD");
const branch = git("branch", "--show-current");
const packed = await readPackage();
const digest = bytes => createHash("sha256").update(bytes).digest("hex");
const packageHash = digest(packed.bytes);
const capture = JSON.parse(await readFile(path.join(".tmp", "release-evidence", "final", "capture-manifest.json"), "utf8"));
const benchmark = JSON.parse(await readFile(path.join(".tmp", "release-evidence", "final", "benchmark.json"), "utf8"));
assert.equal(capture.packageSha256, packageHash, "Screenshots were not captured from the final package.");
assert.equal(benchmark.packageSha256, packageHash, "Benchmarks were not measured on the final package.");
assert.equal(capture.captures.length, 10);
assert.equal(capture.additionalCaptures.length, 10);
for (const item of [...capture.captures, ...capture.additionalCaptures]) {
  assert.equal(item.errors.length, 0);
  assert.equal(item.requests.length, 0);
  const image = await readFile(path.join(".tmp", "release-evidence", "final", item.file));
  assert.equal(digest(image), item.imageSha256);
  assert.equal(image.readUInt32BE(16), item.width);
  assert.equal(image.readUInt32BE(20), item.height);
  if (item.file.startsWith("preview-")) {
    assert.equal(item.width, 1366);
    assert.equal(item.height, 768);
    assert.ok(image.length <= 1024000, "Local listing preview exceeds Microsoft's screenshot byte limit");
  }
}
assert.ok(benchmark.cases.every(item => item.metrics.updateReturn.n === 30 && item.errors.length === 0 && item.requests.length === 0));
await validateSample({ offline: true });
for (const size of [20, 50, 150, 300]) {
  const file = path.join("assets", size === 20 ? "icon.png" : `logo-${size}.png`);
  const image = await readFile(file);
  assert.equal(image.readUInt32BE(16), size);
  assert.equal(image.readUInt32BE(20), size);
}
await mkdir(destination, { recursive: true });
const files = [];
async function preserve(source, relative) {
  const target = path.join(destination, relative);
  await mkdir(path.dirname(target), { recursive: true });
  await copyFile(source, target);
  const bytes = await readFile(target);
  const normalized = relative.split(path.sep).join("/");
  files.push({ path: normalized, bytes: bytes.length, sha256: digest(bytes),
    ...(normalized.endsWith(".png") ? { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) } : {}),
    evidenceClass: normalized.startsWith("local-evidence/") ? "local-engineering"
      : normalized.startsWith("assets/") ? "original-artwork"
        : normalized.startsWith("samples/") ? "authored-sample" : "source-or-package",
    producer: "Local engineering workflow",
    fileModifiedAt: (await stat(source)).mtime.toISOString(),
    provenance: normalized.startsWith("local-evidence/") ? "See the stage capture/benchmark manifests and logs"
      : `Source commit ${commit}; final package ${packageHash}` });
}
async function preserveTree(source, relative) {
  for (const entry of await readdir(source, { withFileTypes: true })) {
    const from = path.join(source, entry.name);
    const to = path.join(relative, entry.name);
    if (entry.isDirectory()) await preserveTree(from, to);
    else if (entry.isFile()) await preserve(from, to);
  }
}
await preserve(packed.absolute, path.join("package", path.basename(packed.absolute)));
for (const tracked of git("ls-files", "-z", "--", "assets", "docs", "samples").split("\0").filter(Boolean)) {
  const local = path.join(...tracked.split("/"));
  await preserve(local, local);
}
for (const stage of ["baseline", "candidate", "candidate-optimized", "candidate-pre-dossier", "candidate-pre-memory-guard", "final"]) {
  const source = path.join(".tmp", "release-evidence", stage);
  if (existsSync(source)) await preserveTree(source, path.join("local-evidence", stage));
}
const sourceArchive = path.join(destination, "source.zip");
execFileSync("git", ["-c", "core.longpaths=true", "archive", "--format=zip", "--output", sourceArchive, commit]);
const sourceBytes = await readFile(sourceArchive);
files.push({ path: "source.zip", bytes: sourceBytes.length, sha256: digest(sourceBytes),
  evidenceClass: "committed-source", producer: "git archive", provenance: `Source commit ${commit}` });
const manifest = {
  createdAt: new Date().toISOString(), repository: "AtlynCo/powerbi-overlap-explorer", commit, branch,
  visual: packed.resource.visual, apiVersion: packed.resource.apiVersion, packageSha256: packageHash,
  evidenceClass: "Local packaged Chromium host mocks and static/schema checks, not native Power BI validation",
  nativeHostStatus: "UNVERIFIED: coordinator owns Desktop/service/PBIX/export and Marketplace submission",
  publicationStatus: "NOT SUBMITTED; owner license/policy/price and native approval gates remain",
  workflowPolicy: "No GitHub Actions or hosted CI used for this release-quality work",
  dependencyLockSha256: digest(await readFile("package-lock.json")),
  toolchain: { node: process.version, platform: process.platform,
    npmUserAgent: process.env.npm_config_user_agent ?? "Not launched through npm",
    powershell: execFileSync("pwsh", ["-NoProfile", "-Command", "$PSVersionTable.PSVersion.ToString()"], { encoding: "utf8" }).trim(),
    packages: JSON.parse(await readFile("package.json", "utf8")).devDependencies,
    browserEnvironment: benchmark.environment },
  exclusions: "Only tracked source/assets/samples are copied; ignored schema caches and native local caches are excluded.",
  files: files.sort((a, b) => a.path.localeCompare(b.path, "en"))
};
const manifestBytes = Buffer.from(JSON.stringify(manifest, null, 2));
await writeFile(path.join(destination, "manifest.json"), manifestBytes, { flag: "wx" });
await writeFile(path.join(destination, "manifest.sha256"), `${digest(manifestBytes)}  manifest.json\n`, { flag: "wx" });
for (const file of files) {
  const target = path.join(destination, ...file.path.split("/"));
  assert.equal((await stat(target)).size, file.bytes);
  assert.equal(digest(await readFile(target)), file.sha256);
}
console.log(`Sealed ${files.length} files for ${commit}\nPackage SHA256 ${packageHash}\nManifest SHA256 ${digest(manifestBytes)}\n${destination}`);

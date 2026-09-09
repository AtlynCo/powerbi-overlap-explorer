import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const workflows = path.join(".github", "workflows");
assert.ok(!existsSync(workflows) || (await readdir(workflows)).length === 0, "Hosted GitHub workflow files are prohibited");
const manifest = JSON.parse(await readFile("package.json", "utf8"));
const lock = JSON.parse(await readFile("package-lock.json", "utf8"));
assert.deepEqual(lock.packages[""].dependencies, manifest.dependencies);
assert.deepEqual(lock.packages[""].devDependencies, manifest.devDependencies);
for (const command of Object.values(manifest.scripts))
  assert.ok(!/\bgh\s+(run|workflow)|codespaces|copilot.*cloud/i.test(command), "A script launches hosted work");
const profile = path.join(".tmp", "package-home", "pbiviz-certs");
if (existsSync(profile)) assert.deepEqual(await readdir(profile), [], "Development certificate material was not removed");
console.log("Local-only policy: no workflows/hosted commands, lockfile matches, local package keys absent.");

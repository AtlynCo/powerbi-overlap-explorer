import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import { readPackage } from "./read-package.mjs";

const { absolute, zip, resource } = await readPackage();
const notices = [await readFile("THIRD-PARTY-NOTICES.md", "utf8")];
for (const file of await readdir(path.join(".tmp", "drop"))) {
  if (file.endsWith(".LICENSE.txt")) notices.push(await readFile(path.join(".tmp", "drop", file), "utf8"));
}
// Preserve full dependency notices inside the single distributed PBIVIZ, not in
// a companion minifier license file that the Power BI packager does not include.
const notice = notices.join("\n\n").replaceAll("*/", "* /");
resource.content.js = `/*!\n${notice}\n*/\n${resource.content.js}`;
const resourceName = Object.keys(zip.files).find(name => name.endsWith(".pbiviz.json"));
if (!resourceName) throw new Error("Missing visual resource");
zip.file(resourceName, JSON.stringify(resource));
await writeFile(absolute, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
console.log("Embedded dependency notices in the distributed visual resource.");

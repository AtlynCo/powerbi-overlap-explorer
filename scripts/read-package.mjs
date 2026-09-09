import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import JSZip from "jszip";

export async function readPackage() {
  const files = (await readdir("dist")).filter(file => file.endsWith(".pbiviz"));
  if (files.length !== 1) throw new Error(`Expected one .pbiviz in dist, found ${files.length}`);
  const absolute = path.resolve("dist", files[0]);
  const bytes = await readFile(absolute);
  const zip = await JSZip.loadAsync(bytes);
  const metadata = JSON.parse(await zip.file("package.json").async("string"));
  const resourceName = Object.keys(zip.files).find(name => name.endsWith(".pbiviz.json"));
  if (!resourceName) throw new Error("Package is missing its visual resource");
  const resource = JSON.parse(await zip.file(resourceName).async("string"));
  return { absolute, bytes, zip, metadata, resource };
}

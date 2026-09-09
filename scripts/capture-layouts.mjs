import { chromium } from "@playwright/test";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { readPackage } from "./read-package.mjs";
import { mount, update } from "../tests/browser-harness.mjs";
import { customerRows, membershipDataset } from "../tests/datasets.mjs";

const stage = process.argv[2] ?? "final";
if (!/^[a-z-]+$/.test(stage)) throw new Error("Use a lowercase stage name");
const output = path.resolve(".tmp", "release-evidence", stage);
await mkdir(output, { recursive: true });
const packed = await readPackage();
const browser = await chromium.launch({ headless: true });
const evidence = { stage, kind: "Local packaged Chromium host mock; NOT Power BI Desktop/service",
  capturedAt: new Date().toISOString(), producer: "scripts/capture-layouts.mjs",
  packageSha256: createHash("sha256").update(packed.bytes).digest("hex"), browser: browser.version(),
  deviceScaleFactor: 1, reducedMotion: "reduce", captures: [], additionalCaptures: [] };
const digest = bytes => createHash("sha256").update(bytes).digest("hex");
async function additionalCapture(page, state, file, rows, options) {
  const image = await page.screenshot({ path: path.join(output, file), animations: "disabled" });
  evidence.additionalCaptures.push({ file, ...page.viewportSize(), capturedAt: new Date().toISOString(),
    imageSha256: digest(image), datasetSha256: digest(JSON.stringify(rows)), options,
    errors: state.errors, requests: state.requests });
  if (state.errors.length || state.requests.length) throw new Error(`Errors/network in ${file}`);
}
try {
  for (const [width, height] of [[80, 80], [258, 198], [398, 298], [1280, 620], [1366, 768]]) {
    for (const variant of ["normal", "dense"]) {
      const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion: "reduce" });
      const state = await mount(page, {}, packed);
      const rows = variant === "normal" ? customerRows : membershipDataset(2000, 10, true);
      const options = { width, height, maxSets: 10, top: 50 };
      await update(page, rows, options);
      await page.evaluate(() => document.fonts.ready);
      const file = `${variant}-${width}x${height}.png`;
      const image = await page.screenshot({ path: path.join(output, file), animations: "disabled" });
      const geometry = await page.evaluate(() => {
        const root = document.querySelector(".atlyn-overlap");
        const chart = document.querySelector(".chart-scroll");
        const firstBar = document.querySelector(".combination");
        return { rootScrollHeight: root.scrollHeight, chartY: chart?.getBoundingClientRect().top ?? null,
          chartHeight: chart?.clientHeight ?? null, firstBarY: firstBar?.getBoundingClientRect().top ?? null,
          barCount: document.querySelectorAll(".combination").length,
          landing: document.querySelector(".resize-message")?.textContent ?? null };
      });
      evidence.captures.push({ file, width, height, variant, ...geometry, capturedAt: new Date().toISOString(),
        imageSha256: digest(image), datasetSha256: digest(JSON.stringify(rows)), options,
        errors: state.errors, requests: state.requests });
      if (state.errors.length || state.requests.length) throw new Error(`Errors/network in ${file}`);
      if (width >= 258 && height >= 198 && variant === "dense") {
        await page.locator(".chart-scroll").evaluate(node => { node.scrollLeft = node.scrollWidth; node.scrollTop = node.scrollHeight; });
        await additionalCapture(page, state, `dense-scrolled-${width}x${height}.png`, rows, { ...options, scrolledToEnd: true });
      }
      await page.close();
    }
  }
  for (const [variant, settings] of [["high-contrast", { highContrast: true }], ["rtl", { locale: "ar-SA" }]]) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 620 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
    const state = await mount(page, settings, packed);
    await update(page, customerRows, { width: 1280, height: 620 });
    await additionalCapture(page, state, `${variant}-1280x620.png`, customerRows, { ...settings, width: 1280, height: 620 });
    await page.close();
  }
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 620 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
    const dense = membershipDataset(2000, 10, true);
    const state = await mount(page, {}, packed);
    await update(page, dense, { width: 1280, height: 620, maxSets: 10, top: 50,
      fontSize: 20, highlights: dense.map((_, index) => index % 3 === 0 ? 1 : null) });
    await additionalCapture(page, state, "dense-highlight-font20-1280x620.png", dense,
      { width: 1280, height: 620, maxSets: 10, top: 50, fontSize: 20, highlightRule: "Every third row is positive" });
    await page.close();
  }
  const featureRows = (await readFile(path.join("samples", "feature-adoption.csv"), "utf8")).trim()
    .split(/\r?\n/).slice(1).map(line => { const [entity, set] = line.split(","); return [entity, set || null]; });
  for (const [name, rows, options] of [
    ["customer-exact", customerRows, {}],
    ["customer-inclusive", customerRows, { inclusive: true }],
    ["feature-adoption", featureRows, { maxSets: 4, highlights: featureRows.map(row => row[0] === "U012" ? 1 : null) }]
  ]) {
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
    const state = await mount(page, {}, packed);
    await update(page, rows, { ...options, width: 1366, height: 732 });
    await page.evaluate(() => {
      const disclaimer = document.createElement("p");
      disclaimer.textContent = "LOCAL PACKAGED PREVIEW / HOST MOCK - not Power BI Desktop or Service validation";
      disclaimer.style.cssText = "margin:0;padding:8px 12px;font:12px Arial;color:#172D38;background:#FFFFFF;border-top:1px solid #172D38;";
      document.body.append(disclaimer);
    });
    await additionalCapture(page, state, `preview-${name}-1366x768.png`, rows,
      { ...options, width: 1366, height: 732, disclaimer: "Local host mock, not native validation" });
    await page.close();
  }
  await writeFile(path.join(output, "capture-manifest.json"), JSON.stringify(evidence, null, 2));
  console.log(`Captured ${evidence.captures.length} normal/dense layouts plus scroll/contrast/RTL evidence in ${output}`);
} finally { await browser.close(); }

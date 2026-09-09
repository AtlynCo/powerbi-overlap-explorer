import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { createHash } from "node:crypto";
import { readPackage } from "./read-package.mjs";
import { mount } from "../tests/browser-harness.mjs";
import { customerRows, membershipDataset } from "../tests/datasets.mjs";

const stage = process.argv[2] ?? "final";
if (!/^[a-z-]+$/.test(stage)) throw new Error("Use a lowercase evidence stage name");
const packagePath = process.argv[3];
const packed = await readPackage(packagePath);
const output = path.resolve(".tmp", "release-evidence", stage);
await mkdir(output, { recursive: true });
const samples = 30;
const warmups = 5;
const cases = [
  { name: "customer-products", rows: customerRows, options: { maxSets: 6, top: 20 } },
  { name: "dense-exact", rows: membershipDataset(2000, 10, true), options: { maxSets: 10, top: 50 } },
  { name: "bounded-inclusive", rows: membershipDataset(6000, 10).slice(0, 30000), options: { maxSets: 10, top: 50, inclusive: true } },
  { name: "selection-700", rows: Array.from({ length: 700 }, (_, index) => [`Customer-${index}`, "Owned"]), options: { maxSets: 1, top: 20 } }
];
const summarize = values => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return { n: sorted.length, p50: sorted[Math.ceil(sorted.length * .5) - 1],
    p95: sorted[Math.ceil(sorted.length * .95) - 1], max: sorted.at(-1), samples: values };
};
const browser = await chromium.launch({ headless: true });
const report = {
  stage, startedAt: new Date().toISOString(), packageSha256: createHash("sha256").update(packed.bytes).digest("hex"),
  environment: { platform: process.platform, os: os.release(), architecture: os.arch(),
    cpu: os.cpus()[0]?.model, logicalProcessors: os.cpus().length, totalRamGiB: os.totalmem() / (1024 ** 3),
    node: process.version, chromium: browser.version(), viewport: { width: 1280, height: 620 },
    headless: true, reducedMotion: "reduce", workers: 1, warmups, samples, percentileMethod: "nearest-rank" },
  caveats: [
    "Shared Windows machine: other tasks may affect scheduling and maxima; not an isolated hardware or vendor comparison.",
    "Native-shaped host mock only. Power BI model query/filter/highlight latency and service/network latency are not measured.",
    "updateReturn is synchronous visual.update time excluding fixture DataView construction. renderFrames includes update and two animation frames.",
    "selectionFrames includes real DOM click, local contributor panel and mock host callbacks plus two frames; no native model latency.",
    "scrollFrames is a real overflow-scroll mutation plus two animation frames. Null means the case had no scrollable overflow.",
    "Frames impose display/scheduling latency; values are milliseconds, not an FPS or sub-frame rendering guarantee."
  ],
  cases: []
};
try {
  for (const scenario of cases) {
    const page = await browser.newPage({ viewport: report.environment.viewport, reducedMotion: "reduce" });
    const state = await mount(page, {}, packed);
    await page.evaluate(({ rows, options }) => {
      window.benchmarkRows = rows;
      window.benchmarkOptions = { ...options, width: 1280, height: 620 };
    }, scenario);
    const measurements = { updateReturn: [], renderFrames: [], selectionFrames: [], scrollFrames: [] };
    let selectedIdentityCount = 0;
    for (let iteration = -warmups; iteration < samples; iteration++) {
      const measurement = await page.evaluate(async iteration => {
        const frame = () => new Promise(resolve => requestAnimationFrame(resolve));
        const begin = performance.now();
        const updateReturn = window.updateVisual(window.benchmarkRows, window.benchmarkOptions);
        await frame(); await frame();
        const renderFrames = performance.now() - begin;
        const columns = [...document.querySelectorAll(".combination")];
        // Select the last displayed combination: dense inclusive leading single
        // sets can exceed 1,000 identities and intentionally refuse selection.
        const column = columns.at(-1);
        window.externalSelection([]);
        const selectionStart = performance.now();
        column.click();
        await frame(); await frame();
        const selectionFrames = performance.now() - selectionStart;
        const close = document.querySelector('[data-focus-key="close-details"]') ??
          [...document.querySelectorAll(".details button")].find(node => node.textContent === "Close contributors");
        close?.click();
        const scroll = document.querySelector(".chart-scroll");
        const canScroll = scroll.scrollWidth > scroll.clientWidth || scroll.scrollHeight > scroll.clientHeight;
        let scrollFrames = null;
        if (canScroll) {
          const scrollStart = performance.now();
          scroll.scrollLeft = iteration % 2 ? 0 : scroll.scrollWidth;
          scroll.scrollTop = iteration % 2 ? 0 : scroll.scrollHeight;
          await frame(); await frame();
          scrollFrames = performance.now() - scrollStart;
        }
        return { updateReturn, renderFrames, selectionFrames, scrollFrames,
          selectedIdentityCount: window.calls.selected.at(-1)?.keys.length ?? 0,
          renderedBars: columns.length, renderedSets: document.querySelectorAll(".set-row").length };
      }, iteration);
      selectedIdentityCount = measurement.selectedIdentityCount;
      if (iteration >= 0) {
        for (const metric of Object.keys(measurements))
          if (measurement[metric] !== null) measurements[metric].push(measurement[metric]);
      }
    }
    report.cases.push({ name: scenario.name, rows: scenario.rows.length,
      entities: new Set(scenario.rows.map(row => row[0])).size,
      datasetSha256: createHash("sha256").update(JSON.stringify(scenario.rows)).digest("hex"),
      options: scenario.options, selectedIdentityCount,
      metrics: Object.fromEntries(Object.entries(measurements).map(([metric, values]) => [metric, summarize(values)])),
      errors: state.errors, requests: state.requests });
    if (state.errors.length || state.requests.length) throw new Error(`Browser errors/network in ${scenario.name}`);
    await page.close();
  }
  report.completedAt = new Date().toISOString();
  await writeFile(path.join(output, "benchmark.json"), JSON.stringify(report, null, 2));
  const table = report.cases.map(item => ({ case: item.name, rows: item.rows,
    updateP95: item.metrics.updateReturn.p95.toFixed(2), renderP95: item.metrics.renderFrames.p95.toFixed(2),
    selectP95: item.metrics.selectionFrames.p95.toFixed(2), scrollP95: item.metrics.scrollFrames?.p95.toFixed(2) ?? "n/a" }));
  console.table(table);
  console.log(`Raw samples and machine/method caveats: ${path.join(output, "benchmark.json")}`);
} finally { await browser.close(); }

import { test, expect } from "@playwright/test";
import { readPackage } from "../scripts/read-package.mjs";

let packed;
test.beforeAll(async () => { packed = await readPackage(); });

const rows = [
  ["C1", "A"], ["C1", "B"], ["C2", "A"], ["C3", "B"],
  ["C4", "A"], ["C4", "B"], ["C4", "C"], ["C5", null]
];

async function mount(page, settings = {}) {
  const errors = [];
  const requests = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("request", request => requests.push(request.url()));
  await page.route("**/*", route => route.abort());
  await page.setContent("<!doctype html><html><head></head><body><div id='host'></div></body></html>");
  await page.addStyleTag({ content: packed.resource.content.css });
  await page.evaluate(() => { window.powerbi = { visuals: { plugins: {} } }; });
  await page.addScriptTag({ content: packed.resource.content.js });
  await page.evaluate(({ guid, settings, resources }) => {
    const ids = new Map();
    const identity = key => {
      if (!ids.has(key)) ids.set(key, {
        getKey: () => key, hasIdentity: () => true,
        equals: other => key === other.getKey(),
        includes: other => key === other.getKey(),
        getSelector: () => ({ data: [{ key }] }),
        getSelectorsByColumn: () => ({ dataMap: { Entity: { key } } })
      });
      return ids.get(key);
    };
    const calls = window.calls = { selected: [], context: [], tooltips: [], fetch: [], events: [], clear: 0 };
    let selected = [];
    let callback;
    const manager = {
      registerOnSelectCallback(cb) { callback = cb; },
      getSelectionIds: () => selected,
      hasSelection: () => selected.length > 0,
      async select(incoming, multi) {
        if (settings.rejectSelect) throw new Error("host rejected");
        const incomingIds = Array.isArray(incoming) ? incoming : [incoming];
        selected = multi ? [...new Map([...selected, ...incomingIds].map(id => [id.getKey(), id])).values()] : incomingIds;
        calls.selected.push({ keys: incomingIds.map(id => id.getKey()), multi });
        callback(selected);
        return selected;
      },
      async clear() { selected = []; calls.clear++; callback([]); },
      async showContextMenu(id, point) { calls.context.push({ key: typeof id?.getKey === "function" ? id.getKey() : undefined, id, point }); }
    };
    const locale = settings.locale || "en-US";
    const host = {
      locale,
      hostCapabilities: { allowInteractions: settings.allowInteractions !== false },
      createSelectionManager: () => manager,
      createSelectionIdBuilder() {
        let key;
        return {
          withCategory(column, index) { key = column.identity[index].key; return this; },
          createSelectionId: () => identity(key)
        };
      },
      createLocalizationManager: () => ({ getDisplayName: key => resources[locale]?.[key] || key }),
      colorPalette: { isHighContrast: Boolean(settings.highContrast),
        foreground: { value: "#FFFF00" }, background: { value: "#000000" }, foregroundSelected: { value: "#00FFFF" } },
      tooltipService: {
        enabled: () => true, show: args => calls.tooltips.push(args),
        hide: () => {}, move: () => {}
      },
      eventService: {
        renderingStarted: () => calls.events.push("started"),
        renderingFinished: () => calls.events.push("finished"),
        renderingFailed: (_, reason) => calls.events.push(`failed: ${reason}`)
      },
      fetchMoreData: aggregate => { calls.fetch.push(aggregate); return !settings.rejectFetch; }
    };
    window.instance = window.powerbi.visuals.plugins[guid].create({ element: document.getElementById("host"), host });
    window.updateVisual = (input, options = {}) => {
      const columns = [
        { displayName: "Entity", queryName: "Memberships.Entity", roles: { entity: true }, type: { text: true } },
        { displayName: "Set", queryName: "Memberships.Set", roles: { set: true }, type: { text: true } }
      ];
      const values = [{ source: { displayName: "Signal", queryName: "Memberships.Signal", roles: { signal: true }, isMeasure: true },
        values: input.map(() => 1), ...(options.highlights ? { highlights: options.highlights } : {}) }];
      values.grouped = () => [];
      const view = {
        metadata: { columns, objects: {
          analysis: { inclusive: Boolean(options.inclusive), maxSets: options.maxSets ?? 6, top: options.top ?? 20, minimum: options.minimum ?? 1 },
          appearance: { fontSize: options.fontSize ?? 12,
            ...(options.color ? { barColor: { solid: { color: options.color } } } : {}) }
        }, ...(options.segmented ? { segment: {} } : {}) },
        categorical: {
          categories: columns.map((source, column) => ({
            source, values: input.map(row => row[column]),
            identity: options.missingIds ? undefined : input.map((row, index) => ({ key: options.identityKeys?.[index] ?? `${column}:${JSON.stringify(row[column])}` }))
          })),
          values
        }
      };
      window.instance.update({ dataViews: options.noViews ? [] : [view], viewport: {
        width: options.width ?? 950, height: options.height ?? 800
      }, type: options.type ?? 2, operationKind: options.operationKind ?? 0 });
    };
    window.externalSelection = keys => { selected = keys.map(identity); callback(selected); };
  }, { guid: packed.resource.visual.guid, settings, resources: packed.resource.stringResources });
  return { errors, requests };
}

async function update(page, data = rows, options = {}) {
  await page.evaluate(({ data, options }) => window.updateVisual(data, options), { data, options });
}

test("packaged visual renders aligned bars/matrix and native identity interactions without networking", async ({ page }) => {
  const state = await mount(page);
  await update(page);
  await expect(page.locator(".universe")).toContainText("5");
  await expect(page.locator(".combination")).toHaveCount(5);
  const alignment = await page.evaluate(() => {
    const margin = document.querySelector(".set-row").getBoundingClientRect();
    const dots = [...document.querySelectorAll(".matrix .dot-row:first-of-type")].map(node => node.getBoundingClientRect());
    return dots.every(dot => Math.abs(dot.top - margin.top) < 1 && dot.height === margin.height);
  });
  expect(alignment).toBe(true);
  const both = page.locator('.combination[data-mask="3"]');
  await both.click();
  await expect(page.locator(".details")).toBeVisible();
  await expect(page.locator(".contributors button")).toHaveText(["C1"]);
  expect(await page.evaluate(() => window.calls.selected.at(-1).keys)).toEqual(['0:"C1"']);
  await both.hover();
  expect(await page.evaluate(() => window.calls.tooltips.at(-1).identities.map(id => id.getKey()))).toEqual(['0:"C1"']);
  await both.click({ button: "right" });
  expect(await page.evaluate(() => window.calls.context.at(-1).key)).toBe('0:"C1"');
  await expect(page.locator(".interaction-status")).toContainText("C1");
  await page.keyboard.press("Escape");
  expect(await page.evaluate(() => window.calls.clear)).toBe(1);
  await both.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator('.combination[data-mask="7"]')).toBeFocused();
  await page.keyboard.press("Home");
  await expect(page.locator('.combination[data-mask="0"]')).toBeFocused();
  await page.keyboard.press("Shift+F10");
  expect(await page.evaluate(() => window.calls.context.at(-1).key)).toBe('0:"C5"');
  const format = await page.evaluate(() => window.instance.getFormattingModel());
  expect(format.cards).toHaveLength(2);
  expect(await page.evaluate(() => window.calls.events)).toEqual(["started", "finished"]);
  expect(state.errors).toEqual([]);
  expect(state.requests).toEqual([]);
});

test("cross-highlights preserve full entity membership; duplicate identities survive", async ({ page }) => {
  await mount(page);
  const data = [["C1", "A"], ["C1", "A"], ["C1", "B"], ["C2", "A"]];
  await update(page, data, { identityKeys: ["native-1", "native-2", "native-3", "native-4"], highlights: [null, 1, null, null] });
  await expect(page.locator(".summary")).toContainText("deduplicated: 1");
  const both = page.locator('.combination[data-mask="3"]');
  await expect(both).toHaveAttribute("aria-label", /Highlighted entities: 1/);
  await both.click();
  expect(await page.evaluate(() => window.calls.selected.at(-1).keys)).toEqual(["native-1", "native-2", "native-3"]);
  await page.evaluate(() => window.externalSelection(["native-4"]));
  await expect(page.locator('.combination[data-mask="1"]')).toHaveAttribute("aria-pressed", "true");
  await expect(both).toHaveAttribute("aria-pressed", "false");
});

test("inclusive counts, set reduction, zero entities and min/top disclosure", async ({ page }) => {
  await mount(page);
  await update(page, rows, { inclusive: true, top: 2, maxSets: 2 });
  await expect(page.locator(".mode")).toContainText("INCLUSIVE");
  await expect(page.locator(".summary")).toContainText("Counts overlap");
  await expect(page.locator(".summary")).toContainText("1 sets omitted");
  await expect(page.locator(".combination")).toHaveCount(2);
  await expect(page.locator('.combination[data-mask="1"] .count')).toHaveText("3");
  await update(page, rows, { minimum: 30000 });
  await expect(page.locator(".combination")).toHaveCount(0);
  await expect(page.locator(".atlyn-overlap")).toContainText("No combinations meet");
});

test("aggregated segments, duplicate overlap, refusal and reset are truthful", async ({ page }) => {
  await mount(page);
  await update(page, [["C1", "A"]], { segmented: true });
  await expect(page.locator(".completeness")).toContainText("PARTIAL");
  await page.getByRole("button", { name: "Load more rows" }).click();
  expect(await page.evaluate(() => window.calls.fetch)).toEqual([true]);
  await expect(page.getByRole("button", { name: "Load more rows" })).toBeDisabled();
  await update(page, [["C1", "A"], ["C1", "A"], ["C1", "B"], ["C2", "A"]], { operationKind: 1 });
  await expect(page.locator(".universe")).toContainText("2");
  await expect(page.locator(".completeness")).not.toContainText("PARTIAL");
  await expect(page.locator(".summary")).toContainText("deduplicated: 1");
  await update(page, [["new", "Z"]]);
  await expect(page.locator(".universe")).toContainText("1");
  await expect(page.locator(".set-label")).toHaveText(["Z"]);
  await update(page, [["incremental", "bad"]], { operationKind: 2 });
  await expect(page.locator(".atlyn-overlap")).toContainText("Unexpected incremental segment");
  await expect(page.locator(".combination")).toHaveCount(0);
  await update(page, []);
  await expect(page.locator(".atlyn-overlap")).toContainText("No valid entities");
});

test("refused fetch remains partial and can be retried", async ({ page }) => {
  await mount(page, { rejectFetch: true });
  await update(page, rows, { segmented: true });
  await page.getByRole("button", { name: "Load more rows" }).click();
  await expect(page.locator(".atlyn-overlap")).toContainText("Host declined");
  await expect(page.getByRole("button", { name: "Retry loading" })).toBeEnabled();
});

test("large or missing-identity groups never silently select a subset", async ({ page }) => {
  await mount(page);
  await update(page, Array.from({ length: 1001 }, (_, index) => [`E${index}`, "A"]));
  await page.locator(".combination").click();
  await expect(page.locator(".interaction-status")).toContainText("exceeds 1,000");
  expect(await page.evaluate(() => window.calls.selected)).toEqual([]);
  await expect(page.locator(".contributors button")).toHaveCount(200);
  await page.locator(".contributors button").first().click();
  expect(await page.evaluate(() => window.calls.selected.at(-1).keys.length)).toBe(1);
  await update(page, rows, { missingIds: true });
  await page.locator(".combination").first().click();
  await expect(page.locator(".interaction-status")).toContainText("no host identity");
});

test("host selection errors are surfaced, no success fallback", async ({ page }) => {
  await mount(page, { rejectSelect: true });
  await update(page);
  await page.locator(".combination").first().click();
  await expect(page.locator(".interaction-status")).toContainText("could not apply");
});

test("host read-only/export mode prevents native interactions", async ({ page }) => {
  await mount(page, { allowInteractions: false });
  await update(page, rows, { segmented: true });
  await expect(page.getByRole("button", { name: "Clear selection" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Load more rows" })).toBeDisabled();
  await page.locator(".combination").first().click();
  await expect(page.locator(".interaction-status")).toContainText("disabled by the host");
  await page.locator(".combination").first().click({ button: "right" });
  expect(await page.evaluate(() => window.calls.selected.length + window.calls.context.length)).toBe(0);
});

test("Ctrl-addition also respects the total native identity bound", async ({ page }) => {
  await mount(page);
  const data = Array.from({ length: 1400 }, (_, index) => [`E${index}`, index < 700 ? "A" : "B"]);
  await update(page, data);
  await page.locator('.combination[data-mask="1"]').click();
  await page.locator('.combination[data-mask="2"]').click({ modifiers: ["Control"] });
  await expect(page.locator(".interaction-status")).toContainText("exceeds 1,000");
  expect(await page.evaluate(() => window.calls.selected.length)).toBe(1);
});

test("high contrast, RTL keyboard, narrow scroll and French resources", async ({ page }) => {
  await mount(page, { highContrast: true, locale: "ar-SA" });
  await update(page, rows, { width: 320, height: 400, fontSize: 20 });
  await expect(page.locator(".atlyn-overlap")).toHaveAttribute("dir", "rtl");
  expect(await page.locator(".bar").first().evaluate(node => getComputedStyle(node).backgroundColor)).toBe("rgb(255, 255, 0)");
  expect(await page.locator(".chart-scroll").evaluate(node => node.scrollWidth > node.clientWidth)).toBe(true);
  await page.locator(".combination").first().focus();
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator('.combination[data-mask="1"]')).toBeFocused();
  await page.evaluate(() => window.instance.destroy());
  await expect(page.locator(".atlyn-overlap")).toHaveCount(0);
  await mount(page, { locale: "fr-FR" });
  await update(page);
  await expect(page.getByRole("button", { name: "Effacer la selection" })).toBeVisible();
  await expect(page.locator(".universe")).toContainText("univers recu");
});

test("unsafe labels stay text, resize preserves data, invalid binding clears old counts", async ({ page }) => {
  const state = await mount(page);
  await update(page, [['<img src=x onerror="window.pwned=1">', "<script>bad</script>"]]);
  await page.locator(".combination").click();
  await expect(page.locator(".contributors")).toContainText("<img");
  await expect(page.locator(".atlyn-overlap img, .atlyn-overlap script")).toHaveCount(0);
  await update(page, [], { type: 4, noViews: true, width: 300, height: 300 });
  await expect(page.locator(".universe")).toContainText("1");
  await update(page, [], { noViews: true });
  await expect(page.locator(".atlyn-overlap")).toContainText("Bind exactly one");
  await expect(page.locator(".combination")).toHaveCount(0);
  expect(state.errors).toEqual([]);
  expect(state.requests).toEqual([]);
});

test("format metadata cannot inject a network-backed CSS background", async ({ page }) => {
  const state = await mount(page);
  await update(page, rows, { color: "url(https://invalid.example/pixel)" });
  await expect(page.locator(".interaction-status")).toContainText("Invalid bar color");
  expect(await page.locator(".bar").first().evaluate(node => getComputedStyle(node).backgroundImage)).toBe("none");
  expect(state.requests).toEqual([]);
});

test("row limit and unknown unloaded totals are visible", async ({ page }) => {
  await mount(page);
  await update(page, Array.from({ length: 30002 }, (_, index) => [`E${index}`, "A"]), { segmented: true });
  await expect(page.locator(".summary")).toContainText("dropped by row bound: 2");
  await expect(page.locator(".summary")).toContainText("Unloaded rows: unknown");
  await expect(page.getByRole("button", { name: "Load more rows" })).toHaveCount(0);
  await expect(page.locator(".completeness")).toContainText("PARTIAL");
});

test("right-clicking header, footer or background opens context menu with empty identity (Policy 1180.2.5)", async ({ page }) => {
  await mount(page);
  await update(page, rows);
  await page.locator("header").click({ button: "right" });
  expect(await page.evaluate(() => window.calls.context.at(-1))).toMatchObject({ key: undefined, id: {} });
  await page.locator(".combination-caption").click({ button: "right" });
  expect(await page.evaluate(() => window.calls.context.at(-1))).toMatchObject({ key: undefined, id: {} });
  await page.locator(".atlyn-overlap").click({ button: "right", position: { x: 5, y: 5 } });
  expect(await page.evaluate(() => window.calls.context.at(-1))).toMatchObject({ key: undefined, id: {} });
});

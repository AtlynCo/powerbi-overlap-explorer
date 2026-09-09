import { test, expect } from "@playwright/test";
import { mount, update } from "./browser-harness.mjs";
import { customerRows, membershipDataset } from "./datasets.mjs";

for (const [width, height] of [[80, 80], [258, 198], [398, 298], [1280, 620], [1366, 768]]) {
  test(`readable packaged ${width}x${height} layout, scrollable matrix and stable set margins`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const state = await mount(page);
    await update(page, customerRows, { width, height });
    if (width === 80) {
      await expect(page.locator(".resize-message")).toBeVisible();
      await expect(page.locator(".combination")).toHaveCount(0);
      expect(await page.locator(".atlyn-overlap").evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
    } else {
      await expect(page.locator(".combination")).toHaveCount(8);
      const geometry = await page.evaluate(() => {
        const chart = document.querySelector(".chart-scroll");
        const margin = document.querySelector(".margins");
        const row = document.querySelector(".set-row").getBoundingClientRect();
        const dot = document.querySelector(".dot-row").getBoundingClientRect();
        return { chartY: chart.getBoundingClientRect().top, chartHeight: chart.clientHeight,
          gap: Math.abs(row.top - dot.top), marginX: margin.getBoundingClientRect().left,
          rowHeight: row.height, dotHeight: dot.height };
      });
      expect(geometry.chartY).toBeLessThan(height * .6);
      expect(geometry.chartHeight).toBeGreaterThanOrEqual(80);
      expect(geometry.gap).toBeLessThan(1);
      expect(geometry.rowHeight).toBe(geometry.dotHeight);
      await page.locator(".chart-scroll").evaluate(node => { node.scrollLeft = node.scrollWidth; });
      expect(await page.locator(".margins").evaluate(node => node.getBoundingClientRect().left)).toBeCloseTo(geometry.marginX, 0);
      await page.locator(".chart-scroll").evaluate(node => { node.scrollTop = node.scrollHeight; });
      await expect(page.locator(".set-label").last()).toBeInViewport();
      await page.locator(".diagnostics summary").click();
      await expect(page.locator(".set-legend")).toContainText("C: Cove");
      await expect(page.locator(".diagnostic-content")).toContainText("deduplicated: 1");
    }
    expect(state.errors).toEqual([]);
    expect(state.requests).toEqual([]);
  });
}

test("delayed native selection cannot bypass the additive identity cap, and Escape queues clear", async ({ page }) => {
  await mount(page, { selectionDelay: 120 });
  const input = Array.from({ length: 1400 }, (_, index) => [`E${index}`, index < 700 ? "A" : "B"]);
  await update(page, input);
  await page.evaluate(() => {
    document.querySelector('[data-mask="1"]').click();
    document.querySelector('[data-mask="2"]').dispatchEvent(new MouseEvent("click", { bubbles: true, ctrlKey: true }));
  });
  await expect(page.locator(".interaction-status")).toContainText("still pending");
  await expect.poll(() => page.evaluate(() => window.calls.selected.length)).toBe(1);
  await page.evaluate(() => document.querySelector('[data-mask="2"]').dispatchEvent(new MouseEvent("click", { bubbles: true, ctrlKey: true })));
  await expect(page.locator(".interaction-status")).toContainText("exceeds 1,000");
  await page.evaluate(() => {
    document.querySelector('[data-mask="1"]').click();
    document.querySelector(".atlyn-overlap").dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  });
  await expect.poll(() => page.evaluate(() => window.calls.clear)).toBe(1);
  await expect(page.locator('.combination[aria-pressed="true"]')).toHaveCount(0);
});

test("destroy cancels queued native calls and all later lifecycle callbacks are inert", async ({ page }) => {
  const state = await mount(page, { selectionDelay: 60 });
  await update(page, customerRows);
  await page.evaluate(() => {
    document.querySelector(".combination").click();
    window.instance.destroy();
    window.externalSelection(['0:"C002"']);
    window.updateVisual([["later", "later"]]);
  });
  await page.waitForTimeout(100);
  await expect(page.locator(".atlyn-overlap")).toHaveCount(0);
  expect(await page.evaluate(() => window.calls.selected)).toEqual([]);
  expect(state.errors).toEqual([]);
});

test("partial entity selection is mixed, not falsely announced as a fully selected combination", async ({ page }) => {
  await mount(page);
  await update(page, customerRows);
  await page.evaluate(() => window.externalSelection(['0:"C002"']));
  await expect(page.locator('[data-mask="1"]')).toHaveAttribute("aria-pressed", "mixed");
  await expect(page.locator('[data-mask="3"]')).toHaveAttribute("aria-pressed", "false");
});

test("set margins select all set members, never an exclusive-only bucket in exact mode", async ({ page }) => {
  await mount(page);
  await update(page, customerRows);
  await page.getByRole("button", { name: /Select all 6 entities in A: Atlas/ }).click();
  expect(await page.evaluate(() => window.calls.selected.at(-1).keys)).toEqual([
    '0:"C001"', '0:"C002"', '0:"C004"', '0:"C006"', '0:"C009"', '0:"C010"'
  ]);
  await expect(page.locator(".details h3")).toHaveText("All members of Atlas");
  await expect(page.locator(".contributors button")).toHaveCount(6);
  await page.getByRole("button", { name: "Close contributors" }).click();
  await expect(page.getByRole("button", { name: /Select all 6 entities in A: Atlas/ })).toBeFocused();
  await page.keyboard.press("Shift+F10");
  expect(await page.evaluate(() => window.calls.context.at(-1).key)).toBe('0:"C001"');
});

test("search and pagination reach contributors beyond the first 200 without creating group identities", async ({ page }) => {
  await mount(page);
  await update(page, Array.from({ length: 1200 }, (_, index) => [`Entity-${String(index).padStart(4, "0")}`, "A"]));
  await page.getByRole("button", { name: "Inspect", exact: true }).click();
  await expect(page.locator(".entity-search")).toBeFocused();
  expect(await page.evaluate(() => window.calls.selected)).toEqual([]);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.locator(".contributors button").first()).toHaveText("Entity-0200");
  await page.locator(".entity-search").fill("1199");
  await expect(page.locator(".contributors button")).toHaveText(["Entity-1199"]);
  await page.locator(".contributors button").click();
  expect(await page.evaluate(() => window.calls.selected.at(-1).keys)).toEqual(['0:"Entity-1199"']);
  await page.locator(".contributors button").click({ button: "right" });
  expect(await page.evaluate(() => window.calls.context.at(-1).key)).toBe('0:"Entity-1199"');
  await page.getByRole("button", { name: "Close contributors" }).click();
  await expect(page.locator(".combination")).toBeFocused();
});

test("bookmarked formatting rehydrates mode/limits/colors and returns identical counts after restore", async ({ page }) => {
  const state = await mount(page);
  const objects = { analysis: { inclusive: true, maxSets: 2, top: 2, minimum: 2 },
    appearance: { fontSize: 16, barColor: { solid: { color: "#803399" } } } };
  await update(page, customerRows, { objects, save: true });
  const before = await page.locator(".combination").evaluateAll(nodes => nodes.map(node => node.getAttribute("aria-label")));
  await expect(page.locator(".mode")).toContainText("INCLUSIVE");
  expect(await page.locator(".bar").first().evaluate(node => getComputedStyle(node).backgroundColor)).toBe("rgb(128, 51, 153)");
  await update(page, [["other", "new"]], { inclusive: false });
  await update(page, [], { restore: true });
  expect(await page.locator(".combination").evaluateAll(nodes => nodes.map(node => node.getAttribute("aria-label")))).toEqual(before);
  const format = await page.evaluate(() => window.instance.getFormattingModel());
  expect(JSON.stringify(format)).toContain("inclusive");
  expect(await page.evaluate(() => window.calls.persisted)).toEqual([]);
  expect(state.errors).toEqual([]);
});

test("resize preserves inspection search/focus, but rebind and invalid role changes discard stale masks", async ({ page }) => {
  await mount(page);
  await update(page, customerRows);
  await page.getByRole("button", { name: "Inspect", exact: true }).click();
  await page.locator(".entity-search").fill("C009");
  await update(page, [], { type: 4, noViews: true, width: 398, height: 298 });
  await expect(page.locator(".entity-search")).toBeFocused();
  await expect(page.locator(".entity-search")).toHaveValue("C009");
  await expect(page.locator(".contributors button")).toHaveText(["C009"]);
  await update(page, [["same", "Different"]], { entityQuery: "Other.ID", setQuery: "Other.Set" });
  await expect(page.locator(".details")).toBeHidden();
  await expect(page.locator(".set-label")).toHaveText(["Different"]);
  await update(page, customerRows, { invalidRoles: true });
  await expect(page.locator(".combination")).toHaveCount(0);
  await expect(page.locator(".onboarding")).toBeVisible();
  await update(page, customerRows);
  await expect(page.locator(".universe")).toContainText("10");
});

test("separate instances isolate options, native selections, high contrast and destroy", async ({ page }) => {
  await mount(page);
  await update(page, customerRows, { width: 398, height: 298 });
  await page.evaluate(() => {
    window.createFixture({ highContrast: true });
    window.fixtures[1].update([["second", "Its own set"]], { width: 398, height: 298, inclusive: true });
    window.fixtures[1].externalSelection(['0:"second"']);
  });
  const first = page.locator('[data-fixture="0"]');
  const second = page.locator('[data-fixture="1"]');
  await expect(first.locator('.combination[aria-pressed="true"]')).toHaveCount(0);
  await expect(second.locator('.combination[aria-pressed="true"]')).toHaveCount(1);
  expect(await first.locator(".bar").first().evaluate(node => getComputedStyle(node).backgroundColor)).not.toBe("rgb(255, 255, 0)");
  expect(await second.locator(".bar").first().evaluate(node => getComputedStyle(node).backgroundColor)).toBe("rgb(255, 255, 0)");
  await page.evaluate(() => window.fixtures[0].visual.destroy());
  await expect(first.locator(".atlyn-overlap")).toHaveCount(0);
  await expect(second.locator(".combination")).toHaveCount(1);
});

test("real touch events expose a native tooltip and select only represented identities", async ({ browser }) => {
  const page = await browser.newPage({ hasTouch: true, viewport: { width: 1280, height: 620 }, reducedMotion: "reduce" });
  const state = await mount(page);
  await update(page, customerRows, { width: 1280, height: 620 });
  await page.locator('[data-mask="3"]').tap();
  expect(await page.evaluate(() => window.calls.selected.at(-1).keys)).toEqual(['0:"C001"', '0:"C010"']);
  expect(await page.evaluate(() => window.calls.tooltips.some(item => item.isTouchEvent))).toBe(true);
  expect(await page.locator(".bar").first().evaluate(node => getComputedStyle(node).animationName)).toBe("none");
  expect(state.errors).toEqual([]);
  expect(state.requests).toEqual([]);
  await page.close();
});

test("dense RTL and high contrast preserve bar-dot correspondence after two-dimensional scroll", async ({ page }) => {
  await mount(page, { locale: "ar-SA", highContrast: true });
  await update(page, membershipDataset(2000, 10, true), { width: 1366, height: 768, maxSets: 10, top: 50, highlights: undefined });
  await page.locator(".chart-scroll").evaluate(node => { node.scrollLeft = -node.scrollWidth; node.scrollTop = node.scrollHeight; });
  const align = await page.evaluate(() => {
    const row = document.querySelectorAll(".set-row")[9].getBoundingClientRect();
    const cells = document.querySelector(".matrix").querySelectorAll(".dot-row");
    const dot = cells[9].getBoundingClientRect();
    return Math.abs(row.top - dot.top);
  });
  expect(align).toBeLessThan(1);
  await page.locator(".combination").first().focus();
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator(".combination").nth(1)).toBeFocused();
});

test("all-null highlights, missing measure, overlong blanks and malformed highlights never fabricate counts", async ({ page }) => {
  const state = await mount(page);
  await update(page, customerRows, { highlights: customerRows.map(() => null) });
  expect(await page.locator(".highlight-count").allTextContents()).toEqual(Array(8).fill("H: 0"));
  await update(page, customerRows, { noSignal: true });
  await expect(page.locator(".highlight")).toHaveCount(0);
  await update(page, [["valid", " ".repeat(257)], ["other", null]]);
  await page.locator(".diagnostics summary").click();
  await expect(page.locator(".diagnostic-content")).toContainText("invalid: 1");
  await expect(page.locator(".universe")).toContainText("1");
  await update(page, customerRows, { highlightLengthMismatch: true });
  await expect(page.locator(".interaction-status")).toContainText("Inconsistent");
  await expect(page.locator(".combination")).toHaveCount(0);
  expect(state.errors).toEqual([]);
});

test("large formatted set counts stay within the margin at the largest text setting", async ({ page }) => {
  await mount(page);
  const input = Array.from({ length: 30000 }, (_, index) => [`Entity-${index}`, "Set with a long descriptive name"]);
  await update(page, input, { width: 1280, height: 620, fontSize: 20, highlights: input.map(() => 1) });
  const overflow = await page.locator(".set-count").evaluate(node => {
    const count = node.getBoundingClientRect();
    const margin = node.closest(".margins").getBoundingClientRect();
    return count.right - margin.right;
  });
  expect(overflow).toBeLessThanOrEqual(0);
  await expect(page.locator(".set-count")).toHaveText("30,000");
  const dense = membershipDataset(2000, 10, true);
  await update(page, dense, { width: 1280, height: 620, fontSize: 20, maxSets: 10, top: 50,
    highlights: dense.map(() => 1) });
  const inspectionClipped = await page.locator(".margin-title button").evaluate(node => node.scrollHeight > node.clientHeight);
  expect(inspectionClipped).toBe(false);
});

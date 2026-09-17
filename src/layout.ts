import { Analysis, Combination, boundedInteger, LIMITS } from "./engine";
import { ParsedData } from "./data";
import { localizer } from "./localization";

export function element<K extends keyof HTMLElementTagNameMap>(tag: K, className = "", text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function button(text: string, key: string): HTMLButtonElement {
  const node = element("button", "", text);
  node.type = "button";
  node.dataset.focusKey = key;
  return node;
}

export interface Layout {
  status: HTMLParagraphElement;
  detail: HTMLElement;
  caption: HTMLElement;
  bars: { button: HTMLButtonElement; combination: Combination }[];
  sets: { button: HTMLButtonElement; index: number; key: string }[];
  clear?: HTMLButtonElement;
  inspect?: HTMLButtonElement;
  load?: HTMLButtonElement;
  diagnostics?: HTMLDetailsElement;
  scroller?: HTMLElement;
}

interface LayoutOptions {
  width: number;
  height: number;
  fontSize: number;
  diagnosticsOpen: boolean;
  pendingFetch: boolean;
  rejectedFetch: boolean;
  unexpectedSegment: boolean;
  interactions: boolean;
  description: (combination: Combination) => string;
  t: ReturnType<typeof localizer>;
  number: Intl.NumberFormat;
}

export function renderLayout(root: HTMLElement, analysis: Analysis, parsed: ParsedData, options: LayoutOptions): Layout {
  const { t, number } = options;
  const n = (value: number) => number.format(value);
  const compact = options.width < 500 || options.height < 360;
  const tiny = options.width < 180 || options.height < 150;
  const fontSize = boundedInteger(options.fontSize, 12, 10, 20);
  const barSpace = compact ? 48 : Math.min(300, Math.max(120, options.height - 190 - analysis.sets.length * 32));
  const countLength = Math.max(1, ...analysis.sets.map(set => n(set.size).length));
  root.classList.toggle("compact", compact);
  root.classList.toggle("tiny", tiny);
  root.style.fontSize = `${fontSize}px`;
  root.style.setProperty("--row-height", compact ? "24px" : "32px");
  root.style.setProperty("--bar-space", `${barSpace}px`);
  root.style.setProperty("--count-width", `${Math.max(compact ? 25 : 42, Math.ceil(countLength * (compact ? 11 : fontSize) * .66) + 4)}px`);
  root.style.setProperty("--index-height", compact ? "24px" : "30px");
  root.style.setProperty("--margin-width", compact ? "116px" : "238px");
  root.style.setProperty("--column-width", compact ? "56px" : "76px");
  root.replaceChildren();
  const layout: Layout = {
    status: element("p", "interaction-status"), detail: element("section", "details"),
    caption: element("footer", "combination-caption"), bars: [], sets: []
  };
  layout.status.setAttribute("role", "status");
  layout.status.setAttribute("aria-live", "polite");
  layout.detail.hidden = true;
  layout.detail.setAttribute("aria-label", t("Details"));
  layout.caption.setAttribute("aria-live", "polite");
  if (tiny) {
    const heading = element("strong", "", t("ShortTitle"));
    root.append(heading, element("p", "resize-message", t("Enlarge")));
    if (!parsed.error && !options.unexpectedSegment)
      root.append(element("p", "tiny-universe", t("CompactUniverse", n(analysis.universe))),
        element("span", "sr-only", t(parsed.segmented || analysis.invalid || analysis.dropped ? "Partial" : "Complete")));
    root.setAttribute("aria-label", `${t("Title")}. ${t("EnlargeAdvice")}`);
    root.tabIndex = 0;
    return layout;
  }
  root.removeAttribute("tabindex");
  root.setAttribute("aria-label", t("Title"));
  const header = element("header", "topline");
  header.append(element("h2", "", t(compact ? "ShortTitle" : "Title")));
  const toolbar = element("div", "toolbar");
  layout.clear = button(t(compact ? "ClearShort" : "Clear"), "clear");
  layout.clear.setAttribute("aria-label", t("Clear"));
  layout.clear.disabled = !options.interactions;
  toolbar.append(layout.clear);
  if (parsed.segmented && !parsed.error && analysis.received < LIMITS.rows) {
    layout.load = button(t(options.rejectedFetch ? "Retry" : "Load"), "load");
    layout.load.disabled = options.pendingFetch || !options.interactions;
    toolbar.append(layout.load);
  }
  header.append(toolbar);
  root.append(header, layout.status);
  if (options.unexpectedSegment || parsed.error) {
    layout.status.textContent = t(options.unexpectedSegment ? "UnexpectedSegment" : parsed.error!);
    const onboarding = element("div", "onboarding");
    onboarding.append(element("strong", "", t("OnboardingTitle")));
    const steps = element("ol");
    for (const key of ["OnboardingEntity", "OnboardingSet", "OnboardingSignal"] as const) steps.append(element("li", "", t(key)));
    onboarding.append(steps, element("p", "", t("OnboardingBlank")));
    root.append(onboarding);
    return layout;
  }
  const summary = element("div", "summary");
  const headline = element("div", "headline");
  headline.append(element("strong", "mode", t(analysis.options.inclusive ? "ModeInclusive" : "ModeExact")),
    element("span", "universe", t(compact ? "CompactUniverse" : "ShortUniverse", n(analysis.universe))));
  summary.append(headline);
  const partial = parsed.segmented || analysis.invalid > 0 || analysis.dropped > 0;
  if (partial) summary.append(element("p", "warning completeness", t("PartialShort")));
  else summary.append(element("span", "sr-only completeness", t("Complete")));
  if (analysis.omittedSets) summary.append(element("p", "warning reduction", t("ReductionShort", n(analysis.omittedSets))));
  if (analysis.options.inclusive) summary.append(element("p", "inclusive-warning", t("InclusiveShort")));
  if (options.pendingFetch) summary.append(element("p", "warning", t("Loading")));
  if (options.rejectedFetch) summary.append(element("p", "warning", t("Rejected")));
  const diagnostics = element("details", "diagnostics");
  diagnostics.open = options.diagnosticsOpen;
  const diagnosticsTitle = element("summary", "", t("Diagnostics", n(analysis.received)));
  diagnosticsTitle.dataset.focusKey = "diagnostics";
  diagnostics.append(diagnosticsTitle);
  const diagnosticContent = element("div", "diagnostic-content");
  diagnosticContent.append(element("p", "", t("Universe", n(analysis.universe))),
    element("p", "", t("Stats", n(analysis.received), n(analysis.invalid), n(analysis.deduplicated), n(analysis.dropped))),
    element("p", "", t(parsed.segmented ? "Unloaded" : "Loaded")),
    element("p", "", t(partial ? "Partial" : "Complete")),
    element("p", "", t("Zero", n(analysis.zero))),
    element("p", "", t(analysis.options.inclusive ? "InclusiveHelp" : "ExactHelp")),
    element("p", "", t(parsed.highlights ? "HighlightHelp" : "NoSignal")),
    element("p", "", t("Hidden", n(analysis.hiddenCombinations))),
    element("p", "", t("Keyboard")));
  if (analysis.omittedSets) diagnosticContent.append(element("p", "", t("Reduction", n(analysis.omittedSets))));
  if (analysis.received >= LIMITS.rows && (parsed.segmented || analysis.dropped))
    diagnosticContent.append(element("p", "", t("RowBound")));
  const legend = element("dl", "set-legend");
  analysis.sets.forEach((set, index) => {
    legend.append(element("dt", "", `${String.fromCharCode(65 + index)}: ${set.label}`),
      element("dd", "", `${t("Count")}: ${n(set.size)}. ${t("RawValue")}: ${set.key}`));
  });
  diagnosticContent.append(legend);
  diagnostics.append(diagnosticContent);
  layout.diagnostics = diagnostics;
  summary.append(diagnostics);
  root.append(summary);
  if (!analysis.universe || !analysis.combinations.length) {
    root.append(element("p", "empty-message", t(analysis.universe ? "NoCombinations" : "NoData")));
    return layout;
  }
  const scroller = element("div", "chart-scroll");
  scroller.setAttribute("role", "region");
  scroller.setAttribute("aria-label", t("ChartHelp"));
  scroller.tabIndex = 0;
  scroller.dataset.focusKey = "chart";
  layout.scroller = scroller;
  const chart = element("div", "chart");
  chart.style.gridTemplateColumns = `var(--margin-width) repeat(${analysis.combinations.length}, var(--column-width))`;
  const margins = element("div", "margins");
  const marginTitle = element("div", "bar-space margin-title");
  marginTitle.append(element("strong", "", t("Count")));
  if (!compact && barSpace >= 240 && fontSize <= 14) marginTitle.append(element("span", "", t("BarMeaning")));
  if (!compact && parsed.highlights) marginTitle.append(element("span", "", `H: ${t("Highlighted")}`));
  layout.inspect = button(t("Inspect"), "inspect");
  marginTitle.append(layout.inspect);
  margins.append(marginTitle, element("div", "index-row", t("SetsShort")));
  const largestSet = Math.max(1, ...analysis.sets.map(set => set.size));
  for (const [index, set] of analysis.sets.entries()) {
    const row = button("", `set:${set.key}`);
    row.className = "set-row";
    row.setAttribute("aria-label", t("SelectSet", `${String.fromCharCode(65 + index)}: ${set.label}`, n(set.size)));
    row.title = `${String.fromCharCode(65 + index)}: ${set.label} (${set.key}): ${n(set.size)}`;
    row.append(element("strong", "set-code", String.fromCharCode(65 + index)),
      element("bdi", "set-label", set.label), element("span", "set-count", n(set.size)));
    const meter = element("span", "set-meter");
    const fill = element("span", "set-fill");
    fill.style.width = `${100 * set.size / largestSet}%`;
    meter.append(fill);
    row.append(meter);
    margins.append(row);
    layout.sets.push({ button: row, index, key: set.key });
  }
  chart.append(margins);
  const maximum = Math.max(1, ...analysis.combinations.map(item => item.count));
  for (const combination of analysis.combinations) {
    const column = button("", `mask:${combination.mask}`);
    column.className = "combination";
    column.dataset.mask = String(combination.mask);
    column.setAttribute("aria-label", options.description(combination));
    column.title = `${options.description(combination)}. ${t("Context")}`;
    const barSpace = element("div", "bar-space");
    barSpace.append(element("span", "count", n(combination.count)));
    const track = element("div", "bar-track");
    const bar = element("div", "bar");
    bar.style.height = `${100 * combination.count / maximum}%`;
    track.append(bar);
    if (parsed.highlights) {
      const highlight = element("div", "highlight");
      highlight.style.height = `${100 * combination.highlighted / maximum}%`;
      highlight.hidden = combination.highlighted === 0;
      track.append(highlight);
      barSpace.append(element("span", "highlight-count", `H: ${n(combination.highlighted)}`));
    }
    barSpace.append(track);
    const codes = analysis.sets.flatMap((_, bit) => combination.mask & (1 << bit) ? [String.fromCharCode(65 + bit)] : []);
    column.append(barSpace, element("div", "index-row combination-code", codes.join("+") || t("NoneShort")));
    const matrix = element("div", "matrix");
    const active = analysis.sets.map((_, bit) => bit).filter(bit => combination.mask & (1 << bit));
    if (active.length > 1) {
      const connector = element("span", "connector");
      connector.style.top = `calc(${active[0]! + 0.5} * var(--row-height))`;
      connector.style.height = `calc(${active[active.length - 1]! - active[0]!} * var(--row-height))`;
      matrix.append(connector);
    }
    analysis.sets.forEach((_, bit) => {
      const cell = element("div", "dot-row");
      cell.append(element("span", `dot${combination.mask & (1 << bit) ? " active" : ""}`));
      matrix.append(cell);
    });
    matrix.setAttribute("aria-hidden", "true");
    column.append(matrix);
    layout.bars.push({ button: column, combination });
    chart.append(column);
  }
  scroller.append(chart);
  root.append(scroller, layout.caption, layout.detail);
  return layout;
}

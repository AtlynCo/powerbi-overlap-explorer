import powerbi from "powerbi-visuals-api";
import { Analysis, Combination, Entity, analyze, boundedInteger, contributors, LIMITS, selectionKeys } from "./engine";
import { ParsedData, parseData } from "./data";
import { FormattingSettingsService, Settings } from "./settings";
import { localizer } from "./localization";
import "../style/visual.less";

type NativeId = powerbi.visuals.ISelectionId;
type Update = powerbi.extensibility.visual.VisualUpdateOptions;

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className = "", text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function isNativeId(id: powerbi.extensibility.ISelectionId): id is NativeId {
  return "getKey" in id && typeof id.getKey === "function" && "includes" in id && typeof id.includes === "function";
}

export class Visual implements powerbi.extensibility.visual.IVisual {
  private readonly root = element("section", "atlyn-overlap");
  private readonly host: powerbi.extensibility.visual.IVisualHost;
  private readonly manager: powerbi.extensibility.ISelectionManager;
  private readonly formatting: FormattingSettingsService;
  private readonly t: ReturnType<typeof localizer>;
  private readonly number: Intl.NumberFormat;
  private readonly percent: Intl.NumberFormat;
  private settings = new Settings();
  private parsed?: ParsedData;
  private analysis?: Analysis;
  private dataView?: powerbi.DataView;
  private selected: NativeId[] = [];
  private bars: { button: HTMLButtonElement; mask: number }[] = [];
  private status = element("p", "interaction-status");
  private detail = element("section", "details");
  private pendingFetch = false;
  private rejectedFetch = false;
  private destroyed = false;
  private revision = 0;
  private focusedMask = 0;
  private unexpectedSegment = false;

  constructor(options?: powerbi.extensibility.visual.VisualConstructorOptions) {
    if (!options) throw new Error("Atlyn Overlap Explorer requires visual constructor options.");
    this.host = options.host;
    this.manager = this.host.createSelectionManager();
    this.t = localizer(this.host);
    this.formatting = new FormattingSettingsService(this.host.createLocalizationManager());
    this.number = new Intl.NumberFormat(this.host.locale);
    this.percent = new Intl.NumberFormat(this.host.locale, { style: "percent", maximumFractionDigits: 1 });
    this.root.setAttribute("aria-label", this.t("Title"));
    this.root.dir = /^(ar|fa|he|ur)(-|$)/i.test(this.host.locale) ? "rtl" : "ltr";
    options.element.appendChild(this.root);
    this.manager.registerOnSelectCallback(ids => {
      if (this.destroyed) return;
      this.selected = ids.filter(isNativeId);
      this.paintSelection();
    });
    this.root.addEventListener("keydown", event => {
      if (event.key === "Escape") { event.preventDefault(); this.clear(); }
    });
  }

  public update(options: Update): void {
    if (this.destroyed) return;
    this.host.eventService.renderingStarted(options);
    try {
      this.root.style.width = `${Math.max(0, options.viewport.width)}px`;
      this.root.style.height = `${Math.max(0, options.viewport.height)}px`;
      const isData = (options.type & powerbi.VisualUpdateType.Data) !== 0;
      if (isData) {
        this.revision++;
        this.pendingFetch = false;
        this.rejectedFetch = false;
        this.unexpectedSegment = options.operationKind === powerbi.VisualDataChangeOperationKind.Segment;
        this.dataView = this.unexpectedSegment ? undefined : options.dataViews?.[0];
      } else if (options.dataViews?.[0]) {
        this.dataView = options.dataViews[0];
      }
      this.settings = this.dataView
        ? this.formatting.populateFormattingSettingsModel(Settings, this.dataView) : new Settings();
      this.parsed = parseData(this.dataView, this.host);
      const card = this.settings.analysis;
      this.analysis = analyze(this.parsed.rows, {
        inclusive: card.inclusive.value, maxSets: card.maxSets.value, top: card.top.value, minimum: card.minimum.value
      }, this.parsed.received);
      this.selected = this.manager.getSelectionIds().filter(isNativeId);
      this.render();
      this.host.eventService.renderingFinished(options);
    } catch (error) {
      this.root.replaceChildren(element("p", "warning", this.t("RenderFailed")));
      this.host.eventService.renderingFailed(options, error instanceof Error ? error.message : String(error));
    }
  }

  public getFormattingModel(): powerbi.visuals.FormattingModel {
    return this.formatting.buildFormattingModel(this.settings);
  }

  private render(): void {
    const analysis = this.analysis!;
    const parsed = this.parsed!;
    const focused = this.root.contains(document.activeElement);
    const scroll = this.root.querySelector(".chart-scroll");
    const oldScroll = { left: scroll?.scrollLeft ?? 0, top: this.root.scrollTop };
    const palette = this.host.colorPalette;
    const hc = palette.isHighContrast;
    this.root.classList.toggle("high-contrast", hc);
    this.root.style.setProperty("--foreground", hc ? palette.foreground.value : "#172D38");
    this.root.style.setProperty("--background", hc ? palette.background.value : "#FFFFFF");
    const accent = this.settings.appearance.barColor.value.value;
    const validAccent = /^#[0-9a-f]{6}$/i.test(accent);
    this.root.style.setProperty("--accent", hc ? palette.foreground.value : validAccent ? accent : "#176B87");
    this.root.style.setProperty("--selected", hc ? palette.foregroundSelected.value : "#8B3B00");
    this.root.style.fontSize = `${boundedInteger(this.settings.appearance.fontSize.value, 12, 10, 20)}px`;
    this.root.replaceChildren();
    this.bars = [];
    const header = element("header");
    header.append(element("h2", "", this.t("Title")),
      element("strong", "mode", this.t(analysis.options.inclusive ? "Inclusive" : "Exact")));
    const toolbar = element("div", "toolbar");
    const clear = this.button(this.t("Clear"), () => this.clear());
    clear.disabled = this.host.hostCapabilities?.allowInteractions === false;
    toolbar.append(clear);
    if (parsed.segmented && !parsed.error && analysis.received < LIMITS.rows) {
      const load = this.button(this.t(this.rejectedFetch ? "Retry" : "Load"), () => this.loadMore());
      load.disabled = this.pendingFetch || this.host.hostCapabilities?.allowInteractions === false;
      toolbar.append(load);
    }
    header.append(toolbar);
    this.root.append(header);
    this.status = element("p", "interaction-status");
    this.status.setAttribute("role", "status");
    this.status.setAttribute("aria-live", "polite");
    this.root.append(this.status);
    if (!validAccent) this.status.textContent = this.t("InvalidColor");
    if (this.unexpectedSegment || parsed.error) {
      this.status.textContent = this.t(this.unexpectedSegment ? "UnexpectedSegment" : parsed.error!);
      return;
    }
    const summary = element("div", "summary");
    const n = (value: number) => this.number.format(value);
    summary.append(element("p", "universe", this.t("Universe", n(analysis.universe))),
      element("p", "", this.t("Stats", n(analysis.received), n(analysis.invalid), n(analysis.deduplicated), n(analysis.dropped))));
    const partial = parsed.segmented || analysis.invalid > 0 || analysis.dropped > 0;
    summary.append(element("p", partial ? "warning completeness" : "completeness", this.t(partial ? "Partial" : "Complete")),
      element("p", "", this.t(parsed.segmented ? "Unloaded" : "Loaded")),
      element("p", "", this.t("Zero", n(analysis.zero))));
    if (analysis.omittedSets) summary.append(element("p", "warning", this.t("Reduction", n(analysis.omittedSets))));
    if (analysis.received >= LIMITS.rows && (parsed.segmented || analysis.dropped))
      summary.append(element("p", "warning", this.t("RowBound")));
    if (this.pendingFetch) summary.append(element("p", "warning", this.t("Loading")));
    if (this.rejectedFetch) summary.append(element("p", "warning", this.t("Rejected")));
    summary.append(element("p", "", this.t(analysis.options.inclusive ? "InclusiveHelp" : "ExactHelp")),
      element("p", "", this.t(parsed.highlights ? "HighlightHelp" : "NoSignal")),
      element("p", "", this.t("Hidden", n(analysis.hiddenCombinations))));
    this.root.append(summary);
    if (!analysis.universe || !analysis.combinations.length) {
      this.root.append(element("p", "", this.t(analysis.universe ? "NoCombinations" : "NoData")));
      return;
    }
    this.root.append(element("p", "keyboard-help", this.t("Keyboard")));
    const scroller = element("div", "chart-scroll");
    scroller.setAttribute("role", "region");
    scroller.setAttribute("aria-label", this.t("Combinations"));
    scroller.tabIndex = 0;
    const chart = element("div", "chart");
    chart.style.gridTemplateColumns = `minmax(220px, 260px) repeat(${analysis.combinations.length}, 76px)`;
    const margins = element("div", "margins");
    margins.append(element("div", "bar-space margin-title", this.t("Combinations")),
      element("div", "index-row", this.t("SetSizes")));
    const largestSet = Math.max(1, ...analysis.sets.map(set => set.size));
    for (const set of analysis.sets) {
      const row = element("div", "set-row");
      row.title = `${set.label}: ${n(set.size)}`;
      const meter = element("span", "set-meter");
      const fill = element("span", "set-fill");
      fill.style.width = `${100 * set.size / largestSet}%`;
      meter.append(fill);
      row.append(element("span", "set-label", set.label), meter, element("span", "set-count", n(set.size)));
      margins.append(row);
    }
    chart.append(margins);
    const maximum = Math.max(1, ...analysis.combinations.map(item => item.count));
    for (const combination of analysis.combinations) {
      const button = element("button", "combination");
      button.type = "button";
      button.dataset.mask = String(combination.mask);
      button.setAttribute("aria-label", this.combinationLabel(combination));
      button.title = `${this.combinationLabel(combination)}. ${this.t("Context")}`;
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
        barSpace.append(element("span", "highlight-count", `${this.t("Highlighted")}: ${n(combination.highlighted)}`));
      }
      barSpace.append(track);
      button.append(barSpace, element("div", "index-row", `#${chart.children.length}`));
      const matrix = element("div", "matrix");
      const active = analysis.sets.map((_, bit) => bit).filter(bit => combination.mask & (1 << bit));
      if (active.length > 1) {
        const connector = element("span", "connector");
        connector.style.top = `${(active[0]! + 0.5) * 32}px`;
        connector.style.height = `${(active[active.length - 1]! - active[0]!) * 32}px`;
        matrix.append(connector);
      }
      analysis.sets.forEach((_, bit) => {
        const cell = element("div", "dot-row");
        cell.append(element("span", `dot${combination.mask & (1 << bit) ? " active" : ""}`));
        matrix.append(cell);
      });
      matrix.setAttribute("aria-hidden", "true");
      button.append(matrix);
      button.addEventListener("click", event => {
        this.focusedMask = combination.mask;
        this.rove();
        const members = contributors(analysis, combination.mask);
        this.showDetails(members);
        this.select(members, event.ctrlKey || event.metaKey);
      });
      this.bindTooltip(button, combination);
      const members = contributors(analysis, combination.mask);
      this.bindContext(button, members);
      button.addEventListener("keydown", event => this.navigate(event, combination.mask));
      this.bars.push({ button, mask: combination.mask });
      chart.append(button);
    }
    scroller.append(chart);
    this.root.append(scroller);
    this.detail = element("section", "details");
    this.detail.hidden = true;
    this.root.append(this.detail);
    if (!this.bars.some(bar => bar.mask === this.focusedMask)) this.focusedMask = this.bars[0]!.mask;
    this.rove();
    this.paintSelection();
    scroller.scrollLeft = oldScroll.left;
    this.root.scrollTop = oldScroll.top;
    if (focused) this.bars.find(bar => bar.mask === this.focusedMask)?.button.focus({ preventScroll: true });
  }

  private button(text: string, action: () => void): HTMLButtonElement {
    const button = element("button", "", text);
    button.type = "button";
    button.addEventListener("click", action);
    return button;
  }

  private combinationLabel(combination: Combination): string {
    const analysis = this.analysis!;
    const included = analysis.sets.filter((_, bit) => combination.mask & (1 << bit)).map(set => set.label);
    const excluded = analysis.sets.filter((_, bit) => !(combination.mask & (1 << bit))).map(set => set.label);
    return [
      this.t(analysis.options.inclusive ? "Inclusive" : "Exact"),
      included.length ? this.t("Included", included.join(" + ")) : this.t("None"),
      analysis.options.inclusive ? this.t("Unrestricted") : this.t("Excluded", excluded.join(", ") || this.t("None")),
      `${this.t("Count")}: ${this.number.format(combination.count)}`,
      `${this.t("Share")}: ${this.percent.format(combination.count / analysis.universe)}`,
      ...(this.parsed?.highlights ? [`${this.t("Highlighted")}: ${this.number.format(combination.highlighted)}`] : [])
    ].join(". ");
  }

  private bindTooltip(button: HTMLButtonElement, combination: Combination): void {
    const show = (event: PointerEvent) => {
      if (!this.host.tooltipService.enabled()) return;
      const selection = selectionKeys(contributors(this.analysis!, combination.mask));
      const identities = selection.keys.flatMap(key => {
        const id = this.parsed?.identities.get(key);
        return id ? [id] : [];
      });
      this.host.tooltipService.show({
        coordinates: [event.clientX, event.clientY], isTouchEvent: event.pointerType === "touch", identities,
        dataItems: [{ displayName: this.t("Combinations"), value: this.combinationLabel(combination) },
          { displayName: this.t("Universe", this.number.format(this.analysis!.universe)), value: this.t("Context") }]
      });
    };
    button.addEventListener("pointerenter", show);
    button.addEventListener("pointerleave", () => this.host.tooltipService.hide({ immediately: true, isTouchEvent: false }));
  }

  private bindContext(button: HTMLButtonElement, entities: Entity[]): void {
    const open = (x: number, y: number) => {
      if (!this.interactionsAllowed()) return;
      const entity = entities.find(item => item.identityKeys.size > 0);
      const key = entity?.identityKeys.values().next().value;
      const id = key ? this.parsed?.identities.get(key) : undefined;
      if (!id || !entity) { this.status.textContent = this.t("MissingIdentity"); return; }
      this.status.textContent = `${this.t("Context")} ${this.t("ContextEntity", entity.label)}`;
      Promise.resolve(this.manager.showContextMenu(id, { x, y })).then(undefined, () => {
        if (!this.destroyed) this.status.textContent = this.t("SelectionFailed");
      });
    };
    button.addEventListener("contextmenu", event => { event.preventDefault(); open(event.clientX, event.clientY); });
    button.addEventListener("keydown", event => {
      if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) {
        event.preventDefault();
        const bounds = button.getBoundingClientRect();
        open(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
      }
    });
  }

  private showDetails(entities: Entity[]): void {
    this.detail.hidden = false;
    this.detail.replaceChildren(element("h3", "", this.t("Details")),
      element("p", "", this.t("DetailsCount", this.number.format(Math.min(entities.length, LIMITS.details)), this.number.format(entities.length))),
      this.button(this.t("Close"), () => {
        this.detail.hidden = true;
        this.bars.find(bar => bar.mask === this.focusedMask)?.button.focus();
      }));
    const list = element("ul", "contributors");
    for (const entity of entities.slice(0, LIMITS.details)) {
      const item = element("li");
      const button = element("button", "", entity.label);
      button.type = "button";
      button.setAttribute("aria-label", this.t("SelectEntity", entity.label));
      button.addEventListener("click", event => this.select([entity], event.ctrlKey || event.metaKey));
      this.bindContext(button, [entity]);
      item.append(button);
      list.append(item);
    }
    this.detail.append(list);
    // Keep focus on the combination; Tab reaches the contributor controls in document order.
  }

  private select(entities: Entity[], multi: boolean): void {
    if (!this.interactionsAllowed()) return;
    const selection = selectionKeys(entities);
    if (selection.reason) {
      this.status.textContent = this.t(selection.reason === "limit" ? "SelectionLimit" : "MissingIdentity");
      return;
    }
    if (multi && new Set([...this.selected.map(id => id.getKey()), ...selection.keys]).size > LIMITS.identities) {
      this.status.textContent = this.t("SelectionLimit");
      return;
    }
    const ids = selection.keys.map(key => this.parsed!.identities.get(key));
    if (ids.some(id => !id)) { this.status.textContent = this.t("MissingIdentity"); return; }
    const revision = this.revision;
    Promise.resolve(this.manager.select(ids.filter((id): id is NativeId => id !== undefined), multi)).then(
      selected => {
        if (this.destroyed || revision !== this.revision) return;
        this.selected = selected.filter(isNativeId);
        this.status.textContent = "";
        this.paintSelection();
      },
      () => { if (!this.destroyed && revision === this.revision) this.status.textContent = this.t("SelectionFailed"); }
    );
  }

  private clear(): void {
    if (!this.interactionsAllowed()) return;
    Promise.resolve(this.manager.clear()).then(() => {
      if (this.destroyed) return;
      this.selected = [];
      this.status.textContent = "";
      this.paintSelection();
    }, () => { if (!this.destroyed) this.status.textContent = this.t("SelectionFailed"); });
  }

  private paintSelection(): void {
    if (!this.analysis || !this.parsed) return;
    const selectedKeys = new Set(this.selected.map(id => id.getKey()));
    const selectedEntities = this.analysis.entities.filter(entity => [...entity.identityKeys].some(key => {
      if (selectedKeys.has(key)) return true;
      const id = this.parsed!.identities.get(key);
      return id && this.selected.some(selected => selected.includes(id) || id.includes(selected));
    }));
    for (const bar of this.bars) {
      const selected = selectedEntities.some(entity => this.analysis!.options.inclusive
        ? (entity.mask & bar.mask) === bar.mask : entity.mask === bar.mask);
      bar.button.classList.toggle("selected", selected);
      bar.button.classList.toggle("muted", this.selected.length > 0 && !selected);
      bar.button.setAttribute("aria-pressed", String(selected));
    }
  }

  private rove(): void {
    this.bars.forEach(bar => { bar.button.tabIndex = bar.mask === this.focusedMask ? 0 : -1; });
  }

  private navigate(event: KeyboardEvent, mask: number): void {
    const index = this.bars.findIndex(bar => bar.mask === mask);
    const direction = this.root.dir === "rtl" ? -1 : 1;
    let next = index;
    if (event.key === "ArrowRight") next += direction;
    else if (event.key === "ArrowLeft") next -= direction;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = this.bars.length - 1;
    else return;
    event.preventDefault();
    const target = this.bars[Math.max(0, Math.min(next, this.bars.length - 1))];
    if (target) {
      this.focusedMask = target.mask;
      this.rove();
      target.button.focus();
      target.button.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
    }
  }

  private loadMore(): void {
    if (!this.interactionsAllowed()) return;
    if (this.pendingFetch || !this.parsed?.segmented || this.parsed.received >= LIMITS.rows) return;
    this.pendingFetch = true;
    this.rejectedFetch = false;
    // Host aggregation supplies complete snapshots. Never append them locally or double-count overlap.
    const accepted = this.host.fetchMoreData(true);
    if (!accepted) { this.pendingFetch = false; this.rejectedFetch = true; }
    this.render();
  }

  private interactionsAllowed(): boolean {
    if (this.host.hostCapabilities?.allowInteractions !== false) return true;
    this.status.textContent = this.t("InteractionsDisabled");
    return false;
  }

  public destroy(): void {
    this.destroyed = true;
    this.revision++;
    this.host.tooltipService.hide({ immediately: true, isTouchEvent: false });
    this.root.remove();
    this.parsed = undefined;
    this.analysis = undefined;
    this.dataView = undefined;
    this.bars = [];
  }
}

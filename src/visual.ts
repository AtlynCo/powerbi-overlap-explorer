import powerbi from "powerbi-visuals-api";
import { Analysis, Combination, Entity, analyze, contributors, LIMITS, selectionKeys } from "./engine";
import { ParsedData, parseData } from "./data";
import { FormattingSettingsService, Settings } from "./settings";
import { localizer } from "./localization";
import { Layout, button, element, renderLayout } from "./layout";
import "../style/visual.less";

type NativeId = powerbi.visuals.ISelectionId;
type Update = powerbi.extensibility.visual.VisualUpdateOptions;

function isNativeId(id: powerbi.extensibility.ISelectionId): id is NativeId {
  return typeof id === "object" && id !== null && "getKey" in id && typeof id.getKey === "function" &&
    "includes" in id && typeof id.includes === "function";
}

export class Visual implements powerbi.extensibility.visual.IVisual {
  private readonly root = element("section", "atlyn-overlap");
  private readonly element: HTMLElement;
  private readonly host: powerbi.extensibility.visual.IVisualHost;
  private readonly manager: powerbi.extensibility.ISelectionManager;
  private readonly formatting: FormattingSettingsService;
  private readonly t: ReturnType<typeof localizer>;
  private readonly number: Intl.NumberFormat;
  private readonly percent: Intl.NumberFormat;
  private settings = new Settings();
  private metadataView?: powerbi.DataView;
  private parsed?: ParsedData;
  private analysis?: Analysis;
  private layout?: Layout;
  private selected: NativeId[] = [];
  private viewport = { width: 0, height: 0 };
  private analysisSignature = "";
  private topology = "";
  private binding = "";
  private focusedMask = 0;
  private detailMask?: number;
  private detailSetKey?: string;
  private detailSearch = "";
  private detailPage = 0;
  private members = new Map<number, Entity[]>();
  private diagnosticsOpen = false;
  private pendingFetch = false;
  private rejectedFetch = false;
  private unexpectedSegment = false;
  private nativeBusy = false;
  private clearRequested = false;
  private destroyed = false;
  private revision = 0;

  constructor(options?: powerbi.extensibility.visual.VisualConstructorOptions) {
    if (!options) throw new Error("Atlyn Overlap Explorer requires visual constructor options.");
    this.element = options.element;
    this.host = options.host;
    this.manager = this.host.createSelectionManager();
    this.t = localizer(this.host);
    this.formatting = new FormattingSettingsService(this.host.createLocalizationManager());
    this.number = new Intl.NumberFormat(this.host.locale);
    this.percent = new Intl.NumberFormat(this.host.locale, { style: "percent", maximumFractionDigits: 1 });
    this.root.dir = /^(ar|fa|he|ur)(-|$)/i.test(this.host.locale) ? "rtl" : "ltr";
    this.element.appendChild(this.root);
    this.manager.registerOnSelectCallback(ids => {
      if (this.destroyed) return;
      this.selected = ids.filter(isNativeId);
      this.paintSelection();
    });
    this.root.addEventListener("keydown", event => {
      if (event.key === "Escape") { event.preventDefault(); this.clear(); }
    });
    this.element.addEventListener("contextmenu", (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      event.preventDefault();
      if (!this.interactionsAllowed()) return;
      const revision = this.revision;
      Promise.resolve().then(() => {
        if (!this.destroyed && revision === this.revision) {
          return this.manager.showContextMenu({}, { x: event.clientX, y: event.clientY });
        }
        return undefined;
      }).then(undefined, () => {
        if (!this.destroyed && revision === this.revision) this.notify("SelectionFailed");
      });
    });
    this.element.addEventListener("keydown", (event: KeyboardEvent) => {
      if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) {
        if (event.defaultPrevented) return;
        event.preventDefault();
        if (!this.interactionsAllowed()) return;
        const bounds = (event.target instanceof HTMLElement ? event.target : this.element).getBoundingClientRect();
        const x = bounds.left + bounds.width / 2;
        const y = bounds.top + bounds.height / 2;
        const revision = this.revision;
        Promise.resolve().then(() => {
          if (!this.destroyed && revision === this.revision) {
            return this.manager.showContextMenu({}, { x, y });
          }
          return undefined;
        }).then(undefined, () => {
          if (!this.destroyed && revision === this.revision) this.notify("SelectionFailed");
        });
      }
    });
  }

  public update(options: Update): void {
    if (this.destroyed) return;
    this.host.eventService.renderingStarted(options);
    try {
      this.viewport = { width: Math.max(0, options.viewport.width), height: Math.max(0, options.viewport.height) };
      this.root.style.width = `${this.viewport.width}px`;
      this.root.style.height = `${this.viewport.height}px`;
      const dataChanged = (options.type & powerbi.VisualUpdateType.Data) !== 0 || !this.parsed;
      const incoming = options.dataViews?.[0];
      if (incoming) this.metadataView = { metadata: incoming.metadata };
      if (dataChanged) {
        this.revision++;
        this.pendingFetch = false;
        this.rejectedFetch = false;
        this.unexpectedSegment = options.operationKind === powerbi.VisualDataChangeOperationKind.Segment;
        const view = this.unexpectedSegment ? undefined : incoming;
        this.parsed = parseData(view, this.host);
        this.binding = JSON.stringify(view?.categorical?.categories?.map(column => [column.source.queryName, column.source.roles]) ?? []);
        this.members.clear();
        if (!view) this.metadataView = undefined;
      }
      this.settings = this.metadataView
        ? this.formatting.populateFormattingSettingsModel(Settings, this.metadataView) : new Settings();
      const card = this.settings.analysis;
      const configuration = { inclusive: card.inclusive.value, maxSets: card.maxSets.value,
        top: card.top.value, minimum: card.minimum.value };
      const signature = JSON.stringify(configuration);
      if (dataChanged || signature !== this.analysisSignature || !this.analysis) {
        this.analysis = analyze(this.parsed!.rows, configuration, this.parsed!.received);
        this.analysisSignature = signature;
        this.members.clear();
      }
      const topology = JSON.stringify([this.binding, this.analysis.sets.map(set => set.key), this.analysis.options.inclusive]);
      if (topology !== this.topology) {
        this.focusedMask = this.analysis.combinations[0]?.mask ?? 0;
        this.detailMask = undefined;
        this.detailSetKey = undefined;
        this.detailSearch = "";
        this.detailPage = 0;
        this.topology = topology;
      }
      if (!this.analysis.combinations.some(item => item.mask === this.focusedMask))
        this.focusedMask = this.analysis.combinations[0]?.mask ?? 0;
      if (this.detailMask !== undefined && this.detailSetKey === undefined &&
          !this.analysis.combinations.some(item => item.mask === this.detailMask))
        this.detailMask = undefined;
      this.selected = this.manager.getSelectionIds().filter(isNativeId);
      this.render();
      this.host.eventService.renderingFinished(options);
    } catch (error) {
      this.layout = undefined;
      this.members.clear();
      this.root.replaceChildren(element("p", "warning", this.t("RenderFailed")));
      this.host.eventService.renderingFailed(options, error instanceof Error ? error.message : String(error));
    }
  }

  public getFormattingModel(): powerbi.visuals.FormattingModel {
    return this.formatting.buildFormattingModel(this.settings);
  }

  private render(): void {
    const active = document.activeElement;
    const hadFocus = this.root.contains(active);
    const focusKey = active instanceof HTMLElement ? active.dataset.focusKey : undefined;
    const cursor = active instanceof HTMLInputElement ? active.selectionStart : undefined;
    const scroll = { left: this.layout?.scroller?.scrollLeft ?? 0, top: this.layout?.scroller?.scrollTop ?? 0 };
    const palette = this.host.colorPalette;
    const hc = palette.isHighContrast;
    const accent = this.settings.appearance.barColor.value.value;
    const validAccent = /^#[0-9a-f]{6}$/i.test(accent);
    this.root.classList.toggle("high-contrast", hc);
    this.root.style.setProperty("--foreground", hc ? palette.foreground.value : "#172D38");
    this.root.style.setProperty("--background", hc ? palette.background.value : "#FFFFFF");
    this.root.style.setProperty("--accent", hc ? palette.foreground.value : validAccent ? accent : "#176B87");
    this.root.style.setProperty("--selected", hc ? palette.foregroundSelected.value : "#8B3B00");
    const frame = renderLayout(this.root, this.analysis!, this.parsed!, {
      ...this.viewport, fontSize: this.settings.appearance.fontSize.value, diagnosticsOpen: this.diagnosticsOpen,
      pendingFetch: this.pendingFetch, rejectedFetch: this.rejectedFetch, unexpectedSegment: this.unexpectedSegment,
      interactions: this.host.hostCapabilities?.allowInteractions !== false,
      t: this.t, number: this.number, description: item => this.combinationLabel(item)
    });
    this.layout = frame;
    if (!validAccent) frame.status.textContent = this.t("InvalidColor");
    frame.clear?.addEventListener("click", () => this.clear());
    frame.load?.addEventListener("click", () => this.loadMore());
    frame.inspect?.addEventListener("click", () => this.showDetails(this.focusedMask, true));
    frame.diagnostics?.addEventListener("toggle", () => {
      if (this.layout === frame) this.diagnosticsOpen = frame.diagnostics!.open;
    });
    for (const { button: column, combination } of frame.bars) {
      const activate = () => {
        this.focusedMask = combination.mask;
        this.rove();
        frame.caption.textContent = this.captionLabel(combination);
        frame.caption.classList.add("caption-active");
      };
      column.addEventListener("focus", activate);
      column.addEventListener("pointerenter", activate);
      column.addEventListener("click", event => {
        activate();
        this.showDetails(combination.mask, false);
        this.select(this.contributors(combination.mask), event.ctrlKey || event.metaKey);
      });
      this.bindTooltip(column, this.combinationLabel(combination), () => this.contributors(combination.mask));
      this.bindContext(column, () => this.contributors(combination.mask));
      column.addEventListener("keydown", event => this.navigate(event, combination.mask));
    }
    for (const set of frame.sets) {
      const entry = this.analysis!.sets[set.index]!;
      const description = this.t("SelectSet", `${String.fromCharCode(65 + set.index)}: ${entry.label}`, this.number.format(entry.size));
      const members = () => this.analysis!.entities.filter(entity => Boolean(entity.mask & (1 << set.index)));
      set.button.addEventListener("click", event => {
        this.showDetails(1 << set.index, false, set.key);
        this.select(members(), event.ctrlKey || event.metaKey);
      });
      set.button.addEventListener("focus", () => { frame.caption.textContent = description; });
      set.button.addEventListener("pointerenter", () => { frame.caption.textContent = description; });
      this.bindTooltip(set.button, description, members, this.t("SetSizes"));
      this.bindContext(set.button, members);
    }
    const current = this.analysis!.combinations.find(item => item.mask === this.focusedMask);
    if (current) frame.caption.textContent = this.captionLabel(current);
    if (this.detailMask !== undefined) this.showDetails(this.detailMask, false, this.detailSetKey);
    this.rove();
    this.paintSelection();
    if (frame.scroller) { frame.scroller.scrollLeft = scroll.left; frame.scroller.scrollTop = scroll.top; }
    if (hadFocus && focusKey) {
      const candidates = Array.from(this.root.querySelectorAll<HTMLElement>("[data-focus-key]"));
      const target = candidates.find(node => node.dataset.focusKey === focusKey) ??
        candidates.find(node => node.dataset.focusKey === `mask:${this.focusedMask}`) ?? frame.clear;
      target?.focus({ preventScroll: true });
      if (target instanceof HTMLInputElement && cursor !== undefined && cursor !== null) target.setSelectionRange(cursor, cursor);
    }
  }

  private contributors(mask: number): Entity[] {
    let members = this.members.get(mask);
    if (!members) {
      members = contributors(this.analysis!, mask);
      // Only cache the inspected/hovered bucket, not 50 overlapping entity lists.
      this.members.clear();
      this.members.set(mask, members);
    }
    return members;
  }

  private combinationLabel(combination: Combination): string {
    const analysis = this.analysis!;
    const named = analysis.sets.map((set, bit) => `${String.fromCharCode(65 + bit)}: ${set.label}`);
    const included = named.filter((_, bit) => combination.mask & (1 << bit));
    const excluded = named.filter((_, bit) => !(combination.mask & (1 << bit)));
    return [
      this.t(analysis.options.inclusive ? "Inclusive" : "Exact"),
      included.length ? this.t("Included", included.join(" + ")) : this.t("None"),
      analysis.options.inclusive ? this.t("Unrestricted") : this.t("Excluded", excluded.join(", ") || this.t("NoneShort")),
      `${this.t("Count")}: ${this.number.format(combination.count)}`,
      `${this.t("Share")}: ${this.percent.format(combination.count / analysis.universe)}`,
      ...(this.parsed?.highlights ? [`${this.t("Highlighted")}: ${this.number.format(combination.highlighted)}`] : [])
    ].join(". ");
  }

  private captionLabel(combination: Combination): string {
    const analysis = this.analysis!;
    const included = analysis.sets.flatMap((set, bit) => combination.mask & (1 << bit)
      ? [`${String.fromCharCode(65 + bit)}: ${set.label}`] : []);
    return [included.join(" + ") || this.t("None"),
      `${this.t("Count")}: ${this.number.format(combination.count)}`,
      `${this.t("Share")}: ${this.percent.format(combination.count / analysis.universe)}`,
      ...(this.parsed?.highlights ? [`${this.t("Highlighted")}: ${this.number.format(combination.highlighted)}`] : [])
    ].join(". ");
  }

  private bindTooltip(column: HTMLButtonElement, description: string, getEntities: () => Entity[], title = this.t("Combinations")): void {
    const show = (event: PointerEvent) => {
      if (!this.host.tooltipService.enabled()) return;
      const selection = selectionKeys(getEntities());
      const identities = selection.keys.flatMap(key => {
        const id = this.parsed?.identities.get(key);
        return id ? [id] : [];
      });
      this.host.tooltipService.show({
        coordinates: [event.clientX, event.clientY], isTouchEvent: event.pointerType === "touch", identities,
        dataItems: [
          { displayName: title, value: description },
          { displayName: this.t("Universe", this.number.format(this.analysis!.universe)), value: this.t("Context") },
          { displayName: this.t("DataStatus"), value: this.t(this.parsed!.segmented || this.analysis!.invalid || this.analysis!.dropped ? "Partial" : "Complete") }
        ]
      });
    };
    column.addEventListener("pointerenter", show);
    column.addEventListener("pointerdown", event => { if (event.pointerType === "touch") show(event); });
    column.addEventListener("pointerleave", event => this.host.tooltipService.hide({ immediately: true, isTouchEvent: event.pointerType === "touch" }));
    column.addEventListener("blur", () => this.host.tooltipService.hide({ immediately: true, isTouchEvent: false }));
  }

  private bindContext(target: HTMLButtonElement, getEntities: () => Entity[]): void {
    const open = (x: number, y: number) => {
      if (!this.interactionsAllowed()) return;
      const entity = getEntities().find(item => item.identityKeys.size > 0);
      const key = entity?.identityKeys.values().next().value;
      const id = key ? this.parsed?.identities.get(key) : undefined;
      if (!id || !entity) { this.notify("MissingIdentity"); return; }
      this.layout!.status.textContent = `${this.t("Context")} ${this.t("ContextEntity", entity.label)}`;
      const revision = this.revision;
      Promise.resolve().then(() => {
        if (!this.destroyed && revision === this.revision) return this.manager.showContextMenu(id, { x, y });
        return undefined;
      }).then(undefined, () => {
        if (!this.destroyed && revision === this.revision) this.notify("SelectionFailed");
      });
    };
    target.addEventListener("contextmenu", event => {
      event.preventDefault();
      event.stopPropagation();
      open(event.clientX, event.clientY);
    });
    target.addEventListener("keydown", event => {
      if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) {
        event.preventDefault();
        event.stopPropagation();
        const bounds = target.getBoundingClientRect();
        open(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
      }
    });
  }

  private showDetails(mask: number, focus: boolean, setKey?: string): void {
    if (!this.layout?.detail.isConnected) return;
    if (mask !== this.detailMask || setKey !== this.detailSetKey) { this.detailSearch = ""; this.detailPage = 0; }
    this.detailMask = mask;
    this.detailSetKey = setKey;
    const detail = this.layout.detail;
    detail.hidden = false;
    const title = element("div", "detail-title");
    const set = setKey === undefined ? undefined : this.analysis!.sets.find(item => item.key === setKey);
    title.append(element("h3", "", set ? this.t("SetDetails", set.label) : this.t("Details")));
    const close = button(this.t("Close"), "close-details");
    close.addEventListener("click", () => {
      detail.hidden = true;
      this.detailMask = undefined;
      this.detailSetKey = undefined;
      const returnTarget = setKey === undefined ? this.layout?.bars.find(bar => bar.combination.mask === this.focusedMask)
        : this.layout?.sets.find(item => item.key === setKey);
      returnTarget?.button.focus();
    });
    title.append(close);
    const label = element("label", "search-label", this.t("SearchEntities"));
    const search = element("input", "entity-search");
    search.type = "search";
    search.maxLength = LIMITS.text;
    search.value = this.detailSearch;
    search.dataset.focusKey = "entity-search";
    label.append(search);
    const count = element("p", "details-count");
    count.setAttribute("aria-live", "polite");
    const list = element("ul", "contributors");
    const pagination = element("div", "pagination");
    detail.replaceChildren(title, label, count, list, pagination);
    const draw = () => {
      const members = setKey === undefined ? this.contributors(mask)
        : this.analysis!.entities.filter(entity => Boolean(entity.mask & mask));
      const query = this.detailSearch.toLocaleLowerCase(this.host.locale);
      const matching = members.filter(entity => `${entity.label} ${entity.key}`.toLocaleLowerCase(this.host.locale).includes(query));
      this.detailPage = Math.min(this.detailPage, Math.max(0, Math.ceil(matching.length / LIMITS.details) - 1));
      const start = this.detailPage * LIMITS.details;
      const displayed = matching.slice(start, start + LIMITS.details);
      count.textContent = this.t("DetailRange", this.number.format(matching.length ? start + 1 : 0),
        this.number.format(start + displayed.length), this.number.format(matching.length), this.number.format(members.length));
      list.replaceChildren();
      for (const entity of displayed) {
        const item = element("li");
        const choose = button(entity.label, `entity:${entity.key}`);
        choose.setAttribute("aria-label", this.t("SelectEntity", entity.label));
        choose.title = `${this.t("RawValue")}: ${entity.key}. ${this.t("IdentityCount", this.number.format(entity.identityKeys.size))}`;
        choose.addEventListener("click", event => this.select([entity], event.ctrlKey || event.metaKey));
        this.bindContext(choose, () => [entity]);
        item.append(choose);
        list.append(item);
      }
      const previous = button(this.t("Previous"), "previous-entities");
      previous.disabled = this.detailPage === 0;
      previous.addEventListener("click", () => { this.detailPage--; draw(); search.focus(); });
      const next = button(this.t("Next"), "next-entities");
      next.disabled = start + LIMITS.details >= matching.length;
      next.addEventListener("click", () => { this.detailPage++; draw(); search.focus(); });
      pagination.replaceChildren(previous, next);
    };
    search.addEventListener("input", () => { this.detailSearch = search.value; this.detailPage = 0; draw(); });
    draw();
    if (focus) search.focus();
  }

  private select(entities: Entity[], multi: boolean): void {
    if (!this.interactionsAllowed()) return;
    if (this.nativeBusy) { this.notify("SelectionPending"); return; }
    const selection = selectionKeys(entities);
    if (selection.reason) { this.notify(selection.reason === "limit" ? "SelectionLimit" : "MissingIdentity"); return; }
    this.selected = this.manager.getSelectionIds().filter(isNativeId);
    if (multi && new Set([...this.selected.map(id => id.getKey()), ...selection.keys]).size > LIMITS.identities) {
      this.notify("SelectionLimit");
      return;
    }
    const ids = selection.keys.map(key => this.parsed!.identities.get(key));
    if (ids.some(id => !id)) { this.notify("MissingIdentity"); return; }
    const revision = this.revision;
    this.nativeBusy = true;
    Promise.resolve().then(() => this.destroyed || revision !== this.revision ? []
      : this.manager.select(ids.filter((id): id is NativeId => id !== undefined), multi)).then(
      selected => {
        if (this.destroyed || revision !== this.revision) return;
        this.selected = selected.filter(isNativeId);
        if (this.layout) this.layout.status.textContent = "";
        this.paintSelection();
      },
      () => { if (!this.destroyed && revision === this.revision) this.notify("SelectionFailed"); }
    ).finally(() => this.finishNative());
  }

  private clear(): void {
    if (!this.interactionsAllowed()) return;
    if (this.nativeBusy) { this.clearRequested = true; this.notify("ClearQueued"); return; }
    this.nativeBusy = true;
    const revision = this.revision;
    Promise.resolve().then(() => {
      if (!this.destroyed && revision === this.revision) return this.manager.clear();
      return undefined;
    }).then(() => {
      if (this.destroyed || revision !== this.revision) return;
      this.selected = [];
      if (this.layout) this.layout.status.textContent = "";
      this.paintSelection();
    }, () => { if (!this.destroyed && revision === this.revision) this.notify("SelectionFailed"); })
      .finally(() => this.finishNative());
  }

  private finishNative(): void {
    this.nativeBusy = false;
    if (!this.destroyed && this.clearRequested) { this.clearRequested = false; this.clear(); }
  }

  private paintSelection(): void {
    if (!this.analysis || !this.parsed || !this.layout) return;
    const selectedKeys = new Set(this.selected.map(id => id.getKey()));
    const unmatched = this.selected.filter(id => !this.parsed!.identities.has(id.getKey()));
    const selectedEntities = this.analysis.entities.filter(entity => [...entity.identityKeys].some(key => {
      if (selectedKeys.has(key)) return true;
      const id = this.parsed!.identities.get(key);
      return id && unmatched.some(selected => selected.includes(id) || id.includes(selected));
    }));
    for (const bar of this.layout.bars) {
      const count = selectedEntities.filter(entity => this.analysis!.options.inclusive
        ? (entity.mask & bar.combination.mask) === bar.combination.mask : entity.mask === bar.combination.mask).length;
      bar.button.classList.toggle("selected", count > 0);
      bar.button.classList.toggle("muted", this.selected.length > 0 && count === 0);
      bar.button.setAttribute("aria-pressed", count === 0 ? "false" : count < bar.combination.count ? "mixed" : "true");
    }
    for (const set of this.layout.sets) {
      const count = selectedEntities.filter(entity => Boolean(entity.mask & (1 << set.index))).length;
      set.button.classList.toggle("selected", count > 0);
      set.button.setAttribute("aria-pressed", count === 0 ? "false" : count < this.analysis.sets[set.index]!.size ? "mixed" : "true");
    }
  }

  private rove(): void {
    this.layout?.bars.forEach(bar => { bar.button.tabIndex = bar.combination.mask === this.focusedMask ? 0 : -1; });
  }

  private navigate(event: KeyboardEvent, mask: number): void {
    const bars = this.layout?.bars ?? [];
    const index = bars.findIndex(bar => bar.combination.mask === mask);
    const direction = this.root.dir === "rtl" ? -1 : 1;
    let next = index;
    if (event.key === "ArrowRight") next += direction;
    else if (event.key === "ArrowLeft") next -= direction;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = bars.length - 1;
    else return;
    event.preventDefault();
    const target = bars[Math.max(0, Math.min(next, bars.length - 1))];
    if (target) {
      this.focusedMask = target.combination.mask;
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
    // Aggregate snapshots replace processed rows; no local append or automatic loop.
    const accepted = this.host.fetchMoreData(true);
    if (!accepted) { this.pendingFetch = false; this.rejectedFetch = true; }
    this.render();
  }

  private notify(key: Parameters<ReturnType<typeof localizer>>[0]): void {
    if (this.layout) this.layout.status.textContent = this.t(key);
  }

  private interactionsAllowed(): boolean {
    if (this.host.hostCapabilities?.allowInteractions !== false) return true;
    this.notify("InteractionsDisabled");
    return false;
  }

  public destroy(): void {
    this.destroyed = true;
    this.revision++;
    this.clearRequested = false;
    this.host.tooltipService.hide({ immediately: true, isTouchEvent: false });
    this.root.replaceChildren();
    this.root.remove();
    this.layout = undefined;
    this.parsed = undefined;
    this.analysis = undefined;
    this.metadataView = undefined;
    this.selected = [];
    this.members.clear();
  }
}

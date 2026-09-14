import { readPackage } from "../scripts/read-package.mjs";

export const rows = [
  ["C1", "A"], ["C1", "B"], ["C2", "A"], ["C3", "B"],
  ["C4", "A"], ["C4", "B"], ["C4", "C"], ["C5", null]
];

// Only a native-shaped contract fixture; no claim of actual Power BI behavior.
export async function mount(page, settings = {}, packageData) {
  const packed = packageData ?? await readPackage();
  const errors = [];
  const requests = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("request", request => requests.push(request.url()));
  await page.route("**/*", route => route.abort());
  await page.setContent("<!doctype html><html><head></head><body style='margin:0'><div id='host'></div></body></html>");
  await page.addStyleTag({ content: packed.resource.content.css });
  await page.evaluate(() => { window.powerbi = { visuals: { plugins: {} } }; });
  await page.addScriptTag({ content: packed.resource.content.js });
  await page.evaluate(({ guid, settings, resources }) => {
    const instances = window.fixtures = [];
    window.createFixture = (instanceSettings = settings) => {
      const ids = new Map();
      const identity = key => {
        if (!ids.has(key)) ids.set(key, {
          getKey: () => key, hasIdentity: () => true, equals: other => key === other.getKey(),
          includes: other => key === other.getKey(),
          getSelector: () => ({ data: [{ key }] }),
          getSelectorsByColumn: () => ({ dataMap: { Entity: { key } } })
        });
        return ids.get(key);
      };
      const calls = { selected: [], context: [], tooltips: [], fetch: [], events: [], clear: 0, persisted: [] };
      let selected = [];
      let callback;
      let delay = instanceSettings.selectionDelay ?? 0;
      const manager = {
        registerOnSelectCallback(cb) { callback = cb; },
        getSelectionIds: () => selected,
        hasSelection: () => selected.length > 0,
        async select(incoming, multi) {
          if (delay) await new Promise(resolve => setTimeout(resolve, delay));
          if (instanceSettings.rejectSelect) throw new Error("host rejected");
          const incomingIds = Array.isArray(incoming) ? incoming : [incoming];
          selected = multi ? [...new Map([...selected, ...incomingIds].map(id => [id.getKey(), id])).values()] : incomingIds;
          calls.selected.push({ keys: incomingIds.map(id => id.getKey()), multi });
          callback(selected);
          return selected;
        },
        async clear() {
          if (delay) await new Promise(resolve => setTimeout(resolve, delay));
          selected = []; calls.clear++; callback([]);
        },
        async showContextMenu(id, point) { calls.context.push({ key: typeof id?.getKey === "function" ? id.getKey() : undefined, id, point }); }
      };
      const locale = instanceSettings.locale || "en-US";
      const host = {
        locale,
        hostCapabilities: { allowInteractions: instanceSettings.allowInteractions !== false },
        createSelectionManager: () => manager,
        createSelectionIdBuilder() {
          let key;
          return {
            withCategory(column, index) { key = column.identity[index].key; return this; },
            createSelectionId: () => identity(key)
          };
        },
        createLocalizationManager: () => ({ getDisplayName: key => resources[locale]?.[key] || key }),
        colorPalette: { isHighContrast: Boolean(instanceSettings.highContrast),
          foreground: { value: "#FFFF00" }, background: { value: "#000000" }, foregroundSelected: { value: "#00FFFF" } },
        tooltipService: { enabled: () => true, show: args => calls.tooltips.push(args), hide: () => {}, move: () => {} },
        eventService: {
          renderingStarted: () => calls.events.push("started"),
          renderingFinished: () => calls.events.push("finished"),
          renderingFailed: (_, reason) => calls.events.push(`failed: ${reason}`)
        },
        persistProperties: changes => calls.persisted.push(changes),
        fetchMoreData: aggregate => { calls.fetch.push(aggregate); return !instanceSettings.rejectFetch; }
      };
      const target = document.createElement("div");
      target.dataset.fixture = String(instances.length);
      document.getElementById("host").append(target);
      const visual = window.powerbi.visuals.plugins[guid].create({ element: target, host });
      let savedView;
      const fixture = {
        visual, calls, target,
        externalSelection(keys) { selected = keys.map(identity); callback(selected); },
        setSelectionDelay(value) { delay = value; },
        update(input, options = {}) {
          const columns = [
            { displayName: "Entity", queryName: options.entityQuery ?? "Memberships.Entity", roles: { entity: true }, type: { text: true } },
            { displayName: "Set", queryName: options.setQuery ?? "Memberships.Set", roles: { set: true }, type: { text: true } }
          ];
          const values = options.noSignal ? [] : [{
            source: { displayName: "Signal", queryName: "Memberships.Signal", roles: { signal: true }, isMeasure: true },
            values: input.map(() => 1), ...(options.highlights ? { highlights: options.highlights } : {})
          }];
          values.grouped = () => [];
          const view = {
            metadata: { columns, objects: options.objects ?? {
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
          if (options.invalidRoles) view.categorical.categories[1].source.roles = { entity: true };
          if (options.highlightLengthMismatch) values[0].highlights = [1];
          const suppliedView = options.restore ? savedView : view;
          if (options.save) savedView = view;
          const start = performance.now();
          visual.update({ dataViews: options.noViews ? [] : [suppliedView], viewport: {
            width: options.width ?? 950, height: options.height ?? 800
          }, type: options.type ?? 2, operationKind: options.operationKind ?? 0 });
          return performance.now() - start;
        }
      };
      instances.push(fixture);
      return instances.length - 1;
    };
    window.createFixture();
    window.instance = instances[0].visual;
    window.calls = instances[0].calls;
    window.updateVisual = (input, options) => instances[0].update(input, options);
    window.externalSelection = keys => instances[0].externalSelection(keys);
  }, { guid: packed.resource.visual.guid, settings, resources: packed.resource.stringResources });
  return { errors, requests };
}

export async function update(page, data = rows, options = {}) {
  return page.evaluate(({ data, options }) => window.updateVisual(data, options), { data, options });
}

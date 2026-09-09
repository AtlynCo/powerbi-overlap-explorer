# Authored offline Overlap Explorer report

This is a **fully authored PBIP/PBIR source report**, not a PBIX and not a
claim of successful opening in Power BI Desktop. Both pages contain a bound
Overlap Explorer, a native distinct-entity card, a native segment/cohort bar
chart, a native membership table, a heading, and an explanatory text box.
The explorer's actual private visual package is included locally; there is
no AppSource dependency or empty page to complete.

## Open locally

1. Use a current Power BI Desktop supporting PBIP, PBIR, TMDL, and the custom
   visual API 5.11.0. Enable the corresponding preview settings if required.
2. Open `OverlapSample.pbip`. It points to `OverlapSample.Report`, which
   references the sibling `OverlapSample.SemanticModel`.
3. **Refresh** to populate the inline import tables. No cached model is
   shipped; the initial open may have definitions without loaded data.
   There are no external data connections, credentials, account IDs, or
   machine-specific source paths.
4. Open both pages and verify the counts below. The explorer is already
   registered and bound; do not import a different visual as a substitute.
5. Click a segment/cohort bar, then clear selection. The page explicitly
   requests cross-highlighting into the explorer. Click a membership row
   to filter it; select an intersection to filter the native table.
   These are authored interaction requests, not proof of host behavior.

If a policy disables private custom visuals, use your organization's normal
approval process; this sample does not change any policy.

The private-resource format repeats the stable visual GUID in folder and
file names. In deeply nested Windows checkouts, use per-command
`git -c core.longpaths=true ...` for Git operations; no machine-wide setting
is required. The coordinator should copy this complete `offline-pbip` folder
to a short local test path before native opening if Desktop has path-length
restrictions. Long-path support in Desktop is not established by Node's
successful resource/schema checks.

## Pages and expected results

| Page | Explorer bindings | Default retained sets | Unfiltered universe |
| --- | --- | ---: | ---: |
| Customer / product overlap | `Memberships[Entity ID]`, `[Set Name]`, `[Highlight signal]` | 3 | 10 |
| Feature adoption overlap | `FeatureAdoption[Entity ID]`, `[Set Name]`, `[Feature highlight signal]` | 4 | 12 |

Both explorers default to **exact**, Top 20, and minimum 1. The native card
uses `[Distinct entities]` or `[Feature distinct entities]`, never the
highlight measure. The native bar groups that measure by `Segment` or
`Cohort`. Those attributes are not extra grouping wells on the explorer.

- **Customer/product:** Atlas 6, Beacon 5, Cove 4; zero 1. Exact Atlas +
  Beacon only is 2; inclusive Atlas + Beacon is 3.
- **Feature adoption:** Search 7, Share 6, Automate 5, Export 2; zero 1.
  Exact Search + Share only is 2; inclusive Search + Share is 4.
- **Exact** means precisely that membership pattern among retained sets.
  **Inclusive** also includes supersets: inclusive bars overlap and must not
  be summed as an entity universe.
- **Partial** means only received rows are known, not the whole dataset.
  These small fixtures do not force host data truncation. The text boxes
  explain the warning; larger real-host data is a separate validation gate.
- Reducing retained sets changes the projection, not the observed denominator.
  Set customer/product maximum sets to 2 or feature adoption to 3: each
  zero projection becomes 2, while universes remain 10 and 12.
- Top/minimum can hide combinations without changing the observed universe.

Full exact/inclusive contributor lists and duplicate/null semantics are in
[the fixture guide](../README.md). Power BI may group duplicate source rows
before sending categories. COUNTROWS signal values can exceed 1, but they
are not entity weights. Card/table values change with native filter context.

## Exact package provenance and regeneration

`package\AtlynOverlapExplorerA83D5B49F72E4CA693D0C8260159BE42.pbiviz`
is the original archive, byte for byte. `package-manifest.json` records its
SHA256, byte count, source build filename, visual/API/SDK versions, and the
SHA256/byte count of each extracted resource.

The report loads the extracted private visual from:

```text
OverlapSample.Report\
  CustomVisuals\
    AtlynOverlapExplorerA83D5B49F72E4CA693D0C8260159BE42\
      package.json
      resources\
        AtlynOverlapExplorerA83D5B49F72E4CA693D0C8260159BE42.pbiviz.json
```

Both extracted files preserve the archive entry bytes, including whitespace.
The scoped `.gitattributes` disables line-ending conversion for those files
and the original archive, keeping recorded hashes stable across checkouts.
`definition\report.json` registers a `CustomVisual` resource package and
`CustomVisualMetadata` item. A local/private visual belongs in `CustomVisuals`,
**not** `publicCustomVisuals` (which requests AppSource). No unrelated source,
keys, source maps, or third-party sample binaries are copied. The separate
original archive is provenance and a manual import fallback; it is not a
second resource registration.

From the repository root, **after the final local package build**:

```powershell
node scripts\prepare-sample.mjs
node scripts\validate-sample.mjs
```

Preparation requires exactly one `.pbiviz` in `dist` via
`scripts\read-package.mjs`, verifies its identity/version/capabilities, and
deterministically updates the authored pages and embedded files. A later
build makes the sample stale: rerun both commands before releasing it.
Commit/share the generated original archive, extracted resources, manifest,
and authored definitions together. They are intentionally not ignored.

Validation uses the explicitly pinned development Ajv dependency with Microsoft's
public JSON schemas. Only this development-time check fetches schemas;
responses are cached in ignored `.schema-cache`. Report use and refresh
have no network data dependency.
The local evidence `sample-validation.json` records the exact schema URLs
and content hashes used; development caches are not copied into the release
source/archive or treated as sample data.

```powershell
# Validate again without any schema network requests after warming the cache:
node scripts\validate-sample.mjs --offline
# Validate a shipped snapshot when dist is absent (does NOT prove current-build equality):
node scripts\validate-sample.mjs --embedded-only --offline
```

The validator checks public schemas, exact authored queries/roles/interactions,
referenced model fields, page bounds, CSV/TMDL row parity, expected distinct,
exact, inclusive and omitted-set counts, source/extracted bytes and SHA256,
and (by default) equality with the one current `dist` package.
It is not a general TMDL parser or a Power BI rendering engine.

## Required manual host gate — not yet established by source validation

### Provisional structural correction, 2026-09-09

Official Microsoft TOM 19.117.0 reproduced an `InvalidLineType /
ReferenceObject` failure at the indented `ref table` declarations in
`model.tmdl`. Those references are now at document root. TOM deserialization
then accepted both tables and their expected columns/source mappings, measure
definitions and import M partitions. It did **not** execute M or DAX, refresh
data, open Desktop, or render the report.

`definition/version.json` was already present and declares PBIR 4.0.0.
The validator now explicitly requires that file/version and root-level table
references instead of relying solely on enumerating whatever schema files
exist. Regression cases cover the previously accepted indented-reference and
missing-version shapes.

This is a **provisional sample-only correction**, using the unchanged
`1.0.0.0` unlicensed rendering package. The earlier sealed bundle is not
rewritten. The owner has chosen paid access through existing Atlyn
subscriptions, but the shared licensing contract is pending; this sample is
not a final paid/submission candidate.

With an already available official TOM assembly and its sibling DLLs, run
in a fresh PowerShell process; the script installs nothing and connects to
no model server:

```powershell
pwsh -NoProfile -File scripts\validate-sample-tom.ps1 -AssemblyPath <existing-official-Microsoft.AnalysisServices.Tabular.dll>
npm run validate:sample -- --offline --evidence-dir .tmp\sample-preflight
```

The explicit evidence directory keeps provisional preflight output separate
from the original rendering evidence. The coordinator still owns all native UI
work and genuine PBIX production.

Schema-valid PBIR does **not** establish that Desktop will successfully load
private-visual resources, parse TMDL, refresh, execute semantic queries, or
render formatting. Public schemas deliberately leave some native visual
formatting properties open-ended; the authored patterns also follow
Microsoft's published visual authoring examples.

Before representing this as a host-validated demonstration, record Desktop
version and the package SHA256, then verify:

- Open, inline refresh, rendering and all expected unfiltered counts on both
  pages; no missing fields, missing custom visual, or credentials prompts.
- Native highlight arrays from the segment/cohort chart, real entity
  selection identities, table filtering, Ctrl multi-select, clear, and
  export/context menu behavior as applicable.
- Exact/inclusive changes and reduced retained-set projections; partial-data
  behavior separately with a dataset large enough to exercise host windows.
- Save/reopen and consistent registration without reimporting the visual.

If Desktop rejects the source, capture the actual error and version. Do not
rename JSON/ZIP data to `.pbix` or claim a successful open. A documented
fallback is a fresh report importing the same CSVs and the included exact
`.pbiviz`, with the bindings above. This is troubleshooting, not equivalent
evidence that the authored source opened.

## Public format references

- [Microsoft PBIP report structure and private CustomVisuals folder](https://learn.microsoft.com/power-bi/developer/projects/projects-report)
- [Microsoft PBIR report schema: ResourcePackage and CustomVisualMetadata](https://github.com/microsoft/json-schemas/blob/main/fabric/item/report/definition/report/3.1.0/schema.json)
- [Microsoft visual container schema](https://github.com/microsoft/json-schemas/blob/main/fabric/item/report/definition/visualContainer/2.5.0/schema.json)
- [Microsoft query projection schema](https://github.com/microsoft/json-schemas/blob/main/fabric/item/report/definition/visualConfiguration/2.2.0/schema-embedded.json)
- [Microsoft native textbox, card, table and bar authoring examples](https://github.com/microsoft/skills-for-fabric/tree/main/skills/powerbi-report-authoring/references)
- [Microsoft private-visual package folder example](https://github.com/microsoft/PowerBI-LogAnalytics-Template-Reports/tree/main/PBIASEngine/src/Report/CustomVisuals)
- [Public PBIR resource registration example](https://github.com/ProdataSQL/FinancialModelling/blob/main/Workspace/Finance-GL.Report/definition/report.json)
- [Microsoft TMDL structure](https://learn.microsoft.com/analysis-services/tmdl/tmdl-overview)

References were used to determine format/field conventions, not to copy
another report's data or visual package. Each authored JSON definition
declares its specific public Microsoft schema. There is no PBIX, Desktop
execution, Fabric deployment, service, certification, or Marketplace claim.

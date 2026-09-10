# Certification requirements and test instructions

**Research checked 2026-09-09. Not submitted, certified, or approved.**
This is a preparation checklist. A successful command named `certification`
is a local packaging/code audit, not a Microsoft certification decision.
Current requirements must be checked again before an authorized submission.

## First-party requirements register

| ID | Current source | Material requirement |
| --- | --- | --- |
| MS1 | [Get visuals certified][certified] | Partner Center approval; required submission tests; latest API/tools; readable reviewable source; package/source match; lowercase `certification` branch; required files/commands; rendering events; no external services/unsafe DOM or dynamic code. |
| MS2 | [Testing submissions][testing] | General conversions, binding, format/filter/selection/resize/lifecycle tests; current Desktop; import/save/reopen/publish; acceptable performance measured with developer tools. AppSource validates current Windows Chrome, Edge and Firefox. |
| MS3 | [Publish visuals][publish] | `.pbiviz`, offline sample `.pbix`, logo, screenshots, HTTPS support/privacy links, EULA, required author/version metadata. |
| MS4 | [Marketplace policies 1180 and 1200][policy] | Desktop/Online/mobile/Windows universal and touch support; core functions/context menu; strings, empty/negative values, at least 20,000 rows, 16-digit numbers; PBIX visual version/content matches PBIVIZ; updates require certification again. |
| MS5 | [Technical configuration][technical] | Offline PBIX with the same visual version as PBIVIZ; stable GUID on update; increase version for package updates. |
| MS6 | [Offer listing][listing] and [image guide][images] | 300×300 PNG logo; 1–5 PNG screenshots exactly 1366×768, each no more than 1024 KB; no blurry/stretched/private content. |
| MS7 | [Offer properties][properties] | Owner chooses standard contract or own/default visual EULA; valid privacy policy and public support document. |
| MS8 | [Project structure][structure] | Visual-pane icon is PNG, exactly 20×20; distinct from listing logo. |
| MS9 | [PBIP overview][pbip] and [report format][pbir] | Public-schema PBIR can be authored externally; native opening still required. PBIP-to-PBIX conversion is documented only through Desktop **File > Save as**, not programmatically. |

The policy page has mixed document/update dates; this register records the
content retrieved on the research date rather than guessing a newer policy
version. Policy 1180.1 says visuals are free to acquire and may offer
additional purchases; that is a platform rule, not a price invented here.
On 2026-09-10 the owner approved **existing Atlyn storefront subscriptions
with an ungated renderer and free shared viewing**. Runtime licensing is no
longer a blocker. The coordinator must present accurate acquisition
disclosures in the final publishing flow; owner approval is not Microsoft
approval. See [acquisition and runtime](acquisition-and-runtime.md).

## Local-only engineering checklist

Final local execution is recorded in [validation](validation-results.md) and
the release seal. Old unit/browser counts, a merged PR and prior hosted checks
are not current release proof. Native/owner acceptance remains pending.

Current work is on **`release-quality-overlap`**. See the
[coordinator-reported local progress](release-review.md#coordinator-reported-local-progress)
for the final 47-unit/30-browser local result, sample checks and regenerated
package-linked captures/measurements.

- [x] Record final commit, clean-worktree status, package version/GUID,
  `package-lock.json` hash, Node/npm/PowerShell/OS/tool versions, commands,
  exit codes, timestamps and output. Working baseline is the coordinator's
  `origin/main` at `4356e10`; that is not the final candidate revision.
- [x] Use the supported local Windows/Node 24/PowerShell 7 packaging baseline;
  retain the locked dependency graph. Restore only when needed by the
  execution workflow; do not turn documentation review into an installation.
- [x] Check current API/tools for this candidate; recheck at submission. On the research date, npm's
  publisher [API dist-tag][api-version] is **5.11.1** and
  [tools dist-tag][tools-version] is **7.2.1**, matching the reviewed manifest.
  SDK package 5.11.1 exports API contract **5.11.0**; these numbers need not
  be identical.
- [x] Run existing typecheck, lint, unit, package/audit and packaged-browser
  checks locally; preserve exact counts/results rather than anticipated ones.
  Existing entry points include `npm run typecheck`, `npm run lint`,
  `npm test`, `npm run certification`, `npm run test:browser`,
  `npm run check:local-policy`, and `npm run audit`.
- [x] Microsoft's explicit `package.json` **eslint command** is provided as
  `npx --no-install eslint . --ext .js,.jsx,.ts,.tsx`, using the installed,
  pinned tool and Power BI plugin without downloading an implicit tool.
- [x] Verify MS1 command requirements: `npm install`, documented custom packaging,
  `npm audit` without moderate/high warnings, and error-free ESLint with the
  Power BI plugin. Preserve a separate advisory record for low/informational
  issues. Offline inability to refresh the advisory database is not a clean
  current audit.
- [x] Document the custom Windows packaging path as `npm run package`, which
  MS1 permits for custom builds. Ensure review rebuilds include every
  postprocessing step, including embedded notices. Do not silently submit
  output differing from the documented build command.
- [x] Retain the `pbiviz package --certification-audit` outcome. Do not use
  `--certification-fix` to hide forbidden calls in our own source. Microsoft's
  fix option is for uncontrollable library calls and still requires regression
  testing and a matching documented build.
- [x] Include `.gitignore`, `capabilities.json`, `pbiviz.json`, `package.json`,
  `package-lock.json`, `tsconfig.json`, readable source and necessary build
  configuration. Exclude generated `node_modules`, `.tmp`, and `dist` from
  the source submitted for review. The repository must contain one visual
  and related material only; do not vendor comparator implementations.
- [x] Review shipped JS and dependencies, not just authored TypeScript:
  `privileges: []`, no WebAccess, network/font/image/telemetry calls, external
  JS, storage, unsafe data-to-HTML insertion or arbitrary/dynamic execution.
  Check success/failure rendering events and console errors for adversarial
  data. Empty privileges alone are not proof of runtime compliance.
- [x] Verify readable source is available for all reviewable OSS dependencies;
  commercial-library and private-dependency restrictions require explicit
  review. Preserve full applicable Microsoft utility and bundled
  Globalize/Globalize Cultures notices, not an absent external license file.
- [x] Inspect the actual final archive: version/GUID/API, capabilities,
  translations, 20×20 icon, formatting metadata, notices, unexpected debug
  resources/source maps and unneeded files. Distinguish generated bundled
  output from the readable source repository required by MS1.
- [x] Check development-certificate generation stays local, installs/trusts no
  certificate, and cleans up sensitive files. It is not production signing.
- [x] Capture deterministic semantic, malformed-input, limit, interaction-race,
  keyboard, resize and layout proof using the **packaged visual in local
  Chromium host mocks**. Record blocked/unexpected requests and console errors.
- [x] Capture actual local performance results and source/package
  hashes. Measure update/render/interaction separately; do not use visual
  impressions or console timings as the whole performance assessment [MS2].
- [x] Validate the authored PBIP/PBIR schemas, bound pages, local model
  reference, embedded sample data and visual resources. This is source/schema
  evidence only; retain native opening/refresh as an unresolved gate.
- [x] Seal the immutable manifest described in the
  [submission dossier](submission-dossier.md#immutable-evidence-manifest).

There is **no hosted CI requirement** in this release workflow. Do not add
workflow badges or use Actions, hosted runners, cloud coding or Codespaces as
proof. The coordinator reports repository Actions disabled (`enabled=false`);
that operational setting is not a product-certification result.

## Native test setup — REQUIRED, not performed here

The coordinator, not this documentation workstream, owns Desktop, service,
mobile/touch and Marketplace activity. Use only authorized test environments
and synthetic data. For every native run record tester/date, Desktop/browser/
device version, tenant settings, report/model hash, source revision, final
PBIVIZ SHA-256, observed outcome, console/profile evidence, and defects.
Use `PASS`, `FAIL`, `NOT RUN`, or justified `NOT APPLICABLE`; a host-mock pass
never upgrades a native row to PASS.

1. Open the authored offline sample project in a current supported Desktop.
   Enable required PBIP/PBIR/TMDL preview features for that Desktop version.
   Refresh without external data connections; inspect both bound sample pages
   and their supporting native visuals. If loading fails, fix and revalidate;
   do not rename a text archive to `.pbix`.
2. Import the exact release package; verify its version and GUID. If a visual
   has already been published, enable Developer mode to prevent the AppSource
   build overriding the imported file. Desktop's setting lasts one session;
   service's setting is per user. **Do not change the GUID** [MS2].
3. For the customer fixture, bind Entity ID and Set Name from `Memberships`
   as groupings. Keep blank sets. Optionally bind a positive
   `COUNTROWS('Memberships')` signal. Segment is a native slicer/table field,
   not a third custom grouping.
4. Add a native entity table and set chart for observed selection effects;
   inspect model relationships/filter direction and Edit interactions rather
   than assuming a fact-table category propagates as intended.
5. Repeat with `FeatureAdoption`, using Cohort as a native slicer. Save a real
   PBIX, reopen disconnected and recheck its included visual version/content.
6. Obtain the Microsoft-linked [sample test report][ms-sample] from MS1 and
   adapt appropriate fields for conversion/data-type/stress tests. Record its
   identity and any modeling changes. Availability/opening and tests are
   **pending**; our synthetic fixtures do not silently replace that requirement.

## Native acceptance matrix

All rows below are **NOT RUN** for this dossier. The more detailed
[manual matrix](manual-validation.md) is complementary; preserve test-specific
results and reconcile any older expectation with the actual sample CSV.

| ID / requirement | Procedure and acceptance criterion |
| --- | --- |
| N01 — conversion/bindings [MS2] | Convert stacked column Category/Value to this visual and back; Gauge with three measures to this visual and back. Unsupported wells show a helpful message, no crash. Exercise all accepted/rejected min/max bindings; remove fields in every order; open Format for each shape. |
| N02 — exact oracle | All customer sets, minimum 1, Top at least 8: universe 10; sizes 6/5/4; eight exact groups as in [comparison](comparison.md). Atlas-only is **C002/C009**, not C006. No duplicate inflation; blank C009 observation does not erase Atlas. |
| N03 — zero/projection/inclusive | Remove C008: universe 9, zero 0. Restore; maximum sets 2: universe 10, exact Atlas/Beacon/both/none = 3/2/3/2 and omission warning. Restore three sets; inclusive has seven nonempty groups, Atlas+Beacon 3, bar sum 23, zero separately 1. |
| N04 — second model | Feature fixture: 12 entities, set sizes 7/6/5/2, 10 exact groups. Retain three sets: zero 2, universe 12. Inclusive Search+Share 4. |
| N05 — selection/identity [MS2, MS4] | Select exact Atlas+Beacon: C001/C010 in supporting native visuals; inclusive adds C004. Atlas set margin targets all six members. Ctrl additive/clear/external selection and Alt/Shift must not cause unexpected behavior. Inspect cross-filter directions, mixed group states and no stale selection after rebind. |
| N06 — identity refusal/races | Exercise missing identities where host can produce them, >1,000-ID groups and additive requests crossing the cap: refuse whole request, never subset. Queue Clear during a pending response; resize/rebind/remove visual; no stale selection. Explain mock-only cases if native host cannot induce them. |
| N07 — inspection/context/tooltips [MS2, MS4] | Inspect independently from selection; search late contributors and page beyond 200; test individual entity selection. Right-click and keyboard context menu identify one representative. Do not assert group drill-through. Filtered tooltip values and percentages match current received universe. |
| N08 — filtering/highlight [MS2] | Visual/page/report filters, slicer and native-chart selection; compare Highlight vs Filter. Positive COUNTROWS highlights count distinct present entities, not weighted magnitudes. Recalculate universe/memberships only as delivered by host. |
| N09 — data types/adversarial [MS2, MS4] | Strings, blanks/nulls, dates, Boolean and numeric IDs, negative values, 16-digit numbers, model format strings and 0/3-decimal formats; bad/infinite/overlong values when deliverable. One/two rows and at least 20,000 rows. Use text for IDs exceeding reliable numeric precision; never promise recovery of precision lost upstream. No exception; invalid data disclosed. |
| N10 — aggregation/limits | Host segmentation, explicit Load more, aggregate replacement, refusal and 30,000-row cap; do not infer unloaded totals. 6-default/10-maximum sets and 50-bar maximum; Top/minimum hide groups, never invent an Other union. |
| N11 — viewport/focus/scroll [MS2, MS4] | Actual size/Fit to page/Fit to width/focus mode/minimum report size. Tiny, compact and dense large viewports; 10–20px text, long labels, horizontal/vertical scroll and high contrast. Coordinates, pinned headers, focus and counts align. Inspect touch-only interactions. |
| N12 — lifecycle/persistence [MS2] | Multiple instances/pages, page navigation, bookmarks, Reading/Edit views, save/reopen, add/remove/rebind, and supported version-upgrade scenario. Format state persists; instances do not interfere. No animation is expected; mark only animation-specific checks N/A with reason. |
| N13 — service/dashboard [MS2, MS4] | Publish exact PBIX through Desktop after authorization; test current supported service/browser versions, pin dashboard and reopen. AppSource validates current Windows Chrome/Edge/Firefox; bundled Chromium mocks do not cover them. |
| N14 — mobile/accessible host [MS4] | Supported Power BI mobile and applicable Windows app/device paths, touch without mouse/keyboard, supported screen reader, keyboard navigation, host high contrast, English/French and an RTL host locale. Record current platform applicability; do not silently waive the published policy. |
| N15 — performance [MS2] | Use native developer-tool profiles with many elements, worst supported inputs, repeated resize/filter/select/load-more. Record host version, query/visual boundary, latency definitions and freezes/errors. Local package timings alone cannot pass native performance. |
| N16 — export/subscription | Test supported PDF/PowerPoint/image and subscription paths, recording tenant/certification restrictions. Offscreen content is not guaranteed in viewport exports. Precertification denial is not successful export evidence; do not promise certified-only benefits before approval. |
| N17 — offline PBIX [MS3, MS5] | Final sample opens and refreshes offline; no source credential/path dependency; bound pages work; PBIX visual version/content matches submitted PBIVIZ. Save/reopen and retain hashes/screenshots. |

Failures remain blockers until fixed and rerun against a new identified
candidate. “Not reproducible with mocks,” a policy restriction, or lack of
access must be recorded as a limitation or blocked test, not a passing result.

## Certification branch and publisher handoff

Only the coordinator may perform this after the local baseline/final review,
native validation and owner gates in [release review](release-review.md).

1. Resolve required defects; confirm supported behavior and supply applicable
   existing terms/privacy references, publisher authority, final listing
   assets and offline PBIX.
   Acquisition/ungated runtime is already approved; do not add paid-author
   checks or licensing calls.
2. Commit and review the exact source and lockfile locally, rebuild using the
   documented command, and seal the package/source/test/media correspondence.
3. **Only then create or advance the branch named `certification`, all
   lowercase**, at the reviewed source revision matching the submitted
   package. Never create it from an unreviewed baseline or independently
   changing candidate. Freeze it for review; MS1 permits changes only in the
   next submission process.
4. Arrange reviewer access to the one-visual source and any required private
   dependency repositories. MS1 documents private-repository access details;
   the account owner must handle those through authorized secure channels.
   Never commit passwords, recovery codes, or submission credentials here.
5. The authorized publisher selects **Request Power BI certification** in
   Partner Center for the owner's required official certification target,
   with source link and test instructions in Notes for certification.
   No submission/account creation/access grant is authorized by this document.
6. Archive Microsoft's actual decision. Show a certification badge/claim only
   after approval. Updates require a fresh review and certification process;
   neither a previous PR merge nor an earlier certified version approves a
   changed package.

The requested target is Microsoft's official **Power BI certified** badge,
not a granted designation or a custom branding/purchase badge. Microsoft
awards/displays it after review and approval; no parent-supplied badge asset
or in-visual image is needed. A documentation-only clarification neither
requires repackaging/version changes nor authorizes certification-ref/main
movement, merging or submission.

[certified]: https://learn.microsoft.com/en-us/power-bi/developer/visuals/power-bi-custom-visuals-certified
[testing]: https://learn.microsoft.com/en-us/power-bi/developer/visuals/submission-testing
[publish]: https://learn.microsoft.com/en-us/power-bi/developer/visuals/office-store
[policy]: https://learn.microsoft.com/en-us/legal/marketplace/certification-policies#1180-power-bi-visuals
[technical]: https://learn.microsoft.com/en-us/partner-center/marketplace-offers/power-bi-visual-technical-configuration
[listing]: https://learn.microsoft.com/en-us/partner-center/marketplace-offers/power-bi-visual-offer-listing
[images]: https://learn.microsoft.com/en-us/partner-center/marketplace-offers/craft-effective-appsource-store-images
[properties]: https://learn.microsoft.com/en-us/partner-center/marketplace-offers/power-bi-visual-properties
[structure]: https://learn.microsoft.com/en-us/power-bi/developer/visuals/visual-project-structure
[pbip]: https://learn.microsoft.com/en-us/power-bi/developer/projects/projects-overview
[pbir]: https://learn.microsoft.com/en-us/power-bi/developer/projects/projects-report
[api-version]: https://registry.npmjs.org/-/package/powerbi-visuals-api/dist-tags
[tools-version]: https://registry.npmjs.org/-/package/powerbi-visuals-tools/dist-tags
[ms-sample]: https://github.com/PowerBi-Projects/PowerBI-visuals/tree/gh-pages/assets

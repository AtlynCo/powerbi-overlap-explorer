# Release-quality local validation

Recorded 2026-09-09. These are **local engineering results**, not Microsoft
certification or native Power BI acceptance. Historical CI and the initial
merged implementation are not current-release proof. Repository Actions are
disabled; the previous workflow was removed. No hosted CI was used in this pass.

## Environment and commands

Windows, Node.js 24.17.0, npm 11.13.0, PowerShell 7, TypeScript 5.9.3,
visuals-tools 7.2.1, SDK npm package 5.11.1 / exported API contract 5.11.0.

| Local command / check | Recorded result |
| --- | --- |
| `npm run typecheck` | Strict source and typed unit fixtures pass |
| `npm run lint` | TypeScript and Microsoft visual rules pass |
| `npm test` | 47 tests pass, including an independent entity-by-entity Boolean-vector oracle and 16-digit/signed identifier cases |
| `npm run certification` | Official package audit reports no external requests; archive/metadata/privileges/icon/locales/notices assertions pass |
| `npm run test:browser` | 30 Chromium tests pass against JavaScript/CSS extracted from the actual `.pbiviz` |
| `npm run check:local-policy` | No workflows/hosted commands, matching lockfile, no retained local package keys |
| `npm run audit` | Zero dependency vulnerabilities at time of validation |
| `npm run test:layouts` | Five normal and dense sizes, two-axis scrolling, HC/RTL, large text/highlights and labeled local preview captures |
| `npm run benchmark` | 30 measured samples after five warmups per case; raw values and environment retained |
| `npm run prepare:sample` / `npm run validate:sample` | 20 Microsoft-schema definitions, two authored pages / 12 visuals, bindings/counts/CSV-TMDL parity and exact embedded package/resources pass |

The Boolean-vector oracle independently evaluates each entity's memberships,
retained-set projection, exact/inclusive combinations, zero count, highlights,
minimum/Top filtering and denominator over seeded fixtures and four set limits.
It does not use the production bitmask/subset counting algorithm as its oracle.
Additional cases cover typed collisions, duplicates and represented identities,
blank-set rows, sparse/overlong invalid observations, safe 16-digit numbers,
long numeric text identifiers and role changes.
Invalid observations retain only a small counter placeholder in the resize
cache, not their oversized raw values/objects; formatted labels are bounded
before caching. Native host heap/profile measurements remain unperformed.

Packaged-browser cases cover aligned bars/dots and sticky set margins, all five
requested viewports, exact/inclusive and native set selection, representative
context menus, tooltips/touch, highlights, persisted formatting/bookmark-shaped
restoration, multiple instances, resize/destroy/rebind, aggregate segments and
refusal, invalid roles, missing identities, row cap, selection cap and pending
Ctrl-add races, mixed selection, contributor search/pagination, large text,
keyboard, HC/RTL/reduced motion, safe labels/colors and host errors.

Mocked native callbacks and browser frames do **not** measure or establish
Power BI model/filter performance, actual bookmarks, screen-reader operation
inside the Power BI frame, or service behavior. See
[performance and visual inspection](performance-and-layout.md).

## Evidence binding and preservation

`dist\artifact.sha256` records the actual package hash. Repackaging can change
ZIP metadata and therefore the hash. Final capture and benchmark manifests
contain the package hash; the sealer rejects mismatches. The final handoff
manifest records source commit, branch, package, source archive, authored
sample, assets, command logs, screenshots and every file's SHA-256.

The sealer requires committed, clean source and a new absolute destination
outside the worktree. It does not overwrite an existing handoff. All recorded
baseline/candidate benchmark runs are retained, including slower candidates;
results were not selected to manufacture a speed advantage. Hashes detect
mutation, but are not a signature, notarization or storage immutability service.

## Tooling findings resolved or disclosed

- Tools 7.2.1's locale-pruning loader fails on formattingutils 7 ESM. Supported
  `--all-locales` retains offline cultures; no dependency source is patched.
- Tools resolves a development certificate while packaging. The wrapper
  isolates tool-home, creates a local .NET certificate, and deletes its
  PFX/password; it does not install/trust a certificate in a store.
- Upstream Node `DEP0187` and nine optional-feature notices remain non-failing
  tool messages. The unimplemented optional features are not advertised.
- Vitest 4.1.11 and scoped `qs` 6.16.0 / `sockjs` -> `uuid` 11.1.1 overrides
  resolve development dependency advisories in the recorded audit.
- SDK npm version 5.11.1 exports API contract 5.11.0; packaged metadata uses
  that contract.
- Full Microsoft MIT, ISC and embedded Globalize notices are included in the
  distributed JavaScript resource, including emitted minifier notices.

## Remaining native and owner gates

Desktop/service import, real model identity/filter/highlight behavior,
screen-reader use, PBIP open/refresh/save, genuine PBIX creation,
PDF/PowerPoint/image export and tenant-policy behavior remain **unperformed**.
Schema-valid PBIP and labeled host-mock previews do not close these gates.
The coordinator owns these checks and live Marketplace submission.

**Owner update, 2026-09-10:** existing Atlyn storefront subscriptions with
ungated runtime and free shared viewing are approved. Paid-author identity
checks and runtime licensing integration are not required or pending. No
package rebuild/version change accompanies this documentation update.
The repository declares no first-party license identifier; applicable
existing terms/public policies, support, native/PBIX work and final assets
(including the required Extra PowerBI badge) remain in the parent's final
publication gate. Nothing in these local results authorizes submission or
release. See [acquisition/runtime](acquisition-and-runtime.md),
[manual validation](manual-validation.md),
[release review](release-review.md) and [submission dossier](submission-dossier.md).

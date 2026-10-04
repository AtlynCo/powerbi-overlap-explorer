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

## Native report-version correction, 2026-09-10

The coordinator's single-variable native A/B on the exact provisional sample
found that report-definition `4.0.0` loaded no report pages/content. Changing
only `definition/version.json` to `2.0.0`, with artifact `definition.pbir`
unchanged at `4.0`, restored pages, refresh and initial customer rendering.
The supplied `overlap-native-version2-probe.json` includes the explorer,
Atlas/Beacon/Cove, ten entities, native card/table, page 1 of 2 and no dialogs.
The coordinator saved a Public-labeled 168,742-byte PBIX; this is not a local
headless conversion or a complete native acceptance result.

The source-only correction independently generates/checks both version
contracts and prevents the schema-valid but natively failing `4.0.0`
report-definition regression. The visual remains the same `1.0.0.0` bytes.
A distinct sample/source receipt records this correction without replacing
the original rendering seal or earlier provisional sample.

## Remaining native and owner gates

Full both-page semantics, real model identity/filter/highlight behavior,
screen-reader use, saved PBIX close/reopen and offline acceptance, service
import, PDF/PowerPoint/image export and tenant-policy behavior remain
**unverified by the supplied probe**. Schema-valid PBIP, the limited initial
native result and labeled host-mock previews do not close these gates.
The coordinator owns these checks and live Marketplace submission.

**Owner update, 2026-09-10:** existing Atlyn storefront subscriptions with
ungated runtime and free shared viewing are approved. Paid-author identity
checks and runtime licensing integration are not required or pending. No
package rebuild/version change accompanies this documentation update.
The repository declares no first-party license identifier; applicable
existing terms/public policies, support, native/PBIX work and final assets
remain in the parent's final publication gate. Official **Power BI certified**
status is the owner's required target via **Request Power BI certification**
in Partner Center, not granted approval. Microsoft awards/displays the badge
after review; no custom badge asset or in-visual graphic is needed. Nothing
in these local results authorizes submission or release. See
[acquisition/runtime](acquisition-and-runtime.md),
[manual validation](manual-validation.md),
[release review](release-review.md) and [submission dossier](submission-dossier.md).

## Isolated sample-sync branch recheck, 2026-10-02

On `garrett-hamers-certification-sample-sync` at the pre-sync branch revision,
`npm ci` succeeded with Node 24.17.0 / npm 11.13.0. The full dependency audit
initially found four fixable transitive development-dependency advisories
(one high, three moderate). `npm audit fix` updated only `package-lock.json`;
the final `npm run audit` reported zero vulnerabilities. The documented
`npm run package` build produced the same uncompressed package members as the
preserved local package. Its ZIP hash varied between build runs, so no rebuilt
archive was substituted for the saved artifact.

After the clean install and sample-script correction, `npm run check` passed:
61 unit tests, 31 packaged-browser tests, typecheck, the explicit ESLint
command, package certification audit (no external requests), package
structure assertions and local-policy checks. `npm run test:layouts` captured
10 normal/dense viewport combinations plus scroll/contrast/RTL evidence;
`npm run benchmark` completed customer, dense-exact, bounded-inclusive and
700-identity selection mock cases. `npm run validate:sample -- --embedded-only
--offline` intentionally failed its version-parity assertion: the preserved
sample manifest says `1.0.0.0`, while `pbiviz.json` and the current package say
`1.0.1.0`. The offline schema/binding check passed before making the parity
assertion dynamic; it was an embedded-snapshot check, not a current-package
parity pass.

To honor the instruction to preserve sample/release bytes, the PBIP payload,
embedded archive and existing `dist` files were restored unchanged after
build checks; their before/after hashes matched. This branch's sample/package
version mismatch remains a release blocker. No Power BI Desktop session was
started, and no native menu, graceful close, process-chain release or
cold-reopen evidence was collected. Service, mobile, accessibility and export
gates remain unverified; these local mock checks do not close them.

## Candidate 1.0.2.0 package and PBIP sync, 2026-10-02

Per the coordinator's approved next patch version, the source candidate now
uses visual version `1.0.2.0`, root npm package version `1.0.2`, and the
verified support fallback
`https://atlynco.github.io/atlyn-powerbi-support/docs/faq/`. The sample
authoring and validation scripts read the visual GUID/version from
`pbiviz.json`; the package validator checks the configured support URL.

`npm ci` passed and did not alter the lockfile after the coordinated version
update. `npm run check` passed with 61 unit and 32 packaged-browser tests,
typecheck, ESLint, package external-request audit/structure checks, and
local-policy checks. `npm run audit` reported zero vulnerabilities. The final
production `npm run package` artifact is
`AtlynOverlapExplorerA83D5B49F72E4CA693D0C8260159BE42.1.0.2.0.pbiviz`,
SHA-256
`3a78a2e7c241cb59261d5a1c82b7fd476873c4954c74e59a0eed0e5892569054`.
`npm run prepare:sample` followed by
`npm run validate:sample -- --offline` passed: 20 definitions
schema-validated, two authored pages / 12 visuals, bindings and sample data
checks pass, and the embedded archive SHA-256
`3a78a2e7c241cb59261d5a1c82b7fd476873c4954c74e59a0eed0e5892569054` exactly
matches the final PBIVIZ. The certification package validator also confirms
the configured support URL is the verified fallback.

The genuine PBIX
`C:\pbicert\reviewer-native-check-2026-09-29\Overlap-1.0.1.0-check.pbix`
remains an immutable historical probe at SHA-256
`e5e27f89fd9d2d9a59c09207863b41aeb88467aca0c2ecaf1815400692e829ec`.
It is version `1.0.1.0`, not the current candidate, and is not the final
sample. A genuine Desktop-saved `1.0.2.0` PBIX, offline reopen, and native
semantic/menu acceptance remain blocked/pending coordinator-owned Desktop
access. No Desktop was launched or closed in this pass; source/PBIP checks do
not close those native gates.

## Current PR #5 candidate recheck, 2026-10-04

PR #5 is open/draft at head
`13ce5f733385361db35f9da88f7fd954b399b7f3`, based on `certification`
`8320d6309cd355e03038718bb82fead519e29853`. The isolated worktree was clean
at that head before validation. The manifest and lockfile agree on Tools
7.2.1 and API npm package 5.11.1; the package correctly advertises host API
5.11.0. `npm view` against the configured Microsoft feed reported Tools
7.2.1 and API 5.11.1 as latest; Tools 7.2.2 returned E404.

`npm run check` passed on this candidate: strict typecheck, ESLint, 61 unit
tests, packaging/certification audit (no external requests), package
structure/policy assertions, 32 packaged-browser tests including empty-space
context-menu hit tests, and local-policy checks. The built PBIVIZ is
`dist\AtlynOverlapExplorerA83D5B49F72E4CA693D0C8260159BE42.1.0.2.0.pbiviz`,
136,021 bytes, SHA-256
`0434c6f986e16379b1b5f3d2cd1bfad8521092e729dbe78fcdc4bbf773989d34`.
The explicit `npm run lint`, `npm run typecheck`, `npm run package`, and
`npm run certification` commands also passed; the 32 browser tests were
rerun against this final archive.
After `npm run prepare:sample`, `npm run validate:sample -- --offline`
passed: 20 JSON definitions, two bound pages / 12 authored visuals, model/CSV
parity and exact embedded package/resource checks. The PBIP embedded archive
has the same 136,021-byte length and SHA-256 as the PBIVIZ.
The embedded resource JSON SHA-256 is
`4c9499ab523a5f2643f5a883f4f789d9c08557d7795918ad7a44ee867cabf55a`.
Repeated packaging changed the outer PBIVIZ SHA-256 while preserving the
embedded resource checksum; use the exact artifact/hash above and regenerate
the PBIP from that artifact before any native save.

The full audit requirement is **not met**. `npm audit --package-lock-only
--json` and `npm run audit` both report six high-severity affected package
nodes (zero moderate/critical/low/info), across prod 7, dev 607, optional 41,
total 614 dependency records. All six findings trace to one distinct advisory,
GHSA-vfj7-8cjw-p6xm: `braces` stack-exhaustion DoS, CVSS 7.5, affected range
`<=3.0.3`. npm's only offered automatic fix is a breaking downgrade of
`powerbi-visuals-tools` to 1.7.2. Registry metadata reports `braces` 3.0.3
latest and 3.0.4 absent. GitHub's advisory record reports
`first_patched_version: null` (coordinator verified, updated 2026-10-02);
there is no patched version published. No override, suppression, forced
downgrade, or dependency/source workaround was applied. The existing
2026-10-02 zero-vulnerability audit result is historical and is superseded
for this current dependency snapshot.

There is no `.pbix` file in the worktree. The only current sample artifact is
the PBIP; it is not a native Desktop save. The external 1.0.1.0 probe is
historical and does not establish current 1.0.2.0 parity. Desktop open,
refresh, native context-menu behavior, save/reopen, and native semantic
acceptance were not performed. This GitHub repository is private; the
coordinator reports read access confirmed for both OSDC1033 and `pbicvsupport`
across all eight repositories and that support/legal pages currently work.
No permission change was made. No Desktop, Partner Center, publication,
merge, or protected-ref action was taken.
The local fixtures are the repository's authored customer/product and feature
adoption datasets; no validation against Microsoft's separately linked
certification sample report is recorded. The frozen `certification` branch
also remains at the PR base and does not yet carry this candidate.

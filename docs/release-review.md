# Release and certification review

Local engineering review prepared **2026-09-09**; owner-model update **2026-09-10**.

## PR #5 candidate recheck, 2026-10-04

The current candidate is **1.0.2.0**, GUID
`AtlynOverlapExplorerA83D5B49F72E4CA693D0C8260159BE42`, on draft PR #5,
head `13ce5f733385361db35f9da88f7fd954b399b7f3`, based on `certification`
at `8320d6309cd355e03038718bb82fead519e29853`. The checked-out branch was
clean before rebuilding. The PR includes the merged empty-space context-menu
hit-test coverage, corrected support URL, and source-managed sample updates.
The tested PBIVIZ and PBIP hashes, command results, and current blockers are
recorded in [validation results](validation-results.md#current-pr-5-candidate-recheck-2026-10-04).

The current lock uses `powerbi-visuals-tools` 7.2.1 and npm API package 5.11.1;
the latter correctly emits host metadata API 5.11.0. The configured Microsoft
npm registry reports Tools 7.2.1 as latest and API 5.11.1 as latest; Tools
7.2.2 is unavailable there. The required full development-dependency audit
currently **fails**: one root advisory, GHSA-vfj7-8cjw-p6xm, affects six
dependency nodes at high severity. `braces` 3.0.3 is the latest published
version and is within the advisory range; 3.0.4 is unavailable. npm's only
offered fix is a breaking Tools downgrade to 1.7.2. No unsafe override,
suppression, or downgrade was applied.
GitHub's advisory record lists `first_patched_version: null` (coordinator
verified, updated 2026-10-02); this is an unresolved upstream advisory, not a
missed compatible version bump.

No candidate-version `.pbix` exists in this worktree. The source-managed PBIP
and packaged visual pass offline/schema/resource checks, but are not evidence
of a genuine Desktop-saved report. A current-version native PBIX, native
open/refresh/save/reopen and semantic acceptance remain outstanding. The
repository is private. The coordinator reports that read access for both
OSDC1033 and `pbicvsupport` is confirmed on all eight repositories and that
the support/legal pages currently work. No permission change was made here.
The frozen lowercase `certification` ref remains at the base commit above; this
draft PR has not been merged, so that protected source branch does not yet
contain the 1.0.2.0 candidate.

## Current decision

**HOLD for the coordinator's final native/assets/publication gate.**
The owner approved **storefront subscriptions, ungated visuals**: external
acquisition through existing Atlyn subscriptions, free shared viewing, and no
paid-author identity enforcement. **Runtime licensing is no longer a blocker;
the current renderer is intended.** No licensing APIs, keys, signer, AAD,
feature gates or runtime calls are to be added. This approval is not Microsoft
certification or native-host proof; see [the decision record](acquisition-and-runtime.md).

The original rendering baseline was `4356e10`. The quality/sample work through
`8026329` was merged by PR #2 into `origin/main` at `b7a5df2`; that historical
merge does not authorize further main/ref changes, merges or submission.
This follow-up also corrects the sample's report-definition version to
`2.0.0` while preserving artifact `4.0`, based on the coordinator's native A/B.
It does not change the renderer or frozen bundles.
The historical release-quality package SHA-256 was
`ae2f1c09694fb5cade37bd1bbe30c18d212e8920f7f9a9cadd33a0234f9cebf0`.
The release seal records the final full source commit and archive/file hashes.
Repository Actions was disabled by the coordinator (`enabled=false`);
this release uses **local validation only**, not hosted CI, cloud coding,
Codespaces, workflow badges or historical hosted results.

### Historical coordinator-reported local progress

The final **local** `npm run check:release` passed: strict typecheck,
Microsoft-plugin ESLint, **47 unit tests**, **30 packaged-browser tests**,
official package audit, local-only policy, **20 schema-validated definitions
for two authored pages / 12 visuals**, exact sample/package equality and zero
dependency vulnerabilities. The explicit `npm run eslint` entry point is
present. Large-text controls, 16-digit/signed identifiers and asynchronous
selection races are covered.

All 20 final PNGs match the visually inspected candidate pixels byte for byte.
Final package-linked raw measurements, images, command logs and schema hashes
are retained; see [validation](validation-results.md) and
[performance/layout](performance-and-layout.md). These do not establish
native-host behavior or competitor superiority. The release seal binds the
committed source to these qualified local artifacts; owner/native gates remain.

## Confirmed metadata

Author **Atlyn**, contact **atlyn.help@gmail.com**, public support
**https://atlynco.github.io/atlyn-powerbi-support/docs/faq/** are coordinator-verified values reflected
in `pbiviz.json`. They are not placeholders or unresolved channel choices.
The owner must still verify public page availability, adequate visual-specific
support content, and contact responsiveness. A private issue tracker is not
the public support channel.

The original review candidate metadata was version `1.0.0.0`, GUID
`AtlynOverlapExplorerA83D5B49F72E4CA693D0C8260159BE42`; SDK npm package
5.11.1 exposes API contract 5.11.0. The current PR #5 candidate is version
`1.0.2.0`; see the recheck above and current archive evidence in
`validation-results.md`.
Acquisition and ungated runtime are owner-approved. The repository still has
no first-party LICENSE/LICENCE file or `package.json` license identifier;
applicable existing terms and public-policy references belong in the owner's
publication paperwork. Dependency licenses do not license this repository.

## Submission-blocker matrix

“Pending” means missing evidence or approval, not a presumed implementation
failure. Do not close a native or owner gate with an automated local check.

| ID | Gate / consequence | Owner | Required closure evidence | Current status |
| --- | --- | --- | --- | --- |
| B01 | First-party terms and provenance record | Product owner/legal | Applicable existing terms and dependency notice review; no invented relicensing | **NO FIRST-PARTY IDENTIFIER/TERMS DECLARED IN REPO**; not a runtime integration task |
| B02 | Acquisition/runtime model and listing paperwork | Product owner/legal | Existing storefront subscription acquisition, ungated shared viewing, applicable EULA/privacy/disclosures | **ACQUISITION/RUNTIME APPROVED**; publication documents remain for the parent gate, not licensing-code implementation |
| B03 | Publisher authority and public support; blocks submission | Publisher owner | Authorized account/legal entity; working public support and responsive contact; secure reviewer-access plan | **PENDING**; metadata verified, responsiveness/account authority not established |
| B04 | Final local correctness and failure-state proof | Engineering coordinator | Final revision-linked type/lint/unit/package/Chromium host-mock logs, all intentional limits and adversarial/selection/lifecycle cases | **CURRENT PR #5 LOCAL PASS**: typecheck, ESLint, 61 unit / 32 packaged-browser tests and package checks; native behavior is not established |
| B05 | Certification build/repository/audit compliance | Engineering coordinator | Current latest API/tools review; required commands/files/plugin config; no moderate/high audit warnings; safe source/bundle; exact rebuild/package correspondence | **BLOCKED**: full audit reports six high-severity package findings rooted in GHSA-vfj7-8cjw-p6xm; latest compatible `braces` patch is unavailable. See current recheck above |
| B06 | Native Desktop/service/core host behavior | Native validation coordinator | Actual N01–N13/N15 results in [certification instructions](certification-requirements.md), real identities/model/filtering/persistence, profiles and defects resolved | **INITIAL NATIVE PROBE ONLY**; version correction restored pages/refresh/customer rendering; full semantics and host matrix pending |
| B07 | Mobile/touch/accessibility/export coverage | Native validation coordinator | N14/N16 outcomes on applicable supported hosts; tenant/certification restrictions honestly recorded; no false conformance/export claim | **NOT RUN** |
| B08 | Authored sample project acceptance | Engineering + native coordinator | Schema/binding/resource checks plus real Desktop open/refresh and both bound pages validated | **LOCAL PBIP PASS**: 20 definitions, two bound pages, exact embedded bytes; current candidate Desktop open/refresh and full both-page acceptance remain pending |
| B09 | Mandatory offline sample PBIX | Native validation coordinator | Genuine Desktop-saved PBIX, offline reopen/refresh, same visual version/content as final PBIVIZ, hash and evidence | **BLOCKED**: no candidate-version PBIX in this worktree; historical 1.0.1.0 probe is not current-version parity evidence |
| B10 | Listing icon/logo/screenshots | Asset + native coordinator | Original source/provenance; 20×20 icon; 300×300 logo; 1–5 native-backed listing PNGs at 1366×768 and ≤1024 KB; hashes, captions and review | **LOCAL ASSETS COMPLETE / NATIVE SCREENSHOTS PENDING**; local previews are host-mock labeled; no custom certification-badge asset is required |
| B11 | Source/package/evidence integrity | Engineering coordinator | Immutable [dossier manifest](submission-dossier.md#immutable-evidence-manifest), final source/archive/package/input/media hashes and qualified evidence classes | **CANDIDATE HASHES RECORDED** in current validation results; no new immutable native-release seal or PBIX evidence exists |
| B12 | Listing and certification handoff | Product/publisher + coordinator | Approved accurate listing/notes, resolved required gates, lowercase `certification` branch matching frozen package/source; explicit instruction to submit | **BLOCKED pending prior gates and owner authorization** |
| B13 | Official Power BI certification, owner-required target | Microsoft + publisher | Authorized publisher selects **Request Power BI certification** at submission; Microsoft awards/displays the official badge after review/approval; retain the actual decision for this version | **REQUESTED BY OWNER; NOT SUBMITTED / NOT CERTIFIED** |

Microsoft requirements and citations are maintained in
[certification requirements](certification-requirements.md).
Publication requires a real offline PBIX, not a PBIP substitute; Microsoft
documents conversion only through Desktop **File > Save as**.
Current screenshot constraints, full proposed listing copy and the evidence
inventory are in the [submission dossier](submission-dossier.md).

## Evidence acceptance

- **Static source/docs:** establishes declared contracts and sourced policy,
  not executed behavior.
- **Local final-package automation:** establish only the scenarios actually
  run; packaged Chromium uses host mocks. Record exact results, errors,
  request observations, tool versions, date, fixture and package hashes.
- **Local performance/layout captures:** identify baseline versus final
  package, metric boundaries, repetitions and viewport. They are not a
  native-host or competitor benchmark.
- **Schema-valid authored PBIP:** useful preparation, not proof of native
  opening, binding, refresh, identities or PBIX production.
- **Native host evidence:** required for real model selection, cross-filter/
  highlight, Desktop/service/mobile, accessibility, dashboard and export
  assertions; never infer from a mocked selection manager.
- **Owner/Microsoft decisions:** only actual authorization/approval closes
  those gates. Local checks cannot manufacture legal or certification status.

[Validation results](validation-results.md) may hold engineering records.
Do not lift earlier “29 unit / 13 browser” counts, an earlier clean audit,
or a merged PR into this review as current release proof. Each final claim
must trace to the final revision and package; otherwise leave it pending.
If a later source/package change affects prior evidence, rerun the affected
checks and capture a new seal instead of editing an immutable evidence set.

## Truthful product and comparison boundaries

The v1 contract is distinct entities in the received snapshot; exact/inclusive
intersections; default six/maximum ten retained sets; default Top twenty/
maximum fifty combinations; maximum 30,000 processed rows; explicit blank-set
universe observations; no runtime privileges; at most 1,000 native identities
per combined selection, with all-or-nothing refusal.

Retained-set exactness is not full-model exactness. Inclusive is not union.
Visible-bar sums are not always the universe. Native context menus refer to a
representative entity, not a generated intersection identity. A completeness
message about processed host data does not guarantee full-source coverage.

[Comparison](comparison.md) verifies the real UpSet.js Power BI integration,
including its AGPLv3/commercial-license evidence, three modes, entity/flag data
contract and native identity source design. It also compares the native
matrix and Deneb's flexible specification workflow. The source-derived
12-capability table and synthetic sample oracles are not measured superiority,
competitor counts/performance, or a “best in class” result.

## Final coordinator handoff

1. Complete/review baseline and final **local** evidence, fix failures, and
   reconcile any stale sample expectation; customer Atlas-only is C002/C009.
2. Complete owner gates and genuine native tests, PBIX and listing captures;
   preserve qualified blocked/not-run outcomes rather than inventing passes.
3. Finalize reviewed source, documented build/postprocessing, package, sample,
   listing copy and immutable evidence correspondence.
4. **Only after that coordinated baseline/final review**, create or advance
   the lowercase **`certification`** branch at the exact reviewed source
   matching the package. Freeze it for the submission process; no independent
   workstream should create it prematurely.
5. Obtain explicit publisher authorization for Partner Center submission and
   source access. This dossier prepares that handoff; it does not submit,
   grant access, accept contracts or publish.

The owner requires the official **Power BI certified** target, requested
through Partner Center's **Request Power BI certification** checkbox. It has
not been granted. Microsoft awards/displays the badge only after approval;
no custom artwork, purchase badge or in-visual graphic is required.

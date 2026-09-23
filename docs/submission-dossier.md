# Submission dossier — draft, not submitted

Prepared **2026-09-09**, updated for the **2026-09-10 owner approval**:
external acquisition through existing Atlyn subscriptions, ungated runtime,
and free shared viewing without paid-author identity enforcement. This
document does not select a new license, invent commercial terms, grant
reviewer access, publish an offer, or claim certification. Native/PBIX,
assets and the parent's final gate remain in [release review](release-review.md).

The current release branch is **`release-quality-overlap`**. The coordinator's
[final local progress](release-review.md#coordinator-reported-local-progress)
records 47 unit / 30 packaged-browser passes, exact authored sample/resource
checks, inspected images and regenerated measurements. The original
clean-source rendering seal records its tested commit, package/assets/evidence
and hashes; the source-only sample/version correction does not rewrite that seal.
Runtime licensing integration is not pending. The current renderer is
intended, with no repackage/version change for this documentation update.
The native version A/B restored pages/refresh/initial rendering and produced
a probe PBIX. Final native/PBIX acceptance and assets remain parent-owned.

## Confirmed identity and unresolved business fields

| Field | Draft value / status |
| --- | --- |
| Public visual name | **Atlyn Overlap Explorer** |
| Author / public contact | **Atlyn** / **atlyn.help@gmail.com** — coordinator-verified metadata |
| Public support URL | **https://atlynco.github.io/atlyn-powerbi-support/docs/faq/** — coordinator-verified channel; public support documentation |
| Repository metadata | `https://github.com/AtlynCo/powerbi-overlap-explorer`; not a substitute for public customer support; reviewer access remains owner-controlled |
| Package version / GUID | Candidate `1.0.1.0` / `AtlynOverlapExplorerA83D5B49F72E4CA693D0C8260159BE42`; final archive must agree |
| API | SDK npm 5.11.1 / manifest API 5.11.0; record final actual values |
| Publisher legal entity/account/authority | **OWNER DECISION / VERIFICATION REQUIRED** |
| Source and distribution license | **No first-party LICENSE/LICENCE file, package `license` field or SPDX identifier declared**; no terms invented or inferred from dependencies |
| Product EULA / standard contract selection | Terms at **https://atlynco.github.io/atlyn-powerbi-support/legal/terms/**; author acquisition via Atlyn all-access subscription |
| Public HTTPS privacy policy | **https://atlynco.github.io/atlyn-powerbi-support/legal/privacy/** |
| Acquisition model | **APPROVED:** Atlyn all-access subscription required for authoring/use; shared viewers require no separate subscription |
| Runtime / shared viewing | **APPROVED:** ungated runtime (no key/license checks), free shared viewing |
| Prices / contract details / availability markets | Use owner-supplied existing terms; no amounts, tiers, SLA or refund clauses invented |
| Certification target | **OWNER REQUIRED:** official **Power BI certified** designation via Partner Center's **Request Power BI certification** checkbox; **NOT SUBMITTED / NOT GRANTED** |

Microsoft's [properties guidance][properties] permits a standard contract or
own/default visual EULA, but selecting a contract requires owner approval.
It warns that publishing under the standard contract constrains later
switching to custom terms. The [publication checklist][publish] describes an
EULA file, while the properties flow accepts a terms URL/contract selection:
retain the approved document and use the actual current publisher form.
Privacy and support links are required even for a local-only implementation.

## Proposed English listing copy

**Name:** Atlyn Overlap Explorer

**Search results summary** (within the [100-character policy limit][policy]):

> Explore exact and inclusive entity overlaps with clear universe and data limits.

**Search keywords** (three, the [listing maximum][listing]):
`set intersections`; `entity overlap`; `membership analysis`.

**Suggested category for owner review:** Comparison. A second category is
optional; do not classify inclusive intersections as an additive part-to-whole
breakdown. Industries and markets remain publisher decisions.

### Description

The following draft stays within the [3,000-character description limit][listing].
Do not publish until its host-dependent features have passed the native tests.

> Atlyn Overlap Explorer helps Power BI report authors examine how distinct
> entities belong to overlapping sets, such as customers using products or
> users adopting features.
>
> Bind Entity ID and Set Name from a long-form membership table. The visual
> groups repeated entity/set observations without inflating entity counts.
> Use exact mode to see exclusive combinations among the retained sets, or
> inclusive mode to count entities belonging to every named set while allowing
> other memberships. Inclusive groups can overlap; their counts are not an
> additive total.
>
> Explore set-size bars and a dot matrix of ranked combinations. Inspect
> contributors using search and paged details. Select contributors through
> Power BI entity identities, or select a set margin to target all members of
> that set. An optional positive Highlight signal measure enables distinct
> highlighted-entity presence rather than weighted counting.
>
> The displayed universe consists of valid entities in the received data
> snapshot. Include blank Set Name observations for entities with no
> memberships. Entities absent from the delivered data are not inferred.
> Data reduction, invalid rows and omitted sets are disclosed.
>
> Designed for bounded analysis: six retained sets by default, configurable
> to ten; twenty combinations by default, up to fifty; and at most 30,000
> processed rows per aggregate snapshot. When sets are omitted, exactness is
> relative to retained sets. Top and minimum-count filters may hide groups.
>
> Group selection is refused if any required entity identity is missing or
> the combined selection exceeds 1,000 identities. Detail inspection is
> separate from that cap, with up to 200 entities per page. Native context
> menus refer to one representative entity, not a new intersection category.
>
> Prepare the two grouping fields in your Power BI model and allow custom
> visuals under your organization's policy. Acquire the visual through
> existing Atlyn storefront subscriptions. The runtime is ungated for authors
> and viewers, with free shared viewing and no paid-author identity checks.
> It requests no additional privileges or licence calls. Power BI's own
> licensing, permissions and sharing requirements still apply.
>
> Synthetic customer/product and feature-adoption examples illustrate the
> counting rules and data preparation. For setup and support, visit
> https://www.atlynco.com/docs/faq.

This description records the approved acquisition/runtime model, not new
commercial terms. Use the owner's existing terms and required publication
disclosures. Do not add “certified,” “best in class,” competitor performance
claims, unrestricted
drill-through/export promises, complete-source counts, or unlimited-data
claims. See [comparison](comparison.md) for the documented trade-offs.

## Media requirements and capture plan

Requirements checked against Microsoft [publication][publish],
[listing][listing], [image guidance][images] and [project structure][structure].

| Artifact | Requirement | Current release evidence |
| --- | --- | --- |
| Visual-pane icon | PNG, exactly **20×20** pixels, referenced by `pbiviz.json` | Original `assets/icon.png`, inspected and package-byte/dimension checked; hash in release seal |
| Marketplace logo | PNG, exactly **300×300** pixels; sharp and recognizable | Original `assets/logo-300.png`, inspected; dimensions/hash in release seal |
| Additional 50/150px images | May be useful derivative assets; not mandatory sizes in the current cited Power BI listing instructions | Optional; do not substitute for 300×300 |
| Screenshots | **At least 1, at most 5**; PNG; each exactly **1366×768** pixels; each **≤1024 KB** | Native captures **PENDING** |
| Screenshot composition | Clear legible text, correct aspect ratio; no personal data/unrelated UI; useful nonobscuring callouts | Local preview inspection complete; native listing composition/approval **PENDING** |
| Video | Optional HTTPS YouTube/Vimeo link in listing guidance | Not supplied; not a blocker |

The publication page asks for explanatory text bubbles; the listing/image
pages recommend callouts. Plan concise callouts without covering labels,
counts or warnings. Capture at the required pixel dimensions; do not stretch
an arbitrary viewport. Retain the original capture and separately hash any
cropped/composited listing derivative. Keep synthetic-data captions readable,
exclude personal account details/taskbars, and conservatively keep files
below 1,024,000 bytes while recording actual byte counts.

**Evidence distinction:** Microsoft's pages specify screenshot format/content,
not that a mock screenshot proves host behavior. Our release policy reserves
final host-behavior screenshots for genuine Desktop/service captures.
Packaged Chromium host-mock images are useful local engineering previews;
label them as such and never represent them as native screenshots.

Proposed listing storyboard (choose 1–5 after native validation):

1. **Customer/product, exact:** all three sets; universe 10; Atlas+Beacon
   exclusive count 2. Callout: “Distinct entities, exact retained-set groups.”
2. **Customer/product, inclusive:** Atlas+Beacon count 3. Callout:
   “Includes entities with additional memberships; groups are not additive.”
3. **Contributor inspection:** exact Atlas+Beacon shows C001/C010;
   native supporting table demonstrates observed selection if validated.
4. **Feature adoption:** four sets with sizes 7/6/5/2 and universe 12.
5. **Retained-set scope:** customer maximum sets 2, omission warning visible,
   universe still 10 and projected zero 2. Callout: “Exact among retained sets.”

Three matching-size local previews (customer exact/inclusive and feature
adoption) are present in the release evidence, visibly labeled as host mocks.
The five storyboard items above still describe future native captures. Do not
reuse competitor artwork or apply a Microsoft certification badge.
Commercial logos *inside* the visual have separate edit-mode/color/behavior
rules in Microsoft's [visual guidelines][guidelines]; a colorful Marketplace
logo does not authorize permanent in-visual branding in reading mode.

## Offline sample PBIX: mandatory and not manufactured

Microsoft requires an offline **`.pbix`**, with the same visual version and
content as the submitted PBIVIZ [publication][publish],
[technical configuration][technical], [policy 1180.2][policy].
A CSV, PBIP/PBIR source project, schema-valid JSON or renamed archive is not
that deliverable. Microsoft explicitly says programmatic PBIP/PBIX conversion
is not supported; use Desktop **File > Save as** [PBIP FAQ][pbip].

The locally authored project has two bound customer/feature pages, 12 visuals
and 20 schema-validated definitions, plus the exact final archive and extracted
resources. Source checks alone do not prove native behavior. The coordinator's
single-variable `4.0.0` to `2.0.0` report-definition correction restored pages,
refresh and initial customer rendering, with artifact `4.0` and package bytes
unchanged. A genuine Public-labeled 168,742-byte PBIX was saved. Final
close/reopen, offline acceptance, both-page semantics and identity/interactions
remain **PENDING**; see the [qualified native record](validation-results.md#native-report-version-correction-2026-09-10).

Required coordinator handoff:

- Open the authored PBIP with a supported current Desktop, refresh offline,
  inspect the actual custom visual on both bound pages, and verify native
  entity table/chart/slicer interactions. Record all defects.
- Include customer and feature examples with the exact fixture oracles in
  [comparison](comparison.md); keep explicit blank-set universe observations.
  Include formatting examples and a hints page explaining modes, omitted sets,
  limits, selections and positive highlight signals.
- Import/verify the final hashed PBIVIZ. Save a genuine PBIX in Desktop and
  reopen offline. Check embedded visual version/content against that package,
  not merely the report title or filename.
- Verify there are no external data connections, machine-specific CSV paths,
  credentials, private customer data or missing custom-visual resources.
- Hash the PBIX, record host version/tester/date and preserve native captures.
  Recreate or update it if the visual package changes.

## Draft Notes for certification

Replace every `PENDING` value only from actual evidence before submission:

> Product: Atlyn Overlap Explorer; candidate version 1.0.0.0; GUID
> AtlynOverlapExplorerA83D5B49F72E4CA693D0C8260159BE42.
> Reviewed source: use the full commit from the release manifest;
> coordinated read-only certification-branch URL remains PENDING review.
> Package: AtlynOverlapExplorerA83D5B49F72E4CA693D0C8260159BE42.1.0.0.0.pbiviz;
> SHA-256 ae2f1c09694fb5cade37bd1bbe30c18d212e8920f7f9a9cadd33a0234f9cebf0.
> Sample: PENDING genuine offline PBIX filename, SHA-256 and Desktop version.
>
> Build with the documented local Windows/Node/PowerShell prerequisites and
> `npm run package`, including notice embedding. See
> `docs/certification-requirements.md` for commands, test setup, native
> acceptance cases N01–N17 and exact/inclusive expected results.
>
> The visual accepts Entity ID and Set Name groupings and one optional
> positive Highlight signal. Counts are distinct entity memberships in the
> received snapshot. Retention/row/display limits and identity-selection
> refusal are intentional and disclosed. No network/storage privileges or
> external account/service are required by the visual runtime.
> Acquisition uses existing Atlyn storefront subscriptions, outside the
> visual. Authors/viewers are not checked for payment or identity entitlement;
> shared viewing is free from Atlyn runtime gates. No runtime licensing
> integration remains pending.
>
> Local packaged Chromium tests use host mocks and are not native Power BI
> evidence. Native Desktop/service/mobile/accessibility/export outcomes:
> PENDING actual test report and limitations. Source/package/media manifest:
> use the immutable location and checksum supplied with the quality PR handoff.
>
> Public support: https://www.atlynco.com/docs/faq;
> contact: atlyn.help@gmail.com.
> Reviewer access is arranged separately by the authorized account owner.

Do not put passwords/recovery codes in this repository, notes template,
screenshots or evidence manifest. The account owner must use the appropriate
secure submission mechanism for any access details.

## Immutable evidence manifest

The engineering handoff supplies final artifacts and seal location. A
mutable worktree path or a screenshot without a matching package hash is
insufficient. Preserve files in a new coordinator-approved durable evidence
snapshot and verify hashes after copying; never overwrite an existing seal.

| Evidence ID | Required artifact/metadata | Status |
| --- | --- | --- |
| E01 | Final full source commit, branch, clean-tree record, source archive SHA-256; baseline `4356e10` separately identified | Recorded by clean-commit release seal; location/checksum accompanies PR handoff |
| E02 | PBIVIZ filename, bytes, SHA-256, version/GUID/API; inspected manifest/resource metadata; documented build/postprocessing | LOCAL COMPLETE; package hash above and release manifest |
| E03 | Lockfile and tool/environment inventory, hashes; local type/lint/unit/browser/package/policy/audit logs with command, timestamps and exact totals | LOCAL COMPLETE; 47 unit / 30 browser passes and zero advisories; qualified command logs in seal |
| E04 | Raw baseline/final performance samples, metric definitions, browser/host-mock environment, fixture hashes and package hashes | LOCAL COMPLETE; developer-tool/native profiles remain separate, unperformed gates |
| E05 | Original icon/logo sources or generator, authorship/license review, 20×20 and 300×300 PNG dimensions/bytes/SHA-256; optional derivatives separately listed | ORIGINAL ARTIFACTS RETAINED; no first-party license identifier declared; no custom certification-badge asset needed |
| E06 | Every local host-mock screenshot and capture manifest: package hash, viewport/device scale, dataset/settings, errors/network outcomes; explicit mock classification | LOCAL COMPLETE; 20 PNGs including three labeled preview images; all byte-identical to inspected candidate images |
| E07 | Both CSVs, authored PBIP/model/PBIR/resources and schema-validation output with schema URLs/versions and content hashes | LOCAL COMPLETE; artifact 4.0 / report definition 2.0.0, exact package/resources and 20 definitions; limited native probe recorded separately |
| E08 | Actual offline PBIX hash, matching embedded visual identity/content, Desktop open/refresh/save/reopen evidence | PROBE PBIX SAVED: 168,742 bytes; final hash/correspondence, reopen/offline and semantic acceptance pending |
| E09 | Native Desktop/service/mobile/touch/keyboard/screen-reader/performance/export test record, N01–N17 outcomes, host versions, tenant restrictions, defects | PENDING native work |
| E10 | Native original screenshots + listing derivatives, capture provenance, exact dimensions/bytes/hashes, captions and approval; 1–5 final assets | PENDING parent assets/native work |
| E11 | Dependency inventory/notices, applicable existing storefront/legal terms, EULA/privacy references, support/account approval | ACQUISITION/RUNTIME APPROVED; publication references remain parent-owned; no new source licence or runtime integration |
| E12 | Final listing text, certification notes, source-access plan, reviewer/date/sign-off, owner-required **Request Power BI certification** checkbox, later submission/decision references if authorized | PENDING final review/submission; official certification target requested by owner, not granted; Microsoft awards/displays the badge after approval |

Each manifest file entry includes relative path, byte length, SHA-256 and
evidence class/producer/provenance. File modification time is not mislabeled
as capture time: the linked capture/benchmark/sample-validation metadata
records actual UTC production times, input/package references and qualified
scope. PNG entries include pixel dimensions; benchmark metadata records
hardware/browser versions. Hash the manifest itself in a separate checksum
file; do not put a self-referential hash inside it. A seal records integrity,
not approval or successful native behavior.

No hosted CI result/badge is needed. An absent native artifact remains absent
in the seal, explicitly marked pending; do not fabricate a PBIX, screenshot,
test pass, audit status, performance number or owner decision to fill a slot.

[publish]: https://learn.microsoft.com/en-us/power-bi/developer/visuals/office-store
[listing]: https://learn.microsoft.com/en-us/partner-center/marketplace-offers/power-bi-visual-offer-listing
[properties]: https://learn.microsoft.com/en-us/partner-center/marketplace-offers/power-bi-visual-properties
[technical]: https://learn.microsoft.com/en-us/partner-center/marketplace-offers/power-bi-visual-technical-configuration
[images]: https://learn.microsoft.com/en-us/partner-center/marketplace-offers/craft-effective-appsource-store-images
[structure]: https://learn.microsoft.com/en-us/power-bi/developer/visuals/visual-project-structure
[guidelines]: https://learn.microsoft.com/en-us/power-bi/developer/visuals/guidelines-powerbi-visuals
[policy]: https://learn.microsoft.com/en-us/legal/marketplace/certification-policies
[pbip]: https://learn.microsoft.com/en-us/power-bi/developer/projects/projects-overview#frequently-asked-questions

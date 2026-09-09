# Atlyn Overlap Explorer

A bounded, entity-level set-intersection custom visual for Power BI. Vertical
intersection bars align with connected membership dots; the margin shows each
retained set's distinct-entity size. Counting and geometry are original
implementations, not an embedded or copied UpSet library.

**Status:** version `1.0.0.0`, private evaluation source. Not certified and not an
AppSource listing. The owner has not selected a source license. Licensing,
required owner-approved public policies, and real Power BI validation remain
publication blockers; see [release review](docs/release-review.md).

## Quick start

1. Obtain a locally built `.pbiviz` from the repository's `dist` directory.
   In Power BI Desktop, use **Import a visual from a file**. Tenant policy can
   restrict uncertified/custom visuals.
2. Load [customer-product.csv](samples/customer-product.csv), or open the
   [offline PBIP sample](samples/offline-pbip/README.md). Keep IDs as text.
3. Put one column in each required grouping well:

   | Field well | Kind | Example | Meaning |
   | --- | --- | --- | --- |
   | **Entity ID** | Grouping, required | `Memberships[Entity ID]` | Entity whose memberships are counted |
   | **Set Name** | Grouping, required | `Memberships[Set Name]` | One membership per row; blank means a universe-only observation |
   | **Highlight signal (optional)** | Measure | `[Highlight signal]` | Positive native cross-highlight presence only |

4. Use long-form data, not one Boolean column per product. Both grouping wells
   must be populated at runtime. Do not put counts or revenue into Entity ID.
   A mapping can be accepted while authoring with Set Name empty, but the visual
   will ask for both wells rather than infer memberships.
5. For native cross-highlights, optionally create:

   ```dax
   Highlight signal = COUNTROWS('Memberships')
   ```

   Configure the other visual's interaction as **Highlight**, where the host
   supports it. Only a finite, strictly positive value in the host's
   **highlights array** marks that row's entity highlighted. Base measure values
   do not highlight entities. Zero, negative, blank, and non-finite highlight
   values do not count. The signal is **never summed to calculate entity
   counts**; an entity with several highlighted rows counts once.

The authored PBIP uses inline synthetic data, bound customer-product and
feature-adoption pages, and an embedded copy of the exact local package.
Source/schema validation is not a Desktop-open result: the coordinator must
open, refresh, inspect interactions, and save a genuine PBIX in Desktop.

## Data contract and denominator

```csv
Entity ID,Set Name
C001,Atlas
C001,Beacon
C002,Atlas
C003,
```

Here there are three distinct received entities. `C003` explicitly belongs to
the received universe but has no observed memberships. An entity with no
delivered valid row is **not** in the denominator.

- IDs and nonblank set values use typed primitive keys: nonempty strings,
  finite numbers, booleans, or valid dates. Numeric `1`, text `"1"`, and Boolean
  `true` remain distinct even if formatting makes labels similar. Case and
  nonblank whitespace are not normalized; clean source data intentionally.
- Blank/null/empty/whitespace-only **Entity ID** is invalid. Blank/null/empty/
  whitespace-only **Set Name** is a valid, explicit zero-membership observation.
- Strings over 256 characters and unsupported/non-finite primitives are
  invalid. Display labels are bounded to 256 characters; labels are never
  used as native selection identities.
- Duplicate entity/set observations do not increase counts. Their native
  entity category identities are still retained for selection.
- A universe-only row can coexist with that entity's real memberships: it does
  not erase them. An invalid row contributes neither membership nor universe;
  another valid row may still establish the same entity.
- Percentages divide a combination's distinct entity count by **all valid
  distinct entities in the processed snapshot**, including entities projected
  into no retained sets. Report filters and incomplete delivery can change this
  universe. It is not a promise about the full model or the full customer base.

See [counting semantics](docs/semantics.md) and
[sample expectations](samples/README.md) for worked examples.

## Exact and inclusive intersections

**Exact (default)** means exactly the marked memberships **among retained sets**.
For retained sets Atlas and Beacon, `Atlas only` excludes Beacon, but says
nothing about an omitted set. Zero projected memberships form their own exact
combination. Exact combinations before display filters partition the received
universe.

**Inclusive** counts entities in every marked set, regardless of additional
retained memberships. Someone in Atlas and Beacon contributes to Atlas,
Beacon, and Atlas + Beacon. Inclusive totals therefore **double-count entities**
across bars. Only nonempty subsets are generated; the separately reported
zero-membership count is not an inclusive intersection.

Sets are retained by distinct-entity size descending, with ordinal typed raw
key ordering to break ties. **Every valid entity is projected into those
retained sets**, including entities that only belonged to omitted sets.
Set reduction is prominently disclosed because exactness no longer describes
all observed sets. Reducing displayed combinations does not create an
invented **Other** union: the visual reports only a hidden-combination count.

## Settings and hard bounds

| Setting or resource | Default | Bound / behavior |
| --- | --- | --- |
| Inclusive intersections | Off | Exact over retained sets when off |
| Maximum retained sets | 6 | 1–10 |
| Top combinations | 20 | 1–50 |
| Minimum entities | 1 | 1–30,000; applied before Top |
| Text size | 12 px | 10–20 px |
| Bar color | `#176B87` | Host high-contrast colors take precedence |
| Received rows processed per snapshot | — | At most 30,000 |
| Raw string values / displayed labels | — | 256 characters |
| Inclusive candidate combinations | — | At most 1,023 nonempty masks |
| Native selection identities | — | At most 1,000, including additive selection |
| Contributors in details | — | 200 per page, searchable across the entire received combination |

The initial categorical window requests 10,000 rows; this is a host request,
not a guaranteed delivery size. **Load more** explicitly requests
`fetchMoreData(true)`. The host's aggregated snapshot is rebuilt from scratch;
there is no unbounded local accumulation or automatic fetch loop.

If the host reports `metadata.segment`, some data remains unloaded and the
unloaded total is **unknown**. Processing stops at 30,000 rows. Invalid or
dropped rows also require a partial-data warning. A host refusal offers retry;
it is not evidence of complete data. Unexpected incremental-only segments are
not silently treated as a complete aggregate snapshot.

Even a fully processed delivery is only the current host-provided/filter
context, not a guarantee that all source-system entities have been included.

## Interaction and accessibility

- Click a combination, or press **Enter/Space**, to select all represented
  native entity category identities and open contributor details.
- Click a set margin to select **all members of that set**, even in exact
  mode. It does not select just the corresponding exclusive singleton bar.
- **Inspect** opens searchable, paged contributors without changing native
  selection. Full set names and source labels are in **Data & definitions**.
- **Ctrl/Cmd + click** adds a group or contributor to native selection.
  **Clear selection** or **Escape** clears it. Pending native selection
  requests are serialized; a clear requested while busy is queued.
- An oversized group or a group with missing native identities is **refused
  in full**. The visual never silently selects the first 1,000. Search and
  200-entity pages make every received contributor available; a contributor
  can itself be unselectable if its identities are missing or exceed the cap.
- A native tooltip describes the group. Right-click or **Shift+F10/context-menu
  key** opens a native menu for the explicitly labeled **first available
  representative entity identity**, not a fictitious intersection identity.
  Native filtering/context actions depend on the model and host.
- **Tab** reaches controls and the chart; **Left/Right** move among
  combinations, **Home/End** move to the first/last, and focus scrolls into
  view. Arrow direction follows right-to-left layout.
- Text alternatives include included/excluded sets, counts, and denominator
  shares. The dot matrix is decorative relative to those alternatives.
  Selection uses outlines/text in addition to color; a partly selected
  group is announced as mixed and outlined with dashes. Host high contrast,
  right-to-left layout, English (`en-US`), and French (`fr-FR`) are supported;
  untranslated locales use English strings. There is no animation.

Set margins stay visible while scrolling horizontally, and their rows remain
aligned with the dot matrix during vertical scrolling. Compact layouts start
the chart after a short universe summary; diagnostics expand on demand.
Below 180 px wide or 150 px high, an explicit enlargement message replaces
an unusably small chart. At 258x198, scrolling is necessary; this is not a
promise that every set and combination fits simultaneously.

These are implementation behaviors, not a completed accessibility conformance
claim. Real screen-reader and Power BI host checks remain in the
[manual validation matrix](docs/manual-validation.md).

## Privacy, support, and distribution

The visual declares no privileges or external scripts. It does not request
network access, external fonts, telemetry, or local storage; data processing
stays inside the visual's host-provided session. Normal Power BI service and
tenant behavior are outside this statement. This is a technical summary, not
an owner-approved public privacy policy or license.

The author is **Atlyn**. The support page is
[Atlyn FAQ](https://www.atlynco.com/docs/faq), and the contact address is
[atlyn.help@gmail.com](mailto:atlyn.help@gmail.com). These metadata values were
confirmed from existing Atlyn sources; the owner must verify page availability
and contact responsiveness before publication.

Repository contributors can also use the access-controlled
[GitHub issue tracker](https://github.com/AtlynCo/powerbi-overlap-explorer/issues).
Do not assume prospective customers can access the private tracker. Never
attach real customer IDs, credentials, or unsanitized model data.

Power BI export captures the **viewport** and can clip scrollable bars,
warnings, or details. There is no complete-data CSV export or guarantee of
full-chart PDF/PowerPoint rendering. Desktop, service, export, and model
identity behavior must be validated manually; no certification is implied.

## Local development

The supported packaging baseline is **Windows, Node.js 24, and PowerShell 7
(`pwsh`) with .NET cryptography available**. Validation is local only:
GitHub Actions are disabled and no workflow files or hosted CI are required.
Cross-platform packaging has not been established. After cloning:

```powershell
npm ci
npm run typecheck
npm run lint
npm test
npm run package
npm run test:browser
```

Deep Windows worktree paths can exceed Git's default path limit for the
authored sample's required private-resource filenames. Use per-command
`git -c core.longpaths=true ...`, not a machine-wide configuration change.
Native sample opening may require a short coordinator-owned test path.

`npm run check` runs typecheck, lint, unit tests, packaging/audits, packaged
browser tests and the local-only policy check. `npm run test:layouts` captures
the five documented sizes; `npm run benchmark` records raw local latency
samples. Run these against the same final package, not between repackages.
Use `npm run assets` for the original icon and 50/150/300 px logos.
`npm run check:release` runs the complete local sequence, including final
sample preparation/schema validation, screenshots, measurements and audit.
`npm run eslint` supplies the explicit certification-review lint entry point.
Sample regeneration intentionally updates tracked package/resources; commit
them together. The first schema check may fetch Microsoft's public schemas;
`npm run validate:sample -- --offline` uses the warmed local cache.
After committing a clean source baseline, `npm run seal -- <new-absolute-folder>`
copies the source archive, package, samples, assets and local evidence into a
write-once handoff folder and hashes every file. This detects later changes;
it is not a cryptographic signature or a WORM storage guarantee.

Package commands invoke
`pwsh -NoProfile -File scripts/package.ps1`. The wrapper isolates the visuals
tool's home/configuration in the worktree, generates a short-lived local
development certificate using .NET cryptography, and removes its PFX/password
files in cleanup. It does not install or trust the certificate in a machine
certificate store. This tooling workaround is not production signing or
Microsoft certification. Use the wrapper rather than a direct `pbiviz package`
command that might otherwise attempt certificate setup in the user's profile.

The repeatable package scripts pass `--all-locales --no-stats` to the official
tool. Keeping offline formatting cultures avoids the tools 7.2.1 locale-pruning
loader's ESM incompatibility; no dependency source is patched. Full dependency
notices are embedded into the packaged JavaScript resource after packaging.

Browser tests require the browsers expected by the existing Playwright setup.
`npm run certification` invokes the repository's package audit and validation;
the command's name does **not** mean Microsoft has certified the visual.
`npm run audit` checks dependency advisories. Record real results rather than
treating these documented commands as execution evidence.

The visual targets Power BI API **5.11.0**, as exported by SDK npm package
**powerbi-visuals-api 5.11.1** (the package patch version and API contract differ).
Development-tool dependency fixes
are narrowly scoped: Vitest **4.1.11**, a `qs` **6.16.0** override, and a
`sockjs`-scoped `uuid` **11.1.1** override. They address the build/test toolchain,
not the visual's counting semantics or runtime feature set. See the
[recorded validation results](docs/validation-results.md); rerun the audit
against the final lockfile and current advisories before release.
Package and browser checks are separate evidence.

The stable visual GUID is
`AtlynOverlapExplorerA83D5B49F72E4CA693D0C8260159BE42`; keep it stable for updates.
The original [SVG icon](assets/icon.svg) produces the required 20×20 PNG with
`node scripts\generate-icon.mjs`, using only Node built-ins.

## Review material

- [Semantics and boundary cases](docs/semantics.md)
- [Manual validation matrix](docs/manual-validation.md)
- [Certification and publication checklist](docs/release-review.md)
- [Comparative evidence and product gaps](docs/comparison.md)
- [Local performance and visual inspection](docs/performance-and-layout.md)
- [Current Microsoft submission requirements](docs/certification-requirements.md)
- [Draft listing and certification dossier](docs/submission-dossier.md)
- [License and provenance review](docs/licensing.md)
- [Third-party notices](THIRD-PARTY-NOTICES.md)
- [Synthetic CSVs and expected results](samples/README.md)
- [Self-contained offline PBIP sample](samples/offline-pbip/README.md)

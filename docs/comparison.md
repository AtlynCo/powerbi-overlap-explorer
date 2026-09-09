# Evidence-based comparison

Research date: **2026-09-09**. This is a source/documentation comparison, not a
head-to-head execution benchmark. No competitor visual was installed, executed,
timed, or tested in a native Power BI host. “Verified” below means the cited
publisher documentation, metadata, or public source was read; it does not mean
Microsoft certification or independently verified runtime performance.

## Scope and provenance

The direct comparator is **UpSet Plot, the UpSet.js Power BI integration**,
not merely an academic UpSet chart, a JavaScript demo, or an unrelated visual.
Its publisher's [integration page][u-integration] links its Power BI packages,
sample PBIX files, and [repository][u-repo]. The repository snapshot reviewed is
`2d1421718f792b8ec58dd448619c69d1504ec89c` (2025-10-04); its manifest declares
**UpSet Plot 2.0.1.0**, package `@upsetjs/powerbi_visuals` **2.0.1**, GUID
`upSetJS61F43BDFCA024B13B6AC5BA73C9427B2`, API **5.11.0**.
This identifies the source comparator; it does **not** establish which build
is currently distributed in Marketplace or what a downloaded preview contains.

Atlyn Overlap Explorer is an original implementation. UpSet.js implementation,
graphics, screenshots, and packages have not been incorporated into this work.
The Power BI integration's README describes three roles, but the reviewed
capabilities declare **four**; the current source is used for that distinction.
Its old email/XML submission instructions are not our submission procedure.

### Exact license evidence, not a permissive-license assumption

| Evidence | Observed declaration | Interpretation boundary |
| --- | --- | --- |
| UpSet Power BI [package.json][u-package], version 2.0.1 | `SEE LICENSE IN LICENSE.md`; dependency `@upsetjs/bundle: ~1.11.0` | Neither field says MIT, BSD, or Apache. |
| Integration [LICENSE.md][u-license] at the pinned revision | Copyright 2025 Samuel Gratzl; **GNU Affero General Public License, Version 3, 19 November 2007**, plus an introductory commercial-license offering/contact | Describe the actual AGPLv3 text and commercial alternative. Do not invent a proprietary license price or normalize this mixed declaration into an unsupported SPDX `-only`/`-or-later` conclusion. |
| Publisher's [integration documentation][u-integration] | Describes GNU AGPLv3 for private/academic purposes and directs commercial users to the author | This is the publisher's stated licensing approach, not a claim that AGPL itself prohibits commercial use. Legal compatibility requires owner/legal review. |
| npm [published bundle 1.11.0 metadata][u-bundle] | `SEE LICENSE IN LICENSE.md`; `gitHead` = `22c8c303fe4455b059940510bd4cb06d4211b033` | Published npm metadata, not an inspection of the Power BI package archive. |
| [License at the bundle's gitHead][u-bundle-license] | Copyright 2021 Samuel Gratzl; same AGPLv3 text and commercial-license introduction | Evidence for the corresponding source license; package archive contents and Marketplace acquisition terms were not independently inspected. |

For identifying that published npm artifact, the registry reports SHA-1 shasum
`124beb1b3be7c18a096846ab895f2776f43f6e4b` and integrity
`sha512-OX4MAYGMfHNaW0hVBjsm339T1ymXnOiubAVb09e+RRZBNkX5Og3wO/ONt3R2Uy+UB1Qstfazg9QrUdWos6VtQQ==`.
These are registry metadata, not locally computed download hashes. No commercial
license was purchased or accepted. Atlyn's own source/distribution license,
product terms, privacy policy, and price remain separate owner decisions;
the MIT licenses of Microsoft utility dependencies do not license Atlyn's code.

## Data contracts and semantics

**Atlyn:** two required categorical groupings, Entity ID and Set Name; zero or
one optional positive Highlight signal measure. One observation represents an
entity/set membership, with blank Set Name allowed to establish the universe.
Counts deduplicate entity/set observations and count distinct typed entity
keys, not measure magnitudes. A blank row coexisting with memberships does not
erase those memberships. There is no weighted/cardinality-expression mode.
See [counting semantics](semantics.md).

**UpSet Power BI:** the normal entity-input path expects one Elements grouping
identifying each element and **one membership field per set** in Sets. These
are Boolean/integer grouping-or-measure fields according to capabilities;
documentation describes truthy membership values. The reviewed model also
rejects false-like string values beginning with `f`; Boolean/0-or-1 fields are
the unambiguous comparison input. Numeric Attributes support intersection
boxplots in the documentation; source also supports categorical attributes.
The fourth role, **Cardinality Expression Measure**, activates a separate
expression/count path. Do not use that path as if it were our distinct-entity
contract, or assert its native member-selection equivalence without testing.
[Capabilities][u-capabilities], [model][u-model].

| Combination meaning | Atlyn | UpSet.js Power BI |
| --- | --- | --- |
| Members of exactly the indicated sets, excluding other retained sets | **Exact**, default | `distinctIntersection` option |
| Members of every indicated set, with other memberships unrestricted | **Inclusive** | `intersection`, source default |
| Members of at least one indicated set | Not implemented | `union` option |

UpSet.js explicitly documents all three [combination definitions][u-data];
the integration exposes them in its [formatting model][u-settings].
**Inclusive intersection is not union.** Do not compare default screenshots
without aligning modes. UpSet's empty-combination option is not proof of an
equivalent received-universe denominator or explicit zero-membership treatment.
Atlyn exactness is relative to retained sets after reduction, not every set
that may exist in the model.

### Native identity behavior

Atlyn collects actual entity-category identities from contributors, including
identities attached to duplicate membership observations. Any missing identity
or a combined selection exceeding **1,000 identities** refuses the whole
selection rather than sending a misleading subset. A combination is not a new
model category. Context menus act on a labeled representative entity, not a
whole intersection. Set-margin selection selects every member of that set,
not just its exclusive singleton. Details are searchable and paged, with at
most **200 entries per page**, independently of group-selection eligibility.
These are source contracts; final local proof and native-model validation are
separate evidence gates.

UpSet's entity-input [model][u-model] constructs a Power BI selection ID from
the Elements category at each row when interaction is allowed. Its
[interaction handler][u-handler] sends the selected combination's element IDs
to the host selection manager, clears an identical current selection, and uses
the first element for a context menu. External selection/highlight support is
also documented. This verifies entity-based selection design, not actual
behavior in a particular model, an unlimited selection guarantee, or parity
with Atlyn's explicit refusal contract.

## Quantified feature and workflow comparison

This table compares **12 defined capabilities**, without a summed score:
configuration and flexibility are valuable, not automatic disadvantages.
`Author-defined` means feasible through modeling/specification, not a tested
ready-made equivalent. `Not established` is not evidence of absence.

| # | Capability | Atlyn v1 source contract | Verified UpSet Power BI source/docs | Native Power BI matrix | Deneb / flexible specification |
| ---: | --- | --- | --- | --- | --- |
| 1 | Base binding shape | 2 required fields in long form | 1 Elements + one field per set | Rows, Columns, Values | Fields/measures in Values + named `dataset` in a specification |
| 2 | Intersection modes | 2: exact/inclusive | 3: distinct/intersection/union | Author-defined model/measures | Author-defined model/transforms/specification |
| 3 | Set retention | Default 6; hard maximum 10; size/key ranking | Source default limit 10; configurable order/limit; no tested hard-cap claim | Model/visual configuration | Specification/data dependent |
| 4 | Displayed combinations | Default Top 20; maximum 50; minimum entity count | Source default limit 20; degree range 1–5, ordering and empty-combination controls | Model/filter configuration | Specification configuration |
| 5 | Received universe / zero | Explicit; preserved when sets are omitted | Equivalent behavior not established | Author-defined measures/entity universe | Author-defined measures/entity universe |
| 6 | Contributor inspection | Search and pages of up to 200 entries | Equivalent inspector not established | Entity rows and hierarchy/drill facilities | Can be authored; specific inspector not evaluated |
| 7 | Native group selection | Entity IDs; all-or-nothing 1,000-ID cap | Sends underlying element IDs; first-element context menu | Native category/hierarchy selection | Resolvable data points; cross-filtering must be enabled/configured |
| 8 | Inbound highlights | Optional positive presence signal; distinct entity count | Documented highlight support | Native interaction configuration | Supporting fields and specification encodings |
| 9 | Attribute distributions | Not implemented | Numeric boxplots; categorical attributes in source | Measures/conditional formatting, not a built-in intersection boxplot | Flexible Vega/Vega-Lite marks |
| 10 | Arbitrary chart composition | Purpose-built overlap layout | Purpose-built UpSet with broader style options; sibling Venn/Euler integration documented | Native rows/columns/hierarchies | Custom Vega/Vega-Lite composition |
| 11 | Row/completeness contract | 30,000 processed snapshot rows; explicit segmentation, invalid/drop/omission notices | 30,000-row window declared; completeness/refusal equivalence not established | Query/model-dependent; no competitor scale measurement | Query/specification-dependent; no competitor scale measurement |
| 12 | Delivery/licensing evidence | Local candidate; no approval; owner legal/price decisions pending | Real Power BI integration and license evidence above; no current Marketplace certification claim | Built into Power BI; Power BI licensing applies | Real Power BI custom visual; chosen version, distribution and specification must be verified |

Sources for matrix: Microsoft [matrix documentation][matrix]. Sources for
Deneb: publisher [dataset][deneb-data] and [cross-filtering][deneb-selection]
documentation. Deneb passes rows at the grain of the fields/measures added to
Values. Its simple cross-filtering resolves marks back to those rows where
possible; aggregation or other transforms must preserve enough context.
The author controls selected-state styling. This is a material design issue
for computed intersection groups, not evidence that Deneb cannot support them.

For the **three-set customer fixture**, field-assignment counts are:

- Atlyn: **2 required** grouping assignments; **3** with Highlight signal.
- UpSet normal entity path: **4 required assignments** (Elements plus
  Atlas/Beacon/Cove membership fields); optional attributes/counts excluded.
- Native incidence matrix: **3 assignments** for Entity rows, Set columns,
  and a membership measure; this displays incidence, not automatically an
  intersection-frequency chart.
- Deneb: no single fair count; it depends on whether supplied data is raw
  membership, wide entity flags, or precomputed combination/member tables.

For UpSet, deriving one Boolean/0-or-1 field per set from the same long-form
fixture is a modeling/pivot step; preserve all ten entities, including C008
with all flags false. For a matrix or Deneb intersection-frequency design,
define exact/inclusive logic, universe retention, and host identity mapping
explicitly. These are workflow differences, **not measured clicks, completion
times, learning curves, usability advantages, or performance results**.

## Deterministic sample oracle

The following are expected results derived from the checked-in CSVs and
engine contract, also asserted in `tests/samples.test.ts`. Final local
unit and sample-schema/binding checks passed; see [validation](validation-results.md).
They remain distinct from native Power BI evidence.
Power BI may group duplicate source rows before delivery; received-row and
duplicate counters in a native host need not equal raw CSV statistics.

| Fixture | Source rows | Distinct entities | Distinct set sizes | Exact groups, including zero |
| --- | ---: | ---: | --- | ---: |
| Customer/product | 18 | 10 | Atlas 6; Beacon 5; Cove 4 | 8 |
| Feature adoption | 22 | 12 | Search 7; Share 6; Automate 5; Export 2 | 10 |

Customer/product with all three sets retained:

| Group | Exact count | Inclusive count |
| --- | ---: | ---: |
| Atlas | 2 | 6 |
| Beacon | 1 | 5 |
| Cove | 1 | 4 |
| Atlas + Beacon | 2 | 3 |
| Atlas + Cove | 1 | 2 |
| Beacon + Cove | 1 | 2 |
| Atlas + Beacon + Cove | 1 | 1 |
| None of the retained sets | 1 | Reported separately, not an inclusive intersection |

Exact counts sum to **10**. Inclusive nonempty counts sum to **23**, so their
sum is not a distinct-entity denominator. Atlas-only is **C002/C009**; exact
Atlas + Beacon is **C001/C010**; inclusive Atlas + Beacon adds **C004**.
With two retained sets, exact Atlas-only/Beacon-only/both/none become
**3/2/3/2** and the universe stays **10**. C005 joins C008 in zero.

Feature adoption's all-set exact counts are Search-only 2, Share-only 1,
Automate-only 1, Export-only 1, Search + Share 2, Search + Automate 1,
Share + Automate 1, Search + Share + Automate 1, all four 1, and zero 1.
With three retained sets, Export is omitted and zero becomes **2**; universe
remains **12**. Inclusive Search + Share is **4**:
U001/U004/U010/U012. See [sample documentation](../samples/README.md).

## Local benchmark and comparative-claim policy

| Evidence class | Status / permitted interpretation |
| --- | --- |
| Current source/documentation comparison | Established above, with explicit scope and unknowns |
| Atlyn deterministic final-package tests | **47 unit / 30 packaged-browser passes**, 20 sample definitions; final package hash and qualified scope in [validation](validation-results.md) and the release seal |
| Atlyn baseline/final packaged Chromium measurements and layout captures | **Completed locally**; raw p50/p95/max, all five sizes, inspected images and limits in [performance/layout](performance-and-layout.md); host mocks, not Desktop/service |
| Head-to-head native Power BI correctness/performance | **Not performed** for UpSet, matrix, or Deneb |
| Human task completion, comprehension, accessibility conformance | **Not measured** comparatively |

The final local benchmark record must identify input hashes, row/entity/set counts,
mode, Top/minimum, browser/OS/CPU/viewport, warmups/repetitions, metric
definition, failure counts, and source/package hashes. Separate synchronous
update return, completed render/paint, interaction latency, and memory metrics;
one cannot substitute for another. Include worst supported combinations and
rejected/partial states. A baseline/final Atlyn comparison is not a competitor
benchmark. A loopback host-mock trace does not measure Power BI query,
selection, or service rendering costs. Retain outliers and limitations.

**Positioning:** a bounded, long-form, distinct-entity overlap workflow with
explicit counting scope and selection safeguards. UpSet offers union and
attribute-distribution capabilities Atlyn does not; matrix and Deneb remain
valid choices for native tabular analysis and flexible authored graphics.
No “best in class,” “fastest,” “easiest,” or general superiority claim is
supported by this evidence.

[u-integration]: https://upset.js.org/integrations/powerbi/
[u-repo]: https://github.com/upsetjs/upsetjs_powerbi_visuals/tree/2d1421718f792b8ec58dd448619c69d1504ec89c
[u-package]: https://github.com/upsetjs/upsetjs_powerbi_visuals/blob/2d1421718f792b8ec58dd448619c69d1504ec89c/package.json
[u-license]: https://github.com/upsetjs/upsetjs_powerbi_visuals/blob/2d1421718f792b8ec58dd448619c69d1504ec89c/LICENSE.md
[u-bundle]: https://registry.npmjs.org/@upsetjs/bundle/1.11.0
[u-bundle-license]: https://github.com/upsetjs/upsetjs/blob/22c8c303fe4455b059940510bd4cb06d4211b033/LICENSE.md
[u-capabilities]: https://github.com/upsetjs/upsetjs_powerbi_visuals/blob/2d1421718f792b8ec58dd448619c69d1504ec89c/capabilities.json
[u-model]: https://github.com/upsetjs/upsetjs_powerbi_visuals/blob/2d1421718f792b8ec58dd448619c69d1504ec89c/src/utils/model.ts
[u-handler]: https://github.com/upsetjs/upsetjs_powerbi_visuals/blob/2d1421718f792b8ec58dd448619c69d1504ec89c/src/utils/handler.ts
[u-settings]: https://github.com/upsetjs/upsetjs_powerbi_visuals/blob/2d1421718f792b8ec58dd448619c69d1504ec89c/src/VisualFormattingSettingsModel.ts
[u-data]: https://upset.js.org/docs/data/
[matrix]: https://learn.microsoft.com/en-us/power-bi/visuals/power-bi-visualization-matrix-visual
[deneb-data]: https://deneb.guide/docs/dataset
[deneb-selection]: https://deneb.guide/docs/interactivity-selection

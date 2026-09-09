# Local performance and visual inspection

Recorded 2026-09-09 for package SHA-256
`ae2f1c09694fb5cade37bd1bbe30c18d212e8920f7f9a9cadd33a0234f9cebf0`.
This is a packaged Chromium **host-mock** experiment, not a native Power BI
benchmark, certification result or evidence of competitor superiority.

## Reproduction and scope

Run `npm run check`, then `npm run test:layouts` and `npm run benchmark`.
Do not repackage between those steps and sample embedding/sealing: package
ZIP metadata can change its hash. Fixtures live in `tests/datasets.mjs`;
the customer case loads the checked-in synthetic CSV. Benchmark JSON includes
dataset hashes, options, all raw samples, errors and attempted requests.

Environment: Windows 10.0.26200 x64; reported AMD EPYC 7763 64-Core Processor,
16 logical processors available; 63.95 GiB reported RAM; Node 24.17.0;
Chromium 153.0.8010.12 headless; 1280x620 viewport; reduced motion; one worker.
This is a **shared machine**, not dedicated benchmark hardware. Scheduling,
other processes, JIT and garbage collection affect distributions and maxima.

Each case has five warmups followed by 30 measured samples. Percentiles use
nearest rank. `updateReturn` measures synchronous `visual.update`, excluding
fixture DataView construction. `renderFrames` includes that update and two
animation frames. `selectionFrames` includes DOM click, contributor UI and
mock-host callbacks plus two frames. `scrollFrames` mutates an actual overflow
scroll offset and waits two frames. The latter measures neither physical
touch-gesture latency nor sustained FPS. No overflowing area means no scroll
measurement. Power BI query/filter/highlight/network latency is not included.

## Final measured distributions

Each metric cell is **p50 / p95 / maximum, milliseconds**; n = 30 per measured
metric. Maximum is observed, not a guaranteed upper bound.

| Fixture | Synchronous update | Update + frames | Click + frames | Scroll + frames |
| --- | --- | --- | --- | --- |
| Customer products: 18 rows, 10 entities | 3.6 / 4.7 / 4.9 | 30.3 / 31.9 / 32.3 | 33.1 / 34.1 / 34.7 | Not applicable |
| Dense exact: 10,001 rows, 2,000 entities, 10 sets, Top 50 | 28.9 / 42.3 / 46.3 | 37.5 / 56.4 / 58.0 | 28.1 / 33.7 / 33.8 | 33.0 / 34.7 / 34.9 |
| Bounded inclusive: 30,000 rows, 5,999 entities, 10 sets, Top 50 | 47.8 / 59.2 / 62.8 | 64.4 / 69.4 / 74.9 | 32.2 / 33.5 / 33.9 (refusal) | 32.6 / 33.6 / 33.6 |
| Native-shaped 700-identity selection: 700 rows/entities | 2.8 / 3.7 / 3.8 | 30.8 / 32.0 / 32.1 | 33.2 / 35.0 / 35.1 | Not applicable |

The inclusive clicked group exceeds the selection cap: its click metric
measures **all-or-nothing refusal and inspection**, not successful native
selection. The other fixtures' last selected identity counts are 1, 2 and 700.
No browser exceptions or attempted runtime requests were recorded.

The initial baseline update p95 was 2.5 / 36.5 / 90.2 / 2.9 ms for these four
cases. Final values are not uniformly better. Intermediate candidates ranged
from 58.8 to 109.8 ms for inclusive update p95, while final is 59.2 ms.
Raw baseline and candidate runs, including regressions, are preserved.
Different UI work and shared-machine variance preclude a causal speed claim;
there is no measured UpSet.js, Deneb or native Power BI timing comparison.

## Inspected screenshots and demonstrated layout changes

Actual generated PNGs were opened and visually inspected, not merely checked
for existence. Normal/dense fixtures were reviewed at 80x80, 258x198, 398x298,
1280x620 and 1366x768, together with two-axis scrolled views, HC, RTL, three
labeled local preview images, and a dense highlighted 20px text case.
The original 20px icon and generated 300px logo were also inspected.
All 20 final PNGs are byte-identical to the inspected pre-dossier candidate
PNGs; their final image hashes, inputs, settings and package hash are recorded
in the capture manifest. Final measurements ran at
2026-09-09T22:38:35.552Z through 22:38:50.961Z.

| Viewport | Initial baseline | Release-quality result |
| --- | --- | --- |
| 80x80 | Chart began more than 1,600px below the viewport | Honest enlargement message and received universe; no unusable miniature chart |
| 258x198 | Chart began at y=488.8px; visible area was prose | Chart begins at y=74.4px; bars and first set rows visible; two-axis scrolling required |
| 398x298 | Chart began at y=388.1px, below the viewport | Chart begins at y=74.4px; three sample set rows and five full initial bars visible |
| 1280x620 | Chart began at y=287.3px; sample overflowed vertically | Chart begins at y=90.8px; all sample set rows visible; dense ten-set default-text view fits vertically |
| 1366x768 | Dense chart extended below the viewport | All ten dense set rows fit; horizontal overflow remains for 50 combinations |

These measured placements compare this visual's own before/after packages,
not another vendor's visual. On the 258px-wide example, the chart starts
414.5px earlier. Full details are intentionally expandable instead of removed.

Inspection drove compact summaries, adaptable bar height, sticky set names,
visible combination codes, preserved row alignment, full-label diagnostics,
and count-width reservation. A dense 20px highlighted view exposed a squeezed
Inspect button: auxiliary legend sizing and nonshrinking controls corrected
it, with a packaged regression assertion. Large text may still require
vertical scrolling; counts and controls are not silently clipped to avoid it.

## Remaining gaps and limits

Long dense names are intentionally ellipsized in margins; full labels/source
values are in Data & definitions and accessible descriptions. At 258x198 only
part of the matrix fits; when scrolled down, bar headers can be offscreen.
Keyboard focus, tooltips and descriptive labels provide combination context,
but this is not equivalent to a large desktop canvas. Some long combination
codes are clipped visually; full combination labels remain available.

The three 1366x768 preview images visibly say **LOCAL PACKAGED PREVIEW / HOST
MOCK - not Power BI Desktop or Service validation**. They are accurate local
UI assets, not fabricated native screenshots. The coordinator must obtain
acceptable native-host submission screenshots, a real PBIX, export evidence
and accessibility/tenant results. No best-in-class or certification claim is
supported by these local experiments.

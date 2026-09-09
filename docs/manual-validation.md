# Manual validation matrix

**Status: not performed in Power BI Desktop or the service.** This is a
review plan, not a passed test report. Automated DOM/unit/package checks
cannot establish native model identity behavior, actual service operation,
screen-reader conformance, or exports. Record tester, date, Desktop/service
version, tenant settings, model, package hash, and evidence for each run.

| Area | Procedure | Expected behavior | Status |
| --- | --- | --- | --- |
| Installation | Import local version 1.0.0.0 `.pbiviz` in a tenant allowing uncertified visuals | Original icon; no unexpected permission request | Not run |
| Binding | Leave wells empty, then bind only Entity ID, then both; try replacing fields | Helpful binding message until both groupings are present; valid render afterward | Not run |
| Sample baseline | Import customer CSV as text and bind both fields | Universe 10; sizes Atlas 6, Beacon 5, Cove 4; exact results in sample README | Not run |
| Explicit zero | Include blank-set rows, then remove the sole C008 observation | Zero projected membership count 1 then 0; universe 10 then 9 | Not run |
| Coexisting blank | Keep C009's Atlas and blank-set rows | C009 remains an Atlas member; no extra entity | Not run |
| Duplicates | Keep/remove the duplicate C001–Atlas source row | Same entity counts, although Power BI may aggregate duplicate source rows before delivery | Not run |
| Types and labels | Use model-appropriate date, numeric, text, and Boolean grouping fields; synthetic long/blank values | Typed handling where delivered; no merged keys from formatting; invalid warnings | Not run |
| Retained sets | Set maximum sets to 2 in customer sample | Prominent omission warning; universe stays 10; projected exact counts 3/3/2/2 | Not run |
| Inclusive | Enable inclusive with three sets | Seven nonempty groups; Atlas + Beacon = 3; zero remains separately 1; totals not described as unique universe | Not run |
| Display filters | Raise minimum, set Top = 1, then restore | Counts/denominator preserved; hidden-combination count changes; no Other union | Not run |
| Native selection | Add a native table of Entity ID and a native set-size chart; select each group | All represented entity identities passed; observe actual host filtering, including duplicate-row identities | Not run |
| Add/clear selection | Ctrl/Cmd-select multiple groups, Escape, Clear, select from another visual | Consistent host selection and local state; no stale state after filters | Not run |
| Selection bounds | Use a model delivering >1,000 native identities for a group and missing-identity cases where feasible | Entire request refused; no partial native selection | Not run |
| Details | Use >200 contributors; open/close details, select one entity | Explicit first-200/total disclosure; individual identity selection; focus restored on close | Not run |
| Tooltip/context | Hover, right-click, and use Shift+F10 | Group tooltip; native menu labeled as one representative entity, never an intersection identity | Not run |
| Native highlight | Bind positive COUNTROWS signal, add native chart, configure Highlight | Distinct highlighted entities, not signal sum; group totals remain base counts | Not run |
| Highlight vs filter | Switch source interaction to Filter; clear selection | Filter can change universe and memberships; no claim of unchanged denominator | Not run |
| Paging | Deliver >10,000 categorical rows, click Load more repeatedly | Explicit user requests; each aggregate replaces analysis; unknown unloaded total while segmented | Not run |
| Row cap/refusal | Deliver >30,000 rows and exercise host refusal if possible | At most 30,000 processed; warning; no automatic unbounded requests or completeness claim | Not run |
| Resize and scrolling | Narrow/short visual, scroll chart/details, resize repeatedly | Alignment and usable controls; no animation; labels bounded | Not run |
| Keyboard | Tab, arrows, Home/End, Enter/Space, Escape, context-menu key | Visible focus, appropriate movement and selection, no focus trap | Not run |
| Assistive technology | Test Windows high contrast and supported screen reader, including selection/warnings | Readable host colors, useful names/status, no color-only meaning | Not run |
| Language/RTL | English, French, then an RTL host locale | English/French strings and locale numbers; English fallback elsewhere; mirrored navigation | Not run |
| Service | Publish only after authorization to a controlled workspace; test same interactions | No Desktop-only assumptions; behavior recorded, not presumed | Not run |
| Export | Export supported PDF/PowerPoint/image paths at several sizes | Record viewport clipping; do not claim offscreen content is fully exported | Not run |
| Offline sample | Open PBIP with supported Desktop/TMDL/PBIR version, refresh with network disconnected | Inline tables refresh without file paths or credentials; blank page opens; visual added manually | Not run |
| Lifecycle | Navigate pages/bookmarks, change filters, remove/re-add visual | No stale selection, uncaught error, detached UI, or incorrect accumulated rows | Not run |

Do not publish real data in screenshots or issue attachments. Use only the
synthetic samples or an equivalently sanitized fixture. A failure must retain
its reproduction steps and remain open; do not change a status to pass based
solely on a mocked host or an automated packaging audit.

# Counting semantics

## Scope

One categorical data view supplies exactly two grouping columns: Entity ID and
Set Name, plus at most one optional numeric Highlight signal measure. Both
groupings are required at runtime. Unequal column lengths, multiple bindings,
or unexpected shapes produce a binding/shape message, not inferred data.

The visual processes at most the first 30,000 rows of the current aggregate
snapshot. It does not merge independent deliveries locally. `metadata.segment`
means more may exist; the visual cannot determine the unloaded row or entity
count. Explicit **Load more** requests host aggregation using
`fetchMoreData(true)`. Every accepted aggregate replaces the previous analysis.
An incremental-only segment is rejected rather than misrepresented as the
whole universe.

## Typed keys and valid observations

Valid nonblank primitives are strings of at most 256 characters, finite
numbers, booleans, and dates with a valid time value. Keys are type-prefixed
raw values. Strings preserve case and nonblank leading/trailing whitespace;
formatting does not define equality. Dates key by ISO instant. Like ordinary
JavaScript numbers, negative and positive zero share a numeric key.

Blank Set Name is a valid universe-only observation; blank Entity ID is
invalid. Even whitespace-only strings must respect the 256-character limit.
Sparse/missing input entries are invalid, not uncounted gaps.
Raw overlong strings are rejected instead of truncated into another
key. Formatted labels may be shortened to the 256-character display bound.
An unsupported Set Name invalidates the entire row, not just that membership.

For each valid observation:

1. Establish its entity in the received universe.
2. Retain all available host entity category identities, including those from
   duplicate observations. Remember if any represented row lacks identity.
3. Mark the entity highlighted if any received native highlight is finite and
   strictly positive.
4. Add its nonblank set membership once. Repeated entity/set pairs do not
   increase set or combination counts.

A blank-set row does not override a nonblank membership for the same entity.
An entity seen only in invalid rows or in no rows is not in the universe.

## Retention and projection

Count each distinct member once in each observed set. Sort sets by that size
descending, then by ordinal typed raw key ascending. Keep the configured
number (default 6, maximum 10). Recalculate this ranking after filters or new
aggregate snapshots; the retained set list is not permanently fixed.

Project **all** received valid entities onto the retained sets. An entity
belonging only to omitted sets becomes zero in this projection; it is not
discarded. The denominator and zero count therefore remain meaningful when
the visual discloses set reduction.

**Example:** Atlas has C001/C002; Beacon has C001/C003; Cove has C003.
C004 has a blank-set observation. With maximum sets = 2, Atlas and Beacon
are retained. The projected universe is still 4: Atlas only = 1,
Beacon only = 1, Atlas + Beacon = 1, none = 1. C003 is Beacon only
**among retained sets**, although it also belongs to omitted Cove.

## Combination modes

### Exact

An entity contributes to precisely one observed membership mask, including
the zero mask. Included dots mean membership; unmarked retained sets mean
nonmembership. These buckets partition the received universe **before**
minimum-count and Top filters. Exactness is not asserted for omitted sets.

### Inclusive

For each observed nonempty exact mask, enumerate its nonempty subsets. Add
its entity count and highlighted-entity count to each subset. There are at
most 1,023 distinct nonempty masks with 10 retained sets; no unbounded
combination generation is needed. No empty inclusive intersection is generated.

An entity belonging to Atlas, Beacon, and Cove contributes to all seven
nonempty subsets. Individual bar shares use the same received-universe
denominator, but summed shares can exceed 100%. Zero projected memberships
are reported separately, not included in the inclusive sum.

### Display reduction

Remove candidates below Minimum entities, rank by count descending with mask
ascending as the deterministic tie-break, then take Top combinations.
Hidden-combination count includes observed candidates excluded by either
filter. It is **not** a hidden distinct-entity count. No Other bucket is
calculated. In exact mode the sum of visible bars may be below the universe;
in inclusive mode even all bars are not a partition.

## Native interactions are not new model categories

A combination is a computed group, not a Power BI model identity. Selection
collects every represented entity category identity from contributing rows.
Even duplicate memberships can carry different host identities.

If an entity has any missing represented identity, or if the deduplicated
identity set exceeds 1,000, the selection is refused without sending a subset.
The cap applies to identities, not entity count, and includes existing
identities for additive selection. Detail display is independently capped at
200 entities per page, with search across all received contributors; this is
not a group-selection approximation. Pending native requests cannot race past
the additive cap; a clear requested while busy runs after the pending request.
Destroyed or rebound instances do not dispatch stale queued selections.

Set-margin selection collects all members of that set in both modes. It does
not mean an exclusive singleton intersection. A partially selected group has a
mixed accessible state, not a false full-selection state. Inspection can be
opened independently of selection, including when a whole group exceeds the cap.

Tooltips describe the full group. Native context menus act on the first
available representative identity and label the represented entity. They do
not imply that drill-through, include/exclude, or other native actions target
the whole computed intersection.

## Highlight presence, not weighted counting

The optional signal enables the host to deliver a categorical highlights
array. Only positive finite highlighted values contribute presence.
`COUNTROWS('Memberships')` is suitable because its nonblank highlighted values
are positive. A signed balance or net change is not a reliable presence signal.

Counts never sum base or highlighted signal magnitudes. A repeated entity
with highlighted values 2 and 7 contributes one highlighted entity, not 9.
Changing an interaction from Highlight to Filter changes delivered rows and
can change memberships, ranking, and denominator instead of merely highlighting.

## Completeness language

- **Segment present:** current delivery is incomplete, unloaded total unknown.
- **Invalid rows:** valid-row counts only; never silently describe all rows as
  completely analyzed.
- **Dropped rows:** at-cap analysis only; display the bound and incompleteness.
- **No segment, no invalid/dropped rows:** current host snapshot was processed,
  not proof of full-source coverage or correctness of upstream modeling.
- **Omitted sets:** a separate, prominent semantic limitation even when every
  delivered row was valid and processed.

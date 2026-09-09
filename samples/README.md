# Synthetic membership samples

All records and labels are fictional. These are sanitized review fixtures, not
an anonymization of real customer or usage data. CSVs are UTF-8 with a header;
import Entity ID, Set Name, and the third column as **Text**. Blank Set Name
cells intentionally represent universe-only observations. Do not remove them
as “bad data.” No file contains a native Power BI selection identity; the host
creates identities after loading and binding model columns.

## Customer/product

`customer-product.csv` has 18 source rows, 10 entities, and three sets.
C001–Atlas is duplicated deliberately. C009 has both Atlas and a blank-set
row, demonstrating that the blank row does not erase membership.

Expected results with maximum sets ≥ 3, minimum 1, Top ≥ 8:

| Retained set | Distinct size |
| --- | ---: |
| Atlas | 6 |
| Beacon | 5 |
| Cove | 4 |

| Exact combination | Count | Contributors |
| --- | ---: | --- |
| Atlas only | 2 | C002, C009 |
| Beacon only | 1 | C007 |
| Cove only | 1 | C005 |
| Atlas + Beacon only | 2 | C001, C010 |
| Atlas + Cove only | 1 | C006 |
| Beacon + Cove only | 1 | C003 |
| Atlas + Beacon + Cove | 1 | C004 |
| No retained memberships | 1 | C008 |

Inclusive counts are Atlas 6, Beacon 5, Cove 4, Atlas + Beacon 3,
Atlas + Cove 2, Beacon + Cove 2, all three 1. Those seven bar counts sum to
23, not the 10-entity universe. Zero remains separately 1.

With **maximum sets = 2**, retain Atlas and Beacon. Exact results become
Atlas only 3 (C002/C006/C009), Beacon only 2 (C003/C007),
Atlas + Beacon 3 (C001/C004/C010), none 2 (C005/C008).
The denominator remains 10 and the omission warning must be visible.

Power BI can group duplicate source rows before delivering categories, so the
visual's received-row and duplicate counters need not equal CSV source-row
statistics. `[Highlight signal] = COUNTROWS('Memberships')` may be 2 for a
duplicate pair, but entity counting remains distinct.

## Feature adoption

`feature-adoption.csv` has 22 source rows, 12 entities, and four sets.
U009–Search is repeated; U008 is universe-only. Cohort is a synthetic
attribute for a native table/chart or slicer, **not a third grouping well**.

With all four sets retained:

| Set | Distinct size |
| --- | ---: |
| Search | 7 |
| Share | 6 |
| Automate | 5 |
| Export | 2 |

| Exact combination | Count |
| --- | ---: |
| Search only | 2 |
| Share only | 1 |
| Automate only | 1 |
| Export only | 1 |
| Search + Share only | 2 |
| Search + Automate only | 1 |
| Share + Automate only | 1 |
| Search + Share + Automate only | 1 |
| All four | 1 |
| No retained memberships | 1 |

At maximum sets = 3, Export is omitted. U011 joins U008 in the zero
projection; U012 joins U004 in Search + Share + Automate. Universe stays 12.
In inclusive mode, Search + Share includes U001/U004/U010/U012 (count 4).

## Ways to load

- **CSV:** Desktop → Get data → Text/CSV → select one file → Transform data →
  set all columns to Text → name the customer query `Memberships` or the
  feature query `FeatureAdoption` → Close & Apply.
- **Offline project source:** see [offline-pbip/README.md](offline-pbip/README.md).
  It carries the same records in inline M tables, avoiding machine-specific
  CSV paths and requiring no source credentials.

Then import the actual locally built custom visual, bind the first two
columns, and optionally bind a positive COUNTROWS measure. Native
cross-highlighting, selection identities, and export behavior require manual
Power BI validation; the CSVs alone cannot demonstrate those host behaviors.

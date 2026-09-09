# Offline PBIP source starter

This is a self-contained **source starter**, not a fake PBIX and not a
completed custom-visual report. It contains:

- `OverlapSample.pbip`: the project entry point.
- `OverlapSample.SemanticModel`: a TMDL import model containing `Memberships`
  and `FeatureAdoption`, using inline M `#table` data equivalent to the CSVs.
- `OverlapSample.Report`: a PBIR definition linked to that local semantic
  model, with one deliberately **blank** page named “Add Overlap Explorer.”

No remote connection, account/tenant ID, credential, machine-specific path,
theme download, or cached model is included. JSON `$schema` URLs identify
file formats for editor validation, not refresh data sources. The schema's
relative model-reference path uses `/` as required by the PBIR specification;
Windows shell paths in the instructions use `\`.

## Honest validation status

The source follows Microsoft's published PBIP, PBISM, PBIR, and TMDL
structures. On 2026-09-09, all seven JSON source files passed validation with
the already-installed Ajv against their public Microsoft schemas. The inline
table records were checked for exact parity with both CSVs, and the documented
entity/set/exact-combination counts were independently calculated.

**Opening, TMDL parsing, model refresh, and saving in actual Power BI Desktop
have not been performed.** Schema/syntax checks do not prove host compatibility.
Use a current Desktop version supporting PBIP, TMDL, and PBIR;
enable the corresponding preview options if your version requires them.
Do not present this scaffold as a validated packaged demonstration.

The private custom visual binary, resource registration, field queries, native
identities, and visual container bindings are intentionally not fabricated.
Desktop must author them after importing the real `.pbiviz`.

## Open and complete manually

1. Build/obtain the actual repository package using the root README. Keep the
   package local; there is no AppSource visual to download.
2. Open `OverlapSample.pbip` in a supported Power BI Desktop installation.
   The project references `OverlapSample.Report`, which references the sibling
   `OverlapSample.SemanticModel`.
3. **Refresh** the model. There is no `cache.abf`, so the first open can have
   definitions but no loaded data until refresh. Both tables are inline and
   need no data-source credentials.
4. On the blank page, select **Import a visual from a file** and choose the
   newly built `.pbiviz`. Add an instance to the page.
5. Bind:

   | Well | Customer/product model field |
   | --- | --- |
   | Entity ID | `Memberships[Entity ID]` |
   | Set Name | `Memberships[Set Name]` |
   | Highlight signal (optional) | `Memberships[Highlight signal]` |

6. Set maximum retained sets to 3, Top to 20, minimum to 1, inclusive off.
   Expect universe 10, sizes Atlas 6 / Beacon 5 / Cove 4, and zero 1.
   The [sample guide](../README.md) lists every exact/inclusive count.
7. Add a native table showing `Memberships[Entity ID]` and a native chart
   showing `Memberships[Segment]` with `[Highlight signal]`. Configure the
   chart's interaction with the explorer as **Highlight**, where supported.
   Inspect actual behavior: a mock cannot prove the host's category identities.
8. For a second page/example, bind `FeatureAdoption[Entity ID]`,
   `FeatureAdoption[Set Name]`, and
   `FeatureAdoption[Feature highlight signal]`. Retain 4 sets to include
   Export. Use `Cohort` only in a separate native visual/filter.
9. Save the completed project in Desktop. It may add custom-visual resources,
   bindings, local cache/settings, and version upgrades. Review generated
   files for data and machine-specific information before sharing.

`[Distinct entities]` and `[Feature distinct entities]` are optional native-card
sanity checks. They are not weights for the explorer. The model has no
relationships between these independent fixtures.

## If your Desktop rejects the source

Do not rename a JSON file to `.pbix` or manufacture a visual query to make the
directory appear complete. Record the Desktop version and error for review.
As a documented fallback, start a new Desktop report and import the two CSVs,
or create blank Power Query queries and copy the **M expression under
`source =`** from each table's TMDL file (omit TMDL metadata and indentation).
Name the queries as above, set text types, and add the COUNTROWS measures
shown in the TMDL files. Then import and bind the real custom visual manually.

## Format references

Source structure was checked against these public specifications:

- [PBIP project overview](https://learn.microsoft.com/power-bi/developer/projects/projects-overview)
- [Semantic model / TMDL folder](https://learn.microsoft.com/power-bi/developer/projects/projects-dataset)
- [Report / PBIR folder](https://learn.microsoft.com/power-bi/developer/projects/projects-report)
- [TMDL language and folder structure](https://learn.microsoft.com/analysis-services/tmdl/tmdl-overview)

Each JSON file declares its specific public Microsoft schema. The report has
no `visuals` directory because no visual has yet been added. There is no
Fabric deployment claim; deployment would require owner authorization and
appropriate real workspace references.

# Licensing and provenance review

## Owner source license: unresolved

The owner has not selected a license for this visual's original source,
documentation, samples, or artwork. This work does not choose one on the
owner's behalf. A private npm package flag is not a license, and the presence
of permissively licensed dependencies does not license this repository.

Before distribution, obtain an owner-approved decision covering the intended
source and binary distribution. Any commercial terms, end-user terms,
support promises, or public privacy statement require separate owner review.
Nothing here invents those terms or provides legal advice.

## Original work

- Entity counting, membership-mask enumeration, ranking/projection, and
  bar/dot layout are implemented directly for this visual.
- There is no UpSet package dependency or copied UpSet implementation,
  dataset, artwork, branding, or stylesheet. The general idea of a set
  intersection matrix is not a claim of affiliation with another project.
- `assets/icon.svg` is original geometric artwork. The matching 20×20
  `assets/icon.png` is deterministically rasterized by
  `scripts/generate-icon.mjs` using Node built-ins; no external icon, font,
  rasterizer, or image service is used.
- The customer/product and feature/adoption samples are entirely fictional
  fixtures authored here. They contain no production records, personal
  names, real customer identifiers, credentials, or external data connections.
- The authored PBIP uses documented Microsoft file formats and inline M
  tables, with original bound pages and this visual's exact package. It does
  not contain someone else's report or claim to be a native-validated PBIX.

## Dependencies

[THIRD-PARTY-NOTICES.md](../THIRD-PARTY-NOTICES.md) records the installed direct
dependencies and relevant runtime utility licenses. Version provenance comes
from `package.json`, `package-lock.json`, and installed package metadata.
Preserve the upstream notices for distributed portions of dependencies.

This is a reviewable inventory, not a legal clearance or exhaustive
transitive software bill of materials. Before release:

1. Reconcile the lockfile, actual production bundle, and all included
   third-party code/assets. Development tools may have dependencies and notices
   beyond the direct-dependency list.
2. Verify upstream license files and any changed versions or overrides.
3. Ensure the final archive carries all required notices. A notice only in
   this repository may not cover a separately distributed binary artifact.
4. Review redistribution of development tools separately if shipping them.
   JSZip offers MIT or GPL-3.0-or-later upstream; identify the relied-upon
   alternative in the release's own review rather than mislabeling its terms.
5. Resolve the owner's source license and public-policy documentation
   blockers. Existing Atlyn support/contact metadata is confirmed; checking
   responsiveness is a release-readiness task, not a missing license choice.

Microsoft, Power BI, and third-party package names identify dependencies or
platforms; no endorsement, partnership, or certification is asserted.

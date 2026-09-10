# Licensing and provenance review

## Current first-party license declaration

Checked **2026-09-10** on the current source and fetched `origin/main`:
there is **no first-party LICENSE/LICENCE file** and no `license` field in
`package.json`. **SPDX identifier: not declared. First-party terms text:
not present in the repository.** Do not label this MIT, proprietary, or
`UNLICENSED` as though that identifier were declared. The `private: true`
npm flag and dependency licenses do not supply a first-party license.

The owner approved acquisition through existing Atlyn subscriptions with
an **ungated runtime and free shared viewing**, without paid-author identity
enforcement. That approved operating model does not add or relicense source
terms. No runtime licensing integration remains to implement.

Use the owner's existing storefront/legal documents for publication terms
and disclosures; do not invent prices, EULA clauses, support promises or a
public privacy statement. See [acquisition and runtime](acquisition-and-runtime.md).

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
5. Record the owner's applicable existing terms and public-policy documents
   for the publication handoff, without inventing a source license or runtime
   gate. Existing Atlyn support/contact metadata is confirmed; checking
   responsiveness remains a release-readiness task.

Microsoft, Power BI, and third-party package names identify dependencies or
platforms; no endorsement, partnership, or certification is asserted.

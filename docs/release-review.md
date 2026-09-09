# Release and certification review

## Current decision

**Not ready for public distribution or certification submission.** No
certification approval, marketplace acceptance, legal approval, or Power BI
host validation is claimed. Version `1.0.0.0` and a stable GUID are technical
metadata, not evidence of any approval.

The `certification` npm script is a local audit workflow. Passing it is
necessary evidence for review, not Microsoft certification.

## Confirmed metadata

The coordinator verified these existing Atlyn metadata values, reflected in
`pbiviz.json`: author **Atlyn**, contact **atlyn.help@gmail.com**, support
**https://www.atlynco.com/docs/faq**. SDK npm package **5.11.1** exports the
Power BI API contract **5.11.0**, which the manifest and built package target.
The contact details are not
invented placeholders or an unresolved choice of public support channel.
The owner must still check support-page availability and contact responsiveness
before publication. The private repository issue tracker is supplementary
contributor support, not the public channel.

## Publication blockers

- [ ] Owner chooses and approves a source/distribution license. Do not assume
  the Microsoft utility dependencies' MIT license licenses this repository.
- [ ] Owner approves actual product terms and public privacy/support
  documentation, if required for the chosen distribution route. No invented
  EULA, pricing, SLA, warranty, refund, or data-processing commitments.
- [ ] Review the actual `pbiviz.json` author, support, repository, version, and
  asset fields against the confirmed details above and verify the support
  page/contact work; a confirmed address alone does not establish responsiveness.
- [ ] Complete [manual Desktop/service/model/identity/accessibility/export
  validation](manual-validation.md) and record actual evidence.
- [ ] Open and refresh the offline PBIP in a supported Desktop version, import
  the actual built package, bind the fields manually, and save a real working
  demonstration. The provided blank-report scaffold is not that completed demo.

## Engineering evidence to collect

Initial automated outcomes are recorded in [validation results](validation-results.md).
Keep the release-specific checklist below: local checks do not replace a new
release review or the manual-host requirements.

- [ ] Pin and retain `package-lock.json`; record Node, npm, PowerShell, SDK API,
  and visuals-tools versions. Use the Windows / Node 24 / PowerShell 7
  packaging baseline (`windows-latest` in CI) with .NET cryptography available.
  Run a clean locked dependency restore.
- [ ] Record typecheck, lint, unit, browser, package-audit, and dependency-audit
  results. Separate warnings, accepted residual risk, and failing requirements.
  The coordinator reported zero audit vulnerabilities after the narrow
  development-tool fixes (Vitest 4.1.11, qs 6.16.0, sockjs-scoped uuid 11.1.1).
  This is not a package/browser test result or a permanent clean-audit guarantee.
- [ ] Inspect the final `.pbiviz` archive, version/GUID, capabilities, icon,
  string resources, formatting controls, source map/debug exposure, and
  third-party notices actually shipped in the package. Include full Microsoft
  MIT utility notices and embedded Globalize/Globalize Cultures attribution
  and MIT text; an omitted external Terser license file does not satisfy this.
- [ ] Verify `scripts/package.ps1` isolates development certificate generation,
  does not install/trust a certificate, and cleans up its PFX/password files.
  Do not present the development certificate as production signing.
- [ ] Confirm no external JS, remote font/image, telemetry, network endpoint,
  storage, dynamic-code execution, or unexpected privilege has entered the
  runtime bundle. This is an implementation review, not a blanket compliance
  claim about the host or toolchain.
- [ ] Verify caps and adversarial inputs: 30,000 rows, 10 sets, 1,023 nonempty
  masks, 1,000 selection identities, 200 details, and 256-character raw strings.
- [ ] Verify aggregate snapshots replace prior analysis and no hidden
  pagination loop or unbounded local append exists.
- [ ] Verify every invalid/dropped/segmented state discloses limited data;
  every set reduction discloses retained-set exactness.
- [ ] Verify exact/inclusive semantics, blank-set universe rows, duplicate
  identity retention, positive native highlight presence, and all-or-nothing
  selection with a real model.
- [ ] Review original icon/source provenance and all runtime dependency
  licenses/notices; retain the dependency inventory with the release.
- [ ] Record package SHA-256, source revision, evidence locations, reviewer,
  date, and any remaining limitations. Do not populate fabricated values.

## Submission-specific work

- [ ] Re-read current Microsoft
  [custom visual certification requirements](https://learn.microsoft.com/power-bi/developer/visuals/power-bi-custom-visuals-certified)
  and [AppSource publication guidance](https://learn.microsoft.com/power-bi/developer/visuals/office-store).
  Requirements and supported host versions can change.
- [ ] Establish the authorized publisher/account and distribution route.
  Publication or submission requires a separate owner instruction.
- [ ] Prepare accurate descriptions, screenshots, support/privacy links,
  licensing information, test instructions, and a genuinely working sample.
  Avoid promising complete-universe counts, unlimited sets/data, arbitrary
  intersection identities, or full-scroll-content exports.
- [ ] Use the actual current submission checklist and required artifact
  formats. A `.pbip` source starter is not automatically a substitute for any
  required packaged demonstration.
- [ ] Submit only after blockers are resolved; retain the resulting Microsoft
  review decision. Never display a certification claim or badge before approval.

No external submission or publication is performed by this repository's
documentation or local package commands.

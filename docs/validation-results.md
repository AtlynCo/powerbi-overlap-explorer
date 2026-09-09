# Initial implementation validation

Recorded 2026-09-09 for bounded v1; these are local engineering results, not
Microsoft certification or a real Power BI host acceptance result.

## Environment and commands

Windows, Node.js 24.17.0, npm 11.13.0, PowerShell 7, TypeScript 5.9.3,
visuals-tools 7.2.1, SDK npm package 5.11.1 / exported API contract 5.11.0.

| Command / check | Result |
| --- | --- |
| `npm run typecheck` | Strict source and typed unit fixtures pass |
| `npm run lint` | TypeScript rules and Microsoft visual rules pass |
| `npm test` | 29 tests pass, including exhaustive mask oracles and both supplied CSVs |
| `npm run certification` | Official package audit reports no external requests; archive/metadata/privileges/icon/locales/notices assertions pass |
| `npm run test:browser` | 13 real Chromium tests pass against JavaScript/CSS extracted from the actual `.pbiviz` |
| `npm run audit` | Zero dependency vulnerabilities at time of validation |
| Local certificate cleanup | No PFX or passphrase remains in the isolated package certificate folder |

The browser suite covers bar/dot row alignment, host-native selection and
representative context menus, tooltips, duplicate identity retention,
cross-highlights, callback selection changes, exact/inclusive counts,
set/min/top reduction, aggregate snapshots and reset, fetch refusal,
1,000-identity all-or-nothing selection and additive bound, 200-contributor
detail bound, 30,000-row truncation, read-only host mode, high contrast, RTL,
French strings, narrow scrolling, keyboard navigation, host selection
rejection, unsafe labels/colors, resize, empty/invalid bindings and destroy.
Network requests are blocked and asserted absent in representative bundle tests.

`dist\artifact.sha256` records the SHA-256 of the **actual retained package**;
repackaging changes ZIP metadata and can change this hash. The final handoff
records the corresponding absolute package path and source commit. Binaries,
browser outputs and temporary tooling files are ignored; source and lockfile
are committed. CI builds and retains its own private package artifact.

## Tooling findings resolved or disclosed

- Tools 7.2.1's default locale-pruning loader fails on formattingutils 7 ESM.
  The supported `--all-locales` option works, retains offline cultures, and is
  part of every package script. No `node_modules` code is patched.
- The generated SDK plugin allows optional constructor options. The visual
  explicitly rejects missing options rather than weakening strict typing.
- Tools resolves a development certificate even while packaging. The wrapper
  creates an in-memory .NET certificate, exports only into ignored local
  tool-home, and deletes its PFX/password afterward; no certificate-store or
  trust operation is invoked by the wrapper.
- The tool emits a Node `DEP0187` warning for its own `fs.existsSync` argument
  handling, and lists nine optional visual features. Neither prevents the
  package, SDK audit or browser tests. Optional features are not advertised.
- Original installed test-tool versions had advisories. Vitest 4.1.11 and
  narrowly scoped `qs` 6.16.0 / `sockjs` -> `uuid` 11.1.1 fixes produce a clean
  audit; package and browser checks pass with this resolved dependency graph.
- The SDK npm version 5.11.1 exports API contract 5.11.0. Both source manifest
  and packaged metadata explicitly use the exported contract.
- Full MIT/ISC and embedded Globalize notices are included in the package's
  JavaScript resource, including any emitted minifier notices.

## Not performed

Actual Desktop/service import, semantic-model native identity/filter behavior,
cross-highlight interactions with other real visuals, screen-reader use in
the Power BI frame, PBIP/TMDL open/refresh/save, PDF/PowerPoint/image export,
and tenant-policy behavior remain **unperformed**. Browser host mocks cannot
establish these outcomes. The offline project has a blank report page that
requires manual package import and field binding.

Source/product licensing, owner-approved public policies, support
responsiveness, publication account/assets and Microsoft review remain owner
steps. Nothing has been submitted to Partner Center/AppSource or publicly
released. See [manual validation](manual-validation.md) and
[release review](release-review.md).

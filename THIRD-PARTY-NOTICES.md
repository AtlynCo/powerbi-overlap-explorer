# Third-party notices

Inventory based on the pinned package manifest and installed package metadata.
**This document does not license Atlyn Overlap Explorer's original source.**
The owner has not selected that source license. See
[license review](docs/licensing.md).

## Direct runtime dependencies and relevant transitive packages

| Package | Version reviewed | Upstream license | Role |
| --- | --- | --- | --- |
| powerbi-visuals-utils-formattingmodel | 7.1.0 | MIT | Formatting pane model/service |
| powerbi-visuals-utils-formattingutils | 7.0.0 | MIT | Host-aware value formatting |
| powerbi-visuals-utils-dataviewutils | 7.0.0 | MIT | Formatting utility dependency |
| powerbi-visuals-utils-typeutils | 7.0.0 | MIT | Formatting utility dependency |
| Globalize and Globalize Cultures | Embedded in formattingutils 7.0.0 | MIT alternative; embedded headers also offer GPL Version 2 | Number/date formatting and culture data |
| powerbi-visuals-api | 5.11.1 | MIT | SDK declarations; also referenced by utilities |
| semver | 7.8.5 | ISC | SDK package dependency; verify actual bundled inclusion |

The production bundle, not merely a dependency's presence in `node_modules`,
determines which code is distributed. Preserve the following notices for
included portions, and reconcile emitted license comments with the archive.
No UpSet library is a dependency.

The full applicable runtime notices below must travel with the distributed
visual. A Terser-generated external `.LICENSE.txt` that is absent from the
`.pbiviz` archive is not sufficient. The packaging workflow must embed these
notices in the shipped resource and preserve any additional emitted notices.

### powerbi-visuals-utils-formattingmodel — MIT

```text
MIT License

Copyright (c) Microsoft Corporation.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE
```

### formattingutils, dataviewutils, and typeutils — MIT

The following upstream notice is identical in
`powerbi-visuals-utils-formattingutils`, `powerbi-visuals-utils-dataviewutils`,
and `powerbi-visuals-utils-typeutils` at the versions above:

```text
Power BI Visualizations

Copyright (c) Microsoft Corporation

All rights reserved.

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### Embedded Globalize and Globalize Cultures — MIT alternative

`powerbi-visuals-utils-formattingutils\lib\globalize\globalize.js` and
`globalize.cultures.js` carry the following attribution and license offer:

```text
Globalize / Globalize Cultures
http://github.com/jquery/globalize

Copyright Software Freedom Conservancy, Inc.
Dual licensed under the MIT or GPL Version 2 licenses.
http://jquery.org/license
```

These files are part of the formatting utility's formatting/culture path,
not separately declared npm dependencies. The MIT alternative's full text is
reproduced below from the
[upstream Globalize license](https://github.com/jquery/globalize/blob/v0.1.1/LICENSE).
The source link identifies the notice text; it does not assert a separately
installed Globalize package version or change the owner's source license.
Do not attribute this embedded third-party code solely to Microsoft.

```text
Copyright Software Freedom Conservancy, Inc.
http://jquery.org/license

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### powerbi-visuals-api — MIT

```text
MIT License

Copyright (c) Microsoft Corporation. All rights reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE
```

### semver — ISC

```text
The ISC License

Copyright (c) Isaac Z. Schlueter and Contributors

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR
IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

## Direct development dependencies

These tools are not intentionally shipped as visual runtime code. Their own
dependencies and notices must also be reviewed if redistributing a development
environment or other artifact that includes them.

| Package | Pinned version | Declared upstream license |
| --- | --- | --- |
| @playwright/test | 1.63.0 | Apache-2.0 |
| @types/node | 24.10.1 | MIT |
| eslint | 9.39.2 | MIT |
| eslint-plugin-powerbi-visuals | 1.1.1 | MIT |
| jszip | 3.10.1 | MIT OR GPL-3.0-or-later |
| powerbi-visuals-api | 5.11.1 | MIT |
| powerbi-visuals-tools | 7.2.1 | MIT |
| typescript | 5.9.3 | Apache-2.0 |
| typescript-eslint | 8.54.0 | MIT |
| vitest | 4.1.11 | MIT |

Upstream JSZip supplies alternative licenses; this inventory is not a claim
that both apply simultaneously. Its upstream license file is
`node_modules\jszip\LICENSE.markdown`. Apache-licensed tooling carries its own
license and, where applicable, NOTICE files.

The manifest also overrides `qs` to `6.16.0` and `sockjs`'s `uuid` to `11.1.1`.
Together with Vitest `4.1.11`, these are narrowly scoped development/build/test
dependency fixes, not added visual runtime features. The uuid override is
scoped to sockjs rather than changing every uuid consumer. The coordinator
reported zero audit vulnerabilities for the resolved dependency state;
the final lockfile, current advisories, and actual package/browser validation
still need their own release evidence.

These are transitive toolchain resolutions, not original code. Reconcile the
complete lockfile before release; this direct-package list is **not** an
exhaustive transitive SBOM or a completed legal review.

## Original artwork and samples

The icon SVG/PNG, deterministic icon generator, fictional CSV fixtures, and
inline-table sample model were authored for this repository without external
artwork or datasets. The owner's still-pending source-license decision applies
to this original work; the upstream notices above do not grant rights in it.

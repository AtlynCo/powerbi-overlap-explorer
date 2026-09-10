# Owner-approved acquisition and runtime model

Decision received **2026-09-10**: **storefront subscriptions, ungated visuals**.
This supersedes the earlier hold awaiting paid-runtime integration.

## Acquisition and shared viewing

Acquisition uses **existing Atlyn storefront subscriptions**. Subscription
management and acquisition are external to this visual. The current renderer
is the intended implementation, not a placeholder awaiting licensing code.

The runtime is ungated for both authors and viewers. Shared viewing is free
from Atlyn runtime subscription checks: report viewers do not need to prove
an Atlyn subscription to the visual. There is no paid-author identity or
entitlement enforcement in the renderer. This does not waive Power BI's own
licensing, permissions, tenant policy, or report-sharing requirements.

Do not add licence keys, a signer, AAD authentication, licensing APIs, feature
gates, WebAccess, or external runtime licence calls. There is no pending
runtime-licensing implementation and no requirement to repackage or bump the
version solely to record this decision.

## Required badge and publication boundary

The owner explicitly requires an **Extra PowerBI** badge. The coordinator
will supply the approved asset and placement; do not invent either. This
requirement is separate from a Microsoft certification badge and does not
permit a certification claim before Microsoft approval.

The coordinator owns native validation, genuine PBIX conversion, final assets,
publication paperwork and the final gate. Hold main, merges, the
`certification` ref and submission until that gate. No hosted CI or independent
Desktop/service/Marketplace UI work is authorized.

## Existing source terms, not a new licence

At this update, the repository contains **no first-party LICENSE/LICENCE file**
and `package.json` has **no `license` field or SPDX identifier**. No first-party
terms text is therefore available in the repository to quote or relabel.
The package's `private: true` flag is not a licence. Third-party MIT/ISC and
other dependency notices do not license Atlyn's original work.

This record does not grant a new licence, select an SPDX identifier, or invent
subscription prices, EULA clauses, author restrictions or redistribution
terms. Use owner-supplied existing storefront/legal documents for publication
paperwork. Their absence here is not a request to add runtime enforcement.
See [licensing and provenance](licensing.md).

## Artifact continuity

The existing `1.0.0.0` package remains the intended ungated renderer:
`ae2f1c09694fb5cade37bd1bbe30c18d212e8920f7f9a9cadd33a0234f9cebf0`.
Frozen rendering and provisional sample bundles remain unchanged. Historical
descriptions such as "unlicensed rendering evidence" identify their capture
state; they do not establish a new runtime-licensing blocker after this owner
decision. Native/submission readiness must still be established separately.

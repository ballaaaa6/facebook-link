# Office Candidate v1 Review

Date: 2026-07-27
Rejected: 2026-07-28

Status: `rejected-visual` — regression evidence only

```text
candidateRevision: r01
activeOfficePromotion: false
commercialCharacterApproval: false
ownerApproval: false
```

The owner rejected r01 because the employees and chairs were not calibrated to
the seat anchors, the approved current Office background was replaced, and the
`5 x 4` workstation geometry was oversized. This route must not be promoted or
used as a source for v2 artwork. Its captures remain only to prevent regression
back to the same failure.

## Scope

Steps 21-23 built and inspected a development-only Office Candidate without
changing the Active Office. The rejected evidence now locks the historical
structural map, workstation bundle, deployment presets, and all 77
derived-asset records by hash. It exercises ten active agent roles, eight
alternate prototype identities, and Boba while retaining the complete
prototype-only licensing boundary.

The route is `?lab=office-candidate-v1` and exposes four deterministic review
scenarios:

- `live`: the existing runtime map in read-only compatibility mode with staged
  8x15 character definitions;
- `workstations`: the accepted Geometry v3 ten-workstation room with real
  prototype characters replacing neutral calibration silhouettes;
- `facilities`: all thirteen accepted furniture/facility composites with real
  actor occlusion; and
- `roster`: all eighteen office-agent identities in selectable 8x15 states plus
  the retained Boba companion record.

## Browser evidence

Review revision `r01` contains ten versioned PNG captures under
`assets/game/processed/office-candidate-v1/qa/review-r01`. The machine-readable
capture manifest is `assets/game/manifests/office-candidate-review-r01.json`.

Observed results:

- ten Geometry v3 workstations and ten real actors remain present through a
  69-second browser stability run;
- thirteen derived composite cards and twelve actor-occlusion cases render with
  no broken images;
- the roster contains ten active identities, eight alternates, and one
  companion record;
- the live compatibility scene renders ten agents and the Boba companion;
- desktop, 768 px tablet, 390 px mobile, and 320 px mobile have no horizontal
  page overflow;
- browser console warnings and errors are both zero; and
- all four Active Office baseline files still match their locked SHA-256 values.

## Review boundary

This evidence does not authorize Step 24. Any requested visual change creates a
new review revision without overwriting `r01`. Promotion requires an explicit
owner approval after reviewing the saved images. Until then the Active Office
continues using `office-c-v2.json` and the existing registries.

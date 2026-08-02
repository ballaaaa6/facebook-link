# Office V2 Visual Style Profile Approval

Status: pending-owner-approval
Profile: office-style-profile-v1
Approval owner: product owner or designated visual approver
Technical owner: asset pipeline and runtime admission owners

## Purpose

This record gates production visual work after the technical style contract
exists. The Phase 1 style fixture defines an engineering contract; it is not
visual-owner approval of the final look. Approval must happen before a
production character, furniture, environment, or runtime asset family is
admitted.

This gate does not replace technical validation, provenance, commercial review,
asset export checks, or runtime admission checks.

## Approval references

- ART_DIRECTION_PIXEL_SPEC.md
- decisions/0015-style-profile.md
- schemas/style-profile.schema.json
- ASSET_PIPELINE.md
- ASSET_RUNTIME_ADMISSION.md

## Owner approval checklist

| ID | Approval subject | Evidence board, path, or hash | Decision | Approver | Date |
| --- | --- | --- | --- | --- | --- |
| STYLE-01 | Scale, tile envelope, character envelope, furniture envelope, and proportion relationships | Pending | pending | pending | pending |
| STYLE-02 | Palette roles, material variance, contrast, and readability at target zooms | Pending | pending | pending | pending |
| STYLE-03 | Lighting direction, contact shadows, occlusion intent, and depth readability | Pending | pending | pending | pending |
| STYLE-04 | Pixel integrity, alpha edges, nearest-neighbor behavior, and export constraints | Pending | pending | pending | pending |
| STYLE-05 | Density, composition, negative space, and scene readability | Pending | pending | pending | pending |
| STYLE-06 | Desktop, compact, and mobile viewport presentation | Pending | pending | pending | pending |
| STYLE-07 | Contact points, sockets, origin tolerances, and interaction affordances | Pending | pending | pending | pending |
| STYLE-08 | Original/commercial boundary and source provenance for the visual direction | Pending | pending | pending | pending |

Every required row must be approved before production pixels or a runtime asset
manifest can be admitted. A style change that affects scale, palette,
proportion, lighting, or density creates a new profile version and requires a
new approval record.

## Required approval record

The final approval must include:

- The exact profile ID and version.
- Board or export hashes for every approved subject.
- The approver identity, role, and approval date.
- Any accepted deviations, tolerances, or follow-up risks.
- Confirmation that the source/provenance and commercial review boundary is
  understood.

## Current decision

No visual-owner approval is claimed at Phase 1 exit. No final production pixel
set or runtime asset family may use this record as an admission until the
checklist is completed and signed.

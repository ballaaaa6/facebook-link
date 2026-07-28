# Historical Office Workstation Step 5 Calibration Record

Status: Superseded execution history; do not implement from this file
Updated: 2026-07-28
Current authority: `docs/art/OFFICE_COORDINATE_SYSTEM.md`

This file preserves the decision sequence that led to the approved R05-r02
baseline. Detailed obsolete execution instructions were removed so they
cannot be mistaken for current guidance. Git history and versioned manifests
retain the complete audit trail.

## Revision outcomes

| Revision | Outcome | Current use |
| --- | --- | --- |
| R01 | Rejected visual composition | Negative evidence only |
| R02 | Rejected calibration | Negative evidence only |
| R03 P0-P3 | Measurement history | Provenance only |
| R04 P4-P6 | Rejected physical composition | Full-top desk pixels only |
| R05-0 through R05-3A | Partial calibration history | Accepted component evidence where R05-r02 revalidates it |
| R05 final | Rejected composition | Negative before/after evidence only |
| R05-r02 P0-P3 | Owner-approved | Current coordinate, socket, equipment-depth, and paired-desk baseline |

## Why R05 final is rejected

The old ten-seat candidate:

- advanced depthwise desks by the 128-pixel authoring canvas instead of the
  64-pixel footprint depth;
- drew the far keyboard over the upright monitor;
- aligned back-facing actors and chairs by a shared top-left origin instead of
  per-character, per-frame seat sockets.

Its map, compositor, coordinates, and screenshots cannot seed new work. Its
component pixels may be reused only through the R05-r02 authority.

## Current decision

The owner approved R05-r02 P0-P3 on 2026-07-28. The accepted baseline covers:

- the 32-pixel XYZ projection;
- independent occupancy, support, render, socket, and depth contracts;
- 216 seat-contact records across 18 seat-capable characters;
- Boba explicitly excluded from seated work;
- centered monitor and bounded keyboard placement;
- one depthwise desk pair joined at 64 pixels with correct occlusion.

Ten-seat execution, other furniture, hand sockets, and Active Office promotion
remain separate decisions. The next proposed work is documented in
`docs/art/OFFICE_WORKSTATION_TEN_SEAT_NEXT_PLAN.md`.

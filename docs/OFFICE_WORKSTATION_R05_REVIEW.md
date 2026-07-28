# Historical Office Workstation R05 Final Review

Status: Rejected composition; do not use as current reference
Rejected: 2026-07-28
Superseded by: R05-r02 P0-P3

The former R05 final ten-seat candidate is retained only for negative
before/after evidence. It is not awaiting approval and cannot feed new layout,
renderer, or Active Office work.

## Rejection reasons

- Depthwise desks were separated by the 128-pixel render-canvas height instead
  of the physical 64-pixel desk depth.
- Far-row equipment drew the keyboard over the upright monitor.
- Back-facing actors shared the chair's bitmap origin instead of resolving a
  measured seat contact for each character and frame.

The accepted component pixels are revalidated by R05-r02, but the old
composition, `office-ten-r05.json`, `R05TenSeatScene`, coordinates, and review
captures are not implementation inputs.

Current placement authority:
`docs/art/OFFICE_COORDINATE_SYSTEM.md`.

Next proposed isolated ten-seat work:
`docs/art/OFFICE_WORKSTATION_TEN_SEAT_NEXT_PLAN.md`.

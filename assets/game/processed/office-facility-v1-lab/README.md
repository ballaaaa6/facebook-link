# Two-row Office layout lab

This directory records the visual QA result for the isolated Office layout lab.
The lab is available only in the web development build at
`/?lab=office-layout`; it does not replace the active Office map.

## Acceptance checks

- Ten employee workstations are arranged in two rows of five.
- Every workstation and floor object is supported by a floor surface.
- Wall art, the wall display, and the extinguisher are supported by a wall
  surface.
- The service, pantry, lounge, and review facilities have unique reservable
  slots matching their declared capacities.
- The browser render contains ten selectable employees and no console warnings
  or errors.

`qa/two-row-office-layout-v1.png` was captured from the local development
renderer at a 1280 by 720 viewport on 2026-07-27.

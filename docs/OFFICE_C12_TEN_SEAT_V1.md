# Office C12 Ten-Seat Placement v1

Status: Isolated owner-review candidate
Updated: 2026-07-29

This candidate places one ten-person workstation block on the approved
`43 x 24` semantic grid. `C12` is the top-left cell of the complete protected
envelope, not the first furniture cell.

## Placement

- Protected envelope: `C12:S19`, measuring `17 x 8` cells.
- Furniture and seat footprint: `D13:R18`, measuring `15 x 6` cells.
- Shared walkway: one cell around the content footprint.
- Far person/chair row: row `13`.
- Far desk rows: rows `14-15`.
- Near desk rows: rows `16-17`.
- Near person/chair row: row `18`.

The five workstation columns start at `D`, `G`, `J`, `M`, and `P`. Each desk
keeps the approved `3 x 2` footprint. The ten people share the chair occupancy
cells at `E13`, `H13`, `K13`, `N13`, `Q13`, `E18`, `H18`, `K18`, `N18`, and
`Q18`.

## Layer separation

The review output includes:

1. a clean combined scene;
2. a combined grid and placement highlight;
3. a furniture-only grid;
4. a people-only grid;
5. a transparent furniture layer;
6. a transparent people layer.

The combined render still uses the approved workstation occlusion order.
Furniture and people are also exported separately for inspection; neither
layer changes the collision contract.

## Boundaries

- The background is `office-c-background-modern-v4-candidate.png`.
- Existing desk, chair, monitor, keyboard, and character pixels are reused.
- The approved R05-r02 socket and occlusion authority remains the component
  source.
- The rejected ten-seat floor coordinates are not imported or offset.
- Active Office remains unchanged and promotion is not authorized.

Run `npm run art:office-c12-ten-seat` to rebuild the candidate and
`npm run art:office-c12-ten-seat:check` to verify freshness.

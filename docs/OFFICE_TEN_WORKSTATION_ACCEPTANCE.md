# Ten-workstation structural acceptance

## Status

Rejected on 2026-07-28. The former Office Map v2 `5 x 4` room is retained only
as regression evidence. It is not an accepted layout and cannot feed new
artwork or Active Office promotion. Current owner-approved geometry is defined
by `docs/art/OFFICE_COORDINATE_SYSTEM.md`.

```text
activeOfficePromotion: false
commercialCharacterApproval: false
```

The development-only route is `?lab=office-ten-v1`. It does not replace
`office-c-v2.json`, `OfficeBackdrop`, the Active Office asset registry, the
two-workstation `?lab=workstation-v1` fixture, or the rejected v5/v6 evidence.

## Structural contract

Office Map v2 separates four structural kinds:

- `floor-region` owns walkable collision and deterministic floor material.
- `wall-segment` owns wall-local placement and never enters floor Y-sort.
- `window-opening` references a parent wall and keeps seasonal content in
  `viewport-local` coordinates.
- `door-opening` references a parent wall and a portal. Closed blocks its
  declared cells; open makes the same cells passable.

The staging room is 29 x 20 tiles at 32 authoring pixels per tile. The back
wall, main floor, seasonal window, and semantic door are rendered explicitly;
the monolithic Active Office background is not imported by the staging
renderer.

## Workstation deployment

All ten deployments use `desk.modular.v1`, a 5 x 4 floor footprint, and a
5 x 3 support plane. Equipment is selected by a deployment preset without
changing the desk family:

- `standard-single`
- `standard-dual`
- `creative-dual-tablet`
- `noc-dual-status`

The far row starts at x coordinates 2, 7, 12, 17, and 22 with y 6. The near
row uses the same columns at y 10. Adjacent footprints touch at their edges
without overlap. Seats and protected access aisles stay outside desk
collision.

## Runtime acceptance

- The page owns one shared scene clock and passes `elapsedMs` to all ten
  workstation composites.
- Screen loops remain stable through the 60-second gate without per-station
  intervals.
- Controls cover furniture-only, seated, standing, geometry, equipment slots,
  structural routes, four seasons, four times of day, and both door states.
- Desktop renders at 928 x 640, tablet at 696 x 480, 390 px mobile at
  348 x 240, and 320 px mobile at 290 x 200. Each scale keeps integer physical
  tile pixels and has no horizontal page overflow.
- Production builds contain no `office-ten-v1`, `staging-station-*`, or
  `desk.modular.v1` identifiers.

The automated gate is part of `npm run check`. Any Active Office promotion or
commercial character approval requires a separate explicit decision.

# Office Camera and Scale Bible

Status: Accepted for Geometry v3 prototype production
Accepted: 2026-07-27
Machine-readable source:
`assets/game/manifests/office-camera-scale-bible.json`
Calibration board:
`assets/art/layout-references/office-camera-scale-calibration-v1.png`

This Bible is the generation and visual-calibration source of truth for Office
assets. Geometry fields remain governed by Geometry v3. The board is generated
from the JSON manifest and must never be edited independently.

## Camera contract

- One logical tile is 32 authoring pixels; exports may be 1x or 2x.
- World footprints use a top-down orthographic grid.
- Sprite elevations use straight orthographic front, back, left, and right
  views with no perspective convergence.
- Surface furniture is a composite: a top-down support-plane component plus
  straight elevation underframe and foreground-occluder components.
- Isometric, oblique, diagonal, three-quarter, and perspective views are
  rejected.
- All anchors and rendered parts snap to integer authoring pixels.
- Lighting comes from the upper-left with a two-pixel authoring outline.

This split projection is intentional. A floor footprint cannot be inferred
from a straight elevation bitmap, and a top-down surface cannot replace the
front/back occlusion parts required around an actor.

## Scale and levels

| Reference | Locked value |
| --- | ---: |
| Standing adult | `1 x 1 x 3` tiles |
| Seated adult | `1 x 1 x 2` tiles |
| Floor level | `0` tiles |
| Seat level | `1` tile |
| Work-surface level | `2.4` tiles |
| Wall / standing-adult height | `3` tiles |

The required calibration footprints are `1 x 1`, `2 x 1`, and `2 x 2`.
Character render pixels may use the declared morphology-safe overflow, but the
standing and seated reservation remains `1 x 1`.

## Canonical workstation

```text
physical scale    = 5 x 4 x 2.4 tiles
floor footprint   = 5 x 4 tiles
support plane     = 5 x 3 tiles at height 2.4
employee edge     = fourth depth row; zero attachment slots
base pivot        = (2.5, 4)
sort pivot        = (2.5, 4)
generation canvas = 5 x 5 tiles
```

The surface must be a real `5 x 3` plan component. The employee-edge row is
physical floor depth, not extra tabletop. A straight-front bitmap may not be
stretched or filled across the `5 x 4` footprint. The desk composite names
`rear`, `surface`, `base`, and `foreground` parts so support placement and
actor occlusion remain independent.

## Acceptance rules

- Adjacent footprints may touch edges but may not overlap.
- Greater `sortPivot.y` draws later.
- A foreground part may cover the lower body; the actor head-safe region must
  remain visible.
- Render pixels may cross footprint edges only through declared render bounds
  and offsets; overflow never changes collision.
- Front/back and left/right views preserve one physical design and scale.
- The prompt builder must stop when this manifest is missing or its status is
  not `accepted`.

Acceptance is limited to prototype Office geometry calibration. It does not
approve character licenses, authorize Active Office promotion, or approve any
future generated sheet without the normal asset review.

## Reproduction

Run `npm run art:geometry:bible` to regenerate the board and
`npm run art:geometry:bible:check` to verify that the committed image matches
the accepted manifest.

# Office Camera and Scale Bible

Status: Workstation v2 blueprint review; artwork generation blocked
Updated: 2026-07-28
Machine-readable source:
`assets/game/manifests/office-camera-scale-bible.json`
Calibration board:
`assets/art/layout-references/office-camera-scale-calibration-v2.png`

This Bible locks camera, scale, and the corrected compact workstation
geometry. It does not authorize artwork, renderer implementation, ten-seat
assembly, or Active Office promotion. Those permissions remain false until the
owner approves the Workstation Assembly Bible images.

## Camera contract

- One logical tile is 32 authoring pixels.
- Footprints use a top-down orthographic grid.
- Visible elevations use strict straight front/back/left/right views.
- Perspective convergence, isometric, oblique, diagonal, and three-quarter
  views are rejected.
- Surface furniture separates the top plane from rear, base, and foreground
  height parts.
- All pivots and rendered parts snap to integer authoring pixels.
- Lighting comes from the upper-left with a two-pixel authoring outline.

## Scale references

| Reference | Locked value |
| --- | ---: |
| Standing adult | `1 x 1 x 3` tiles |
| Seated adult | `1 x 1 x 2` tiles |
| Chair reservation | `1 x 1` tile |
| Floor level | `0` tiles |
| Seat level | `1` tile |
| Work-surface level | `2.4` tiles |
| Wall / standing-adult height | `3` tiles |

## Canonical workstation v2

```text
physical scale      = 3 x 2 x 2.4 tiles
floor footprint     = 3 x 2 tiles
support plane       = 3 x 2 tiles at height 2.4
employee-edge row   = none
base + sort pivot   = (1.5, 2)
generation canvas   = 3 x 4 tiles
monitor reservation = 3 x 1, far from actor
keyboard reservation= 3 x 1, near actor
```

The monitor and keyboard visuals may occupy fewer pixels than their `3 x 1`
reservation. The reservation controls stable placement, not stretching.

The `3 x 4` generation canvas is deliberately taller than the floor
footprint. The extra height permits visible vertical furniture parts; it may
not become collision or another support row.

## Superseded v1 decision

The former `5 x 4` footprint, `5 x 3` support plane, and fourth employee-edge
row are rejected. The former v1 calibration board and desk sprites are
historical regression evidence only. The prompt builder must never substitute
those dimensions for a new workstation request.

## Review and generation gate

`npm run art:prompt:check` validates that this Bible is internally correct.
`npm run art:prompt -- <asset-id>` must still refuse to produce a workstation
prompt while status is `blueprint-review` or owner approval is false.

Run `npm run art:geometry:bible` to regenerate the deterministic v2 camera
board and `npm run art:geometry:bible:check` to verify it. Run
`npm run art:workstation:bible` for the three owner-review images.

# Office Camera and Scale Bible v3

Status: Geometry v6 ruler retained; Step 5 R05 final candidate under owner review
Updated: 2026-07-28
Machine-readable source:
`assets/game/manifests/office-camera-scale-bible-v3.json`

The prior `office-camera-scale-bible.json` remains Step 4 desk-art evidence.
Its `2.4` work-surface height, seated-person height `2`, and `3 x 1` keyboard
reservation are forbidden as Step 5 assembly authority.

## Coordinate and projection contract

- One world tile is 32 authoring pixels.
- World X increases right.
- World Y increases toward the viewer.
- World Z increases upward.
- Coordinates snap to integer authoring pixels.
- Perspective convergence is not used.

```text
screenX = worldX * 32
screenY = worldY * 32 - worldZ * 32
```

## Integer reference levels

| Level | Meaning |
| ---: | --- |
| `z = 0` | floor and chair wheel contact |
| `z = 1` | chair cushion and seated pelvis contact |
| `z = 2` | desk support and chair logical top |
| `z = 3` | person logical top |

The levels describe world stacking. They are not bitmap crop boundaries.

## Object ruler

| Object | Floor footprint | Logical volume | Pixel rule |
| --- | --- | --- | --- |
| Current Office person | `1 x 1` | `1 x 1 x 3` | Keep the current `96 x 104` frame at 32 px/tile |
| Chair | `1 x 1` | `1 x 1 x 2` | R05 final reuses the real 64 x 80 source on a 96 x 112 canvas without scaling; seat y80, floor y112 |
| Desk | `3 x 2` | `3 x 2 x 2` | Full support plane is `96 x 64` px at `z = 2` |
| Monitor | desk child | support child | Reserve actor-far `3 x 1`; accepted visual `52 x 40`, base centered with 0 px error |
| Keyboard | desk child | support child | Reserve center `1 x 1`; accepted visual `48 x 24` |

Visible character, chair, hair, clothing, equipment, or furniture-height pixels
may overflow a footprint only where declared. Render overflow never creates
collision cells.

## Contact and support rules

- The person and chair reserve the same `1 x 1` floor cell.
- The pelvis rests on the cushion at `z = 1`.
- The backrest supports the torso and reaches logical `z = 2`.
- The head extends above the backrest to logical `z = 3`.
- The desk top is the complete rectangular `3 x 2` support plane.
- Legs, drawers, apron, and vertical faces are height, not extra floor rows.
- The keyboard visual must remain inside the desk support plane and cannot
  overlap the monitor.

## Current gate

R04 physical composition is rejected; only its desk pixels remain accepted.
R05 Geometry v6 separates top-down reservation, world support socket, local
visual pivot, and support height. The R05 final candidate keeps the approved
desk, monitor, keyboard, and existing poses; it derives chair masks from the
real source pixels and validates one station plus ten seats for 60 seconds at
0 px drift. Its authority is `office-workstation-step5-r05-final.json`.
Step 6, other furniture, and Active Office promotion remain blocked pending
owner review.

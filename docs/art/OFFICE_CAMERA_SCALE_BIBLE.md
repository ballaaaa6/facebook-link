# Office Camera and Scale Bible v3

Status: P0-P3 calibration authority; owner approval required
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
| Chair | `1 x 1` | `1 x 1 x 2` | Exact render envelope remains unlocked until contact approval |
| Desk | `3 x 2` | `3 x 2 x 2` | Full support plane is `96 x 64` px at `z = 2` |
| Monitor | desk child | support child | Reserve the actor-far `3 x 1` row; reuse the current visual |
| Keyboard | desk child | support child | Reserve center `1 x 1` near the actor; visual maximum `1.5 x 1`, proposed `48 x 24` px |

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

Only deterministic measurement and the three R03 calibration boards are
authorized. Artwork generation, renderer implementation, one-seat assembly,
ten-seat assembly, Step 6, and Active Office promotion remain blocked.

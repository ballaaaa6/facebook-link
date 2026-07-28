# Office Furniture Massage Chair R02

Status: Owner-approved at F8 on 2026-07-29

Family: `chair.massage.modern`

Revision: `r02`

Active Office promotion: blocked pending F9-F10

## Purpose

R02 replaces the rejected R01 `lounge-front` visual pose with the
owner-approved upright workstation pose. It preserves the clean-source,
geometry, part, route, and reservation requirements while separating the
runtime behavior from the displayed character pose:

- semantic action: `use-massage-chair`;
- visual pose: `working-front-seated`;
- orientation: front; and
- pose row: 14.

R01 remains immutable rejection evidence. R02 does not read or copy R01
processed furniture pixels.

The machine-readable authority is
`assets/game/manifests/office-furniture-chair-massage-r02.json`.

## Furniture source

R02 re-extracts the chair from the audited full original master:

`assets/art/layout-references/facility-lounge-sheet-modern-bright-v1-source.png`

The source SHA-256 is
`9c60ebe86d971b7af8be33b8f1ab07d005e83dd8e3af0e380379719ebe50a6b1`.
The audit record is
`modern-bright-library-v1:env-05-facility-lounge:chair.massage.modern`.

The extraction:

- starts from the complete master rather than R01 or another processed crop;
- selects one connected component containing 41,388 pixels;
- discards 22 unrelated full-master components;
- touches neither the nominal source-cell boundary nor the master boundary;
- preserves authoring pixels without resampling; and
- performs no repaint or generative repair.

## Pose authority

R02 reads the existing owner-approved socket authority:

`assets/game/manifests/office-character-seat-sockets-v1.json`

Its locked SHA-256 is
`45837daa526e9d0142ae09103677fe50b32ff82f36c7a46dba87c26e46f14d75`.
The authority supplies the source spritesheet, row, frame, and local seat
contact for every character. R02 does not create or modify a character pose.

The front pose uses one local contact `(48,80)` for all 18 seat-capable
characters and all six active frames. The chair uses one runtime seat anchor
`(32,50)`. Per-character furniture scaling and seat offsets remain forbidden.

## Scale, parts, and geometry

- Authoring canvas: `192 x 288`.
- Runtime canvas: `64 x 96`.
- Uniform integer divisor: 3.
- Physical volume: `2 x 2 x 2` tiles.
- Collision footprint: `2 x 2` tiles.
- Render box: `2 x 3` tiles.
- Base and sort pivot: local tile `(1,2)`.
- Seat cell: local cell `(1,1)`.
- Approach cell: local cell `(1,2)`.
- Exit cell: local cell `(1,3)`.
- Capacity: one.

The authoring and runtime families each contain `shell`, `rear`, and
`foreground` parts. Rear plus foreground recomposes the clean shell
pixel-for-pixel. Rendering order is:

`rear -> character -> foreground`

The R02 generator rebuilds every furniture part from the original master.

## Roster and reservation proof

The isolated lab validates:

- 18 authority characters;
- six `working-front-seated` frames per character;
- 108 compositions;
- every actor inside the review card;
- at least 517 actor/foreground overlap pixels;
- one furniture scale and one seat anchor; and
- no per-character offset.

The reservation lab runs for 30 simulated seconds with two agents, capacity
one, zero concurrent-use collisions, and a released slot at the end.

## Review evidence

1. `01-source-ownership.png`
2. `02-alpha-parts.png`
3. `03-geometry-grid.png`
4. `04-pose-comparison.png`
5. `05-six-frame-seat-lab.png`
6. `06-roster-fit.png`
7. `07-reservation-timeline.png`

All review images are under:

`assets/art/layout-references/office-furniture-family-v1/chair-massage-r02`

The comparison board renders both poses with the newly extracted R02 chair.
The rejected pose is evidence only and is not a runtime R02 input.

## Gate state

- F0-F7: passed for the exact R02 hashes.
- F8: owner-approved on 2026-07-29.
- F9: blocked.
- F10: blocked.

R02 is the approved massage-chair family, but it is not registered in Active
Office. It may enter a future furniture-only F9 candidate; Active promotion
still requires the complete room to pass F9-F10.

## Reproduction

```bash
npm run art:furniture:massage:r02
npm run art:furniture:massage:r02:check
```

The generator supports deterministic freshness checking:

```bash
python scripts/build-office-furniture-massage-chair-r02.py --check
```

# Office Furniture Massage Chair R01

Status: F0-F7 evidence complete; F8 owner review pending

Family: `chair.massage.modern`

Revision: `r01`

Active Office promotion: blocked

## Purpose

R01 is the first production-gated furniture family after the R05-r02
workstation. It proves the reusable clean-master pipeline for source ownership,
no-resample extraction, uniform runtime scaling, occlusion decomposition, seat
geometry, full-roster fit, and atomic reservation without importing any
candidate into Active Office.

The machine-readable authority is
`assets/game/manifests/office-furniture-chair-massage-r01.json`.

## Source decision

R01 uses only the audited original master:

`assets/art/layout-references/facility-lounge-sheet-modern-bright-v1-source.png`

The extractor starts from the complete `1254 x 1254` master and selects the one
connected component wholly owned by audited bounds `(0, 627, 314, 940)`.
Selected object bounds are `(68, 661, 242, 930)`. The component contains 41,388
retained pixels, touches neither the nominal cell edge nor the master edge, and
is surrounded by at least nine transparent authoring pixels.

Generated-magenta background and edge contamination are removed through alpha
only. Retained furniture pixels are not repainted. No existing processed crop,
Active Office furniture, legacy asset, rejected candidate, or generative repair
enters the family.

The historical left and right orientations remain rejected. R01 contains the
audited front orientation only.

## Scale and geometry

- Authoring canvas: `192 x 288` pixels.
- Runtime canvas: `64 x 96` pixels.
- Scale: one uniform integer divisor of `3`.
- Non-uniform scaling: forbidden.
- Physical scale: `2 x 2 x 2` tiles.
- Floor footprint: `2 x 2` tiles.
- Render box: `2 x 3` tiles at the 32-pixel runtime grid.
- Base pivot and sort pivot: local tile `(1, 2)`.
- Seat socket: local tile `(1, 1)`.
- Approach cell: local cell `(1, 2)`.
- Exit cell: local cell `(1, 3)`.
- Capacity: one.
- Facing and interaction action: front / `lounge-front`.

Physical volume, collision footprint, and render overflow remain separate.
The authoring shell is never stretched to fill the footprint.

## Parts

R01 emits three exact authoring and runtime parts:

- clean shell;
- rear/base layer; and
- foreground layer.

Rear and foreground layers recompose the clean shell pixel-for-pixel at both
authoring and runtime resolutions. The actor is drawn after the rear layer and
before the foreground layer. No character pixels are baked into the chair.

Processed outputs are under:

`assets/game/processed/office-furniture-family-v1/chair-massage-r01`

## Character fit

The isolated seat lab uses the frozen `lounge-front` row without creating or
rescaling a character. One chair scale, chair seat anchor, and actor contact
point are shared by all characters.

The checker covers:

- 18 seat-capable character atlases;
- six active frames per character;
- 108 validated compositions;
- no per-character furniture scaling;
- no per-character seat offset;
- every actor inside the review card; and
- positive actor/foreground overlap in every frame.

## Reservation proof

The isolated 30-second simulation uses two actors and one seat:

- agent A reserves, approaches, occupies, releases, and completes;
- agent B requests while A holds the slot, waits, then acquires it after
  release;
- maximum concurrent reservations is one;
- collision count is zero; and
- the slot is free at the end.

The contract requires atomic reservation and release on route or interaction
failure.

## Review evidence

The six owner-review boards are:

1. `01-source-ownership.png`
2. `02-alpha-parts.png`
3. `03-geometry-grid.png`
4. `04-six-frame-seat-lab.png`
5. `05-roster-fit.png`
6. `06-reservation-timeline.png`

They are stored under:

`assets/art/layout-references/office-furniture-family-v1/chair-massage-r01`

## Gate state

- F0-F7: candidate evidence passed.
- F8: pending explicit owner review.
- F9: blocked; no furniture-only room authority.
- F10: blocked; no Active Office or runtime integration authority.

Owner approval, if granted, applies only to this exact front family revision
and the hashes recorded in the manifest. It does not approve the rejected side
sources or any other furniture family.

## Commands

Regenerate the deterministic evidence:

```bash
npm run art:furniture:massage:r01
```

Run the portable contract, hash, geometry, roster, reservation, and isolation
check:

```bash
npm run art:furniture:massage:r01:check
```

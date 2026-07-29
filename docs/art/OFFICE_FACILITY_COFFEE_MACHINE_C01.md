# Office Facility Coffee Machine C01

Status: F0-F7 passed; rejected at F8
Updated: 2026-07-29
Scope: One front-only, capacity-one coffee machine supported by Counter Bar
A01-r02

## Decision boundary

Coffee Machine C01 is preserved rejected evidence. It is not a floor
fixture and has no independent floor footprint. Its physical base occupies one
complete back-to-front support span on the owner-approved Counter Bar A01-r02.

C01 is one machine family with four local visual states. The four audited
master cells are not four separate machine models:

- A: idle;
- B: ready indicator;
- C: coffee stream and steam;
- D: complete / returned idle.

The candidate remains development-only and cannot be promoted. It is not imported by Active Office,
a furniture-only room, or any later facility family. F9 and F10 remain
blocked.

## Source authority

The only machine-pixel source is:

`assets/art/layout-references/review-facility-completion-sheet-modern-bright-v1-source.png`

SHA-256:

`fa66b2d4891d7dddc4f90469d61262803641956052f977c22f8cd29827029853`

The builder re-extracts these four exact full-master cells:

| Frame | Source bounds |
| --- | --- |
| A | `[0, 940, 314, 1254]` |
| B | `[314, 940, 627, 1254]` |
| C | `[627, 940, 940, 1254]` |
| D | `[940, 940, 1254, 1254]` |

All four records are marked
`salvage-full-master-and-decompose` by
`assets/game/manifests/office-furniture-master-audit-v1.json`.
Each extraction resolves to one complete connected component, remains inside
its nominal cell, does not touch the master boundary, and is moved into the
authoring canvas without resampling.

The following sources are explicit non-inputs:

- all processed Coffee crops;
- the four old `machine.coffee.loop.*` frames;
- the old left and right side views;
- the old runtime Coffee machine;
- Active Office assets;
- rejected furniture and facilities;
- fallback or generative repair.

The old loops are effect reference evidence only. Their pixels do not enter
C01.

## Geometry calibration

The audit family record proposes a `1 x 3` render box. The generic asset guide
proposes `1 x 2`. Neither envelope produces a readable commercial-machine
silhouette when the nearly square original source is constrained to one
render tile of width.

C01 therefore records all three calibration outcomes:

| Candidate | Result |
| --- | --- |
| `1 x 2` | physically compatible but visually too narrow |
| `1 x 3` | audit envelope retained as evidence but visually too narrow |
| `2 x 3` | selected visual envelope; preserves source aspect at readable scale |

The selected render envelope and physical occupancy are locked independently:

- physical scale: `1 x 2 x 2` tiles;
- render envelope: `2 x 3` tiles, `64 x 96` runtime pixels;
- authoring canvas: `256 x 384`;
- uniform divisor: `4`;
- placement plane: `furniture-surface`;
- floor footprint: none;
- base anchor: bottom-center;
- non-uniform scaling: disabled.

The machine reserves a full two-cell depth column even though the source image
is not resampled. A01-r02's complete top supports all six back-to-front
columns. The six-span placement proof records zero unsupported cases.

## Parent Counter A01-r02

The parent manifest is:

`assets/game/manifests/office-furniture-counter-bar-a01-r02.json`

C01 requires the parent to remain:

- `owner-approved`;
- F8 passed;
- `attachedCoffeeProduction = true`;
- F9 blocked;
- F10 blocked.

The default isolated review composition uses:

| Contract | Value |
| --- | --- |
| Selected depth span | `surface.depth.03` |
| Occupied support cells | `surface.back.03`, `surface.front.03` |
| Front visual anchor | `surface.front.03` |
| Parent local socket | `[112, 70]` |
| Machine output | internal output bay |
| Shared use lane | `use.03` |
| Stand | `(2.5, 2.5)` |
| Approach | `(2.5, 3.5)` |
| Exit | `(2.5, 4.5)` |

The machine base resolves from `base.support = [32, 96]` to the selected
parent socket with attachment delta `[0, 0]`. No `base.floor`, `sort.floor`,
center-to-center attachment, per-scene offset, or fallback exists.

The machine is compatible with all six complete A01-r02 `1 x 2` depth spans.
During one interaction, both cells in the selected span are reserved, leaving
ten counter cells available for other supported objects. The mug appears in
the machine's internal output bay; it does not claim a third support cell.

## Parts and local animation

C01 produces these independent parts:

- immutable static shell;
- viewport A;
- viewport B;
- viewport C;
- viewport D;
- empty output bay;
- Coffee stream overlay;
- steam overlay;
- independent H01 Coffee mug.

The static shell is derived from neutral frame A. The local viewport owns the
indicator and front-machine state changes. The empty bay is separated from the
shell. Frame C supplies the stream and steam pixels through tightly bounded
difference masks.

The final local sequence is:

| Frame | Viewport state | Effect overlays |
| --- | --- | --- |
| A | idle | none |
| B | ready indicator | none |
| C | active indicator | Coffee stream, steam |
| D | complete / idle | none |

All animation differences are confined to the declared local viewport:

`outsideViewportChangedPixels = 0`

The base pivot, parent support socket, and render anchor remain stable across
all four states.

## Empty bay and H01 output

The machine shell and viewport contain no cup. The empty bay is an independent
machine-local part.

The drink output is:

`held.coffee-mug`

from the owner-approved:

`assets/game/manifests/office-held-props-h01.json`

The mug remains at runtime scale one and transitions through:

1. no mug;
2. no mug;
3. `facility.output.primary`;
4. `actor.hand.primary.grip`;
5. `actor.hand.primary.grip`;
6. no mug.

The mug uses the complete front-overlay presentation when attached to the
actor. No hand mask, character-specific offset, or clipped prop is allowed.

## I01 roster proof

C01 uses the owner-approved I01 interact-front action and spatial authorities.
It does not create new character poses.

The validation matrix covers:

- 18 characters;
- 6 interact-front frames per character;
- 108 total pose cases;
- 54 visible-mug cases;
- 18 machine-output attachment cases;
- 36 actor-hand attachment cases;
- 36 complete front-overlay cases;
- zero attachment-delta failures;
- zero visible-alpha failures;
- zero per-character facility scaling;
- zero per-character actor offsets.

The roster review renders the machine on its Counter A01-r02 parent. This
proves handoff behavior against the actual support surface instead of a
floating machine-only mockup.

## Reservation proof

The capacity-one simulation samples seconds `0` through `30` and includes:

- two users;
- one atomic reservation;
- one blocked competing attempt;
- one failed cycle;
- release on failure;
- one successful retry;
- no concurrent reservation;
- no collision;
- no owner at second `30`.

The reservation owns the machine, its two-cell depth span, and its paired use
lane. It does not reserve unrelated counter cells.

## Review bundle

The review directory is:

`assets/art/layout-references/office-facility-family-v1/coffee-machine-c01/`

It contains:

1. source ownership;
2. geometry calibration on the counter;
3. alpha parts;
4. clean front;
5. local animation;
6. counter placement and support;
7. use lane and routes;
8. six-frame output handoff;
9. 18-by-6 roster;
10. socket attachment debug;
11. 30-second reservation timeline;
12. hand close-ups and layer order.

## Rebuild and portable checks

```bash
npm run art:facility:coffee:c01
npm run art:facility:coffee:c01:rebuild:check
npm run art:facility:coffee:c01:check
```

The deterministic builder owns the manifest, source evidence, parts,
composites, and review boards.

## Gate result and rejection

- F0-F7: passed;
- F8: rejected;
- F9: blocked;
- F10: blocked.

The owner rejected C01 because its compact one-cell visual silhouette did not
visibly fill the reserved two-cell depth. C01-r02 replaces it with a fresh
`2 x 2 x 2` source and reuses zero C01 pixels.

Arcade, Server, furniture-only room composition, and Active Office promotion
remain outside C01 scope.

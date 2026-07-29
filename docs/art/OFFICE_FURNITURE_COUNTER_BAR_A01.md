# Office Furniture Counter Bar A01

Status: F0-F7 passed; owner-review-f8-pending
Updated: 2026-07-29
Scope: One original front-only modular cafe counter family

## Decision boundary

Counter Bar A01 is a new isolated surface-furniture family made before Coffee
Machine C01. It is a reusable cafe counter, not a machine-specific pedestal.
The family remains development-only and is not imported by Active Office or a
furniture-only room.

Coffee C01 is not an A01 source, part, debug fixture, or runtime dependency.
After the owner approves A01 at F8, Coffee can start as its own family and may
target an A01 semantic support slot. Approval of A01 will not approve Coffee,
F9 room composition, or F10 Active Office integration.

## Original clean source

Source:

`assets/art/layout-references/office-furniture-counter-bar-a01-source.png`

SHA-256:

`22831cfd7a9fedfc0d1733d7bca864d66ff6c71ad0dd777b0a1a7a9fea8b695f`

The source was created with the built-in image-generation workflow without an
input image. The approved cafe-direction concept sheet supplied design intent
only; none of its pixels entered A01. Two geometry-only correction passes
produced the complete empty support surface and full front silhouette.

The source is original to this project and isolated on a removable magenta
backdrop. It contains no Coffee machine, cup, food, decor, person, stool,
shelf, room, floor, cast shadow, logo, text, or watermark.

The builder does not read or reuse:

- Active Office assets or its runtime registry;
- an existing or processed counter crop;
- a legacy or rejected furniture asset;
- a previous processed furniture-library crop;
- the cafe concept-sheet pixels; or
- Coffee C01 art.

The source contract fails if its hash, ownership bounds, component count,
canvas contact, or chroma statistics change.

## Chroma and ownership proof

The deterministic chroma pass samples RGB `[239, 7, 230]` and records:

- source canvas: `1536 x 1024`;
- owned bounds: `[154, 158, 1383, 867]`;
- owned components: `1`;
- visible owned pixels: `833,578`;
- transparent pixels: `739,286`;
- partial-alpha pixels: `4,228`; and
- canvas contact: `false`.

The keyed pixels are normalized without resampling to `1344 x 960` with
padding:

- left `57`;
- top `191`;
- right `58`; and
- bottom `60`.

Authoring source pixels are not stretched or reconstructed. The runtime
conversion uses one uniform integer divisor of `6`.

## Geometry v3

A01 separates its render envelope from its physical geometry.

| Contract | Value |
| --- | --- |
| Asset type | `surface-furniture` |
| Placement plane | `floor` |
| Orientation | `front` |
| Physical scale | `6 x 2 x 2` tiles |
| Footprint | `6 x 2` tiles |
| Support plane | `6 x 2` tiles at `Z=2` |
| Base pivot | `(3,2)` tiles |
| Sort pivot | `(3,2)` tiles |
| Authoring canvas | `1344 x 960` |
| Runtime canvas | `224 x 160` |
| Runtime root/sort socket | `[112,150]` |

The shared Office orthographic authority is used:

```text
screenX = worldX * 32
screenY = worldY * 32 - worldZ * 32
```

Perspective and non-uniform scaling are disabled.

## Independent production parts

The normalized master is separated into three disjoint alpha parts:

1. `support-surface` for the rear worktop;
2. `base-shell` for the fixed cabinet body; and
3. `foreground-occlusion` for the near plinth/foreground band.

The three authoring parts recompose byte-equivalently to the normalized clean
master before runtime derivation. Every authoring and runtime part is
hash-locked in the manifest.

Runtime clean asset:

`assets/game/processed/office-furniture-counter-bar-a01/runtime/counter-bar-a01.clean.png`

## Reusable surface contract

The support plane exposes five independent `1 x 1` slots:

| Slot | Tile point | Runtime socket |
| --- | --- | --- |
| `surface.01` | `(1,1)` | `[48,54]` |
| `surface.02` | `(2,1)` | `[80,54]` |
| `surface.03` | `(3,1)` | `[112,54]` |
| `surface.04` | `(4,1)` | `[144,54]` |
| `surface.05` | `(5,1)` | `[176,54]` |

Each slot accepts an `equipment-1x1` or `prop-1x1` child. Four adjacent pairs
also accept an atomic `equipment-2x1` child:

- `surface.01 + surface.02`;
- `surface.02 + surface.03`;
- `surface.03 + surface.04`; and
- `surface.04 + surface.05`.

Overlap and unsupported child widths fail closed. A child owns its actual
interaction behavior; A01 owns only surface support, occupancy, routing, and
reservation.

## Use lanes

Every surface slot has a paired front use lane:

- stand cell at `(x,2)`;
- approach cell at `(x,3)`; and
- exit cell at `(x-1,4)`.

The proof contains five distinct routes and reports zero route obstructions.
No child requires a scene-specific position fix.

## Socket and movement proof

All child placement uses:

```text
drawOrigin = parentSocket - childSocket
```

The manifest explicitly disables per-scene offsets, center fallback, and
missing-socket fallback. The movement board checks all five child slots at
world positions `(0,0)`, `(4,3)`, and `(9,6)`: `15` attachment cases with
zero attachment or prop-follow failures.

## Placement and contention proof

The deterministic placement lab covers:

- five `1 x 1` slot cases;
- four `2 x 1` adjacent span cases;
- five mixed configurations;
- one overlap rejection;
- one unsupported-width rejection;
- zero route obstructions; and
- zero attachment delta failures.

The reservation lab runs from second `0` through second `30` with contenders
`alpha` and `beta`. It proves capacity one, a blocked attempt, failure release,
a later successful retry, and no reservation held at the end.

## Review bundle

Owner-review evidence:

1. `01-source-ownership.png`;
2. `02-alpha-parts.png`;
3. `03-clean-front.png`;
4. `04-orthographic-geometry.png`;
5. `05-support-slots.png`;
6. `06-modular-configurations.png`;
7. `07-span-and-rejection.png`;
8. `08-use-lanes-and-routes.png`;
9. `09-movement-socket-proof.png`;
10. `10-reservation-timeline-30s.png`; and
11. `11-layer-order.png`.

The simple blocks on the modular boards are code-authored test fixtures. They
prove A01 can hold different items and are deliberately not Coffee C01 art.

Review root:

`assets/art/layout-references/office-furniture-family-v1/counter-bar-a01`

## Production authority

Manifest:

`assets/game/manifests/office-furniture-counter-bar-a01.json`

Deterministic builder:

`scripts/build-office-furniture-counter-bar-a01.py`

Portable checker:

`scripts/office-furniture-counter-bar-a01-check.mjs`

Commands:

```bash
npm run art:furniture:counter:a01
npm run art:furniture:counter:a01:rebuild:check
npm run art:furniture:counter:a01:check
```

## Gate result and owner review

- F0-F7: passed with hash-locked evidence;
- F8: `pending-owner-review`;
- F9: blocked;
- F10: blocked.

The owner-review decision applies only to the exact A01 manifest and output
hashes. Until an explicit decision is recorded, attached Coffee production,
furniture-only room composition, and Active Office promotion remain disabled.

# Office Furniture Counter Bar A01-r02

Status: F0-F8 passed; owner-approved
Updated: 2026-07-29
Scope: One fresh front-only `counter.bar.modular` revision

## Decision boundary

A01-r02 replaces the rejected A01 tapered-top candidate. The owner required
the physical `6 x 2 x 2` contract to control the artwork: a complete
six-tile-wide, two-tile-deep support surface, two-tile total height, and no
visual gap beneath any edge cell.

A01-r02 is development-only. It is not imported by Active Office or a
furniture-only room. The owner approved the exact A01-r02 hashes on
2026-07-29 and directed Coffee Machine C01 production to begin on this support
surface. That approval unlocks isolated Coffee production but does not approve
Coffee, F9 room composition, or F10 Active Office integration.

## Pixel independence

Source:

`assets/art/layout-references/office-furniture-counter-bar-a01-r02-source.png`

SHA-256:

`3d809b2279f57590e802b792c48336428242174cc239b9bb6bfbece32bbdfe94`

The selected source begins with a new text-only built-in ImageGen generation.
It has no external input image. Two same-lineage geometry correction passes
deepened that fresh top before selection.

The following are not pixel inputs:

- rejected Counter Bar A01;
- the thin-top preview;
- the earlier cafe concept sheet;
- Active Office;
- processed or legacy furniture crops;
- rejected furniture families; and
- Coffee C01.

The source policy disables concept reuse, processed reuse, Active Office
reuse, legacy/rejected reuse, generative repair, and missing-asset fallback.

## Chroma and source ownership

The deterministic source pass records:

- source canvas: `1536 x 1024`;
- sampled border key: RGB `[240,12,224]`;
- source owned bounds: `[123,99,1414,922]`;
- connected components: `1`;
- visible owned pixels: `1,051,378`;
- source pixel resampling: `false`; and
- canvas contact: `false`.

The keyed source, ownership mask, geometry-normalized source, and final
normalized cutout are all independent hash-locked files.

## Orthographic depth normalization

Image generation established new project pixels and a complete rectangular
top, but the selected top was slightly deeper than the exact Office
projection. The deterministic builder removes rows `[529,579)` and moves the
fresh lower assembly upward. It does not stretch, warp, interpolate, repair,
or generate any pixel.

| Evidence | Bounds |
| --- | --- |
| Generated surface | `[123,99,1414,579]` |
| Removed rows | `[529,579)` |
| Preserved lower assembly begins | row `579` |
| Geometry-normalized surface | `[123,99,1414,529]` |

The corrected component normalizes without authoring resampling to
`1536 x 960` with padding:

- left `122`;
- top `127`;
- right `123`; and
- bottom `60`.

Runtime output uses one uniform divisor of `6`, producing `256 x 160`.

## Exact 6 x 2 x 2 contract

One tile equals 32 runtime pixels.

| Contract | Tile size | Runtime size |
| --- | ---: | ---: |
| Floor footprint | `6 x 2` | `192 x 64` |
| Support plane | `6 x 2 @ Z=2` | `192 x 64` |
| Total height | `2` | `64` |
| Top slab thickness | `0.25` | `8` |
| Runtime canvas | — | `256 x 160` |

The local root and sort sockets are both `[128,150]`.

The shared Office projection produces:

```text
screenX = worldX * 32
screenY = worldY * 32 - worldZ * 32
```

The exact projected support rectangle is `[32,22,224,86]`. Its dimensions are
`192 x 64` pixels. The visible terrazzo bounds are `[20,21,236,93]`, giving a
small visual overhang around the physical plane while keeping every supported
cell over opaque art.

Perspective and non-uniform scaling remain disabled.

## Twelve supported cells

The plane exposes two complete rows of six `1 x 1` cells:

```text
far side
 B1  B2  B3  B4  B5  B6   equipment row
 F1  F2  F3  F4  F5  F6   prop/display row
near/user side
```

Back-row sockets use runtime Y `38`; front-row sockets use runtime Y `70`.
Both rows use runtime X positions:

```text
48, 80, 112, 144, 176, 208
```

The four extreme fixtures B1, B6, F1, and F6 remain entirely within the
physical support rectangle. Every one of the twelve `32 x 32` cells has
`1,024 / 1,024` visible support pixels:

```text
edgeSupportFailures = 0
```

## Spans and configurations

A01-r02 supports:

- twelve independent `1 x 1` placements;
- ten horizontal `2 x 1` spans, five per row; and
- five full-depth `2 x 2` spans.

The seven configuration proofs include empty, all-independent,
equipment-and-props, two `2 x 1` items, one `2 x 2` item, an overlap probe,
and an unsupported `3 x 1` probe.

Overlap and unsupported widths reject atomically. Debug fixtures prove
placement only and are not Coffee C01 art.

## Use lanes

Each column owns one front use lane shared by its back equipment cell and
front prop cell:

- stand at `Y=2.5`;
- approach at `Y=3.5`; and
- exit at `Y=4.5`.

The six routes are distinct by X column and report zero route obstructions.
Child assets retain their own actions; the counter owns support, occupancy,
route pairing, and reservation only.

## Parts and depth

The final source is separated into:

1. `support-surface`;
2. `base-shell`; and
3. `foreground-occlusion`.

The three disjoint authoring parts recompose exactly to the normalized clean
master. Runtime derivation keeps the same layer order. All authoring and
runtime outputs are hash-locked.

## Movement and reservation

All children attach with:

```text
drawOrigin = parentSocket - childSocket
```

Per-scene offsets, center fallback, and missing-socket fallback are disabled.
The movement proof checks twelve cells at `(0,0)`, `(4,3)`, and `(9,6)`:

- attachment cases: `36`;
- attachment delta failures: `0`; and
- prop-follow failures: `0`.

The 30-second reservation proof uses contenders `alpha` and `beta` and
records one blocked attempt, one failure release, one successful retry,
capacity one, and no reservation held at second 30.

## Owner-review bundle

Review root:

`assets/art/layout-references/office-furniture-family-v1/counter-bar-a01-r02`

Evidence:

1. source lineage and row normalization;
2. exact `6 x 2 x 2` geometry;
3. alpha parts;
4. clean front;
5. twelve surface cells;
6. four-corner edge support;
7. modular configurations;
8. spans and rejections;
9. use lanes and routes;
10. movement sockets;
11. 30-second reservation timeline; and
12. layer order.

## Production authority

Manifest:

`assets/game/manifests/office-furniture-counter-bar-a01-r02.json`

Builder:

`scripts/build-office-furniture-counter-bar-a01-r02.py`

Portable checker:

`scripts/office-furniture-counter-bar-a01-r02-check.mjs`

Commands:

```bash
npm run art:furniture:counter:a01:r02
npm run art:furniture:counter:a01:r02:rebuild:check
npm run art:furniture:counter:a01:r02:check
```

## Gate result

- F0-F8: passed;
- F9: blocked;
- F10: blocked.

`ownerDecision.decision = approved` records the owner's 2026-07-29 decision.
Isolated Coffee C01 production is enabled. Furniture-only room composition
and Active Office promotion remain disabled.

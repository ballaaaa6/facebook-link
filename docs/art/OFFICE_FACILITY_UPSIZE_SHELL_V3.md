# Office Facility Integrated Shell V3

Status: `shell-integration-owner-review`

Updated: 2026-07-30

## Decision boundary

Motion V2 effects are accepted. The subsequent owner review rejected the four
reused shells because their proportions, material language, pixel density, and
effect receiving areas did not visually belong to the authored effect parts.

Motion V2 remains immutable effect-source evidence. Shell V3 replaces only:

- the visible shell pixels;
- the front shell/effect integration;
- the left, right, and back shell elevations; and
- authored shell foreground pieces that occlude moving parts.

The accepted `2 x 2 x 4` physical scale, `2 x 2` footprint, `3 x 4` render
box, `[48,124]` base pivot, behavior states, I01/H01 grips, seat sockets,
reservation logic, and timing do not change.

No old shell pixels are used. No effect pixels are regenerated.

## Fresh ImageGen shell sources

Built-in ImageGen created one retained four-view turnaround for each family.
Coffee and Water received one targeted proportion correction before their
retained source was selected.

| Family | New shell views | Approved effect parts reused |
| --- | ---: | ---: |
| Coffee Machine C02 | 4 | 12 |
| Water Dispenser W02 | 4 | 12 |
| Vending Machine U02 | 4 | 16 |
| Massage Chair R03 | 4 | 12 |
| **Total** | **16** | **52** |

The exact prompts and correction history are recorded in
`assets/art/layout-references/office-facility-upsize-shell-v3/source/IMAGEGEN_PROMPTS.md`.

Each retained source uses a flat magenta background. The installed ImageGen
chroma helper produced an alpha atlas with transparent corners. The asset
compositor then:

1. detects the four alpha-separated source views;
2. crops each authored view;
3. nearest-resizes it uniformly;
4. aligns it to `[48,124]`;
5. places approved Motion V2 parts in declared machine-local regions; and
6. alpha-composites authored foreground shell pixels over moving parts.

The compositor may crop, resize, rotate, alpha-mask, translate, and composite.
It may not use `ImageDraw` or create a visible shell or effect pixel from a
runtime primitive.

## Layer order

| Family | Front composition |
| --- | --- |
| Coffee | rear shell → screen/steam/pour → authored drip-tray lip |
| Water | rear shell → screen/flow/splash → authored tray lip |
| Vending | rear shell → merchandise/display/coil/package → authored delivery lip |
| Massage | rear pod → seat/roller/display → authored rim and arm foreground |

The same front shell and foreground hashes are reused for every motion frame.
All sixteen A-D transitions report zero changed pixels outside declared effect
regions and `[0,0]` pivot drift.

## Review evidence

Batch review:

`assets/art/layout-references/office-facility-upsize-shell-v3/00-shell-v3-batch-review.png`

Each family contains:

1. `01-new-shell-four-sides.png`
2. `02-integrated-seam-a-d-a.png`
3. `03-integrated-finite-use.png`
4. `04-person-interaction.png`
5. `05-layers-regions-pivot.png`
6. one Shell V3 seam-loop GIF
7. one Shell V3 person-interaction GIF

The generated manifest is:

`assets/game/manifests/office-facility-upsize-shell-v3.json`

## Gate state

| Gate | State |
| --- | --- |
| V3 ImageGen source and alpha ownership | Passed |
| Four retained shell views per family | Passed |
| Motion V2 effect reuse | Passed |
| A-D seam closure and exact finite idle return | Passed |
| V3 visual review | `pending-owner-review` |
| 108/432 production rebuild | Blocked |
| Reservation-slot transfer | Blocked |
| F9 / F10 / Active Office | Blocked |

This package is a visual preflight. It does not activate the five candidate
slots and it does not modify the hash-pinned F9 room.

## Commands

```text
npm run art:facility:upsize:shell:v3
npm run art:facility:upsize:shell:v3:rebuild:check
npm run art:facility:upsize:shell:v3:check
```

# Office Facility Upsize Motion Artwork V2

Status: `effects-approved-shell-integration-rejected`

Updated: 2026-07-30

## Decision boundary

The owner accepted the physical design and system behavior of Coffee C02,
Water W02, Vending U02, and Massage R03, but rejected the Production V1 motion
artwork at F8. The rejected visuals used procedural rectangles, bars, lines,
arcs, and simple color bands instead of authored raster effect parts.

Production V1 remains immutable evidence. Its `2 x 2 x 4` geometry, `2 x 2`
footprint, pivots, routes, I01/H01 or seat sockets, capacity rules, reservation
timeline, and approved preflight identities remain accepted. Motion V2
replaces only the visual motion source and stops before the 108/432 production
rebuild.

No reservation slots transfer. F9 and Active Office remain unchanged.

## Subsequent owner review

The owner accepted all 52 Motion V2 effect parts but rejected their visual
integration with the reused four shells. The committed Motion V2 manifest
retains its historical `pending-owner-review` state as immutable evidence.
Integrated Shell V3 consumes the accepted effect cutouts by exact hash and
creates fresh four-side shell pixels with no old-shell pixel reuse. See
`docs/art/OFFICE_FACILITY_UPSIZE_SHELL_V3.md`.

## V1 motion artwork rejection

The Production V1 builder created its runtime effect pixels with drawing
primitives. That implementation met the spatial constraints but did not meet
the owner-approved Arcade G02 visual-production standard.

Motion V2 records:

- V1 system behavior: accepted;
- V1 four cabinet identities: accepted;
- V1 procedural motion artwork: rejected at F8;
- V2 scope: visual motion artwork only; and
- full production rebuild: blocked until V2 visual approval.

## Fresh authored motion sources

Four detached motion atlases were created with built-in ImageGen. The existing
owner-approved four-view sheets were identity and style references only.

| Family | Authored components | Rows |
| --- | ---: | --- |
| Coffee Machine C02 | 12 | display, steam, coffee pour |
| Water Dispenser W02 | 12 | display, water flow, splash |
| Vending Machine U02 | 16 | merchandise, display, coil, package |
| Massage Chair R03 | 12 | articulated seat, roller field, display |
| **Total** | **52** | — |

The exact prompts and source filenames are recorded in:

`assets/art/layout-references/office-facility-upsize-motion-v2/source/IMAGEGEN_PROMPTS.md`

Each source uses a flat magenta background. The installed chroma-key helper
creates the alpha source, and the builder isolates every component by source
box. All four atlas corners are transparent after removal.

## No procedural runtime effect pixels

The runtime asset compositor is:

`scripts/office_facility_upsize_motion_v2_assets.py`

It does not import `ImageDraw` and is forbidden from using drawing primitives
or direct pixel painting. It may only:

- crop an authored source;
- remove the already-declared chroma background;
- resize with nearest-neighbor sampling;
- rotate a declared authored part by an integer quarter turn;
- translate to an integer machine-local region;
- clip to the runtime canvas; and
- alpha-composite authored layers.

Review boards use a separate script and may draw labels and diagram frames.
Those review pixels never feed a processed or runtime asset.

The composition formula is:

`approvedShell + generatedMotionPart[n] + existing H01/seat overlay`

Massage uses the more specific seat-layer formula:

`rearShell + generatedInnerSeat[n] + generatedRoller[n] + actor + foregroundShell`

## Visual sequences

Each family owns:

- four real seam-loop frames `A, B, C, D`;
- a logical wrap from `D` to exact `A`;
- six finite-use frames that return to the initial idle state;
- one machine-only authored seam-loop GIF; and
- one person-interaction GIF using existing sockets.

Across all four families:

- seam frames: `16`;
- finite-use frames: `24`;
- outside-declared-region changes: `0`;
- base-pivot drift: `[0,0]`;
- footprint changes: `0`;
- new coordinate systems: `0`;
- magic offsets: `0`; and
- fallback assets: `0`.

Coffee, Water, and Vending retain the existing primary-hand H01 attachment
formula. Massage retains the approved working-front seat contact and
foreground occlusion order.

## Visual review outputs

Each family provides:

1. `01-authored-source-and-parts.png`
2. `02-authored-seam-loop-a-d-a.png`
3. `03-authored-finite-use.png`
4. `04-person-interaction-closeups.png`
5. `05-shell-region-pivot-lock.png`
6. `<family>-authored-seam-loop.gif`
7. `<family>-authored-interaction.gif`

The batch board is:

`assets/art/layout-references/office-facility-upsize-motion-v2/00-motion-v2-batch-review.png`

All sources, processed parts, composites, review images, and GIFs are locked
by:

`assets/game/manifests/office-facility-upsize-motion-v2.json`

## Gates

| Gate | Status |
| --- | --- |
| V2 source generation | Passed |
| V2 alpha ownership | Passed |
| V2 authored part composition | Passed |
| V2 visual owner review | `pending-owner-review` |
| F4-F7 case rebuild | Blocked |
| F8 production approval | Blocked |
| Five-slot transfer | Blocked |
| F9 | Blocked |
| F10 / Active Office | Blocked |

If the owner rejects any visual, only that family's atlas and derived review
outputs are revised. The accepted spatial and reservation implementation is
not rebuilt during visual iteration.

After the owner approves all four V2 visual hashes, a separate production
revision may regenerate the 108 actor cases, 432 orientation cases, and
30-second reservation proof per family. Slot transfer still requires the
subsequent production F8 decision.

## Reproduction

```bash
npm run art:facility:upsize:motion:v2
npm run art:facility:upsize:motion:v2:rebuild:check
npm run art:facility:upsize:motion:v2:check
```

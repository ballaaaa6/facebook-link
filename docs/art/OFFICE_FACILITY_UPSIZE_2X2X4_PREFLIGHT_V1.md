# Office Facility 2x2x4 Visual Preflight V1

Status: `pending-owner-review` at F3

Date: 2026-07-30

This isolated visual preflight replaces neither the accepted production
families nor the current F9 room. It creates four fresh, floor-standing
`2 x 2 x 4` candidates with four visible sides each, then stops so the owner
can judge their silhouettes before any animation, actor matrix, reservation
simulation, or room replacement is built.

## Scope

| Candidate | Current production authority | New visual identity | Planned instances / slots after F8 |
| --- | --- | --- | ---: |
| Coffee Machine C02 | C01-r02, `2 x 2 x 2`, counter-supported | Floor-standing four-side cabinet | 1 / 1 |
| Water Dispenser W02 | W01, `1 x 1 x 3`, front-only | Broad four-side cabinet | 2 / 2 |
| Vending Machine U02 | U01-r03, `2 x 1 x 3`, front-only | Broad four-side cabinet | 1 / 1 |
| Massage Chair R03 | R02, `2 x 2 x 2`, front-only | Enclosed four-side lounge pod | 1 / 1 |

The batch contains four families and 16 isolated visual views. Every candidate
uses a `2 x 2` floor footprint, a `3 x 4` render box, a `384 x 512` authoring
canvas, a `96 x 128` runtime canvas, and integer divisor `4`. The common
runtime base and sort pivot is `[48, 124]`.

The batch lineup is
[`00-batch-2x2x4-lineup.png`](../../assets/art/layout-references/office-facility-upsize-v1/00-batch-2x2x4-lineup.png).

## Fresh ImageGen source policy

All four source masters were generated in built-in ImageGen mode for this
preflight. No current family pixels, Active Office pixels, processed foreign
family pixels, rejected candidate pixels, or original master pixels were
provided as image inputs. The generated masters therefore establish new
visual identities instead of repairing or enlarging old rasters.

The common prompt specification was:

> Create one square 2-by-2 reference sheet containing exactly one facility
> design in four clean orthographic game-sprite elevations: top-left FRONT,
> top-right RIGHT, bottom-left BACK, bottom-right LEFT. Use crisp low-resolution
> pixel-art styling, chunky dark outlines, warm ivory panels, charcoal and navy
> structure, restrained cyan-blue accents, consistent scale and baseline, and
> a flat solid `#ff00ff` chroma background. Keep each object wholly inside its
> quadrant with generous empty gutters. Use no text, logo, brand, people,
> loose props, products, scenery, cast shadow, or floor shadow.

The family-specific prompt additions were:

- Coffee Machine C02: a tall premium floor-standing bean-to-cup cabinet with
  a small dark display, machine-local illuminated controls, dispensing bay,
  lower service door, and rear ventilation; not a countertop appliance.
- Water Dispenser W02: a broad floor-standing hydration cabinet with one
  recessed dispensing niche, hot/cold machine-local controls, drip tray,
  lower service/storage panel, and rear ventilation; no exposed bottle.
- Vending Machine U02: a broad modern vending cabinet with a dark empty
  product-window region, right-side machine-local selection controls, payment
  and pickup regions, serviceable side panels, and rear ventilation; no
  branded products.
- Massage Chair R03: an enclosed premium massage pod with a padded seated
  cavity, high hood, arm/control region, heavy base, coherent rear enclosure,
  and believable entry from the front; no person.

ImageGen returned four `1254 x 1254` chroma masters. The ImageGen skill helper
`remove_chroma_key.py` then used border auto-key sampling, soft matte,
transparent threshold `12`, opaque threshold `220`, and despill. The resulting
alpha masters have transparent corners and zero visible magenta-dominant
pixels. The extraction did not use generative repair.

| Source | Sampled key | Transparent pixels | Partial-alpha pixels |
| --- | --- | ---: | ---: |
| Coffee C02 | `#fb03fa` | 1,056,490 | 8,329 |
| Water W02 | `#f903ee` | 1,035,002 | 8,799 |
| Vending U02 | `#f903f2` | 930,545 | 9,153 |
| Massage R03 | `#f803ef` | 980,713 | 10,304 |

Original chroma and keyed alpha sources are retained under
`assets/art/layout-references/office-facility-upsize-v1/source` and
`source-alpha`. The builder splits the fixed quadrant order `front`, `right`,
`back`, `left`; it fails when visible alpha touches a source-cell boundary.

## Geometry and orientation preflight

The preflight creates all four visual orientations because future right-edge
room placement may expose a side or rear elevation. It does not claim that
side interaction poses already exist.

| Visual orientation | Local approach cell |
| --- | --- |
| Front | `[2, 4]` |
| Right | `[4, 2]` |
| Back | `[2, 0]` |
| Left | `[0, 2]` |

All four orientations share the same collision footprint and pivot. At F3 the
`productionEnabledOrientations` list remains empty. Side-facing use, rotated
route cases, and the Massage side-seated pose require explicit production
proof after owner approval.

## Modular motion plan

The review boards declare future child regions only. They contain zero
production animation frames and zero actor cases.

- Coffee C02 keeps an immutable orientation shell. Status viewport A-D,
  control lights, brew light, coffee stream, steam, and the empty output bay
  become local children. The existing H01 coffee mug remains the held prop.
- Water W02 keeps an immutable shell. Status viewport A-D, control lights,
  dispense stream, and drip effects become local children. Existing H01 water
  handling remains authoritative.
- Vending U02 keeps an immutable shell. Product/status viewport A-D,
  machine-local controls, payment light, and finite pickup state become local
  children. Existing vending held-prop rules remain authoritative.
- Massage R03 keeps an immutable enclosure and base. Status light A-D,
  upholstery pressure pulse, and recline child states may move locally while
  base pivot, sort pivot, and footprint stay fixed. It does not invent a held
  prop.

Every future repeated motion must use the approved composition rule:
immutable shell plus machine-local child frames forming a deterministic
seam loop. A-D content may change only inside its declared child region.
Shell pixels, collision, footprint, and pivots must not drift.

## Counter, slots, and F9 isolation

Counter A01-r02 remains owner-approved and is retained. Coffee C02 is designed
to stand on the floor, so the Counter is no longer a Coffee support dependency,
but this preflight does not delete it or silently place it elsewhere.

Facility v1 remains `20/20` through the current accepted families. These new
candidates contribute zero slots at F3. If all four later pass F8, five slots
transfer from their predecessors to the new families without double-counting.

The current `office.furniture-only-room.f9.v1` is hash-pinned and unchanged.
Future F9 v2 must preserve:

- ten workstations in two rows anchored at `C12`;
- all people hidden;
- the 200 route-query contract;
- separate footprint, approach, route, reservation, and decor layers; and
- no Active Office promotion.

## Review evidence

Each family owns five `1600 x 1000` boards:

1. four-side clean;
2. alpha and source ownership;
3. canonical-person scale and geometry;
4. floor footprint and orientation approaches; and
5. modular motion regions.

The folders are:

- `assets/art/layout-references/office-facility-upsize-v1/coffee-machine-c02`
- `assets/art/layout-references/office-facility-upsize-v1/water-dispenser-w02`
- `assets/art/layout-references/office-facility-upsize-v1/vending-machine-u02`
- `assets/art/layout-references/office-facility-upsize-v1/massage-chair-r03`

The machine-readable batch authority is
`assets/game/manifests/office-facility-upsize-2x2x4-preflight-v1.json`.

## Gates and commands

F0 fresh-source isolation, F1 geometry, and F2 ownership pass. F3 is
`pending-owner-review`. F4-F10, reservation transfer, F9 replacement, and
Active Office promotion remain blocked.

```powershell
npm run art:facility:upsize:preflight
npm run art:facility:upsize:preflight:rebuild:check
npm run art:facility:upsize:preflight:check
```

After the owner approves exact review hashes, the next revision may build
modular motion, interaction poses, the 18-character matrix, and the
30-second contention/failure/release/retry proof. Until then, this work stops
at visual preflight.

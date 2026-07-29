# Warm Studio Office BOM

Status: Historical inventory and capacity reference

Furniture reset directive (2026-07-29): every reuse instruction in this file
is revoked for new Office candidates. The active map and registry remain
rollback evidence only. The object counts, capacity targets, and physical
dimensions below may inform requirements, but none of the named current,
legacy, derived, or existing library assets is promotable. R05-r02 is the sole
furniture exception. Follow
`docs/art/OFFICE_FURNITURE_PRODUCTION_GATES.md` for all new asset work.

## Production Rule

Only assets referenced by `assets/game/maps/office-c-v2.json` are rendered for the active integer-grid scene. Extra catalog variants remain deferred until a real layout requires them.

## Facility v1 Reservation Contract

Facility capacity is measured in shared reservation slots, not in the number
of furniture objects. The target contract has 20 slots and is the planning
input for the final character action rows. A sofa can contribute several slots,
while one reusable raster asset can be placed more than once.

| Facility | Object count | Shared slots | Action family |
| --- | ---: | ---: | --- |
| Water dispenser | 2 | 2 | `interact-use` / drink |
| Coffee machine | 1 | 1 | `interact-use` / drink |
| Printer | 2 | 2 | `interact-use` / pickup |
| Server rack | 2 | 2 | `inspect` |
| Vending machine | 1 | 1 | `interact-use` |
| Refrigerator | 1 | 1 | `interact-use` |
| Mission review table | 1 | 4 | `review` |
| Sofa zone | 2 (3+2 seats) | 5 | `lounge` |
| Massage chair | 1 | 1 | `lounge` |
| Game machine | 1 | 1 | `interact-use` |
| **Total** | **14** | **20** | — |

The object count is an authored-layout target, not a cell multiplier. Reuse a
single accepted asset for repeated objects unless a deliberate visual variant
is required. The five sofa seats remain five independently reservable slots
even when the sofa is split into two furniture objects.

Current Facility v1 readiness is `15/20` after Arcade G02 F8 approval. The
remaining five slots are Server Rack N01 (`2`), Refrigerator R01 (`1`), and
Printer P01 (`2`). Server Rack N01 is currently an F0-F3 visual preflight, so
its two planned instances do not yet contribute slots.

### Facility asset generation plan

The current registry already contains reusable visuals for most Facility v1
objects. The numbers below are generation cells, not map placements:

| Facility | Planned objects | Reuse or create | Cell plan |
| --- | ---: | --- | ---: |
| Water dispenser | 2 | Reuse `dispenser.water` | 1 existing |
| Coffee machine | 1 | Reuse `machine.coffee` | 1 existing |
| Printer | 2 | Reuse `printer.desktop` plus paper overlay | 1 existing |
| Server rack | 2 | Reuse `server.rack` plus status overlay | 1 existing |
| Vending machine | 1 | Create one facility asset | 1 new |
| Refrigerator | 1 | Create one facility asset | 1 new |
| Mission review table | 1 | Reuse `table.meeting.empty` | 1 existing |
| Sofa zone | 2 (3+2 seats) | Create two footprint variants: 3-seat and 2-seat | 2 new |
| Massage chair | 1 | Create one facility asset | 1 new |
| Game machine | 1 | Create one facility asset | 1 new |

That locks the Facility v1 addition at six new facility cells: four
unambiguous missing facility assets plus two sofa footprint variants. The
second printer, second dispenser, and second rack are placements of accepted
assets, not additional generation work. Every new cell still needs an integer
render box, floor footprint, approach anchor, interaction-facing metadata, and
a separate overlay where its activity changes.

The six-cell count assumes one map-required orientation for each fixed Facility
v1 shell. Vending, refrigerator, massage chair, game machine, and both sofa
footprint variants are placed in authored directions. Do not generate extra
side or rear views unless the expanded 15-workstation map introduces an actual
placement or interaction-facing requirement for them.

### Facility scale contracts

The scale contract in `docs/art/OFFICE_ASSET_CREATION_GUIDE.md` and
`docs/art/OFFICE_COORDINATE_SYSTEM.md` is the source of truth for generation
prompts. Its canonical adult is `1 x 1 x 3`.
Facility v1 uses these locked physical scales:

| Facility | W x D x H | Render box | Floor footprint | Extra approach |
| --- | ---: | ---: | ---: | ---: |
| Water dispenser | `1 x 1 x 3` | `1 x 3` | `1 x 1` | One front tile |
| Coffee machine | `1 x 1 x 2` | `1 x 2` | Parent counter | One counter-facing slot |
| Printer | `2 x 1 x 1` | `2 x 1` | Parent credenza | One pickup slot |
| Server rack | `2 x 1 x 3` | `2 x 3` | `2 x 1` | One front tile |
| Vending machine | `2 x 1 x 3` | `2 x 3` | `2 x 1` | One front tile |
| Refrigerator | `2 x 1 x 3` | `2 x 3` | `2 x 1` | One front tile |
| Mission review table | `6 x 2 x 2` | `6 x 3` | `6 x 2` | Four external seats |
| Modern three-seat sofa | `4 x 2 x 2` | `4 x 3` | `4 x 2` | Three lounge slots |
| Modern two-seat sofa | `3 x 2 x 2` | `3 x 3` | `3 x 2` | Two lounge slots |
| Massage chair | `2 x 2 x 2` | `2 x 3` | `2 x 2` | One front entry tile |
| Game machine | `2 x 2 x 3` | `3 x 3` | `2 x 2` | One front interaction tile |

The approach area is navigation clearance, not part of the furniture's
physical `W x D x H`. Source art is cropped and scaled uniformly into the
declared render box; it must never be stretched independently by axis.

### Decorative motion plan

The active Office page targets 43 reusable base asset types: 29
functional/support assets and 14 decorative assets. Every base type still owns
one static shell cell. Animation adds overlay/keyframe cells; it does not
increase object count, reservation capacity, or collision geometry.

| Decorative base asset | v1 behavior | Cell contract |
| --- | --- | ---: |
| `tv.wall` | Seam-loop screen scene | 1 existing shell + 4 source cells; 4 derived runtime frames |
| `lamp.desk`, `lamp.floor` | Static in v1; animate one selected lamp family in full polish | 1 shell each; 4 cells for the selected ambient set |
| `plant.small`, `plant.tall`, `plant.potted` | Static in v1; animate one selected plant family in full polish | 1 shell each; 4 cells for the selected ambient set |
| `art.wall`, `bookshelf.magazine`, `cup.coffee`, `papers.stack` | Static | 1 cell each |
| `bin.waste`, `divider.planter`, `extinguisher.wall`, `pet-bed.round` | Static | 1 cell each |

For the recommended Facility v1 seam-loop motion tier, create 18 new source
cells total:

- Six missing facility shell cells.
- Four TV screen-content cells.
- Four vending display-content cells.
- Four game display-content cells.

For full ambient polish, replace the Facility v1 display sources with the
four-frame mechanical contract and produce 62 new source cells total as
defined in `docs/art/ASSET_SHEET_PLAN.md`. The tiers are alternatives; never
add 18 and 62 together.

All animated displays must be authored as seam loops: frame D is a natural
predecessor of frame A, and the four frames form one continuous scene, status
sequence, or game. The modern furniture skin uses brighter surfaces and
controlled cyan, teal, lime, amber, and coral accents while retaining the
same shell silhouette, anchor, and collision footprint in every frame.

The current map is still an implementation baseline with ten active agents
and two reserved workstation modules. Expanding to the 15-person target
requires a map/workstation expansion in the same change set as the facility
placement; it must not be assumed that the current 36 x 24 map already
supports 15 people.

### Non-reservation decoration

The following remain decor or personal-station assets until an interaction
contract is explicitly added: 15 personal locker compartments, speakers,
figure display cases, non-interactive bookshelves, beanbags without booking,
decorative lights, and small ornaments.

Phase 2 may add beanbags (4 slots), a board-game table (4 slots), a reading
area (1–2 slots), a second massage chair, a second game machine, and a second
coffee machine.

Those Phase 2 facility additions already have reusable library candidates in
the modern-bright source set: `beanbag.lounge`, `table.board-game`,
`bookshelf.reading`, `chair.reading`, `chair.massage.modern`,
`machine.game.arcade.modern`, and the coffee-machine loop. Reuse those assets;
do not generate duplicates merely to represent the second placement.

The library-only decoration batch is documented in
`docs/art/ASSET_SHEET_PLAN.md` as three controlled sheets, now generated and
extracted:

- `env-09-phase2-completion-architecture`: missing formal Phase 2 side views,
  the fifth system/management screen theme, and the three planned catalog gaps
  (`light.wall.decorative`, `ornament.small`, `partition.glass`) plus shared
  wall/safety props.
- `env-10-storage-operations-detail`: storage, waste/recycling, first-aid,
  safety, CCTV, and support-room detail.
- `env-11-comfort-personal-detail`: small plants, lounge comfort, desk
  personalisation, and cable/headphone details.

These sheets add 48 library cells but zero reservation slots. They remain
deferred from the active map and runtime registry until a future layout selects
specific assets.

When a future layout rotates an existing functional shell, use the two
orientation-only sheets now generated and available in the library (runtime
integration remains deferred):

- `env-12-facility-side-orientations`: 16 side cells for vending, refrigerator,
  arcade, massage chair, server rack, printer, water dispenser, and coffee
  machine shells.
- `env-13-lounge-storage-side-orientations`: 16 side cells for sofas, storage
  cabinets, shelf, utility cart, board-game table, and glass partition shells.

These are turns of existing assets, not new furniture identities. They add zero
Facility v1 reservation slots and should be generated only when a rotated
placement requires them.

## Core Furniture

| Asset | Initial quantity | Notes |
| --- | ---: | --- |
| Standard desk, up-facing | 7 | Shared by research and release agents. |
| Creative desk, up-facing | 2 | Uses equipment overlays for copy and visual work. |
| NOC desk, up-facing | 1 | Uses multi-monitor and network overlays. |
| Office chair, up-facing | 10 | Seat point and foreground mask are shared. |
| Empty meeting table | 1 | Table-only raster; seats are never baked into it. |
| Meeting chair | 4 | Independent seats around the meeting table. |
| Sectional sofa | 1 | Lounge idle location. |
| Coffee counter | 1 | Shared interaction point. |
| Printer credenza | 1 | Printing facility with supported surface attachment. |
| Server rack | 2 | Systems support equipment. |
| Water dispenser | 1 | Shared interaction point. |
| Tall plant | 4 | Work-floor rhythm and edge framing. |
| Small plant | 7 | Desk spacing and support-floor decoration. |
| Planter divider | 1 | Soft support-zone structure without a wall. |
| Round pet bed | 1 | Mascot idle location. |
| Entry rug | 1 | Code-rendered entry cue; no decorative door. |

## Equipment Overlay Targets

- Standard single-monitor workstation (4).
- Dual-monitor analytics workstation (1).
- Creative drawing-tablet workstation (1).
- Visual production monitor and camera station (1).
- Multi-device publishing preview station (1).
- NOC multi-monitor console (1).
- Server racks, printer, coffee machine, water dispenser, camera, and studio light.

## Rendered Scene Layers

The map's `objects` array is the source of truth for the visible office scene. Each object has either a logical grid position or a parent/slot attachment, plus a rendering layer and anchor. The web renderer resolves image scale and physical support (`floor`, `wall`, `ceiling`, `desk-surface`, `table-surface`, `counter-surface`, `credenza-surface`, or `rack-surface`) through the office asset registry so furniture, equipment, decor, and characters keep believable proportions across responsive viewports.

Desk equipment must attach to its workstation rather than duplicate the desk coordinates. Wall equipment must use a wall anchor, and floor props must use a bottom contact point. Storage props stay at zone edges so the central mission and walking lanes remain clear.

## Code-Generated Assets

- Floors, walls, rugs, collision geometry, and simple shadows.
- Monitor content, charts, task status, server LEDs, alert glow, coffee steam, and camera rotation.
- Theme A/B palette maps, lighting overlays, and UI color tokens.

## Retired Utility Batch

`office-utility-c-v1` remains archived for provenance but is not imported by the
active Office runtime. Its flat SVG presentation did not match the shaded Warm
Studio raster language. New visible furniture must be produced against Concept
C, extracted to transparent raster output, registered with integer geometry,
and accepted through desktop and mobile scene review.

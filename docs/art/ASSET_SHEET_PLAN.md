# Controlled Asset Sheet Plan

## Goal

Reduce generation latency without sacrificing usable geometry. Static furniture and props are generated as controlled 4x4 asset sheets. Identity-sensitive character work animations use one character per sheet.

Execution gate (2026-07-27): Steps 1-4 in
`docs/art/OFFICE_GEOMETRY_REMEDIATION_ROADMAP.md` are complete. A new Office
sheet requires an approved `regenerate` audit record; deterministic cleanup or
composition requires `derive-composite`. Every sheet reads the accepted
Camera/Scale Bible. Active Office promotion remains a separate later gate.

Workstation staging gate (2026-07-27): Steps 5-8 are accepted-staging. The
canonical `desk.modular.v1` prototype is project-authored and deterministic,
not an image-generation sheet. It is one bare physical family with four
orthographic orientations and four compositing parts per orientation. Role
equipment, chairs, actors, and monitor content remain separate children under
`office.workstation.bundle.v1`; none of these staging assets is imported by
Active Office.

Derived-asset staging gate (2026-07-27): Steps 13-16 resolve all 77 reviewed
`derive-composite` records under `office-derived-v1`. The versioned outputs
reuse source pixels only, retain source canvas coordinates, and remain absent
from the Active Office registry. Sixteen coherent inputs are explicitly
verified no-op derivatives; their pixels must not be removed without a new
reviewed mask or disposition.

## Shared Sheet Contract

- Square contact sheet with a logical 4x4 grid.
- One isolated asset or frame per cell.
- Large uniform magenta chroma-key background.
- No cell labels, text, logos, watermarks, ground planes, cast shadows, or overlapping assets.
- Generous empty padding around every object.
- Fixed top-down perspective, light direction, outline weight, and Concept C palette.
- Furniture views are straight orthographic only. A side view is an exact
  90-degree turn; oblique, diagonal, three-quarter, and perspective views are
  rejected.
- This is a hard production gate for every asset and every orientation:
  front is a straight 0° view, back is the exact horizontally flipped front
  shell at 180°, left/right are strict 90° profile views. Any visible
  three-quarter angle, diagonal tilt, foreshortened depth, or perspective top
  surface is rejected and the sheet must be regenerated.
- `table.review.long.modern` is the single authored exception: it remains
  centered at 0° with parallel edges and no side rotation, while a slightly
  raised frontal camera exposes the tabletop surface and both legs.
- Every cell manifest includes the locked physical `W x D x H`, integer
  `renderBox`, integer floor `footprint`, support surface, and anchor from
  `assets/game/manifests/office-camera-scale-bible.json`.
- Runtime entries read these values from
  `assets/game/manifests/office-assets.json`; pre-production entries read them
  from `assets/game/manifests/office-planned-assets.json`. Use
  `npm run art:prompt -- <asset-id>` instead of transcribing scale values.
- All prompts compare the object against the canonical `1 x 1 x 3` standing
  adult without drawing the adult inside the exported asset cell.
- Cell order is defined outside the image in a JSON manifest.
- Failed cells are regenerated as a targeted row or smaller sheet; accepted cells are not regenerated.

## Orientation Allocation Gate

Every manifest declares `requiredOrientations` from current map placements,
workstation facing, facility approach, interaction facing, footprint, and
occlusion needs before cells are assigned:

- Use one cell for a fixed-front, wall-mounted, rotationally symmetric, or
  single-direction object.
- Use two cells when only front/back or horizontal/vertical footprints are
  required.
- Use three cells for front, back, and one side only when runtime mirroring is
  safe.
- Use four cells only for a genuinely rotatable or asymmetric asset whose
  left/right geometry cannot be mirrored safely.

The 4x4 sheet is batching capacity, not an instruction to invent four views
for every object. Never spend cells on an orientation that has no active map
placement or interaction contract. If a later layout needs another view,
generate that view as a targeted sheet without replacing accepted cells.

## Environment Sheets

1. `env-01-core-furniture`: reusable core furniture families using only their
   manifest-required orientations, up to four views per family.
2. `env-02-workstations`: computer, monitor, laptop, printer families by idle/active/waiting/error states.
3. `env-03-research-creative`: sixteen zone-specific research and creative props.
4. `env-04-release-noc`: sixteen publishing, QA, networking, and server props.
5. `env-05-lounge-large`: sofa, coffee counter, tables, storage, and mascot-resting furniture.
6. `env-06-decor-small`: plants, cups, documents, boxes, bins, lamps, and small decoration.
7. `env-07-animated-mechanical`: four mechanical props with four key frames each.
8. `env-08-animated-ambient`: four ambient props with four key frames each.
9. `office-furniture-c-v2`: targeted Concept C raster replacements for visible
   furniture that cannot be assembled from accepted production assets.

### Library expansion sheets (env-09 through env-11)

The first eight environment sheets and the modern office chair turnaround are
already extracted into the library. The following three controlled sheets are
also generated and extracted; their source and cell contracts remain here as
the source of truth. They are library-only additions: they do not increase
Facility v1 reservation capacity, alter the current map, or authorize runtime
imports by themselves.

All three sheets use a 4x4 logical grid, modern-bright Concept C raster style,
straight orthographic views, a flat `#ff00ff` source background, and no text,
logos, labels, or baked characters. Cell IDs below are the manifest IDs to use
when the sheets are generated and extracted.

#### `env-09-phase2-completion-architecture`

Purpose: close the formal Phase 2 orientation/theme gap and supply the
architecture/safety pieces most likely to be needed when a future layout adds
partitions and shared walls.

| Cells | IDs | Locked size / support |
| --- | --- | --- |
| 1–2 | `desk.workstation.left`, `desk.workstation.right` | `3x2x2`, floor |
| 3–4 | `monitor.shell.left`, `monitor.shell.right` | `2x1x2`, desk surface |
| 5–8 | `screen.theme.system.a` … `screen.theme.system.d` | `2x0x1`, monitor viewport overlay |
| 9 | `light.wall.decorative` | `1x0x1`, wall |
| 10 | `ornament.small` | `1x1x1`, desk/table/counter/rack surface |
| 11 | `partition.glass` | `4x1x3`, floor |
| 12 | `whiteboard.mobile` | `3x1x3`, floor |
| 13 | `pinboard.team` | `3x0x2`, wall |
| 14 | `sign.exit.modern` | `1x0x1`, wall |
| 15 | `emergency.light.wall` | `1x0x1`, wall |
| 16 | `cable.cover.floor` | `2x1x1`, floor |

The four system frames are one seam loop, not four different dashboards. Keep
the monitor shell and inner viewport fixed; only local CPU/memory/status
content changes.

#### `env-10-storage-operations-detail`

Purpose: storage, safety, and operations details for zone edges, support
rooms, and future facility approaches. These are non-reservation props unless
a later interaction contract explicitly promotes one.

| Cells | IDs | Locked size / support |
| --- | --- | --- |
| 1 | `cabinet.storage.low` | `2x1x2`, floor |
| 2 | `cabinet.storage.tall` | `2x1x3`, floor |
| 3 | `cart.utility` | `2x1x2`, floor |
| 4 | `shelf.storage.tall` | `2x1x3`, floor |
| 5 | `drawer.archive` | `2x1x2`, floor |
| 6 | `bin.waste.modern` | `1x1x1`, floor |
| 7 | `bin.recycling.modern` | `1x1x1`, floor |
| 8 | `bin.paper.modern` | `1x1x1`, floor |
| 9 | `mail.sorter` | `2x1x2`, desk/counter surface |
| 10 | `document.tray` | `1x1x1`, desk/table/counter surface |
| 11 | `label.box` | `1x1x1`, desk/table/counter surface |
| 12 | `first.aid.wall` | `2x0x1`, wall |
| 13 | `extinguisher.wall.modern` | `1x0x2`, wall |
| 14 | `cctv.camera.wall` | `1x0x1`, wall |
| 15 | `smoke.detector.wall` | `1x0x1`, wall |
| 16 | `clock.digital` | `2x0x1`, wall |

Use blank package faces and abstract indicator marks only. Do not put readable
brand names, safety claims, or UI copy into these small props.

#### `env-11-comfort-personal-detail`

Purpose: small comfort and personalisation props that can be attached to
desks, lounge furniture, walls, or zone edges without changing navigation or
reservation geometry.

| Cells | IDs | Locked size / support |
| --- | --- | --- |
| 1 | `plant.hanging` | `2x0x2`, wall |
| 2 | `plant.corner.large` | `2x1x3`, floor |
| 3 | `planter.round` | `1x1x1`, floor/table surface |
| 4 | `cushion.lounge` | `1x1x1`, sofa/beanbag surface |
| 5 | `footrest.office` | `1x1x1`, floor/desk vicinity |
| 6 | `stool.side` | `1x1x2`, floor |
| 7 | `coat.hooks.wall` | `2x0x1`, wall |
| 8 | `bag.hook.wall` | `1x0x1`, wall |
| 9 | `mug.stack` | `1x1x1`, desk/counter surface |
| 10 | `water.cup.stack` | `1x1x1`, counter surface |
| 11 | `stationery.cup` | `1x1x1`, desk surface |
| 12 | `pen.stand` | `1x1x1`, desk surface |
| 13 | `headphone.hook` | `1x0x1`, wall/desk surface |
| 14 | `desk.nameplate.blank` | `2x0x1`, desk surface; blank face |
| 15 | `monitor.arm` | `1x1x2`, desk surface |
| 16 | `cable.grommet` | `1x1x1`, desk surface |

Personal-detail props must remain isolated objects. Do not bake them into the
desk, chair, monitor, or character; attachment and randomisation happen later
through surface slots.

Generation order was fixed as `env-09`, then `env-10`, then `env-11` because
`env-09` closes the formal Phase 2 gap. If a future replacement is needed,
regenerate only the failed row/cells and preserve accepted cells.

### Orientation extension sheets (env-12 and env-13)

Status: generated and extracted into the office library. These sheets contain
only exact side turns of accepted shells; they do not introduce new furniture
identities, slots, props, or runtime registrations.

These sheets are not new furniture families. They are additional orthographic
views of accepted assets already present in the library. Each row contains the
same existing shell rendered from `side-left` and `side-right`; the source
front view remains the identity anchor.

Orientation extensions must preserve the original asset's:

- physical `W x D x H`, render box, floor footprint, and support surface;
- palette, material treatment, outline weight, and lighting direction;
- interaction-facing height and bottom/center anchor;
- animation shell silhouette, when the source asset owns a screen or loop.

Do not bake characters, approach markers, interaction icons, or new props into a
side cell. A side view is accepted only when it is an exact turn of an existing
asset, not a redesigned variant. Runtime may mirror a side view only after the
asset is proven left/right symmetric; keep both cells for asymmetric shells.

#### `env-12-facility-side-orientations`

16 cells, eight existing Facility/operations shells × two side views:

| Cells | Existing source asset | Physical size | Side cells |
| --- | --- | --- | --- |
| 1–2 | `vending.machine.modern` | `2x1x3` | `side-left`, `side-right` |
| 3–4 | `refrigerator.modern` | `2x1x3` | `side-left`, `side-right` |
| 5–6 | `machine.game.arcade.modern` | `2x2x3` | `side-left`, `side-right` |
| 7–8 | `chair.massage.modern` | `2x2x2` | `side-left`, `side-right` |
| 9–10 | `server.rack.noc` | `2x1x3` | `side-left`, `side-right` |
| 11–12 | `printer.desktop` shell | `2x1x1` | `side-left`, `side-right` |
| 13–14 | `dispenser.water` shell | `1x1x3` | `side-left`, `side-right` |
| 15–16 | `machine.coffee` shell | `1x1x2` | `side-left`, `side-right` |

Mechanical/ambient frame sets are not redrawn here. If one of these shells is
later animated, the existing A–D content frames remain overlays on the same
side-stable shell.

#### `env-13-lounge-storage-side-orientations`

16 cells, eight existing lounge/storage/table shells × two side views:

| Cells | Existing source asset | Physical size | Side cells |
| --- | --- | --- | --- |
| 1–2 | `sofa.modern.three-seat` | `4x2x2` | `side-left`, `side-right` |
| 3–4 | `sofa.modern.two-seat` | `3x2x2` | `side-left`, `side-right` |
| 5–6 | `cabinet.storage.low` | `2x1x2` | `side-left`, `side-right` |
| 7–8 | `cabinet.storage.tall` | `2x1x3` | `side-left`, `side-right` |
| 9–10 | `shelf.storage.tall` | `2x1x3` | `side-left`, `side-right` |
| 11–12 | `cart.utility` | `2x1x2` | `side-left`, `side-right` |
| 13–14 | `table.board-game` | `3x3x2` | `side-left`, `side-right` |
| 15–16 | `partition.glass` | `4x1x3` | `side-left`, `side-right` |

`whiteboard.mobile` remains front-only for now because its current contract
places it against a wall. Add a targeted side pair only when a layout actually
uses it as a room divider or freestanding prop.

These two sheets add 32 orientation cells but zero new furniture identities,
reservation slots, or animation families. They are generated only to support
future rotated placements; the current front-facing facility layout can
continue using the existing shells.

Floors, walls, rugs, glass partitions, and simple architectural tiles are generated deterministically from the locked palette so their edges tile perfectly. They are not delegated to image generation.

Code may render non-pictorial architecture such as floor fields, rugs, route
debugging, and shadows. Visible furniture and decorative props must use the
accepted shaded raster language; the retired `office-utility-c-v1` SVG batch
must not be imported by the active scene.

## Static and Motion Cell Budget

Count the physical object and its local motion separately:

- A rigid furniture shell or static decoration uses one cell per required
  orientation. Desks, chairs, tables, sofas, cabinets, shelves, refrigerators,
  massage chairs, wall art, cups, papers, boxes, bins, dividers, and pet beds
  do not receive duplicate cells merely to fill an animation timeline.
- A screen, LED, indicator, or other local display uses four true seam-loop
  keyframes (`A`, `B`, `C`, `D`). Runtime plays `A-B-C-D-A`; do not store
  duplicate return frames. The frames must depict one continuous scene,
  dashboard, or game state.
- A mechanical or ambient motion that changes more than a local display uses
  four true seam-loop keyframes. The base anchor, render box, collision
  footprint, and support surface remain unchanged in every frame.
- Use a locked shell plus changing-content source during authoring. Then
  precompose full-frame runtime variants from that shell when the renderer
  benefits from a single asset. Do not independently redraw three or four
  complete copies of a TV, vending machine, game machine, printer, server
  rack, water dispenser, coffee machine, or lamp.

The approved production tiers are alternatives, not cumulative budgets:

| Tier | Included work | New cells |
| --- | --- | ---: |
| Static-only Facility v1 | Six missing facility shells | 6 |
| Facility v1 seam-loop motion | Six shells plus four-frame TV, vending, and game sources | 18 |
| Full ambient polish | Six shells, four mechanical sets x 4, four ambient sets x 4, five monitor themes x 4, and one TV seam-loop x 4 | 62 |

The full-polish mechanical sets are vending display/mechanism, game display,
printer paper/status, and server status. They replace the simpler four-frame
vending and game sources from the Facility v1 seam-loop tier; do not count both
versions. The ambient sets are water indicator, coffee steam/indicator, plant
sway, and lamp brightness. The TV remains a one-cell shell with a separate
four-frame screen source, plus four derived full-frame runtime variants.

## Transient Held-Prop Sheet

`held-props-modern-bright-v1` is one controlled 4x4 sheet of character-scale
objects. These are not furniture, world-collision objects, or pixels baked into
a character atlas. Runtime attaches one selected prop to a recorded hand anchor
only during an interaction and removes it before the actor leaves the facility.

| Cell | Asset ID | Primary pools |
| ---: | --- | --- |
| 1 | `held.water-cup.clear` | water |
| 2 | `held.water-cup.blue` | water |
| 3 | `held.water-bottle` | water, refrigerator |
| 4 | `held.coffee-mug` | coffee, sofa |
| 5 | `held.takeaway-cup` | coffee |
| 6 | `held.tea-cup` | coffee |
| 7 | `held.soda-can` | vending |
| 8 | `held.juice-box` | vending, refrigerator |
| 9 | `held.snack-bag` | vending |
| 10 | `held.yogurt-box` | refrigerator |
| 11 | `held.paper-sheet` | printer, review |
| 12 | `held.envelope` | printer |
| 13 | `held.label-card` | printer |
| 14 | `held.tablet` | review, server |
| 15 | `held.notebook` | review, sofa, massage |
| 16 | `held.smartphone` | sofa, massage |

The sheet uses the same magenta source background, modern-bright palette,
outline weight, lighting, cell padding, and no-text/no-logo requirements as the
environment library. Every cell contains one isolated handheld object in a
consistent front presentation. Stacks, furniture-scale desk props, hands, and
characters are rejected.

Each extracted prop records a normalized grip anchor, character-relative scale,
and front/back hand-layer role. Facility pools may also contain an explicit
`none` entry. Selection is deterministic for
`agentId + facilitySlotId + visitIndex`, remains stable for the complete
interaction, and avoids the immediately previous selection when the pool has
an alternative.

The six-frame `interact-front` contract is:

1. reach with no prop;
2. facility response with no prop;
3. selected prop appears at the output or hand anchor;
4. hold or inspect;
5. hold or inspect;
6. lower the hand and remove the prop before departure.

Water, coffee, and printer variants keep silhouettes compatible with their
existing loops. The vending tray is processed into an item-neutral shell so a
selected can, juice box, or snack bag never conflicts with baked output art.
The refrigerator remains static in v1; its selected prop appears at the hand
anchor without a door-opening animation. No carry-walk or side-facing facility
rows are added.

## Character Sheets

- Commercial replacement work follows
  `docs/art/COMMERCIAL_CHARACTER_ROSTER_PLAN.md`. Prototype PetDex images,
  screenshots, names, and identifying visual combinations are forbidden as
  generation inputs. The project may reuse only the technical atlas contract,
  semantic rows, frame counts, and anchor coordinate systems.
- A project-authored replacement begins from an approved original identity
  master rather than an imported PetDex base. Generated output remains
  staging-only until its provenance record and explicit commercial reviewer
  sign-off are complete.
- One selected PetDex-compatible character per image-generation call.
- The imported 8x9 base atlas is the identity anchor and remains unchanged.
- Generate only missing semantic rows as separate eight-cell horizontal strips.
- The facility action pilot adds four rows: working-back, interact-front,
  inspect-front, and lounge-front, producing an interim packed 8x13 runtime
  atlas.
- The final workstation contract adds two required character-only rows after
  the facility rows: working-back-seated and working-front-seated. With those
  rows included, the final atlas is 8x15.
- Every added row contains six active frames and two empty cells, so the
  facility pilot adds 32 cells and the final seated-work extension adds another
  16 cells.
- Use the accepted Einstein seated-working source as the morphology, pelvis
  anchor, visible-leg, and chair/desk occlusion reference. Generate the
  character-only rows without drawing chairs, desks, monitors, or facilities.
- Furniture and facility props remain separate map layers.
- Left/right movement mirrors are created at runtime where safe.
- Chair movement, sitting transition, and standing transition are code-driven to avoid generating unnecessary frames.
- A single-frame `seated` semantic state may reuse an accepted source row when
  the character's lower body is hidden by a desk foreground mask, but this is
  only an interim compatibility fallback and does not replace the final
  seated-work rows.
- Einstein is the first golden 8x15 runtime character. Generate its four missing
  facility rows as separate eight-cell strips, retain the accepted
  character-only rear/front seated-working sources, then pack and validate the
  complete atlas before extending any other PetDex identity.
- The first transfer pilot is accepted in staging: Doraemon closes its existing
  8x13 sheet with the two seated rows; Anna supplies the human-like proof; AI
  Workbot supplies the non-human robot proof. Their versioned 8x15 atlases are
  cataloged but not imported by the active Office.
- The follow-on fourteen-character batch is complete in staging. Asuka, Jesus,
  Miku, Rem, Ruri, Itachi, Lian, Taffy, Yinyue, Noir, Baobao, Gugugaga,
  Nai-long, and QQ Penguin each add the same six canonical rows. The batch
  validates 84/84 source strips, retains exactly six active frames and two
  empty trailing cells per row, and preserves visible RGBA plus the alpha plane
  across every accepted 8x9 base.
  See `docs/art/CHARACTER_ROSTER_8X15_BATCH.md`.
- Einstein defines the semantic row order, standing and seated anchors,
  character-relative prop scale, and interaction hand-anchor contract. Each
  later PetDex character still preserves its own base identity, proportions,
  and any recorded seat or hand offset.
- The final 15 rows remain sufficient for Facility v1. Review seating uses
  `working-front-seated` with a transient tablet, paper, or notebook; it does
  not add a sixteenth character row.

## Facility-to-Pose Planning Gate

Before generating the final character set, lock the facility v1 contract at 20
shared reservation slots. Slot capacity is independent of object count: the
five sofa seats are five slots even when represented by two sofa objects.
Assign each slot an action family (`interact-use`, `inspect`, `review`, or
`lounge`), approach direction, interaction facing, anchor, duration, and any
map-layer overlay. The final character rows are then generated against those
stable anchors; no facility prop is baked into a character cell.

### Review and decor completion sheet

`review-decor-completion-sheet-modern-bright-v2-source.png` is a controlled
4x4 source sheet. Every cell has a declared runtime consumer:

| Row | Cells 1-4 |
| --- | --- |
| 1 | `table.review.long.modern`, `planter.trough.slim`, `cactus.column`, `cactus.cluster` |
| 2 | `plant.snake`, `plant.zz`, `plant.bonsai`, `planter.succulent.bowl` |
| 3 | `planter.moss.low`, `vase.floor.branch`, `sculpture.arch.ceramic`, `sculpture.rings.metal` |
| 4 | `sculpture.stones.stack`, `hourglass.desktop`, `globe.desktop`, `terrarium.succulent` |

The table is a slim centered Modern v3 shell with a 4x1 floor footprint and a
4x2 render box. Its targeted v3 replacement uses the approved raised frontal
exception so the tabletop surface and both legs remain readable, without any
left/right rotation or perspective convergence. It has no baked chairs,
actors, props, or wood texture. Four existing modern office
chairs are composed as children: two rear seats at x=1 and x=3 use
`working-front-seated`; two front seats at x=1 and x=3 use
`working-back-seated`. There are no head, tail, or side-facing seats.

The table and chairs occupy a compact 4x3 facility envelope. Approach clearance
extends to 4x5 so each seat has an independent entry and release path. The entire
group is one facility object with four reservation slots.

The fifteen decor cells remain library-only staging assets. They do not consume
reservation slots or enter the active Office until chosen during the interior
layout pass. Existing Printer, Water, and Coffee families remain the canonical
machine assets and are not duplicated in this sheet.

## Extraction Pipeline

1. Remove chroma key from the full sheet.
2. Slice by manifest cell coordinates.
3. Find visible bounds inside each cell.
4. Add canonical padding and align to the 32 px world grid.
5. Quantize to the locked palette.
6. Place the trimmed content inside an integer tile render box; transparent
   padding may remain and must not change the floor footprint.
7. Validate alpha, bounds, palette, perspective, integer geometry, and anchor safety.
8. Pack accepted assets into atlases.
9. Record integer collisions and interaction anchors separately from theme images.

## Theme Strategy

- Concept C is the authored source skin.
- Facility v1 furniture uses a modern-bright material pass inside that skin:
  lighter graphite, warm white, brushed metal, pale slate, and controlled
  cyan, teal, lime, amber, and coral accents.
- Bright accents belong to declared displays, indicators, buttons, or trim;
  they must not change the shell silhouette or collision footprint between
  frames.
- Display content uses bright high-value colors such as warm white, pale sky,
  cyan, mint, teal, lime, amber, coral, and lavender. Mostly black, navy, or
  dark-blue screens are not accepted for the modern-bright skin.
- Theme A and B initially use palette maps, material tokens, lighting overlays, and UI variables.
- Shared geometry and animation manifests remain unchanged.
- Only genuinely theme-specific props are generated later, preferably one controlled sheet per theme.

Every animated display or prop is authored as a seam loop. Four distinct frames
must depict one continuous scene or mechanical cycle and play
`A-B-C-D-A`. The `D -> A` transition is an acceptance check, not an accidental
reset. Ping-pong is allowed only as a documented exception for motion that
cannot form a natural cycle.

## Acceptance Gate

Run one calibration sheet first. Continue with 4x4 batching only if at least 12 of 16 cells are usable and perspective-consistent. Otherwise reduce density to a 3x3 sheet before producing the remaining categories.

## Estimated Generation Work

- Full-polish C environment: eight controlled sheets. Static-only and Facility
  v1 motion may defer the complete `env-07` and `env-08` batches.
- Facility v1 additions: six cells static-only or 18 source cells with the
  recommended TV, vending, and game seam-loop motion.
- Full ambient-polish additions: 62 source cells; this replaces, rather than
  adds to, the 18-cell Facility v1 seam-loop tier. Derived runtime composites
  are produced by processing and are not extra generation prompts.
- Pilot character: one sheet for the vertical slice.
- Full active roster: ten character sheets total.
- Initial image generation: approximately 30-90 minutes depending on retries.
- Extraction and asset QA are separate from generation and are expected to take longer than the raw image calls.

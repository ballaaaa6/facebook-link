# Controlled Asset Sheet Plan

## Goal

Reduce generation latency without sacrificing usable geometry. Static furniture and props are generated as controlled 4x4 asset sheets. Identity-sensitive character work animations use one character per sheet.

## Shared Sheet Contract

- Square contact sheet with a logical 4x4 grid.
- One isolated asset or frame per cell.
- Large uniform magenta chroma-key background.
- No cell labels, text, logos, watermarks, ground planes, cast shadows, or overlapping assets.
- Generous empty padding around every object.
- Fixed top-down perspective, light direction, outline weight, and Concept C palette.
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

## Character Sheets

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

## Facility-to-Pose Planning Gate

Before generating the final character set, lock the facility v1 contract at 20
shared reservation slots. Slot capacity is independent of object count: the
five sofa seats are five slots even when represented by two sofa objects.
Assign each slot an action family (`interact-use`, `inspect`, `review`, or
`lounge`), approach direction, interaction facing, anchor, duration, and any
map-layer overlay. The final character rows are then generated against those
stable anchors; no facility prop is baked into a character cell.

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

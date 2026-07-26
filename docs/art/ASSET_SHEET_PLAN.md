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

## Environment Sheets

1. `env-01-core-furniture`: four furniture families by four orientations.
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
- A screen, LED, indicator, or other local display uses three true overlay
  keyframes (`A`, `B`, `C`). Runtime plays `A-B-C-B-A`; do not store duplicate
  return frames.
- A mechanical or ambient motion that changes more than a local display uses
  four true keyframes. The base anchor, render box, collision footprint, and
  support surface remain unchanged in every frame.
- The shell stays visible under an overlay. Do not generate three or four
  complete copies of a TV, vending machine, game machine, printer, server rack,
  water dispenser, coffee machine, or lamp when only its screen, paper, LED,
  button, steam, or light changes.

The approved production tiers are alternatives, not cumulative budgets:

| Tier | Included work | New cells |
| --- | --- | ---: |
| Static-only Facility v1 | Six missing facility shells | 6 |
| Facility v1 motion | Six shells plus three-frame TV, vending, and game overlays | 15 |
| Full ambient polish | Six shells, four mechanical sets x 4, four ambient sets x 4, five monitor themes x 3, and one TV overlay x 3 | 56 |

The full-polish mechanical sets are vending display/mechanism, game display,
printer paper/status, and server status. They replace the simpler three-frame
vending and game strips from the Facility v1 motion tier; do not count both
versions. The ambient sets are water indicator, coffee steam/indicator, plant
sway, and lamp brightness. The TV remains a one-cell shell with a separate
three-frame screen overlay.

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
- Theme A and B initially use palette maps, material tokens, lighting overlays, and UI variables.
- Shared geometry and animation manifests remain unchanged.
- Only genuinely theme-specific props are generated later, preferably one controlled sheet per theme.

## Acceptance Gate

Run one calibration sheet first. Continue with 4x4 batching only if at least 12 of 16 cells are usable and perspective-consistent. Otherwise reduce density to a 3x3 sheet before producing the remaining categories.

## Estimated Generation Work

- Full-polish C environment: eight controlled sheets. Static-only and Facility
  v1 motion may defer the complete `env-07` and `env-08` batches.
- Facility v1 additions: six cells static-only or 15 cells with the recommended
  TV, vending, and game motion overlays.
- Full ambient-polish additions: 56 cells; this replaces, rather than adds to,
  the 15-cell Facility v1 motion tier.
- Pilot character: one sheet for the vertical slice.
- Full active roster: ten character sheets total.
- Initial image generation: approximately 30-90 minutes depending on retries.
- Extraction and asset QA are separate from generation and are expected to take longer than the raw image calls.

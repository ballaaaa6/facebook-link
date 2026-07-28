# Office Asset Creation Guide

Status: Production guide; Step 4 Workstation v2 bare desk accepted, Step 5 planning only
Scope: Office assets created for the latest orthographic pixel-art reference
Current execution plan: `docs/art/OFFICE_GEOMETRY_REMEDIATION_ROADMAP.md`
Historical migration plan: `docs/art/OFFICE_REF_MIGRATION_ROADMAP.md`

Workstation reset gate (2026-07-28): the former `5 x 4` / `5 x 3` workstation
contract and Candidate r01 are rejected. The owner approved the corrected
`3 x 2` blueprint and accepted the bare desk v2 source, its front/back
normalization, semantic layers, and Step 4 QA boards. A Step 5 single-seat plan
may now be prepared. Chair, monitor, keyboard, character assembly, the lab
implementation, renderer, ten-seat assembly, and Active Office promotion remain
blocked until the plan is separately approved.

## 1. Purpose

This guide defines the repeatable workflow for creating, extracting, registering, and validating office furniture, equipment, screen overlays, and character poses.

The latest office reference is a layered, orthographic scene. It is not a single background image. Every interactive or visible object must be created so it can be placed, rotated, occluded, animated, and validated independently.

The current composition target is
`assets/art/layout-references/office-modern-operations-target-v2.png`.
The active modern scene plate remains
`assets/art/backgrounds/office-c-background-modern-v2.png`.
The target establishes the modern workstation and chair language; it does not
replace the layered scene or authorize baking chairs and characters together.

For the office migration, this guide takes precedence over older office-specific sheet layouts. Generic chroma-key extraction and 32 px grid rules remain applicable.

## 2. Production principles

1. Build one calibrated vertical slice before producing a large batch.
2. Separate physical furniture from equipment and screen content.
3. Treat `anchor`, `footprint`, and `viewport` as contracts, not visual guesses.
4. Generate one consistent turnaround for an object before generating animation.
5. Animate local details as a seam loop while keeping the world anchor and
   silhouette stable.
6. Use aliases for static frames instead of duplicating identical pixel data.
7. Use original designs with no copied brands, logos, characters, or UI layouts.
8. Treat generated sheets as source material; crop, normalize, and validate before runtime use.

## 3. Shared visual contract

Lock these values before creating production assets:

- 32 px integer world tile grid.
- Orthographic straight-on pixel-art presentation.
- Concept C warm studio palette for the room; new furniture may use the
  approved modern-bright skin below.
- Consistent dark outline weight.
- Consistent upper-left light direction.
- No baked runtime labels, HUD, task text, or branded UI.
- No perspective convergence or isometric camera.
- No oblique, three-quarter, 15°, 30°, or 45° furniture views. The default
  view is straight orthographic; a side view is a deliberate 90° turn.
- Hard gate: front must be 0° straight-on, back must be the exact horizontal
  flip of the front shell at 180°, and left/right must be strict 90° profiles.
  Reject any diagonal tilt, visible perspective/foreshortening, three-quarter
  angle, or exposed perspective top surface.
- Authored exception: `table.review.long.modern` stays at 0° with no left/right
  yaw, but uses a slightly raised frontal view so a standing character can see
  the rectangular tabletop and the legs below it. Its front/back and left/right
  tabletop edges remain parallel; perspective convergence and three-quarter
  rotation are still rejected.
- Authored exception: `desk.workstation.modern.v2` uses an elevated straight
  front/back camera so its complete rectangular `3 x 2` top remains a broad,
  usable support plane. Its far/near edges stay horizontal and equal length;
  its left/right edges stay vertical and equal depth. Trapezoids, narrowed far
  edges, diagonal yaw, and perspective convergence remain rejected.
- No transparent padding changes between animation frames.

Use the same pixel scale for every view of one asset. Do not create the front at one camera distance and the back at another.

### 3.1 Modern-bright furniture skin

The new Facility v1 furniture should read as modern equipment inside the warm
studio, not as a second unrelated art style:

- Use lighter charcoal, graphite, warm white, brushed metal, and pale slate
  for the main shell surfaces.
- Use controlled cyan, teal, lime, amber, and coral accents for screens,
  indicators, buttons, and small trim.
- Keep dark outlines and the established upper-left light direction so the
  brighter palette still belongs to the same office.
- Prefer clean flat panels, thin bezels, rounded corners, compact feet, and
  simple readable silhouettes.
- Do not use neon glow, gradients, glossy reflections, brands, or random
  rainbow changes as substitutes for authored screen motion.
- Screen and display content must use a bright high-value palette: warm white,
  pale sky, cyan, mint, teal, lime, amber, coral, or lavender. Do not use a
  mostly black, navy, dark-blue, or near-black screen background. Dark outlines
  may remain on the furniture shell, but the active display must stay readable
  and visibly bright at 1:1.

The shell palette is static across all frames. Only the declared local display,
indicator, paper, steam, or light region may change.

### 3.2 Office Scale Bible

The authoritative values are now machine-readable in
`assets/game/manifests/office-camera-scale-bible.json`; the rendered reference
is `assets/art/layout-references/office-camera-scale-calibration-v1.png`.
This section is explanatory only. Prompt generation reads the accepted
manifest and refuses missing or non-accepted Bible data.

Lock scale before generating any office asset. The canonical comparison is one
standing adult:

```text
adult = 1 wide x 1 deep x 3 high
1 tile = 32 authoring pixels
```

`W x D x H` describes the intended physical mass used in prompts and layout
planning. `renderBox` describes the integer tile canvas used to draw the
orthographic sprite. `footprint` describes only the floor cells blocked by
collision. A render box may be wider or taller than the physical mass to allow
for perspective, animation, hair, arms, foliage, or transparent padding.

Wall and supported assets use `-` for floor footprint. Their parent wall,
desk, counter, table, credenza, or rack owns the collision.

#### Structural surface contract

The map, rather than the backdrop pixels, is the source of truth for legal
placement. Every Office map declares named structural `surfaces` with a
`support` of `floor`, `wall`, or `ceiling` and integer-grid bounds.

- A coordinate-placed object must declare `surfaceId`. Its asset `supports`
  list must contain that surface's support.
- A floor object's complete footprint must remain inside its declared floor
  surface.
- A wall or ceiling object's anchor must remain inside its declared structural
  surface.
- Workstations must reference a floor surface; their collision rectangle and
  seat, work, approach, and stand points must remain inside it.
- A desk-, table-, counter-, credenza-, or rack-supported object must use a
  parent slot and must not declare a structural `surfaceId`.

The visual wall and floor may share one non-interactive architecture backdrop.
That image never grants placement permission. Surface regions, asset support
metadata, parent slots, and layout validation are the enforceable contract.

#### Actors and architecture

| Asset or family | Locked W x D x H | Render box W x H | Floor footprint W x D | Notes |
| --- | ---: | ---: | ---: | --- |
| Standing adult agent | `1 x 1 x 3` | approximately `3 x 3.25` | `1 x 1` | Identity reference for every furniture prompt; feet use bottom-center anchor. |
| Seated adult agent | `1 x 1 x 2` | same character frame contract | `1 x 1` seat slot | Pelvis and seat anchors remain fixed; furniture is not baked into the character. |
| Office mascot / small companion | `1 x 1 x 1` | `2 x 2` | `1 x 1` | May use transparent padding for its walk cycle. |
| Floor tile | `1 x 1 x 0` | code-generated | `-` | Architecture, not an image-generation cell. |
| Wall segment | `1 x 0 x 3` | code-generated | `-` | Wall height establishes the adult and appliance ceiling reference. |
| Entry rug / zone rug | `4 x 2 x 0` | code-generated | `-` | Visual floor layer only. |
| Door | `2 x 0 x 3` | `2 x 3` | `-` | Wall anchor; opening clearance is handled by the map. |
| Window module | `4 x 0 x 3` | code-generated or `4 x 3` | `-` | Wall-only; never reserves floor collision. |
| Glass or planter partition | `4 x 1 x 3` | `4 x 3` | `4 x 1` | Use only when an authored map requires a physical divider. |

#### Core furniture and seating

| Asset or family | Locked W x D x H | Render box W x H | Floor footprint W x D | Seats / support |
| --- | ---: | ---: | ---: | --- |
| Standard desk | `3 x 2 x 2.4` | `3 x 4` generation canvas | `3 x 2` | Complete `3 x 2` support plane; no employee-edge footprint row. Artwork blocked pending blueprint approval. |
| Creative desk | `3 x 2 x 2.4` | `3 x 4` generation canvas | `3 x 2` | Same physical family; role equipment changes, geometry does not. |
| NOC desk | `3 x 2 x 2.4` | `3 x 4` generation canvas | `3 x 2` | Same physical family; role equipment changes, geometry does not. |
| Office task chair | `1 x 1 x 2` | `1 x 2` | `1 x 1` | One seat slot. |
| Studio task chair | `1 x 1 x 2` | `1 x 2` | `1 x 1` | One seat slot. |
| Cafe / meeting chair | `1 x 1 x 2` | `1 x 2` | `1 x 1` | One review or cafe seat. |
| Four-person mission table | `6 x 2 x 2` | `6 x 3` | `6 x 2` | Four separate review slots; chairs remain separate. |
| Round cafe table | `2 x 2 x 2` | `2 x 2` | `2 x 2` | Supported tabletop slot. |
| Coffee table | `3 x 2 x 1` | `3 x 2` | `3 x 2` | Low furniture; no reservation slot by default. |
| Coffee counter | `4 x 2 x 2` | `4 x 3` | `4 x 2` | Three supported counter slots. |
| Printer credenza / low bookshelf | `4 x 1 x 2` | `4 x 2` | `4 x 1` | Printer and decor parent slots. |
| Magazine bookshelf | `2 x 1 x 2` | `2 x 2` | `2 x 1` | Static unless reading interaction is activated. |
| Filing cabinet | `2 x 1 x 3` | `2 x 3` | `2 x 1` | Tall storage. |
| Planter divider | `4 x 1 x 2` | `4 x 2` | `4 x 1` | Soft zone boundary. |
| Existing sectional sofa | `6 x 3 x 2` | `6 x 4` | `6 x 3` | Existing large lounge asset. |
| Modern three-seat sofa | `4 x 2 x 2` | `4 x 3` | `4 x 2` | Three independent lounge slots. |
| Modern two-seat sofa | `3 x 2 x 2` | `3 x 3` | `3 x 2` | Two independent lounge slots. |
| Lounge stool | `1 x 1 x 1` | `1 x 1` | `1 x 1` | One optional seat. |
| Massage chair | `2 x 2 x 2` | `2 x 3` | `2 x 2` | One lounge slot; one approach row in front. |
| Round pet bed | `2 x 2 x 1` | `2 x 2` | `2 x 2` | Mascot home slot. |

#### Facilities and large equipment

| Asset or family | Locked W x D x H | Render box W x H | Floor footprint W x D | Interaction contract |
| --- | ---: | ---: | ---: | --- |
| Wall TV | `3 x 0 x 2` | `3 x 2` | `-` | Approximate inner viewport `80 x 40 px` in a `96 x 64 px` authoring render. |
| Water dispenser | `1 x 1 x 3` | `1 x 3` | `1 x 1` | One front interaction slot. |
| Coffee machine | `1 x 1 x 2` | `1 x 2` | `-` | Counter-supported; one front interaction slot belongs to the counter. |
| Desktop printer | `2 x 1 x 1` | `2 x 1` | `-` | Credenza-supported; one pickup slot. |
| Server rack | `2 x 1 x 3` | `2 x 3` | `2 x 1` | One inspection slot in front. |
| Vending machine | `2 x 1 x 3` | `2 x 3` | `2 x 1` | One front interaction slot; one extra approach row. |
| Refrigerator | `2 x 1 x 3` | `2 x 3` | `2 x 1` | One front interaction slot; door swing stays visual in v1. |
| Arcade game machine | `2 x 2 x 3` | `3 x 3` | `2 x 2` | One front interaction slot; approximate game viewport `48 x 32 px`. |
| Camera tripod | `1 x 1 x 3` | `1 x 3` | `1 x 1` | Floor equipment. |
| Studio light | `1 x 1 x 3` | `1 x 3` | `1 x 1` | Floor equipment. |
| CCTV camera | `1 x 0 x 1` | `1 x 1` | `-` | Wall support. |

#### Workstation and supported equipment

| Asset or family | Locked W x D x H | Render box W x H | Floor footprint | Parent support |
| --- | ---: | ---: | ---: | --- |
| Front monitor | `2 x 1 x 2` | `2 x 2` | `-` | Desk surface. |
| Dual-monitor set | `2 x 1 x 2` | `2 x 2` | `-` | Desk surface. |
| Keyboard and mouse | `2 x 1 x 1` | `2 x 1` | `-` | Desk surface. |
| Open laptop | `2 x 1 x 2` | `2 x 2` | `-` | Desk or table surface. |
| Drawing tablet | `1 x 1 x 1` | `1 x 1` | `-` | Desk surface. |
| Phone / preview device | `1 x 1 x 1` | `1 x 1` | `-` | Desk surface. |
| Multi-device preview station | `2 x 1 x 2` | `2 x 2` | `-` | Desk surface. |
| Network stack | `1 x 1 x 2` | `1 x 2` | `-` | Rack surface. |
| Desktop speaker | `1 x 1 x 1` | `1 x 1` | `-` | Desk, shelf, or counter surface. |

#### Plants, lighting, safety, and small decor

| Asset or family | Locked W x D x H | Render box W x H | Floor footprint | Support |
| --- | ---: | ---: | ---: | --- |
| Small plant | `1 x 1 x 1` | `1 x 2` | `1 x 1` when floor-supported | Floor or supported surface. |
| Medium potted plant | `1 x 1 x 2` | `1 x 2` | `1 x 1` | Floor. |
| Tall plant | `1 x 1 x 3` | `2 x 3` | `1 x 1` | Floor; foliage may overhang transparently. |
| Floor lamp | `1 x 1 x 3` | `1 x 3` | `1 x 1` | Floor. |
| Desk lamp | `1 x 1 x 1` | `1 x 1` | `-` | Desk surface. |
| Wall art | `2 x 0 x 1` | `2 x 1` | `-` | Wall. |
| Wall clock | `1 x 0 x 1` | `1 x 1` | `-` | Wall. |
| Exit sign | `2 x 0 x 1` | `2 x 1` | `-` | Wall. |
| Fire extinguisher | `1 x 0 x 2` | `1 x 2` | `-` | Wall. |
| Waste bin | `1 x 1 x 1` | `1 x 1` | `1 x 1` | Floor. |
| Parcel box | `1 x 1 x 1` | `1 x 1` | `1 x 1` | Floor. |
| Coffee cup | `1 x 1 x 1` | `1 x 1` | `-` | Table or counter surface. |
| Paper stack | `1 x 1 x 1` | `1 x 1` | `-` | Desk, table, or credenza surface. |
| Small ornament | `1 x 1 x 1` | `1 x 1` | `-` | Shelf or supported surface. |
| Decorative wall light | `1 x 0 x 1` | `1 x 1` | `-` | Wall. |

#### Planned storage and Phase 2 lounge assets

| Asset or family | Locked W x D x H | Render box W x H | Floor footprint W x D | Planned behavior |
| --- | ---: | ---: | ---: | --- |
| Personal locker bank, 15 compartments | `5 x 1 x 3` | `5 x 3` | `5 x 1` | Static decor/personal storage in v1. |
| Figure display case | `2 x 1 x 3` | `2 x 3` | `2 x 1` | Static decor. |
| Beanbag | `2 x 2 x 1` | `2 x 2` | `2 x 2` | One lounge slot when Phase 2 is activated. |
| Board-game table | `3 x 3 x 2` | `3 x 3` | `3 x 3` | Four external seat slots; chairs remain separate. |
| Reading bookshelf | `2 x 1 x 3` | `2 x 3` | `2 x 1` | One or two reading slots when activated. |
| Reading chair | `1 x 1 x 2` | `1 x 2` | `1 x 1` | One reading slot. |

### 3.3 Scale and clearance rules

- The scale table is mandatory prompt input, not a suggestion inferred after
  generation.
- Preserve the declared `W x D x H` ratio. Scale uniformly; never stretch an
  asset independently on one axis to fill its render box.
- Crop source padding, scale the visible object with nearest-neighbor sampling,
  and add transparent padding to the locked render box.
- A floor facility reserves its footprint plus one clear approach tile in
  front. The approach tile is not part of the furniture's physical size.
- A seated facility reserves its furniture footprint, seat slots, and one
  reachable entry side. Do not count the entire sofa footprint as one slot.
- Supported props do not create new floor collision. Their parent surface owns
  placement and collision.
- Internal viewports may use pixel dimensions that are fractions of a tile;
  world placement, render boxes, and footprints remain integer tile values.
- Validate each large or interactive asset beside a neutral `1 x 1 x 3` adult
  scale silhouette before approving the asset. The silhouette is a QA overlay,
  not part of the exported sprite.

### 3.4 Machine-readable scale and prompt workflow

The written Scale Bible explains intent. Generation must read the same
contracts from machine-readable manifests:

- Registered runtime assets:
  `assets/game/manifests/office-assets.json`
- Planned assets that do not yet have accepted runtime files:
  `assets/game/manifests/office-planned-assets.json`

Every entry declares `physicalScale`, `renderBox`, support, anchor, and any
floor footprint. Do not copy scale numbers manually into an ad hoc prompt.
Generate the scale-locked prompt instead:

```bash
npm run art:prompt -- vending.machine.modern
npm run art:prompt -- chair.office.up --orientations=front,back,side
npm run art:prompt -- --list
```

Validate both catalogs with:

```bash
npm run art:prompt:check
```

`npm run check` includes this catalog validation. A planned asset moves into
the runtime manifest only after its raster, anchor, collision footprint, and
map placement are accepted.

## 4. Asset classes

### 4.1 Furniture

Furniture defines physical room geometry and collision:

- Desk.
- Chair.
- Sofa.
- Coffee table.
- Bookshelf.
- Vending machine.
- Water dispenser.
- Server rack.

Furniture must have an explicit floor footprint and an anchor.

### 4.2 Equipment

Equipment is a separate object attached to furniture or placed on the floor:

- Monitor shell.
- Keyboard.
- Mouse.
- Printer.
- Camera.
- Network equipment.

Equipment must declare its parent attachment or floor anchor. Do not bake equipment into a desk if the equipment can vary by employee role.

### 4.3 Screen overlays

Screen overlays are content-only images placed inside a monitor shell's fixed viewport:

- Coding.
- Analytics.
- Document.
- Chat/support.
- System dashboard.

Screen overlays must not contain a monitor bezel, stand, desk, or keyboard.

### 4.4 Characters

Characters are animated actors with independent world anchors:

- Standing movement.
- Seated work.
- Review.
- Relax.
- Interaction.

The seated anchor is the seat or pelvis contact point, not the center of the visible alpha bounds.

## 5. Furniture creation workflow

### 5.0 Chair-first calibration

Before generating seated character rows, create one modern ergonomic chair
family and validate it with a single workstation. The calibration chair uses a
four-view turnaround (`up`, `down`, `left`, `right`) so the design, seat
height, caster baseline, and armrest proportions are locked once. Runtime
initially uses `up` for a chair facing the desk and `down` for a chair facing
the aisle.

The chair contract is:

- `renderBox`: 1 x 2 tiles.
- `footprint`: 1 x 1 floor tile.
- `anchor`: bottom-center at the caster contact point.
- `seatAnchor`: the pelvis/seat contact point, never the alpha-box center.
- `foregroundMask`: the backrest or armrest pixels that should occlude the
  seated lower body.

Do not place the chair inside a character sprite. The chair, seated actor, and
desk foreground mask remain separate layers.

The Einstein calibration now establishes the reusable seated reference:

- `assets/game/characters/einstein/einstein-seated-chair-calibration-v1-source.png`
  locks the chair-to-pelvis relationship.
- `assets/game/characters/einstein/einstein-seated-working-v1-source.png`
  contains the accepted character-only rear and front seated silhouettes.

These files are calibration sources until the runtime atlas packer records the
seated anchor and chair/desk foreground masks. They are the reference for
future characters; the chair does not need to be regenerated and removed for
every character.

### Step 1 — Define the physical contract

Before prompting, write the intended dimensions:

```json
{
  "id": "office-desk-v1",
  "renderBox": {
    "width": 4,
    "height": 2
  },
  "footprint": {
    "width": 4,
    "depth": 2
  },
  "anchor": "center"
}
```

`renderBox` is the visible image area. `footprint` is the floor contact area used for collision. A tall object can have a small floor footprint and a taller render box.

### Step 2 — Create the turnaround

Declare `requiredOrientations` from the active map before prompting. The
contact-sheet grid does not require every object to have four views.

Use this decision gate:

| Required views | Use when |
| ---: | --- |
| 1 | The object is wall-mounted, rotationally symmetric, fixed against a wall/counter, or used by the map from one direction only. |
| 2 | The map needs front/back, or a rectangular object needs horizontal/vertical footprints only. |
| 3 | The map needs front, back, and one side view, and left/right mirroring is visually safe. |
| 4 | The object is genuinely rotatable, asymmetric, or needs independent left/right collision or occlusion geometry. |

Read workstation `facing`, facility `approach`, `interactionFacing`, object
placement, and footprint requirements before choosing the list. Do not
generate an orientation for a future hypothetical layout. Add it later as a
targeted sheet when a real map placement requires it.

Mirroring is safe only when it does not reverse text, controls, door hinges,
asymmetric arms, attached props, material highlights, or the locked upper-left
light direction. If any of those would look wrong, generate both side views.

Orientation is discrete, never approximate:

- `front` and `back` are straight orthographic views.
- `left` and `right` are straight 90-degree side views.
- Do not generate a three-quarter, oblique, diagonal, tilted, or perspective
  view as a compromise between them.
- If a prompt or source sheet produces an angled object, reject that cell and
  regenerate it as the declared straight view.

Examples:

- Wall TV, vending machine, refrigerator, water dispenser, server rack,
  printer, coffee machine, game machine, wall art, and extinguisher normally
  use one front view when their placement is fixed.
- Round tables, cups, bins, and visually rotationally symmetric plants use one
  view.
- A café chair may use front, back, and one mirror-safe side view.
- A reusable work desk or office-chair calibration may use all four views.

When four views are actually required, create one consistent design in:

```text
front
back
left
right
```

For rectangular furniture rotated 90 degrees:

```text
front/back: width 4, depth 2
left/right: width 2, depth 4
```

Do not assume a simple rectangle for irregular furniture. Use orientation-specific masks when arms, protrusions, wheels, or attached props change the collision shape.

Required turnaround invariants:

- Front and back preserve the same overall width.
- Left and right preserve the same depth.
- The object uses one consistent height and material design.
- Front-only props do not appear in the back view.
- Side views show depth rather than a compressed front view.
- All views share a common baseline and anchor.

### Step 3 — Extract the physical asset

After generation:

1. Remove the chroma-key background.
2. Crop each declared required orientation into its own cell; reject
   undeclared extra views.
3. Preserve the dark outline.
4. Normalize to the declared render box.
5. Align the declared anchor to the integer grid.
6. Record the footprint and any foreground mask.
7. Validate front/back/side proportions at 1:1 scale.

### Step 4 — Add optional animation

Do not animate the entire furniture silhouette by redrawing it independently
for every frame. Select exactly one cell contract before generating:

```text
static rigid shell             1 cell
screen / LED / status motion   4 true keyframes: A, B, C, D
mechanical / ambient motion    4 true keyframes: A, B, C, D
```

Seam-loop is the default for every animated or changing prop. Runtime plays
the four distinct authored keyframes as `A-B-C-D-A`; the final frame must
transition naturally back into the first frame. Do not store duplicate return
frames. A ping-pong loop is an explicit exception only when a cyclic story
cannot be authored without a visible jump.

Author animated display furniture in two passes:

1. Create one locked shell cell.
2. Create only the changing screen, LED, paper, steam, or light frames.
3. Measure the local viewport and deterministically precompose full-frame
   runtime variants from the same shell.

The runtime may use the precomposed full-frame variants so the current
single-asset renderer does not need a second overlay layer. The source
manifest still records the shell, viewport, and four content keyframes for
future themes or live overlays. Never ask the generator to redraw the full
furniture independently for each animation frame; that causes bezel, anchor,
and collision drift.

The base furniture must retain the same anchor, dimensions, and collision
footprint in every frame. For example, a wall TV uses one shell cell plus four
screen-content cells, then produces four derived full-frame runtime images.
The four derived images are processing outputs, not four additional AI
generation prompts.

Facility production uses three alternative tiers:

- Static-only: six missing facility shell cells.
- Facility v1 motion: six shells plus four-frame TV, vending, and game
  seam-loop sources, for 18 new source cells and 12 derived runtime frames.
- Full ambient polish: 62 new source cells under
  `docs/art/ASSET_SHEET_PLAN.md`; this replaces the simpler Facility v1 motion
  strips and is not added on top of them.

Before extraction, confirm whether a generated strip is a shell, an overlay,
or a full local-motion frame set. Never mix those roles inside one strip.

## 6. Equipment and monitor workflow

### 6.1 Monitor shell

Create a monitor shell independently:

```text
monitor-front
monitor-back
monitor-left
monitor-right
```

The shell contains:

- Bezel.
- Housing.
- Stand.
- Buttons or indicator light if physically visible.

The shell does not contain role-specific screen content.

### 6.2 Screen viewport

Measure the inner screen rectangle from the front monitor shell and lock it:

```json
{
  "monitor": "office-monitor-v1",
  "viewport": {
    "x": 8,
    "y": 6,
    "width": 52,
    "height": 30
  }
}
```

Every screen theme and frame must use this exact viewport size. Do not let the generator choose a different screen rectangle per theme.

### 6.3 Screen themes

Start with five themes so five adjacent workstations can look different:

1. Coding editor.
2. Analytics dashboard.
3. Document/content workspace.
4. Chat/support inbox.
5. System/management dashboard.

Each theme has four seam-loop keyframes:

```text
A, B, C, D
```

Runtime playback is cyclic:

```text
A -> B -> C -> D -> A
```

Frame `D` must be a natural predecessor of frame `A`, not a reset screen.
Keep 65–75% of the screen layout static and animate a visible 20–35% region.
The four frames should read as one scene or one game state evolving over time,
not four unrelated screenshots.

Recommended motion:

- Coding: highlighted block or progress line moves several rows.
- Analytics: large bars, line point, and status ring change.
- Document: progress bar, section highlight, or thumbnail moves.
- Chat: one message bubble enters and an unread badge changes.
- System: CPU/memory bars and status dots pulse.

Avoid:

- Cursor-only animation that disappears at small scale.
- Full-screen redesign between frames.
- Screen content that changes theme, camera, or game rules between frames.
- A direct `D -> A` cut when the endpoints are visually different.

### 6.4 Screen overlay extraction

Screen overlays must contain only the content rectangle. Remove:

- Monitor bezel.
- Monitor frame.
- Stand.
- Desk.
- Keyboard.

The source pipeline composes:

```text
monitor shell
+ screen overlay
-> precomposed full-frame runtime variant
```

Store true keyframes once:

```json
{
  "keyframes": ["analytics-a", "analytics-b", "analytics-c", "analytics-d"],
  "loop": "seam",
  "frameDurationMs": 700
}
```

Do not store duplicate copies of `B` or `C` merely to represent the return
leg. Validate the `D -> A` seam at 1:1 scale before packing.

## 7. Character creation workflow

### 7.1 Standard pose contract

Every production character starts from an approved PetDex-compatible base atlas.
The base contract is an 8x9 sheet; do not redraw the identity or regenerate
working rows that already exist. Add only the missing semantic rows required by
the office:

```text
idle-front
walk-down
walk-up
walk-left
walk-right
working
review
failed
waiting
reaction-or-wave
```

The facility-ready extension adds four rows to the same atlas:

```text
working-back
interact-front
inspect-front
lounge-front
```

This produces an 8x13 atlas (104 cells). Each extension row uses six active
frames plus two empty cells. Facility orientation is handled by map placement:
the actor approaches from the front, so no side or back facility animation is
required for the pilot. Desk furniture remains separate from the character.

### 7.1.1 Seated work extension

The approved seated-work contract adds two required character-only rows after
the facility rows before the final workstation roster is accepted:

```text
working-back-seated
working-front-seated
```

With the four facility rows retained, the complete contract is 8x15. Both
seated rows use six active frames plus two empty cells. The rear row is a
dead-center back view with symmetric shoulders and naturally hanging legs; it
must not drift into a three-quarter or side view. The front row is a
dead-center upright office-chair pose whose lower legs may be hidden by the
desk foreground mask. Neither row contains a chair, desk, monitor, or floor.

Use the approved Einstein seated rows and the modern chair calibration as the
shared morphology and anchor reference for every character. Generate the
character-only rows directly. Do not repeat the chair-in-frame-and-remove step
unless a new character's proportions cannot match the shared seat height.
Calibrate one rear frame and one front frame first; expand to six-frame
animation rows only after both pelvis and visible-leg anchors pass the chair
overlay check.

### 7.2 Character anchors

Standing characters anchor at the feet. Seated characters anchor at the seat or pelvis contact point.

Do not:

- Center a frame using its visible alpha bounds.
- Shift the whole body when an arm moves.
- Use the standing foot anchor for a seated pose.
- Hide a standing character behind a desk as a substitute for a seated pose.

For action poses such as waving, keep the body anchor fixed and move only the hand or upper body inside the same frame envelope.

### 7.3 Character prompt requirements

Character prompts must specify:

- The supplied PetDex/base atlas as the identity reference.
- Straight orthographic game sprite style.
- Fixed body proportions.
- Exact pose.
- Stable feet/pelvis anchor.
- No furniture or facility props in the character frame; those remain map layers.
- No text, logos, or watermark.
- Same frame size and baseline across the sheet.

For the four extension rows, explicitly request:

- `working-back`: back-facing head and shoulders with subtle typing motion.
- `interact-front`: front-facing hands reaching toward an unseen facility.
- `inspect-front`: front-facing look/hand inspection of an unseen facility.
- `lounge-front`: front-facing seated idle; sofa/beanbag is a separate map asset.

For `working-back-seated`, explicitly request a dead-center rear view with
symmetrical shoulders, hands reaching toward an unseen keyboard, and a compact
lower-body silhouette with naturally hanging legs. For
`working-front-seated`, request a dead-center upright office-chair pose with
legs down but mostly ready for desk occlusion. Use the approved Einstein
seated rows as the morphology and anchor reference; do not draw the chair.

Always request a single horizontal strip of eight equal cells: six active
frames followed by two empty cells. Generate one missing row at a time.

### 7.4 Character extraction

After generation:

1. Remove chroma key.
2. Detect the six generated frame bounds and slice the row.
3. Normalize the standing or seated box separately.
4. Align standing feet and seated pelvis/seat anchors.
5. Validate row-to-row scale against the PetDex base atlas.
6. Append accepted rows without modifying the base rows.
7. Pack the result into a versioned 8x13 interim atlas or 8x15 final atlas,
   depending on whether the seated-work rows are present.
8. Record the extension rows and any per-character scale override explicitly.

## 8. Prompt templates

### 8.1 Furniture turnaround

```text
Create one original orthographic pixel-art [FURNITURE] in ONLY these required
orientations: [REQUIRED_ORIENTATIONS].
Use the Office Scale Bible adult reference of 1 wide x 1 deep x 3 high.
The furniture's locked physical scale is [WIDTH] x [DEPTH] x [HEIGHT] tiles.
Its target render box is [RENDER_WIDTH] x [RENDER_HEIGHT] tiles and its floor
footprint is [FOOTPRINT_WIDTH] x [FOOTPRINT_DEPTH] tiles.
Use exactly one equal cell per listed orientation and do not add extra views.
Use one exact design and preserve width, depth, height, material, outline,
lighting direction, and anchor across every view.
When both front and back are requested, preserve the same overall width and
remove front-only props from the back. When side views are requested, rotate
the object correctly and expose its depth rather than compressing the front.
Place one isolated object per equal cell on a flat #FF00FF chroma-key background.
No people, room, text, logos, watermark, perspective, or isometric camera.
All views must be straight orthographic: front/back face the camera directly,
and left/right are exact 90-degree turns. Never use an oblique or three-quarter
view.
Do not make the furniture wider, shorter, taller, or bulkier merely to fill
the cell; preserve the declared scale and leave empty chroma-key padding.
```

### 8.2 Screen animation

```text
Create a screen-content-only sprite strip for a fixed [WIDTH]x[HEIGHT] viewport.
Produce four keyframes A, B, C, D of one [THEME] dashboard, display, or game.
Keep the viewport, toolbar, sidebar, and major layout fixed.
Use a bright high-value display palette with warm white, pale sky, cyan, mint,
teal, lime, amber, coral, or lavender. Do not use a mostly black, navy, or
dark-blue screen background.
Animate one large readable region so 20–35% of the pixels visibly change
between adjacent frames.
Design the sequence as one continuous seam loop:
A-B-C-D-A. Frame D must naturally lead into frame A.
Keep the same scene, dashboard, or game rules in all four frames.
Do not include a monitor bezel, stand, desk, keyboard, text labels outside the UI,
logos, watermark, or any object outside the viewport.
```

For a wall TV, vending display, or game display, replace `[THEME] dashboard`
with the intended screen content while preserving the same four-cell seam-loop
contract. The prompt must not include the TV housing, machine shell, floor,
wall, or cast shadow.

### 8.2.1 Mechanical or ambient overlay

```text
Use the supplied accepted [ASSET] shell as the fixed anchor and style
reference. Create ONLY the local [MOTION] overlay as four distinct keyframes.
Keep the render box, anchor, lighting direction, palette, and affected region
identical across all four cells. Pixels outside the moving LED, paper, button,
steam, plant, or light region must remain transparent.
Use a flat #FF00FF chroma-key background. Do not redraw the furniture shell,
change its footprint, move its baseline, add a room, add text, or add shadows.
```

### 8.3 PetDex character extension

```text
Use the supplied PetDex-compatible [CHARACTER] atlas as the identity and style
reference. Create ONLY the missing [POSE] animation row.
Output one horizontal strip of exactly eight equal cells: six active frames and
two empty cells. Preserve body proportions, frame size, baseline, feet/pelvis
anchor, palette, outline, and silhouette from the base atlas.
For working-back, show only the back-facing character with subtle typing motion.
For interact-front and inspect-front, show only the front-facing character;
the facility itself is a separate map asset. For lounge-front, show only the
front-facing seated character; do not draw the sofa or beanbag.
Use a flat #FF00FF chroma-key background. No furniture, props, logos, text,
watermark, extra rows, grid lines, or perspective.
```

### 8.4 Seated work rows from the approved reference

```text
Use the supplied PetDex-compatible [CHARACTER] atlas as the identity reference
and the approved Einstein seated rows as the seated morphology and anchor
reference. Create ONLY the missing [working-back-seated or
working-front-seated] character row.

Output one horizontal strip of exactly eight equal cells: six active frames and
two empty cells. Preserve the character's exact head scale, body proportions,
palette, outline, seated pelvis height, and visible-leg placement from the
reference. For working-back-seated use a dead-center straight rear view with
symmetrical shoulders, hands reaching toward an unseen keyboard, and naturally
hanging legs. For working-front-seated use a dead-center upright front view
with legs down and lower-body detail ready for desk occlusion.

Use a flat #FF00FF chroma-key background. Character only: do not draw the
chair, desk, monitor, keyboard, floor, shadows, text, logos, watermark, side
angles, or perspective.
```

## 9. Naming and manifest conventions

Use English, stable, descriptive names:

```text
office-desk-v1-front.webp
office-desk-v1-back.webp
office-desk-v1-left.webp
office-desk-v1-right.webp

office-monitor-v1-front.webp
screen-analytics-v1-a.webp
screen-analytics-v1-b.webp
screen-analytics-v1-c.webp

office-agent-working-back-v1.webp
office-agent-review-back-v1.webp
```

Suggested furniture manifest:

```json
{
  "id": "office-desk-v1",
  "requiredOrientations": ["front", "back", "left", "right"],
  "orientations": {
    "front": "office-desk-v1-front",
    "back": "office-desk-v1-back",
    "left": "office-desk-v1-left",
    "right": "office-desk-v1-right"
  },
  "footprints": {
    "front": { "width": 4, "depth": 2 },
    "back": { "width": 4, "depth": 2 },
    "left": { "width": 2, "depth": 4 },
    "right": { "width": 2, "depth": 4 }
  },
  "anchor": "center",
  "foregroundMask": "office-desk-v1-front-mask"
}
```

A fixed front-facing facility declares only the orientation it uses:

```json
{
  "id": "vending-machine-v1",
  "requiredOrientations": ["front"],
  "orientations": {
    "front": "vending-machine-v1-front"
  },
  "footprints": {
    "front": { "width": 2, "depth": 1 }
  },
  "anchor": "bottom-center"
}
```

Suggested workstation manifest:

```json
{
  "id": "workstation-v1",
  "desk": "office-desk-v1",
  "chair": "office-chair-v1",
  "monitor": "office-monitor-v1",
  "screenTheme": "analytics",
  "screenLoop": "seam",
  "screenFrames": ["analytics-a", "analytics-b", "analytics-c", "analytics-d"],
  "seatAnchor": { "x": 2, "y": 3 },
  "interactionAnchor": { "x": 2, "y": 4 }
}
```

## 10. QA checklist

### Geometry

- [ ] The asset uses the locked `W x D x H` entry from the Office Scale Bible.
- [ ] A neutral `1 x 1 x 3` adult scale overlay confirms the intended height
      and bulk.
- [ ] `requiredOrientations` is derived from current map placements and interaction facings.
- [ ] No cell was generated for an undeclared or hypothetical orientation.
- [ ] One-view and symmetric objects are not expanded into unnecessary turnarounds.
- [ ] Left/right mirroring preserves controls, hinges, props, highlights, and lighting direction.
- [ ] All views use the same intended object design.
- [ ] Every view is straight orthographic; side views are exact 90-degree turns.
- [ ] No oblique, three-quarter, diagonal, tilted, or perspective cell was
      accepted.
- [ ] Front/back width matches.
- [ ] Side depth matches.
- [ ] Footprint is integer-aligned.
- [ ] Irregular objects use orientation-specific masks.
- [ ] Anchor does not change between frames.
- [ ] The visible object was scaled uniformly and was not stretched to fill
      the render box.

### Layering

- [ ] Desk, monitor, screen, props, and character are separate.
- [ ] Every coordinate-placed object declares a compatible structural surface.
- [ ] Floor footprints and wall or ceiling anchors remain inside that surface.
- [ ] Supported objects use one compatible parent slot and no structural surface.
- [ ] Foreground mask hides the seated lower body.
- [ ] Screen overlay is clipped to the monitor viewport.
- [ ] Back views do not show front-only props.

### Animation

- [ ] Static assets use aliases rather than duplicate pixels.
- [ ] A rigid shell occupies one cell per required orientation.
- [ ] Screen, LED, and status overlays contain exactly four true seam-loop
      keyframes.
- [ ] Mechanical and ambient sets contain exactly four true keyframes.
- [ ] Overlay frames do not redraw the furniture shell.
- [ ] Animated assets keep a fixed silhouette.
- [ ] Screen movement is visible at final 1:1 size.
- [ ] Screen content is bright and high-value at 1:1; it is not mostly black,
      navy, or dark-blue.
- [ ] Screen playback uses `A-B-C-D-A`.
- [ ] The `D -> A` endpoint seam is visually continuous.
- [ ] Adjacent frames tell one continuous scene, status sequence, or game.
- [ ] Independent phase offsets prevent synchronized displays.

### Extraction

- [ ] Chroma key is removed.
- [ ] No magenta fringe or alpha halo remains.
- [ ] Transparent padding does not alter the floor footprint.
- [ ] Render box and collision footprint are recorded separately.
- [ ] Accepted files are packed and registered.

### In-game review

- [ ] One workstation works before batching.
- [ ] Ten workstations do not overlap.
- [ ] Characters can reach, sit, work, and leave.
- [ ] Screen content remains readable behind the character.
- [ ] Furniture remains stable when orientation changes.
- [ ] Mobile and narrow viewports remain usable.

## 11. Recommended production order

```text
1. Lock grid, palette, viewport, and anchor contracts.
2. Create and validate one bare desk.
3. Create and validate one monitor shell.
4. Create one four-frame analytics screen strip and test seam-loop playback.
5. Create one chair and one seated-back character pose.
6. Lock the facility v1 objects, 20 shared slots, action families, and
   approach/facing anchors.
7. Assemble and validate one workstation plus one facility reservation in the
   running office.
8. Produce the remaining four screen themes.
9. Produce the remaining workstation furniture and equipment.
10. Generate and validate `working-back-seated` and `working-front-seated`
    from the Einstein reference.
11. Expand the map/workstation modules toward the 15-person target.
12. Migrate the character roster.
13. Build the relaxation-area asset set.
14. Add ambient animations and interactions.
15. Run the full-room QA gate.
```

The best quality and speed come from locking the shared interfaces first. Once the desk, monitor viewport, screen overlay, seated anchor, and foreground mask are correct, the rest of the office becomes controlled asset production instead of repeated one-off fixes.

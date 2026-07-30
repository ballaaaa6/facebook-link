# Office Asset Creation Guide

Status: Primary Camera C furniture authoring guide; R05-r02 workstation placement owner-approved
Updated: 2026-07-30
Scope: Camera C furniture geometry, image authoring, four-direction source art,
wall contact, and preflight review

This is the primary Office furniture image-authoring guide. It records the
owner-accepted Camera C method demonstrated with the `2 x 2 x 4` refrigerator
mockup. The acceptance covers the geometry method, not any production asset,
room candidate, source pixel, or runtime hash.

Production approval and source authority still come from:

- `docs/art/OFFICE_FURNITURE_PRODUCTION_GATES.md`;
- `docs/art/OFFICE_2D_GEOMETRY_PRINCIPLES.md`; or
- a family-specific F1 geometry contract and F8 owner decision.

The production gates always win. In particular, this guide does not authorize
copying pixels from the Active Office, a rejected candidate, a processed
library crop, or an unaudited master. A family that adopts Camera C must record
that decision in a new versioned F1 contract before producing promotable art.

## 1. The Camera C rule

Camera C is a raised, axis-aligned furniture presentation.

Each orientation may show:

1. one top plane; and
2. exactly one vertical face.

It must not show two vertical faces at once. A visible front plane plus a
visible side plane is a three-quarter view and is rejected. A visible side
plane plus a broad rear plane is also a three-quarter view and is rejected.

Camera C changes pitch, not yaw:

```text
accepted: top + front
accepted: top + back
accepted: top + left profile
accepted: top + right profile
rejected: top + front + side
rejected: top + side + rear
```

The top plane is centered and symmetric. Its left and right insets must match.
The vertical face remains straight and axis-aligned. There is no diagonal
turn, vanishing-point drift, or second vertical plane.

## 2. Keep the physical contracts separate

Every furniture family must record these values independently:

- logical physical size `W x D x H`;
- floor footprint `W x D`;
- visible render envelope;
- base pivot;
- sort pivot;
- support plane, when applicable;
- interaction or seat facing;
- required orientations; and
- foreground occlusion parts.

Height never becomes floor depth. A `2 x 2 x 4` refrigerator always reserves
`2 x 2` floor cells. The `4` controls vertical mass and render height; it must
never create a `2 x 4` footprint.

The visible bitmap is not the collision rectangle. Handles, feet, foliage,
open doors, top projection, and transparent padding may exceed the footprint
without adding collision cells.

## 3. Camera C calibration

Use one logical tile as the authoring ruler:

```text
T = 32 authoring pixels
```

The accepted refrigerator reference measured approximately:

```text
top depth             = 77 reference pixels
vertical face height  = 570 reference pixels
physical depth        = 2 tiles
physical height       = 4 tiles
```

This produces the Camera C depth-projection coefficient:

```text
kC = (77 / 2) / (570 / 4)
   = 0.2702
   ≈ 0.27
```

Use these authoring constants for Camera C preflight:

```text
depthProjectionCoefficient = 0.27
topFarEdgeScale            = 0.92
topSymmetryTolerance       = 1 pixel
```

`topFarEdgeScale` creates the small, symmetric inset visible in the accepted
C reference. It does not authorize a second vertical face.

### 3.1 Projection formulas

For a front or back orientation:

```text
faceWidthPx       = W * T
verticalFacePx    = H * T
projectedTopPx    = round(D * T * 0.27)
topNearWidthPx    = faceWidthPx
topFarWidthPx     = round(faceWidthPx * 0.92)
topSideInsetPx    = round((topNearWidthPx - topFarWidthPx) / 2)
rotatedFootprint  = W x D
```

For a left or right orientation:

```text
faceWidthPx       = D * T
verticalFacePx    = H * T
projectedTopPx    = round(W * T * 0.27)
topNearWidthPx    = faceWidthPx
topFarWidthPx     = round(faceWidthPx * 0.92)
topSideInsetPx    = round((topNearWidthPx - topFarWidthPx) / 2)
rotatedFootprint  = D x W
```

With `bodyJoinY` at the top of the vertical face, the top polygon is:

```text
(x, bodyJoinY)
(x + topNearWidthPx, bodyJoinY)
(x + topNearWidthPx - topSideInsetPx, bodyJoinY - projectedTopPx)
(x + topSideInsetPx, bodyJoinY - projectedTopPx)
```

The two sloped top edges must be mirror images. Do not push one corner farther
back to imply yaw.

### 3.2 Why low furniture shows more top

Do not apply the refrigerator's `13.5%` top-to-face ratio to every object.
That ratio belongs to one `D2 / H4` volume.

The general ratio is:

```text
topToFaceRatio = (projected depth / vertical height)
               = (D / H) * 0.27        for front/back
               = (W / H) * 0.27        for left/right
```

The formula naturally produces the intended visual behavior:

- low furniture has a large top relative to its vertical face;
- medium furniture has a readable but controlled top;
- tall furniture has a smaller top relative to its height; and
- increasing physical depth increases the visible top without changing
  logical height.

Examples at `T = 32`:

| Asset blockout | Orientation | Vertical face | Projected top | Top/face |
| --- | --- | ---: | ---: | ---: |
| Refrigerator `2 x 2 x 4` | front/back | `128 px` | `17 px` | `13.3%` |
| Desk `3 x 2 x 2` | front/back | `64 px` | `17 px` | `26.6%` |
| Desk `3 x 2 x 2` | left/right | `64 px` | `26 px` | `40.6%` |
| Coffee table `3 x 2 x 1` | front/back | `32 px` | `17 px` | `53.1%` |
| Bookshelf `2 x 1 x 3` | front/back | `96 px` | `9 px` | `9.4%` |

These are blockout measurements. Feet, lips, cushions, bezels, foliage, and
other overflows remain separate from the logical volume.

### 3.3 Render-envelope consequence

Camera C adds projected top pixels above the vertical face:

```text
minimumVisibleHeight = verticalFacePx + projectedTopPx + baseOverflowPx
```

Do not shrink the object vertically to force this silhouette into an old
render box. If the current render box cannot contain the Camera C result, stop
at F1 and version the render-box contract before generating art.

If runtime requires one fixed canvas for all orientations, use an envelope
large enough for the maximum front, back, left, and right bounds. Center each
orientation on its declared pivot. If runtime supports orientation-specific
render bounds, record every bound explicitly. Never rescale one orientation
independently merely to fill its cell.

## 4. Four-direction contract

Author only the orientations required by the map. A four-direction family
uses these exact turns:

| Furniture facing | Source view | Allowed visible surfaces |
| --- | --- | --- |
| down / toward viewer | `front` | top + front |
| up / away from viewer | `back` | top + back |
| right | `facing-right` | top + strict right-facing profile |
| left | `facing-left` | top + strict left-facing profile |

The side cells must represent a physical 90-degree turn. Do not compress the
front view, shear the front view, or expose a broad door/front plane to make a
side view easier to read. A handle, hinge, trim edge, or door thickness may
appear as a narrow edge detail when physically correct; it must not become a
second vertical face.

Use semantic facing rather than trusting an old filename. Verify orientation
from doors, handles, controls, seat direction, shelf opening, and interaction
side before assigning `left` or `right`.

Required four-view invariants:

- one identity, palette, material language, outline, and light direction;
- one physical height across all views;
- front/back face width derived from `W`;
- side face width derived from `D`;
- correct `W x D` to `D x W` footprint rotation;
- one common ground-contact rule;
- stable base and sort pivots;
- no front-only controls or openings on the back;
- no rear service details on the front; and
- no second vertical plane in any cell.

## 5. Wall placement and inward-facing use

Wall location, furniture facing, visible source view, and wall contact are
four different concepts. Do not infer one from another.

For furniture whose physical back must touch the wall and whose usable front
must face the room center:

| Room wall | Furniture faces | Use this source | Physical face touching wall |
| --- | --- | --- | --- |
| top / north | down | `front` | back |
| bottom / south | up | `back` | back |
| left / west | right | `facing-right` | back |
| right / east | left | `facing-left` | back |

This mapping is mandatory for usable appliances, cabinets, vending machines,
and other front-operated furniture placed against a perimeter wall.

### 5.1 Flush placement does not delete the object

When a refrigerator is flush against the bottom foreground wall, the object
still occupies its complete `2 x 2` footprint. The wall hides the rear
vertical face that touches it, while the Camera C top remains visible.

The correct compositor behavior is:

```text
draw floor
draw furniture in sort-pivot order
draw foreground/bottom wall occlusion
draw debug overlays or UI
```

Do not:

- remove the bottom-wall refrigerator row;
- replace the refrigerator with a top-only asset;
- bake a brown wall into the refrigerator sprite; or
- change its footprint because the body is hidden.

The same full `back` sprite is used for both flush and separated placement.
The wall layer determines visible pixels.

### 5.2 Pulling furniture away from the wall

Moving a bottom-wall object inward by `g` whole floor cells shifts its sprite
by the normal world-grid projection. The newly visible rear-face band is
approximately:

```text
rearRevealPx = min(verticalFacePx, g * T)
```

At a zero-cell gap, the rear vertical face is hidden and the top remains. At a
one-cell gap, the upper rear band becomes visible. The exact band may be
clipped by the authored wall height, but it must come from the same sprite and
the same pivot rule.

With zero yaw, side-wall assets must not suddenly expose a broad rear plane.
A side placement may reveal floor clearance or a narrow physical edge, but a
large rear surface would be a forbidden three-quarter turn.

### 5.3 Corners and perimeter filling

Place footprints before drawing art:

1. reserve the top-wall ring;
2. reserve the bottom-wall ring;
3. reserve the left and right rings without overlapping corners;
4. fit only complete integer footprints; and
5. record any remainder cell as an intentional gap.

An occluded footprint still participates in collision and overlap checks.
Never use visible alpha to decide whether a corner is free.

## 6. How to adapt each furniture family

Start from the logical blockout, not from the old bitmap silhouette.

### 6.1 Tall closed shells

Examples: refrigerator, vending machine, server rack, filing cabinet, tall
storage cabinet, and floor copier.

Adjust them as follows:

1. Lock `W x D x H` and the floor footprint.
2. Build the Camera C cap from the complete physical depth.
3. Keep the front shell flat and axis-aligned.
4. Put doors, controls, outputs, and user-facing handles only on the front.
5. Put vents, service panels, cables, and access covers only on the back.
6. Use pure side profiles for left and right.
7. Allow only narrow front-edge hardware in side profiles.
8. Separate doors, drawers, screens, outputs, and effects from the immutable
   shell before animation.

Do not enlarge the footprint to match height. Do not expose a broad door plane
inside a side cell.

### 6.2 Desks, tables, counters, and low cabinets

These objects must show more top than a tall cabinet because their `D / H`
ratio is larger.

1. Project the complete logical support plane with Camera C.
2. Keep the near and far tabletop edges centered and symmetric.
3. Place aprons, drawers, legs, and cabinets below the support plane.
4. Keep supported equipment separate from the furniture shell.
5. Preserve the support plane in logical world coordinates even though its
   screen polygon is compressed by `0.27`.
6. Verify adjacent tables join by footprint, not by render-envelope height.

Do not reduce the top to a decorative strip. Do not create a trapezoid by
turning the table left or right; Camera C inset is symmetric and has zero yaw.

### 6.3 Chairs, sofas, and seating

Seating is not one solid cuboid. Decompose it into:

- floor base or legs;
- seat support plane;
- backrest;
- arms; and
- foreground occlusion parts.

Apply Camera C independently to physical horizontal surfaces such as the seat
cushion and arm tops. Keep the backrest as an axis-aligned vertical structure.
The seat contact, actor contact, floor pivot, and foreground mask remain
separate contracts.

Only author side orientations when a real map placement requires them. A
chair or sofa must not contain a baked person, pose, held prop, or approach
marker.

### 6.4 Shelves and open storage

1. Use the full shell depth to create the top plane.
2. Keep shelf openings on the declared usable face.
3. Use a closed or mechanically credible rear shell for the back view.
4. Side profiles show shelf depth, not a compressed front opening.
5. Separate removable books, boxes, or display props when they animate or
   change by state.

### 6.5 Round or visually symmetric furniture

Examples: round tables, stools, bins, simple pots, and some lamps.

Use one orientation when rotation does not change operation, collision,
lighting, or silhouette. Camera C still controls the visible horizontal
surface, but symmetry may make additional directional cells unnecessary.

Do not generate four near-identical cells merely to fill a turnaround sheet.

### 6.6 Plants and irregular silhouettes

Apply the Camera C blockout to the physical pot, planter, trunk base, or other
collision-bearing structure. Foliage may overflow the render envelope but
does not enlarge the floor footprint. Preserve the same root/pot pivot across
all required orientations.

Organic foliage must not be used to hide a wrong pot angle or a contaminated
source edge.

### 6.7 Wall-mounted and supported assets

Wall TVs, signs, clocks, art, and supported desk/counter equipment do not gain
a floor footprint. Use their wall or parent support contract. Do not add a
Camera C top cap when the object's physical thickness and placement do not
make that top visible.

Supported props inherit world placement from a declared parent socket. Their
bitmap size never creates new floor collision.

## 7. Conversion decision table

| Current condition | Required action |
| --- | --- |
| Authorized clean source already matches Camera C | Normalize bounds, pivot, and padding; do not redraw it. |
| Correct identity but wrong pitch | Re-author from a clean allowed source using a Camera C blockout. Do not vertically stretch the bitmap. |
| Any three-quarter or oblique source | Reject and regenerate the affected orientation. Do not shear, crop, or paint over it. |
| Front is valid but side is missing | Create a targeted strict 90-degree side source from the accepted identity reference. |
| Top is too small | Recompute only the top plane from physical depth; preserve face scale and ground pivot. |
| Top is too large on a tall asset | Recompute with `(depth / height) * 0.27`; do not scale the entire object down. |
| Side looks mostly like front or rear | Reject it and rebuild a pure side profile with only narrow edge hardware. |
| Front/back widths differ | Return to blockout; normalize world scale before detailing. |
| Footprint uses logical height | Correct F1 immediately; `H` never occupies floor cells. |
| Bottom-wall row disappears | Restore the placements and fix wall occlusion/layer order. |
| Full rear panel is visible while flush to the bottom wall | Fix the foreground wall mask; do not create a new sprite. |
| Mirroring reverses text, hinges, controls, or light | Author both left and right sources independently. |
| Old render box clips the Camera C top | Version the F1 render envelope; do not compress the art. |
| Source is Active Office, rejected, processed, or unaudited | Use it only as dimensional reference and create a clean authorized source. |

## 8. End-to-end authoring workflow

### Step 1 — Declare the family contract

Before prompting or drawing, record:

```json
{
  "physicalScale": { "width": 2, "depth": 2, "height": 4 },
  "footprint": { "width": 2, "depth": 2 },
  "camera": {
    "profile": "camera-c",
    "yawDegrees": 0,
    "depthProjectionCoefficient": 0.27,
    "topFarEdgeScale": 0.92,
    "visibleVerticalPlanes": 1
  },
  "requiredOrientations": [
    "front",
    "back",
    "facing-left",
    "facing-right"
  ],
  "basePivot": "footprint-front-edge-center",
  "sortPivot": "footprint-front-edge-center"
}
```

Also declare support, slots, approaches, animation parts, source authority, and
the intended wall placements.

### Step 2 — Draw four cuboid blockouts

Create a geometry-only sheet before detailed art:

1. draw the `W x D x H` front block;
2. create the exact back block;
3. rotate the footprint to `D x W` for the right-facing block;
4. create the exact left-facing block;
5. add the Camera C top polygon with the formulas above;
6. mark the base pivot and footprint cells; and
7. reject the sheet if any cell shows two vertical faces.

Do not proceed from blockout to detailed generation until width, depth, height,
top projection, and pivots pass at 1:1.

### Step 3 — Create a clean identity source

Follow F0-F3 in `OFFICE_FURNITURE_PRODUCTION_GATES.md`.

- Create one original isolated family.
- Use a uniform removable chroma background.
- Keep generous padding.
- Keep people, room pixels, labels, brands, effects, and props out.
- Use the cuboid silhouettes as strict composition guides.
- Generate or draw only required orientations.
- Reject any cell that changes identity, scale, pitch, or yaw.

Image generation may supply shaded source pixels, but it must not decide the
camera. Geometry guides, masks, extraction, scaling, pivots, and placement are
deterministic.

### Step 4 — Extract and normalize

1. Remove the chroma key.
2. Verify transparent corners and border clearance.
3. Crop each declared orientation independently.
4. Preserve one scale across all views.
5. Align the base pivot to the integer grid.
6. Add transparent padding to the approved render envelope.
7. Record orientation-specific alpha bounds.
8. Verify no magenta fringe or neighboring component remains.

Never use alpha bounds as footprint or collision data.

### Step 5 — Decompose semantic parts

Separate, when applicable:

- immutable shell;
- support surface;
- rear structure;
- base;
- foreground occlusion;
- door or drawer;
- screen or viewport;
- output item;
- effect; and
- interaction socket.

The Camera C shell and pivot remain byte-stable while children animate.

### Step 6 — Test on an empty grid

Produce a test board containing:

- the four direction sprites;
- a `W x D x H` cuboid proof;
- footprint rectangles;
- facing arrows;
- one neutral `1 x 1 x 3` adult ruler;
- a zero-cell wall-contact state; and
- a one-cell wall-gap state.

The zero-cell state must keep the full placement while the wall hides the
contact face. The one-cell state must reveal the expected rear band without
changing sprite identity or pivot.

### Step 7 — Test a four-wall room

Before adding people:

1. place top-wall assets facing down;
2. place bottom-wall assets facing up;
3. place left-wall assets facing right;
4. place right-wall assets facing left;
5. reserve corners only once;
6. record integer remainder cells;
7. sort by ground pivot; and
8. draw the foreground wall after furniture.

Run overlap validation against complete footprints, including objects whose
vertical faces are hidden.

### Step 8 — Stop for owner review

Camera C preflight does not grant production approval. Present the clean
turnaround, alpha proof, blockout, wall test, placement plan, and provenance
together. Continue only under the family-specific gate sequence.

## 9. Prompt templates

### 9.1 Clean Camera C turnaround

```text
Create one original [FURNITURE FAMILY] as isolated game-furniture source art.
Its locked logical size is [W] wide x [D] deep x [H] high tiles, and its floor
footprint is [W] x [D] tiles.

Create ONLY these required orientations: [ORIENTATIONS]. Use the supplied
Camera C cuboid guides as strict silhouettes.

Camera contract for every orientation:
- raised axis-aligned Camera C;
- pitch only and exactly 0-degree yaw;
- one visible top plane plus exactly one vertical face;
- no second vertical face;
- front/back are direct views;
- left/right are exact 90-degree profiles;
- centered symmetric top plane;
- preserve one design, scale, baseline, pivot, palette, material, outline,
  and upper-left light direction across all cells.

Front-facing controls, openings, handles, and interaction outputs belong only
on the front. Rear vents and service panels belong only on the back. A side
view may show narrow edge hardware but must not expose a broad front or rear
plane.

Place one isolated object per declared cell on a perfectly flat solid #FF00FF
chroma-key background. Keep generous empty padding. No room, floor, wall,
person, character, prop, labels, logos, watermark, cast shadow, reflection,
three-quarter view, diagonal turn, isometric camera, asymmetric convergence,
or vanishing-point drift beyond the supplied symmetric Camera C top guide.
```

The prompt does not replace the geometric guide. Reject output that violates
the blockout even when its materials and details look attractive.

### 9.2 Targeted missing side

```text
Use the supplied accepted [FURNITURE FAMILY] identity only as the design,
palette, material, outline, and scale reference. Create ONLY the missing
[FACING-LEFT or FACING-RIGHT] Camera C source.

The result is an exact 90-degree profile with pitch only and 0-degree yaw. It
shows one centered top plane and one side vertical face. It must not show a
broad front plane, rear plane, person, prop, room, label, logo, watermark,
shadow, or reflection. Preserve the declared physical scale, ground pivot,
and upper-left lighting. Use a perfectly flat solid #FF00FF chroma-key
background with generous padding.
```

Do not use this template to repair an unauthorized or contaminated source.

## 10. Required review artifacts

Create these review files for each Camera C family before room promotion:

1. `01-camera-c-measurement-lock.png`;
2. `02-camera-c-cuboid-four-directions.png`;
3. `03-camera-c-four-direction-turnaround.png`;
4. `04-wall-flush-vs-gap-proof.png`;
5. `05-four-wall-facing-footprint-plan.png`;
6. `06-four-wall-grid-test.png`;
7. `07-four-wall-clean-test.png`; and
8. a manifest containing formulas, pivots, bounds, placements, counts, source
   hashes, and intentional gaps.

These files are review evidence only until the production gates and owner
approval explicitly promote the named family.

## 11. Camera C QA checklist

### Projection

- [ ] Camera profile is explicitly `camera-c`.
- [ ] Yaw is exactly `0` degrees.
- [ ] Every view shows one top plane and one vertical face.
- [ ] No view shows a second vertical face.
- [ ] The top is horizontally centered.
- [ ] Left and right top insets differ by no more than one pixel.
- [ ] Projected top depth comes from physical depth and `kC = 0.27`.
- [ ] Low furniture shows more relative top than tall furniture.
- [ ] One orientation was not independently stretched to fill its cell.

### Geometry

- [ ] Logical `W x D x H` is recorded.
- [ ] Floor footprint excludes `H`.
- [ ] Front/back use `W x D`; side views rotate to `D x W`.
- [ ] Render envelope, footprint, and alpha bounds remain independent.
- [ ] Base and sort pivots are integer-grid stable.
- [ ] Handles, doors, feet, and foliage overflow without changing collision.
- [ ] The render box contains the complete Camera C top without compression.

### Direction

- [ ] Top-wall furniture faces down into the room.
- [ ] Bottom-wall furniture faces up into the room.
- [ ] Left-wall furniture faces right into the room.
- [ ] Right-wall furniture faces left into the room.
- [ ] Side labels were verified from physical features rather than filenames.
- [ ] Mirroring does not reverse controls, hinges, text, props, or lighting.

### Wall contact and occlusion

- [ ] Flush furniture retains its complete placement and footprint.
- [ ] The wall-contact rear face is hidden by layer order, not deleted art.
- [ ] The Camera C top remains visible at zero gap.
- [ ] A one-cell gap reveals the expected rear band.
- [ ] Side-wall assets do not expose a broad rear plane.
- [ ] Foreground wall pixels are not baked into furniture sprites.
- [ ] Hidden footprints still participate in overlap and route checks.

### Source and production safety

- [ ] Source authority is recorded before art creation.
- [ ] No Active Office, rejected, processed, or unaudited pixels were reused.
- [ ] A clean source or admitted full-master extraction passed F2-F3.
- [ ] Chroma, alpha, padding, connected components, and border contact pass.
- [ ] Animation uses an immutable shell plus local children.
- [ ] Review evidence does not claim F8, F9, F10, or Active Office approval.

## 12. Hard rejection conditions

Reject the asset or placement immediately when any of these occurs:

- a side cell becomes a three-quarter view;
- two vertical faces are visible;
- physical height is used as floor depth;
- the top plane is guessed independently for each asset;
- a tall object and a low object receive the same top-to-face ratio;
- the bottom-wall row is removed because its body is occluded;
- a flush bottom-wall object shows its complete rear panel through the wall;
- left-wall furniture faces left or right-wall furniture faces right;
- one orientation changes object scale or identity;
- the pivot moves between states or orientations;
- a wall mask is baked into the furniture source;
- an old render box clips the Camera C top and the art is compressed to fit;
- a missing source silently falls back to an old library asset; or
- review evidence is treated as production approval.

The guiding rule is simple: define the physical block first, project it with
one shared Camera C, author only the required axis-aligned faces, and let the
map compositor decide occlusion. Art must follow geometry; geometry must not
be reverse-engineered from whichever generated image looks most attractive.

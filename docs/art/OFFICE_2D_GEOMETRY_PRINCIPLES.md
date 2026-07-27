# Office 2D Geometry Principles

Status: Geometry Contract v3

This document is the geometry source of truth for Office assets. It separates
top-down placement and collision from the visible bitmap so a straight-front
sprite, transparent overflow, or tall actor cannot silently redefine world
geometry.

Machine-readable definitions live in
`assets/game/manifests/office-asset-geometry.schema.json` and
`packages/contracts/src/officeGeometry.ts`.

## Coordinate spaces and units

- World X increases to the right.
- World Y increases toward the viewer and draws later when a floor object has
  a greater `sortPivot.y`.
- Physical scale, footprints, support planes, pivots, slots, and vertical
  extension use logical tile units. Half-tile values are allowed for pivots
  and slot centers.
- Source and render dimensions use canonical authoring pixels. One tile is 32
  authoring pixels; a 2x export scales those pixels without changing logical
  geometry.
- `basePivot` and `sortPivot` are local to the footprint origin. They never
  derive from the bitmap center or alpha bounding box.
- `renderOffset` is measured in authoring pixels from `basePivot` to the
  render-bounds origin. It never changes collision, navigation, or slots.

## Independent geometry concepts

Every Geometry v3 record declares each concept or uses an explicit `null` or
empty collection when the concept does not apply.

1. `assetType` defines semantic behavior rather than visual style.
2. `placementPlane` names floor, wall, ceiling, or a furniture surface.
3. `physicalScale` records intended physical width, depth, and height.
4. `footprint` reserves top-down floor cells for placement and collision.
5. `supportPlane` defines a local surface that may accept child objects.
6. `basePivot` aligns an asset to its logical placement point.
7. `sortPivot` controls front-to-back ordering independently from placement.
8. `renderBounds` records the visible bitmap canvas at the authoring scale.
9. `renderOffset` positions that canvas without moving logical geometry.
10. `verticalExtension` records visible mass above or below the base.
11. `occlusionParts` names rear, base, and foreground composite parts.
12. `attachmentSlots` and `seatSlots` define legal child and actor anchors.
13. `orientation` names the authored front, back, left, or right view, or
    `none` for a non-oriented asset.

A debug footprint is not a clipping cage. Visible pixels may cross a footprint
edge when render bounds and offsets declare that overflow.

## Asset types

### `floor-decal`

Uses the floor plane but reserves no collision, owns no slots, has no pivots,
and does not participate in Y-sort. Rugs and cable covers use this type.

### `upright-floor-object`

Requires a floor footprint, base pivot, and sort pivot. It owns no support or
seat plane. Tall plants, floor lamps, and simple cabinets use this type.

### `surface-furniture`

Requires independent floor footprint and support plane plus both pivots.
Desks, counters, tables, and credenzas use this type. Attachment slots must
reference and remain inside the declared support plane.

### `seat`

Requires a floor footprint, pivots, and at least one seat slot. Chairs, sofas,
beanbags, and massage chairs use this type. Seat slots may sit within or beside
the visible upholstery but remain logical tile-space anchors.

### `wall-mounted`

Uses the wall plane, has no floor footprint, and does not use floor Y-sort. Its
base pivot aligns it to the wall surface. Wall TVs, clocks, signs, and art use
this type.

### `structural-opening`

Uses the wall plane and represents a semantic opening independently from its
threshold, leaf, and visual overlay. Doors and traversable openings use this
type.

### `animated-shell`

Uses the placement rules of its plane and must declare more than one frame.
Every frame preserves identical base and sort pivots. Vending machines, arcade
screens, and other locally animated facilities use this type.

### `character`

Uses the floor plane, reserves exactly `1 x 1`, and sorts from the foot or seat
base rather than the head or bitmap center. Morphology may extend outside the
cell without expanding collision.

## Canonical workstation decision

Geometry v3 resolves the previous `4 x 2` versus `5 x 4` conflict as follows:

```text
physicalScale  = 5 x 4 x 2.4 tiles
floor footprint = 5 x 4 tiles
support plane   = 5 x 3 tiles at height 2.4
employee edge   = the fourth depth row, with no attachment slots
```

The five columns provide a center lane and two prop columns on each side. The
three support rows contain the monitor row, keyboard row, and near clear/prop
row. The fourth row belongs to the physical desk footprint but is not a legal
support row.

This approves the logical contract, not the rejected v6 artwork. Replacement
art must visibly represent the four-cell top-down depth without stretching a
straight-front bitmap to fill the footprint.

## Paired workstation behavior

- Each desk reserves one complete `5 x 4` rectangle.
- Adjacent desk footprints may touch edges but may not overlap.
- Far and near desk rows touch directly.
- A chair reserves one adjacent `1 x 1` cell on the employee edge.
- The far row faces the viewer and the near row faces away.
- Greater `sortPivot.y` draws later.
- A desk composite separates its support surface, underframe/base, and
  foreground occluder.
- The far actor may be occluded below the torso; its head-safe region remains
  visible.
- The near actor draws above the paired workstation group.

## Support, attachment, and seating rules

- A child asset on furniture references a named attachment slot and does not
  create new floor collision.
- An attachment slot references exactly one `supportPlane.id` and remains
  inside that plane.
- A slot may have one claimant unless its contract explicitly allows capacity.
- A seat slot declares its facing independently from the furniture bitmap.
- A character's seated render offset changes visual placement only; its
  reservation and navigation points remain logical.
- Wall and ceiling objects never acquire floor placement merely because their
  images visually overlap floor pixels.

## Orientation rules

- `front` and `back` are exact opposing views; `left` and `right` are strict
  90-degree profiles.
- A rectangular footprint swaps width and depth for a 90-degree orientation.
- Mirroring is allowed only after the asset is proven visually and
  functionally symmetric.
- Orientation completeness is evaluated per asset family during audit.
- No three-quarter or diagonal view may claim a strict orientation.

## Render and occlusion rules

- Bitmap dimensions never define collision.
- `renderBounds` may be larger or smaller than the footprint projection.
- `renderOffset` and `verticalExtension` may not move a footprint or slot.
- Multi-part furniture declares rear, base, and foreground parts explicitly.
- Occlusion parts are deterministic derivatives or authored components; the
  renderer must not create an arbitrary percentage clip.
- Animated frames keep render dimensions and pivots stable unless a future
  schema version explicitly authorizes a bounded exception.

## Validation rules

The Geometry v3 validator rejects:

- unsupported asset types, planes, or orientations;
- wall assets with floor footprints;
- floor decals that enter Y-sort or own slots;
- floor objects without placement and sort pivots;
- surface furniture without a support plane;
- duplicate or out-of-bounds attachment slots;
- seats without seat slots;
- characters whose footprint is not `1 x 1`;
- animated shells without stable base and sort pivots;
- non-finite or negative geometry where a positive dimension is required.

The complete asset audit may classify a legacy record as missing Geometry v3
data. The legacy adapter must not invent unknown support planes, pivots,
orientations, or occlusion parts.

## Acceptance

Geometry v3 is accepted when:

- one valid fixture exists for each asset type;
- invalid fixtures cover the known failure modes;
- the written contract, JSON Schema, and shared TypeScript types agree;
- the canonical desk's physical scale, footprint, and support plane are
  independently asserted;
- the Active Office still uses its legacy manifest unchanged; and
- `npm run art:geometry:check` and `npm run check` pass.

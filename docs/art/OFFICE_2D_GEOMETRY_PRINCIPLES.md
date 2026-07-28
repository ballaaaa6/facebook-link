# Office 2D Geometry Principles

Status: Current Geometry v6 workstation principles; R05-3A owner anchor-proof review
Updated: 2026-07-28

This document defines the shared Office principles. For Step 5 workstation
work, Geometry v6 supersedes declaration-only anchor equality. Earlier
workstation rules remain historical evidence only.

Machine-readable workstation authority:
`assets/game/manifests/office-workstation-assembly-bible-v3.json`.
Camera authority: `assets/game/manifests/office-camera-scale-bible-v3.json`.
Character-scale authority:
`assets/game/manifests/office-character-scale-standard-v1.json`.
R05 calibration authority:
`assets/game/manifests/office-workstation-step5-r05-calibration.json`.
R04 component and assembly manifests are rejected historical evidence except
for the explicitly accepted desk pixels.

## Coordinate spaces

- World X increases to the right.
- World Y increases toward the viewer.
- World Z increases upward.
- One logical tile is 32 authoring pixels.
- Workstation projection is `screenX = worldX * 32` and
  `screenY = worldY * 32 - worldZ * 32`.
- `footprint` is top-down physical floor reservation and collision.
- `supportPlane` is the top-down furniture surface that accepts children.
- `renderBounds` and `renderOffset` place visible pixels; they never add
  collision cells.
- `basePivot` places an asset. `sortPivot` controls front-to-back order.
- The placement formula is
  `drawOrigin = worldReservationCenter - localVisualPivot`.
- Front/back art cannot add orientation-specific placement offsets.
- A visible leg, drawer, apron, monitor stand, chair back, or actor head is
  height or render overflow. None of those parts expands a footprint.

The visible bitmap is not a collision rectangle. Transparent canvas size and
the alpha bounds are also not collision geometry.

## Character-relative world scale

The current Active Office character scale is the comparison ruler for all new
Office geometry. A character reserves a `1 x 1` floor footprint and has a
logical `1 x 1 x 3` volume. At a 32-pixel tile, the current renderer displays
its frame at `96 x 104` pixels. That visible envelope is deliberately larger
than the collision footprint.

Hair, head, clothing, arms, and seated legs may overlap neighboring screen
pixels in the same way they do in other tile-based games. Do not clip those
pixels, stretch the footprint, or give individual characters a different
world scale. Furniture dimensions must be evaluated beside this ruler, not
against the transparent canvas or alpha bounds of one sprite.

For seating, the chair reserves `1 x 1` on the floor and has logical height
`2`. Actor and chair share that one floor cell. The chair seat anchor and actor
hip anchor share one world point. Backrest, seat/base, actor frame, collision
footprint, and logical volume remain separate data.

## Independent geometry concepts

Every Office asset must keep these concepts independent:

1. semantic asset type;
2. placement plane;
3. physical scale;
4. floor footprint;
5. support plane;
6. placement pivot;
7. sort pivot;
8. render bounds and offset;
9. vertical extension;
10. rear, surface, base, and foreground semantic parts;
11. equipment attachment reservations;
12. chair seat and actor pelvis anchors;
13. strict front, back, left, or right orientation.

The rule is practical: when two school desks are pushed together, the two
tabletops touch in plan. The nearer desk's visible legs can hide the farther
desk's legs, but neither desk gains another floor row merely because its legs
are tall.

## Workstation Rule v3

```text
desk physical scale = 3 x 2 x 2 tiles
desk footprint      = 3 x 2 tiles
support plane       = 3 x 2 tiles at z = 2 (96 x 64 pixels)
employee-edge row   = none
base pivot          = (1.5, 2)
sort pivot          = (1.5, 2)
authoring canvas    = 3 x 4 tiles
chair footprint     = shared person/chair 1 x 1 floor cell
chair volume        = 1 x 1 x 2 tiles
character volume    = 1 x 1 x 3 tiles
```

The complete tabletop occupies the `3 x 2` plan. The render canvas may be
taller than two tiles so the sprite can contain the table edge, legs, drawers,
and occlusion masks. That extra bitmap height is not a third floor row.

Standard, Creative, and NOC stations use the same physical desk family.
Equipment is the variant; desk geometry is not.

## Monitor and keyboard reservations

The monitor reserves the actor-far `3 x 1` band. The keyboard reserves only
the middle `1 x 1` cell in the actor-near row.

- The monitor uses the desk row farthest from the seated actor.
- The keyboard uses the center cell of the adjacent row nearest the seated
  actor.
- For the far actor north of the desk, keyboard local Y is `0` and monitor
  local Y is `1`.
- For the near actor south of the desk, monitor local Y is `0` and keyboard
  local Y is `1`.
- A monitor is never stretched to fill all three tiles.
- The proposed keyboard visual is `48 x 24` pixels. Its `1.5 x 1` visual
  maximum may overflow the reservation horizontally while remaining inside
  the desk top.

## Paired ten-seat block

Ten-seat coordinates are intentionally not current authority. R04 validates
one logical station only. A ten-seat block can be derived only after the owner
accepts the R04 pixels and renderer. The Active Office background, zone split,
map, registry, and roster remain unchanged.

## Furniture part contract

Each desk orientation is exported as explicit semantic parts:

- `rear`: rim or structure behind equipment and actor;
- `surface`: the visible top plane corresponding to the `3 x 2` support plane;
- `base`: legs, drawers, apron, and vertical mass below the tabletop;
- `foreground`: front lip or mask that may cover seated lower-body pixels.

Every part records whether it may visually overflow. Every part records
`changesFootprint: false`. The foreground may cover the lower body but must not
cover the actor head-safe region. The chair base, actor, and chair foreground
remain separate from all desk parts.

## Orientation and occlusion

- Historical `.front` and `.back` filenames are not semantic authority. R04
  verified drawers, modesty panel, knee space, actor side, and monitor side
  from visible features before assigning seat/public meanings.
- Near-row chair and actor layers draw in front of the paired desk bank.
- Far-row lower-body pixels may be hidden by the desk base or foreground.
- Greater `sortPivot.y` draws later.
- No diagonal, isometric, oblique, or three-quarter asset can satisfy a strict
  front/back orientation.

## Rejected rules and assets

The following cannot feed new art, new layout, or Active Office promotion:

- `desk.modular.v1`;
- `desk.standard.up`, `desk.creative.up`, and `desk.noc.up`;
- `chair.office.up` and `chair.studio.up`;
- any `5 x 4` workstation footprint;
- any `5 x 3` workstation support plane;
- any extra employee-edge footprint row.

Historical v1 labs and screenshots may remain readable only as rejected
regression evidence. They are not current examples.

The Step 5 R01 and R02 manifests and images are rejected evidence. They cannot
define actor scale, chair geometry, desk-side meaning, keyboard reservation,
or contact anchors.

## Approval gate

R04 physical composition is rejected; coordinate stability did not prove
seat contact or correct equipment pivots. R05-3A freezes the keyboard, centers
the monitor base, and proves the chair/person sockets with placeholders.
R05-3B polished artwork,
single-seat composition, the other eighteen characters, ten seats, Step 6,
and Active Office permissions remain false pending owner approval.

# Office 2D Geometry Principles

Status: Current Geometry v8 workstation principles; R05-r02 P0-P3 owner review
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
Rejected R05 assembled evidence:
`assets/game/manifests/office-workstation-step5-r05-final.json`.
Current coordinate/socket review authority:
`assets/game/manifests/office-workstation-step5-r05-r02.json`.
Roster seat-socket authority:
`assets/game/manifests/office-character-seat-sockets-v1.json`.
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
- Static support placement uses
  `drawOrigin = project(worldSupportSocket.xyz) - localSupportSocket.xy`.
- Seated actor placement uses
  `actorDrawOrigin = project(chairSeatSocketWorld.xyz) - actorSeatContactLocal.xy`.
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
`2`. Actor and chair share that one floor cell. The chair seat socket and actor
seat-contact socket resolve to one world point, but their bitmap origins are
independent. Never align a character and chair by assigning the same top-left
pixel. Backrest, seat/base, actor frame, collision footprint, support plane,
local sockets, and logical volume remain separate data.

Seat contacts are recorded per character, orientation, and animation frame.
The current library contains eighteen seat-capable 8x15 actor atlases. Boba is
the nineteenth character directory but owns an 11-row companion atlas with no
seated-working rows, so its seat capability is explicitly `not-applicable`.
No pose may be invented to make a directory satisfy a seat count.

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

## Depthwise desk pairing

A depthwise pair advances by the desk footprint depth, exactly two tiles or
64 pixels. It does not advance by the 128-pixel authoring canvas. The nearer
tabletop occupies the same projected screen band as the farther desk's base,
so normal painter ordering hides the farther legs and drawers while preserving
both complete 3x2 tabletops. The accepted proof stops at one paired column;
five-column and ten-person expansion remain blocked pending owner review.

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
- In the far row, the keyboard draws before the upright monitor because the
  monitor is closer to the viewer and occludes any projected overlap.
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

R04 physical composition is rejected; coordinate stability did not prove seat
contact or correct equipment pivots. R05 final is retained as rejected
composition evidence because it used a shared actor/chair top-left origin,
placed depthwise desks 128 pixels apart, and drew the far keyboard over the
monitor. R05-r02 replaces those rules with per-frame seat sockets, a 64-pixel
footprint join, and physical equipment depth order. It stops after P0-P3 and
one paired workstation proof. Ten-seat expansion, other furniture, hand
sockets, Step 6, and Active Office promotion remain false pending owner review.

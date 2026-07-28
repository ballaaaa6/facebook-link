# Office 2D Geometry Principles

Status: Current Geometry v3 principles with Workstation Rule v2
Updated: 2026-07-28

This document is the current geometry source of truth for Office assets.
Workstation Rule v2 supersedes every earlier `5 x 4` footprint, `5 x 3`
support plane, and employee-edge footprint-row decision. Those values remain
only in explicitly rejected v1 fixtures for regression evidence.

Machine-readable workstation authority:
`assets/game/manifests/office-workstation-assembly-bible-v2.json`.
Camera authority: `assets/game/manifests/office-camera-scale-bible.json`.

## Coordinate spaces

- World X increases to the right.
- World Y increases toward the viewer.
- One logical tile is 32 authoring pixels.
- `footprint` is top-down physical floor reservation and collision.
- `supportPlane` is the top-down furniture surface that accepts children.
- `renderBounds` and `renderOffset` place visible pixels; they never add
  collision cells.
- `basePivot` places an asset. `sortPivot` controls front-to-back order.
- A visible leg, drawer, apron, monitor stand, chair back, or actor head is
  height or render overflow. None of those parts expands a footprint.

The visible bitmap is not a collision rectangle. Transparent canvas size and
the alpha bounds are also not collision geometry.

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

## Workstation Rule v2

```text
desk physical scale = 3 x 2 x 2.4 tiles
desk footprint      = 3 x 2 tiles
support plane       = 3 x 2 tiles at height 2.4
employee-edge row   = none
base pivot          = (1.5, 2)
sort pivot          = (1.5, 2)
authoring canvas    = 3 x 4 tiles
chair footprint     = separate 1 x 1 tile
```

The complete tabletop occupies the `3 x 2` plan. The render canvas may be
taller than two tiles so the sprite can contain the table edge, legs, drawers,
and occlusion masks. That extra bitmap height is not a third floor row.

Standard, Creative, and NOC stations use the same physical desk family.
Equipment is the variant; desk geometry is not.

## Monitor and keyboard reservations

Both reservations use `3 x 1` logical surface bands for simple deterministic
placement. The artwork may be smaller than the reserved band and must remain
centered.

- The monitor uses the desk row farthest from the seated actor.
- The keyboard uses the adjacent desk row nearest the seated actor.
- For the far actor north of the desk, keyboard local Y is `0` and monitor
  local Y is `1`.
- For the near actor south of the desk, monitor local Y is `0` and keyboard
  local Y is `1`.
- A monitor is never stretched to fill all three tiles.

## Paired ten-seat block

The normalized review geometry uses the existing `36 x 24` Active Office grid
without modifying its background or zone split. The work zone remains
`x=0..23`.

```text
desk origins X = [4, 7, 10, 13, 16]
far chairs     = y 5
far desks      = y 6..7
near desks     = y 8..9
near chairs    = y 10
desk bank      = x 4..18, y 6..9
```

The five columns touch horizontally because each origin is exactly three
tiles apart. The two rows touch vertically because the near row begins at Y 8,
immediately after the far row ends at Y 8. Chairs stay outside the desk
footprints and are centered on the middle tile of each desk.

These coordinates are the approved blueprint. Only Step 4 bare desk artwork is
authorized. Single-seat assembly, renderer work, ten-seat assembly, and Active
Office promotion remain false.

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

- The far row uses the front-facing desk assembly, an actor facing down, and
  the back of the monitor visible to the viewer.
- The near row uses the back-facing desk assembly, an actor facing up, and the
  monitor front visible to the viewer.
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

## Approval gate

The geometry boards are approved and the Step 4 bare desk is now in owner
review. Before Step 5, the owner must approve the replacement elevated-camera
desk, its semantic layers, and its zero-gap adjacency proofs.

1. replacement source plus normalized front/back desk;
2. front/back semantic layer proof;
3. two- and five-module adjacency proof;
4. Step 4 contact sheet.

Until that approval is recorded, chair/monitor/keyboard assembly, renderer,
ten-seat scene, and Active Office permissions stay false.

# Office 2D geometry principles

This document is the geometry contract for Office furniture, actors, and
surface props. It prevents a sprite's visible height from being mistaken for
the cells that the object reserves.

## Five independent concepts

Every placeable object must be reasoned about through separate concepts:

1. **Floor footprint** — top-down cells reserved for collision and placement.
2. **Support grid** — cells on a desk, table, wall, or other parent that may
   accept attached objects.
3. **Ground pivot** — the base point used to position and depth-sort the
   sprite. For floor objects this is normally the bottom-center of the
   footprint.
4. **Render bounds** — the visible width and height of the bitmap. Render
   bounds may extend outside the footprint.
5. **Render offset** — a visual-only correction from a logical point to a
   sprite pivot. It never changes collision or pathfinding.

A collision or debug rectangle is not a clipping cage. A chair, employee,
monitor, or desk may be visibly taller than its reserved cells.

## Paired workstation contract

Each desk reserves a complete rectangular `5 x 4` top-down footprint: 20
cells. Adjacent desks and the two desk rows may touch footprint edges. Touching
edges do not count as overlap and no decorative gap is inserted.

The four depth rows have the following employee-relative meaning:

| Depth row | Center column | Side columns |
| --- | --- | --- |
| Farthest from employee | Monitor | Two left and two right prop cells |
| Middle | Keyboard | Two left and two right prop cells |
| Near | Clear center cell | Two left and two right prop cells |
| Employee edge | Clear across the desk | No attachment slots |

The left side therefore contains `2 x 3 = 6` prop cells and the right side
contains another six. Monitor and keyboard each reserve one center support
cell. Their bitmap may be wider than one cell so that the equipment remains
legible and proportionate to the desk.

The chair reserves exactly one `1 x 1` floor cell immediately adjacent to the
employee edge of the desk. There is no empty cell between desk and chair. The
actor and chair sprites are bottom-center anchored to that floor base; their
heads and backs may visually cross the desk footprint.

## Orientation and depth

- The far row is next to the wall and faces the viewer. Its chair base is on
  the wall side of the desk.
- The near row faces away from the viewer. Its chair base is on the viewer
  side of the desk.
- Exactly one floor row remains clear between the wall and the far chair
  bases.
- The far and near desk footprints touch directly.
- Depth order derives from each object's ground pivot or footprint bottom,
  not from the bitmap center.
- A greater ground Y draws later. The near desk therefore hides the lower
  visual parts of the far desk where the bitmaps overlap.
- The near seated actor draws above the complete paired workstation group.
  The far seated actor uses a lower desk foreground mask so the desk can hide
  the lower body without covering the head.

## Validation rules

The geometry validator must check footprints, support compatibility, protected
routes, surface bounds, and duplicate slot claims. It must not reject visual
overhang that leaves a collision footprint. Debug overlays show the exact
footprint and support cells; they never resize or clip the sprite.

Browser acceptance for a paired block covers all of the following:

- ten `5 x 4` desk footprints and ten adjacent `1 x 1` chair footprints;
- no gap between desk rows and no footprint overlap;
- five front-facing and five back-facing seated employees;
- monitor, keyboard, clear center cell, and 6+6 side prop cells per desk;
- proportionate monitor and keyboard render bounds;
- near-row occlusion over the far row and unobscured actor heads;
- stable positions and poses for the full sampling interval.

## Engine references

This model follows established 2D scene practices:

- [Godot CanvasItem Y sorting](https://docs.godotengine.org/en/stable/classes/class_canvasitem.html)
  sorts a later ground Y in front.
- [Unity Sprite Sort Point](https://docs.unity3d.com/ScriptReference/SpriteSortPoint.html)
  supports pivot-based sorting instead of center-based sorting.
- [Unity Sorting Groups](https://docs.unity3d.com/6000.0/Documentation/Manual/sprite/sorting-group/sorting-group-landing.html)
  describe grouping multi-sprite characters and furniture.
- [Tiled object layers](https://doc.mapeditor.org/en/stable/manual/objects/)
  separate placed-object geometry and alignment from tile artwork.
- [The Sims 4 Build Mode](https://www.ea.com/games/the-sims/the-sims-4/new-player-hub/build-mode)
  is the interaction reference for grid-based placement; this project keeps
  its own explicit footprint, support, and depth contracts.

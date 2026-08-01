# World Coordinates, Projection, and Camera

## Coordinate authority

The first implementation uses integer world cells with four integer sub-cell
units. Projection version `office-projection-v1` fixes a 64 by 32 logical-pixel
cell, 16 logical pixels per elevation unit, and a non-rotating camera. Increasing
X moves screen right/down; increasing Y moves screen left/down.

Screen position is derived. Components may not persist pixel offsets as world
placement. Asset metadata may define a sprite origin only for presentation.

Decision 0008 locks the coordinate spaces that W1.1 will encode:

- `CellPosition` is an integral floor-local occupancy and placement value;
- `SubCellPosition` is an integral floor-local movement value with exactly four
  units per cell under `office-projection-v1`;
- definition-local pixels describe authored local geometry;
- sprite pixels describe points inside a sprite canvas or frame;
- screen pixels exist only after projection and camera transformation.

These values are not structurally interchangeable. A named transform must own
every conversion. Floor identity belongs to a versioned owner or reference and
is never inferred from elevation.

The generic `position` in `schemas/common.schema.json` is frozen V1 evidence.
W1.1 introduces `common-v2.schema.json` rather than changing the historical
shape. A V1 value without complete version, floor, coordinate-space, and
projection context fails migration instead of being guessed.

## Facing transform

World and simulation truth uses `north`, `east`, `south`, and `west`. Under
`office-projection-v1`, presentation maps those values as follows:

| World facing | Screen facing |
| --- | --- |
| `north` | `north-east` |
| `east` | `south-east` |
| `south` | `south-west` |
| `west` | `north-west` |

Mirror policy is presentation metadata only. It may change which frame is
drawn, but it cannot change world facing or the transform above.

## Projection contract

A projection exposes pure `project` and `unprojectGround` operations. The
accepted 2:1 isometric projection uses:

```text
screenX = originX + (worldX - worldY) * halfTileWidth
screenY = originY + (worldX + worldY) * halfTileHeight - elevation * elevationHeight
```

This formula is versioned by `decisions/0001-projection-grid.md`. It is not
copied into React or asset components. Pointer picking uses the inverse operation
and a half-open edge policy with `(y, x)` as the stable tie-breaker.

## Camera contract

The camera owns world focus, viewport, zoom, and world-space bounds. It does not
resize or rearrange the world for small screens.

Camera focus is scoped to one explicit building/floor reference. Switching a
floor selects another independently versioned floor-local world; elevation and
camera Y never select a floor. Presentation-only site bounds may inform framing
but cannot expand world occupancy or picking into an indoor route.

- Pan and zoom are bounded and deterministic for a given viewport.
- Zoom limits preserve legibility and prevent texture over-scaling.
- Fit-to-world adds documented safe margins.
- Pixel snapping is applied only after projection and camera transformation.
- Phone layouts may change surrounding UI but retain the same world positions.

## Depth inputs

Projection returns screen position, projected ground contact, and normalized
depth inputs. Render ordering is owned by `RENDERING_DEPTH_OCCLUSION.md`.

## Required evidence

- Projection round-trips at bounds and representative sub-cell positions.
- The four world facings map to the four screen facings exactly.
- Schema and generated-type checks reject coordinate-space substitution.
- Pointer picking states its edge and tie behavior.
- Camera fitting passes desktop, tablet, and phone fixtures.
- Repeated projection of the same input produces byte-identical test output.
- No authoritative scene fixture contains a screen-pixel placement field.

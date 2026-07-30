# World Coordinates, Projection, and Camera

## Coordinate authority

The first implementation uses integer world cells with four integer sub-cell
units. Projection version `office-projection-v1` fixes a 64 by 32 logical-pixel
cell, 16 logical pixels per elevation unit, and a non-rotating camera. Increasing
X moves screen right/down; increasing Y moves screen left/down.

Screen position is derived. Components may not persist pixel offsets as world
placement. Asset metadata may define a sprite origin only for presentation.

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
- Pointer picking states its edge and tie behavior.
- Camera fitting passes desktop, tablet, and phone fixtures.
- Repeated projection of the same input produces byte-identical test output.
- No authoritative scene fixture contains a screen-pixel placement field.

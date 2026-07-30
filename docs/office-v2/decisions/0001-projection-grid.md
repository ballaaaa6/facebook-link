# Decision 0001 — Fixed 2:1 Isometric Grid

- Status: accepted
- Date: 2026-07-31
- Owners: product, world, projection, and art pipeline

## Context

Office V2 needs a compact management-game room with deterministic occupancy,
furniture connectivity, character routing, and original pixel assets. A strict
projection must be selected before geometry or art production.

## Options considered

- Orthogonal top-down: simplest picking, but weak furniture face readability.
- Oblique dollhouse background: visually flexible, but encourages scene-specific
  offsets and makes reusable placement contracts difficult.
- Fixed 2:1 isometric diamond: one testable projection with readable furniture
  tops and deterministic grid composition.

## Decision

Use a fixed, non-rotating 2:1 isometric-diamond projection, version
`office-projection-v1`:

- one world cell projects to 64 by 32 logical pixels;
- one elevation unit projects 16 logical pixels upward;
- one world cell contains four integer sub-cell units;
- increasing world X moves screen right/down;
- increasing world Y moves screen left/down;
- north is `y - 1`, east is `x + 1`, south is `y + 1`, west is `x - 1`;
- the world origin is the north corner of cell `(0, 0)`;
- camera rotation is not supported in V1 of the projection.

Projection is pure and uses the formula in
`WORLD_COORDINATES_PROJECTION_CAMERA.md`. Ground picking uses half-open cells;
an exact shared edge resolves to the cell with the lower `(y, x)` sort key.

## Consequences

All asset families declare compatibility with this projection and density.
Changing tile ratio, axis direction, sub-cell precision, or camera rotation
requires a new projection and asset-family version. Responsive layouts move the
camera and surrounding UI, not the world.

## Evidence

`schemas/world.schema.json`, `fixtures/projection-roundtrip.json`, the knowledge
gate, and Phase 2 projection property tests.

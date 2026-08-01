# Office V2 Glossary and Invariants

## Canonical terms

- **Cell position**: integral floor-local position used for occupancy and
  placement; it is not a movement or pixel value.
- **Sub-cell position**: integral floor-local movement position using the
  projection version's fixed number of units per cell.
- **Definition-local pixel**: pixel coordinate inside an authored definition's
  local geometry; it is not a sprite-frame or projected coordinate.
- **Sprite pixel**: pixel coordinate inside a sprite canvas or frame.
- **Screen pixel**: derived coordinate after world projection and camera
  transformation; it is never authoritative world state.
- **World facing**: `north`, `east`, `south`, or `west` in world axes.
- **Screen facing**: the diagonal-looking presentation direction produced by a
  versioned world-facing transform.
- **Footprint**: ground cells reserved by an entity; it excludes visual height.
- **Anchor basis**: geometry-owned origin from which footprint, clearance, and
  world/sub-cell sockets are defined.
- **Placed anchor**: an instance's floor-local placement of its geometry anchor
  basis; it does not redefine geometry.
- **Ground contact**: presentation point where a sprite touches the floor.
- **Sprite origin**: pixel-space point aligned to the projected anchor.
- **Socket**: named relative point for approach, actor, held item, or effect use.
- **Render band**: coarse visibility group: floor, ground, shared world, upper,
  or effect. Actors and ordinary furniture share the world band so depth may
  interleave them.
- **Depth key**: deterministic fine ordering inside a render band.
- **Approach cell**: legal actor destination for an interaction.
- **Use slot**: geometry-owned set of approach candidates, waiting cells,
  required facing, and socket references used by an interaction.
- **Reservation**: temporary ownership of a cell, socket, or facility capacity.
- **Neighbor mask**: encoded compatible neighbors used to select a visual variant.
- **Snapshot**: complete serializable simulation state at one logical tick.
- **Trace**: ordered commands, inputs, and snapshots used for deterministic replay.
- **Adapter**: one-way translation from operational records into engine input.

## Non-interchangeable concepts

- Footprint is not sprite bounds.
- Anchor is not sprite origin.
- Elevation is not visual height.
- Simulation state is not animation clip state.
- Path planning is not movement following.
- Operational status is not an actor's decorative idle variation.
- Missing data is not idle.
- Cell, sub-cell, definition-local pixel, sprite-pixel, and screen-pixel values
  are not interchangeable.
- World facing is not screen facing or mirror metadata.
- World geometry is not asset pixel geometry or instance placement.

## Global invariants

1. World and simulation state never store screen pixels as authority.
2. Presentation never commits simulation or operational state.
3. Every identifier is stable within its declared versioned namespace.
4. Every collection with visible ordering has a stable tie-breaker.
5. Wall-clock time and randomness enter as recorded inputs.
6. Invalid or missing assets fail visibly; no legacy fallback is allowed.
7. Every interaction names its approach, facing, duration, cancellation, and
   result instead of relying on component-specific offsets.
8. Every external proposal passes existing review, idempotency, and feature-flag
   policy outside the engine.
9. Floor identity is explicit and cannot be inferred from elevation.
10. Coordinate conversions and facing transforms are named, versioned pure
    operations rather than consumer conventions.

## Rule writing template

Every future rule records: owner, version, inputs, outputs, invariant, valid
example, rejected example, automated evidence, and migration effect. Ambiguous
terms are added here before they appear in code or asset metadata.

# Office V2 Glossary and Invariants

## Canonical terms

- **World cell**: smallest integer unit used for occupancy and navigation.
- **Sub-cell unit**: fixed integer precision inside a world cell.
- **Footprint**: ground cells reserved by an entity; it excludes visual height.
- **Anchor**: world-space reference from which footprint and sockets are defined.
- **Ground contact**: presentation point where a sprite touches the floor.
- **Sprite origin**: pixel-space point aligned to the projected anchor.
- **Socket**: named relative point for approach, actor, held item, or effect use.
- **Render band**: coarse visibility group such as floor, actor, or upper object.
- **Depth key**: deterministic fine ordering inside a render band.
- **Approach cell**: legal actor destination for an interaction.
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

## Rule writing template

Every future rule records: owner, version, inputs, outputs, invariant, valid
example, rejected example, automated evidence, and migration effect. Ambiguous
terms are added here before they appear in code or asset metadata.

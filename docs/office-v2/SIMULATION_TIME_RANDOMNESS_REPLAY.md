# Simulation, Time, Randomness, and Replay

## Logical time

Simulation advances with a fixed logical tick independent from display frames.
The tick rate is part of the snapshot version. Rendering may interpolate but
cannot decide task completion, movement distance, or queue ownership.

## Commands and events

Every command has a stable identifier, issued tick, actor or system owner, and
versioned payload. Applying the same command identifier twice is harmless.
Rejected commands return structured reasons and do not partially mutate state.

Events are facts emitted by accepted state transitions. Presentation events may
request sound or effects but are not operational facts.

## Randomness

All random choices use a named seeded stream recorded in the snapshot or trace.
Decorative randomness cannot influence routing, operational meaning, or external
actions. Adding a visual idle variation must not consume a gameplay stream.

## Replay

A replay contains initial snapshot, ordered external inputs, accepted and
rejected commands, random seeds, and resulting state hashes. Wall-clock values
and network arrival are normalized into recorded inputs before use.

## Snapshot versioning

Snapshots declare schema and engine versions. Readers either migrate through an
explicit tested path or reject the snapshot. Unknown fields are not silently
interpreted and historical fixtures are never edited to match new behavior.

## Required evidence

- Two runs of the same trace produce identical state hashes.
- Simulation results are identical at different display frame rates.
- Duplicate command application is a no-op after the first accepted result.
- Cancel, block, and unreachable paths are present in fixtures.
- Replay failure reports the first divergent tick and owning subsystem.

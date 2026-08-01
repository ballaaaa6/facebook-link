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

Decision 0011 separates semantic normalization from canonical bytes. A
simulation-owned normalizer stable-sorts only collections explicitly declared
unordered and preserves every ordered array. The shared contract utility then
serializes an explicit domain/version envelope as RFC 8785-compatible UTF-8 and
hashes those bytes with SHA-256. Presentation state is outside the simulation
hashable-state projection.

Raw hashed JSON enters through a duplicate-key rejecting loader. Negative zero
normalizes to zero; malformed UTF-8, lone surrogates, non-finite numbers, unsafe
integers, and schema-invalid values reject. Unicode spelling is preserved and
object keys use UTF-16 code-unit order.

## Snapshot versioning

Snapshots declare schema and engine versions. Readers either migrate through an
explicit tested path or reject the snapshot. Unknown fields are not silently
interpreted and historical fixtures are never edited to match new behavior.

`fixtures/deterministic-replay.json` remains a V1 schema-shape fixture with
placeholder hashes. Until W2.2 runs the real reducer and independently verifies
its hashable-state projection, reducer/replay evidence remains zero.

## Required evidence

- Two runs of the same trace produce identical state hashes.
- A domain/version change changes the hash even when payload data is equal.
- Ordered arrays remain ordered while only declared unordered collections
  normalize to a stable order.
- Duplicate keys and invalid string or number inputs fail before hashing.
- Simulation results are identical at different display frame rates.
- Duplicate command application is a no-op after the first accepted result.
- Cancel, block, and unreachable paths are present in fixtures.
- Replay failure reports the first divergent tick and owning subsystem.

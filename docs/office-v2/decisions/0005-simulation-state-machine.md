# Decision 0005 — Pure Reducer at Ten Logical Ticks per Second

- Status: accepted
- Date: 2026-07-31
- Owners: simulation

## Context

Office behavior must be deterministic, serializable, and independent from
display frames, React lifecycle, animation callbacks, and network arrival time.
The first state machine is small enough that a framework dependency would add
more persistence and effect semantics than the slice needs.

## Options considered

- UI timers and callbacks: rejected because they mix presentation and truth.
- XState 5: strong actor/statechart reference, but unnecessary before the
  internal contract proves insufficient.
- Pure project reducer: small, serializable, dependency-free, and easy to replay.

## Decision

Use a pure command reducer with states `idle`, `planning`, `moving`,
`interacting`, and `blocked`, advancing at 10 logical ticks per second. Commands
and injected external inputs are ordered by issued tick and stable identifier.
Effects are emitted as data and executed outside the reducer.

Snapshots record tick rate, named random streams, accepted command identifiers,
reservations, and complete actor state. Presentation may interpolate between
snapshots but cannot emit a completion transition.

## Consequences

The initial implementation does not depend on XState. A future framework change
must preserve snapshot and trace semantics and pass the same fixtures.

## Evidence

Simulation snapshot and trace schemas, replay fixtures, and Phase 2 identical
state-hash tests.

# Actors, Navigation, and Interactions

## Actor state

The minimum actor machine is `idle`, `planning`, `moving`, `interacting`, and
`blocked`. State transitions are simulation decisions. Presentation maps them to
clips without owning the transition.

## Navigation

A navigation graph is derived from world occupancy and declared traversal rules.
A planner selects a legal route; a movement follower advances along it. The two
systems have separate inputs, outputs, and tests.

- Diagonal policy and corner cutting are explicit.
- Replanning occurs after relevant world changes, not every frame.
- Route cost has stable integer units and deterministic tie-breaking.
- An unreachable target produces a visible blocked reason.

## Reservations and queues

Actors reserve destinations, approach cells, sockets, and limited facility
capacity before committing to an interaction. Decision 0012 requires a typed
resource set to be normalized, fully validated, and acquired all-or-none. An
actor cannot hold one newly requested resource while waiting for another in the
same set.

Waiting actors have stable tickets and occupy declared legal cells; they never
stack through presentation offsets. Queue order is durable-before-decorative,
then enqueue tick, then canonical ticket ID. Input, render, and wall-clock order
cannot change the winner.

Cancellation, timeout, target or actor removal, preemption, route invalidation,
completion, and failure run one idempotent cleanup path that releases every
applicable task claim, facility/use slot, approach or waiting cell, reservation,
queue entry, and held prop.

After a fixture-defined no-progress threshold, a wait-for cycle yields its
lowest-priority, latest-intent, greatest-actor-ID victim. The victim may move
only to a declared legal yield cell. Missing yield geometry blocks with
`simulation.deadlock-no-yield-cell`; it never permits an exceptional move.

## Interaction definition

Every interaction references a geometry-owned use-slot ID. The versioned world
geometry record owns its approach candidates, waiting cells, required world
facing, actor socket, optional prop socket, and target-relative coordinates.
The interaction owns target semantics, preconditions, duration, capacity
policy, cancellation, and result event without copying those spatial facts.
Character components do not contain facility-specific positioning.

In W1.2 the interaction reference carries the exact geometry reference and
use-slot ID it consumes. The use-slot ID is resolved inside that geometry
version; it is not a global coordinate, array index, or socket surrogate. A
missing socket, wrong kind, duplicate use-slot, or geometry-version mismatch
fails before an interaction can be planned. An interaction may name a required
actor or held-prop socket, but it never repeats the socket position or facing.

## Interruptions

Cancellation states whether reservations are released, progress is retained,
held items are returned, and a follow-up event is emitted. Disconnects and stale
operational data cannot leave permanent reservations.

## Required evidence

- Every planned step is legal in the snapshot where it is executed.
- Equivalent route choices resolve identically across runs.
- Two actors cannot own an exclusive socket at the same tick.
- A missing or conflicting use-slot/socket reference fails before interaction.
- Reordering bundle records preserves the same use-slot and socket resolution.
- Cancel, timeout, and target removal release declared resources.
- Reversing request input preserves normalized acquisition and queue order.
- Every deadlock fixture has a deterministic victim and either a legal yield
  route or the exact missing-yield diagnostic.
- Interaction completion is unchanged when animation is disabled.

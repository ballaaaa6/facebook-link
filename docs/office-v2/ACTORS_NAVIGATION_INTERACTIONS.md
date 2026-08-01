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
capacity before committing to an interaction. Reservation acquisition order and
timeouts are deterministic. Waiting actors occupy real legal cells and never
stack through presentation offsets.

## Interaction definition

Every interaction references a geometry-owned use-slot ID. The versioned world
geometry record owns its approach candidates, waiting cells, required world
facing, actor socket, optional prop socket, and target-relative coordinates.
The interaction owns target semantics, preconditions, duration, capacity
policy, cancellation, and result event without copying those spatial facts.
Character components do not contain facility-specific positioning.

## Interruptions

Cancellation states whether reservations are released, progress is retained,
held items are returned, and a follow-up event is emitted. Disconnects and stale
operational data cannot leave permanent reservations.

## Required evidence

- Every planned step is legal in the snapshot where it is executed.
- Equivalent route choices resolve identically across runs.
- Two actors cannot own an exclusive socket at the same tick.
- A missing or conflicting use-slot/socket reference fails before interaction.
- Cancel, timeout, and target removal release declared resources.
- Interaction completion is unchanged when animation is disabled.

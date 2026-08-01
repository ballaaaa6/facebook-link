# Decision 0012 — Queue, Reservation, and Deadlock Policy

- Status: accepted
- Date: 2026-08-01
- Owners: contracts, world, and simulation

## Context

The V1 fixtures prove only one exclusive reservation winner and shallow
cancel/timeout cleanup. The target floor needs multiple facilities, approach
cells, queue tickets, held props, target removal, and deterministic resolution
when actors cannot progress. Implementing those ledgers without one acquisition
and cleanup policy would make replay depend on arrival or iteration order.

## Options considered

- Acquire resources incrementally and wait while holding successful claims:
  simple locally, but creates avoidable hold-and-wait cycles and partial cleanup.
- Retry contested resources optimistically every tick: compact, but permits
  starvation and makes outcomes depend on subsystem iteration.
- Normalize a complete resource set, acquire it atomically, queue explicitly,
  and resolve remaining wait-for cycles by one deterministic policy: auditable
  and replayable.

## Decision

Adopt concurrency policy version `office-queue-policy-v1`.

Every requested resource uses a typed stable key. Before acquisition, simulation
validates the complete requested set, rejects malformed or duplicate keys, and
sorts it by the accepted canonical key comparator. It commits the complete set
or none. An actor never keeps one newly requested resource while waiting for a
second resource in that set.

Every wait is represented by a stable queue ticket. Queue service order is:

1. priority class, with durable operational work ahead of decorative work;
2. enqueue tick ascending;
3. ticket ID ascending by the canonical UTF-16 code-unit comparator.

This is FIFO inside a priority class. Arrival order, array order, wall-clock
time, renderer order, and display name are not tie-breakers. Durable work may
preempt only decorative work whose accepted policy marks it cancelable, and the
preempted activity runs the same complete cleanup path as cancellation.

Cancellation, timeout, target removal, actor removal, preemption, route
invalidation, completion, and failure are terminal cleanup triggers. Cleanup is
idempotent and releases every applicable task claim, facility/use slot,
approach or waiting cell, reservation, queue entry, and held prop. A held prop
follows its declared return, transfer, or release policy and cannot become
ownerless or multiply owned.

Atomic acquisition prevents partial-set hold-and-wait, but wait-for cycles may
still involve already held activity resources or spatial movement. After the
future fixture's declared no-progress threshold, simulation selects one victim
deterministically:

1. lowest priority class first, so decorative work yields before durable work;
2. latest-issued intent first within the same priority, preserving older work;
3. greatest actor ID by the canonical comparator as the final tie-breaker.

The victim releases its applicable claims through normal cleanup and may route
only to a declared legal yield cell. If no legal yield cell exists, simulation
does not teleport, stack actors, invent a diagonal, or move through collision.
It enters a stable blocked outcome with
`simulation.deadlock-no-yield-cell` and the wait-for evidence.

W2.3 owns the intent, facility, use-slot, action-queue, reservation, and cleanup
contracts. W2.4 owns queue, wait-for graph, numeric no-progress/bounded-wait
limits, yield geometry, victim selection, and crowd fixtures. Both reuse this
policy; neither renderer nor operations adapter can override it.

The V1 navigation, interaction, snapshot, and trace schemas and fixtures remain
frozen. They do not prove atomic acquisition, queue fairness, resource cleanup,
deadlock resolution, bounded waiting, crowds, or replay. A V1 snapshot lacking
complete claims, queues, reservations, held props, intent age, priority, and
resource versions cannot migrate an in-progress action by inference.

## Consequences

Contention outcomes are stable and every terminal path has one auditable
cleanup matrix. Lower-priority decorative activity can wait while durable work
is present; W2.4 must specify numeric fixture bounds and starvation evidence
before claiming crowd readiness.

This decision does not implement queues, reducers, resource ledgers, movement,
deadlock detection, or schemas. Reducer/replay and crowd evidence remain zero.

## Evidence

`ACTORS_NAVIGATION_INTERACTIONS.md`,
`SIMULATION_TIME_RANDOMNESS_REPLAY.md`, and `SAVE_SNAPSHOT_MIGRATION.md` own the
canonical lifecycle. W2.3/W2.4 will add all-or-none acquisition, reversed input,
duplicate ticket, every cancellation phase, preemption, timeout, target
removal, held-prop, starvation pressure, multi-resource cycle, deterministic
victim, legal-yield, and missing-yield exact-diagnostic fixtures.

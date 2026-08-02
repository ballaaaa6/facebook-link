# Crowd, Queue, Fairness, and Deadlock Contracts

## Purpose and authority

This document owns the Phase 1 policy and fixture profile for contention. The
runtime queue and wait-for implementation belongs to W2.4/T3. The accepted
policy is `office-queue-policy-v1` from
`decisions/0012-queue-reservation-and-deadlock-policy.md`.

## Resource keys and atomic acquisition

Every requested resource has a typed stable key and version. The complete set
is validated, duplicate keys are rejected, and keys are normalized with the
accepted UTF-16 code-unit comparator before acquisition. The simulation commits
the complete set or none; it never keeps one newly requested resource while
waiting for another resource in that same request.

Every wait has a stable queue ticket. Renderer order, array order, wall-clock
arrival, and display name are never tie-breakers.

## Queue order and fairness

Queue service order is:

1. priority class, with durable before decorative;
2. enqueue tick ascending;
3. ticket ID ascending by UTF-16 code-unit order.

FIFO is preserved inside a priority class. Durable work may preempt only
decorative work marked cancelable. Preemption invokes the same cleanup path as
cancellation and records a deterministic resume or yield outcome.

## Wait-for cycles

The future executable implementation records the declared resource and spatial
edges in a wait-for graph. After the fixture-defined no-progress threshold, the
victim is selected by:

1. lowest priority class;
2. latest-issued intent within that class;
3. greatest actor ID by canonical ordering.

The victim may route only to a declared legal yield cell. If no yield cell is
available, it becomes blocked with `simulation.deadlock-no-yield-cell` and the
wait-for evidence. Teleporting, diagonal invention, stacking, or collision
through movement are forbidden.

## Fixture profiles

The contract pack defines profiles for one actor, ten active actors, and fifteen
geometric capacity actors. It also defines narrow-door contention, head-on
passage, attempted swaps, shared pantry/printer/review/reliability facilities,
target removal, world revision changes, starvation pressure, and a
multi-resource cycle. Each profile must name service duration, deadlock tick,
maximum completion-or-block tick, legal yield cells, and participating
resources.

The W1.6 gate checks policy shape, numeric bounds, and exact failure contracts.
It does not claim crowd execution, fairness measurements, bounded-wait replay,
or target-floor performance. Those belong to T3.

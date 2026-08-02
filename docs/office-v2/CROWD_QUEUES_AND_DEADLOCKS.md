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

## RC-01 research closure — queue, waiting, and cancellation boundary

Status: bounded research-closure evidence only. This section records the
neutral queue and cleanup observations needed before Phase 3/T2 implementation;
the runtime queue, wait-for graph, reducer, and crowd behavior remain deferred.

### Engineering question and source rights record

The bounded question was how a source system orders waiting users, distinguishes
expected entrants from present users, handles target removal, and disconnects
a user on completion or interruption. Only these four pages were inspected:

| Source page | Observed revision/date | License and rights boundary |
| --- | --- | --- |
| [room.lua](https://github.com/CorsixTH/CorsixTH/blob/master/CorsixTH/Lua/room.lua) | `master`, observed 2026-08-02 (Asia/Bangkok) | The page header states the MIT license. It is a bounded architecture study; no code, map, game data, names, timings, or behavior table is copied. |
| [object.lua](https://github.com/CorsixTH/CorsixTH/blob/master/CorsixTH/Lua/entities/object.lua) | `master`, observed 2026-08-02 (Asia/Bangkok) | MIT notice observed in the page header; object implementation and content are not adopted. |
| [queue.lua](https://github.com/CorsixTH/CorsixTH/blob/master/CorsixTH/Lua/queue.lua) | `master`, observed 2026-08-02 (Asia/Bangkok) | MIT notice observed in the page header; only neutral observations are recorded. |
| [use_object.lua](https://github.com/CorsixTH/CorsixTH/blob/master/CorsixTH/Lua/humanoid_actions/use_object.lua) | `master`, observed 2026-08-02 (Asia/Bangkok) | MIT notice observed in the page header; the source is not an Office dependency or runtime asset source. |

`master` is recorded as observed on the date above, not treated as a pinned
dependency. The MIT headers define the external rights boundary for the study;
Office V2 remains original code, data, and policy.

### Source observations

- `room.lua` keeps the queue on the door, tests the front entry against room
  readiness and capacity, pops an entry when it may proceed, and retries queue
  advancement after a participant leaves. Deactivation reroutes present and
  expected participants and invokes registered callbacks for expected entries.
- `queue.lua` exposes expected entries, present entries, front/pop, removal,
  maximum size, and a source-specific priority insertion rule. It also removes
  expected entries when a room or object is destroyed. Its displayed count is a
  projection, not a complete durable ticket model.
- `object.lua` tracks current users and reserved users separately and clears
  usage/reservation state when an object is picked up or destroyed.
- `use_object.lua` connects a user after the walk-in boundary, disconnects the
  user on normal finish, and handles a high-priority interruption by cleaning
  the active user or pending reservation before ending the action.

### Office disposition and canonical ownership

| Observation | Disposition | Canonical owner |
| --- | --- | --- |
| Waiting needs a stable entry identity and a declared legal waiting position. | Adapt: Office uses `office-queue-ticket-v1`, the geometry-owned waiting-cell set, and the accepted durable/decorative plus enqueue-tick plus UTF-16 ticket-ID order. Reject source array order, display count, source priority numbers, and wall-clock arrival. | This document for queue policy; `queue-ticket.schema.json` and existing geometry authority for the frozen shapes. |
| A requested set must not be held incrementally while another resource is unavailable. | Adapt: validate and normalize the complete typed resource set, then acquire all or none; a waiting ticket does not imply partial facility/socket ownership. Reject source-specific queue capacity and insertion implementation. | Decision 0012, this document, and existing facility-slot/reservation schemas. |
| Target removal, cancellation, interruption, completion, and queue destruction require terminal release. | Adapt: all terminal paths use one idempotent cleanup matrix for task claim, facility/use slot, approach/waiting cell, every reservation, queue ticket, and held prop. Reject source callbacks and entity lifecycle as Office runtime behavior. | `JOBS_INTENTS_ASSIGNMENT.md`, Decision 0012, and existing reservation/action-queue/interaction contracts. |

Migration consequence: the frozen queue, facility, reservation, action-queue,
interaction, and geometry interfaces are unchanged. A V1 in-progress action
without complete queue, resource, target-generation, and held-prop context is
rejected or migrated only through an explicit tested path; no source queue
position or actor state is guessed. No dependency, runtime diagnostic catalog,
or crowd promotion is introduced.

Focused acceptance command: `node --test scripts/office-v2-rc-01-evidence.test.mjs`.
This fixture-only acceptance proves bounded queue/cleanup facts and explicitly
does not claim reducer, replay, crowd, fairness, or T3 evidence.

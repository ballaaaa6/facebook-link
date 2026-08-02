# Jobs, Activity Intents, and Facility Assignment

## Purpose and authority

This document owns the Phase 1 contract for activity intents, facility
capabilities, use-slot runtime state, actor action queues, and cleanup
ownership. `ACTORS_NAVIGATION_INTERACTIONS.md` owns geometry-owned approach and
socket semantics. `decisions/0012-queue-reservation-and-deadlock-policy.md`
owns atomic resource acquisition and cleanup policy. Operations data remains
outside simulation truth.

## Intent identity and source

An activity intent is a versioned, presentation-only request derived from a
workflow/task/event correlation. It carries:

- intent ID and version;
- durable-operational or decorative source kind;
- workflow run and task IDs, with an optional source event;
- capability, priority class, issue tick, not-before tick, and optional expiry;
- cancellation and preemption policy;
- coalescing key and target-selector version;
- `presentationOnly: true`.

An intent never writes operational state directly. A durable operational intent
may preempt cancelable decorative activity, but its transition still enters the
simulation command pipeline and is audited independently.

## Capability-based assignment

Facilities are selected by declared capability, not sprite family, display name,
or renderer component. A facility slot is a mutable reference to a versioned
facility and use slot. It carries capacity, target generation, availability,
revision, and the accepted `office-queue-policy-v1` version.

World geometry remains the sole owner of footprint, clearance, approach cells,
waiting cells, sockets, and facing. The runtime slot cannot add or override
those facts. A removed or disabled target invalidates its dependent action and
enters the shared cleanup path.

## Action phases

An actor action queue records ordered actions with these phases:

```text
requested -> en-route -> waiting -> acquired -> using -> released
                                      \-> canceled
                                      \-> failed
```

Each action has an immutable action ID and intent ID, progress ticks, requested
resource keys, and an optional target or failure reason. Queue order is a
simulation fact. Presentation may show a derived status but may not advance an
action from an animation callback.

## Cleanup matrix

Completion, cancellation, timeout, target removal, actor removal, preemption,
route invalidation, and failure all call one idempotent cleanup path. The path
must release, when present:

1. task claim;
2. facility/use slot;
3. approach or waiting cell;
4. every reservation in the normalized resource set;
5. queue ticket;
6. held prop according to its declared policy.

Repeated cleanup is a no-op after the cleanup generation is recorded. Partial
new resource acquisition is forbidden: a request is validated and acquired as
a complete set or not acquired at all.

## RC-01 research closure — facility use and terminal cleanup

Status: bounded research-closure evidence only. This section records a
clean-room study for the Phase 3/T2 facility boundary; it does not implement
assignment, queues, a reducer, or runtime cleanup.

### Engineering question and bounded source record

The question was how a room/object system represents room readiness, limited
use, approach and waiting positions, queue entry, target removal, use, and
terminal cleanup, and which neutral constraints can inform the Office contracts.
The source scope is limited to these four CorsixTH pages:

| Source page | Observed revision/date | License and rights boundary |
| --- | --- | --- |
| [room.lua](https://github.com/CorsixTH/CorsixTH/blob/master/CorsixTH/Lua/room.lua) | `master`, observed 2026-08-02 (Asia/Bangkok) | The page header states the MIT license. This is an architecture study only; no code, map, game data, names, timings, or behavior table is copied or admitted. |
| [object.lua](https://github.com/CorsixTH/CorsixTH/blob/master/CorsixTH/Lua/entities/object.lua) | `master`, observed 2026-08-02 (Asia/Bangkok) | MIT notice observed in the page header; source remains external reference material and is not an Office dependency or runtime asset source. |
| [queue.lua](https://github.com/CorsixTH/CorsixTH/blob/master/CorsixTH/Lua/queue.lua) | `master`, observed 2026-08-02 (Asia/Bangkok) | MIT notice observed in the page header; only bounded, neutral observations are retained. |
| [use_object.lua](https://github.com/CorsixTH/CorsixTH/blob/master/CorsixTH/Lua/humanoid_actions/use_object.lua) | `master`, observed 2026-08-02 (Asia/Bangkok) | MIT notice observed in the page header; no implementation or content is imported. |

The branch name and observation date are recorded rather than treating a
moving `master` page as a vendored dependency. The source headers are a rights
boundary for the study, not permission to copy implementation or game content.

### Source observations

- `room.lua` keeps room readiness and occupancy state separate from the door
  queue. A room has a configured maximum patient count, becomes active only
  after its room-finished path, checks required staff and occupancy before a
  patient enters, and tries to advance the front queue entry when a user or
  reservation no longer blocks the door. Deactivation reroutes queued or
  expected visitors.
- `object.lua` keeps an orientation-specific footprint and named use-position
  offsets on the object type. The object tracks its current user separately
  from reserved users. Destruction and pickup invoke a reset path that cancels
  usage and denies reservations; the usage cancellation notifies users before
  clearing those references.
- `queue.lua` attaches a queue to a door or usable object, distinguishes
  expected entries from present entries, exposes front/pop and removal
  operations, and reroutes queued participants when the queue's room or object
  is destroyed. Its priority and queue-size rules are source-specific.
- `use_object.lua` separates approach/walk-in from use and walk-out phases.
  Connecting the user happens at the use boundary; normal completion disconnects
  the user, and a high-priority interruption cleans either the active user or
  the pending reservation before ending the action. A destroyed room/object
  suppresses follow-up work that would assume the target still exists.

### Office disposition and canonical ownership

| Observation | Disposition | Canonical owner |
| --- | --- | --- |
| Readiness, capacity, and target generation must be checked before use. | Adapt: the Office facility slot exposes versioned capacity, availability, target generation, and revision; room composition separately proves authored capacity and legal approaches. Reject source patient/staff classes and its game-specific limits. | This document for mutable facility/use-slot state; `ROOMS_SURFACES_STRUCTURES_ZONES.md` for room-template capacity; `facility-slot.schema.json` and `interaction.schema.json` for frozen shapes. |
| A use action needs a declared approach and use position, and target removal ends the action. | Adapt: geometry remains the sole owner of approach candidates, waiting cells, sockets, and use-slot geometry; an interaction references the versioned use slot without repeating coordinates. Reject source coordinates, animation phases, and object pointers. | `ACTORS_NAVIGATION_INTERACTIONS.md` for geometry authority and interaction semantics; existing geometry and interaction contracts. |
| Completion, interruption, pickup, and target destruction all need cleanup. | Adapt: all terminal triggers call the one idempotent Office cleanup matrix for task claim, facility/use slot, approach/waiting cell, every reservation, queue ticket, and held prop. The RC-01 fixture exercises the categories; it is not runtime reducer evidence. Reject source callback/entity behavior as an implementation dependency. | This cleanup matrix and `decisions/0012-queue-reservation-and-deadlock-policy.md`; existing reservation, queue-ticket, action-queue, and interaction schemas. |

Migration consequence: no frozen interface changes. V1 forms remain immutable;
an in-progress action cannot infer a missing target generation, use slot,
complete resource set, queue ticket, reservation set, or held-prop owner from
an actor position. Such input follows the existing explicit migration or
rejects with the existing migration diagnostic. No CorsixTH dependency is
introduced.

Focused acceptance command: `node --test scripts/office-v2-rc-01-evidence.test.mjs`.
The test is intentionally labeled research-closure fixture evidence and does
not claim reducer, replay, crowd, or T3 execution.

## Migration and diagnostics

The V1 interaction and snapshot forms remain immutable. A reader cannot infer a
missing intent, target generation, queue ticket, reservation set, or held-prop
owner from an actor position. Such input rejects with a stable migration
diagnostic. Unsupported action phases, duplicate resource keys, and missing
facility capability references fail before a runtime action is planned.

Executable action assignment, preemption, and exactly-once cleanup are T2/T3
evidence. This document and its schemas close the Phase 1 specification only.

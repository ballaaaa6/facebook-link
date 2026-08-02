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

## Migration and diagnostics

The V1 interaction and snapshot forms remain immutable. A reader cannot infer a
missing intent, target generation, queue ticket, reservation set, or held-prop
owner from an actor position. Such input rejects with a stable migration
diagnostic. Unsupported action phases, duplicate resource keys, and missing
facility capability references fail before a runtime action is planned.

Executable action assignment, preemption, and exactly-once cleanup are T2/T3
evidence. This document and its schemas close the Phase 1 specification only.

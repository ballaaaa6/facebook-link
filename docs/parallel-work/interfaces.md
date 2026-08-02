# Phase 3 Wave `P3-W2-02` Frozen Interfaces

This is a coordination reference. It does not create a new contract owner.

## Existing versions and package boundaries

- `office-simulation-command-v2`
- `office-simulation-result-v2`
- `office-simulation-event-v2`
- `office-simulation-snapshot-v2`
- `office-simulation-trace-v2`
- `office-activity-intent-v1`
- `office-facility-slot-v1`
- `office-action-queue-v1`
- `office-reservation-v1`
- `office-queue-ticket-v1`
- `office-interaction-v1` fixture/policy
- `office-v2:world-kernel` canonical hash conventions
- Decision 0005 pure reducer at 10 logical ticks per second
- Decision 0011 semantic normalization followed by canonical hash envelope

No schema version, generated type, package dependency, diagnostic catalogue,
or accepted decision may change in this wave.

## Simulation ownership

`packages/office-v2-simulation` owns serializable simulation facts, reducer
state, command ledgers, activity runtime state, lifecycle tick pumping, and
simulation hashes. World geometry remains owned by
`@affiliate-ops/office-v2-world`; presentation and operations are consumers and
must not be imported by the simulation package.

The existing `command-pipeline.ts` is read-only to workers. Main may re-export
new worker modules from `src/index.ts` after review. Worker modules must remain
usable through direct imports before Main wiring.

## W2.2 state hash contract

The worker must reuse `normalizeDeclaredCollections` and `canonicalHashHex`
from `@affiliate-ops/office-v2-contracts`. It must declare ordered versus
unordered simulation collections explicitly, preserve ordered arrays, use
UTF-16 key ordering supplied by the shared canonical utility, and exclude
presentation-only state. The module must expose a pure serializable projection
and a deterministic hash boundary with named PRNG streams. A hash is reducer
evidence only when produced from the supplied state; fixture literals remain
non-evidence.

The wave freezes the new module's domain as `office-v2:simulation` and its
projection version as `office-simulation-state-v2`. The worker may choose
internal type names, but the exported result must include the normalized
projection and the resulting 64-character SHA-256 digest.

## W2.3 activity runtime contract

The worker consumes existing intent, facility-slot, action-queue, reservation,
queue-ticket, and command facts. It must provide a deterministic one-actor
runtime that can request an intent, select a capability-matching available
facility/use slot, reserve the complete resource set atomically, progress
through reach/wait/acquire/use, and execute exactly-once cleanup on completion,
cancellation, timeout, target removal, or unreachable approach. It must not
implement multi-actor fairness/deadlock resolution, persistence, operations,
or route geometry outside the supplied test model.

All resource decisions are simulation facts. Queue/resource ordering is stable
and based on declared identities, never input array position, sprite identity,
wall-clock time, or presentation offsets.

## W2.6 lifecycle contract

The worker provides an injected, renderer-free lifecycle port with states
`mounted`, `visible`, `hidden`, `restoring`, and `destroyed`. Logical progress
uses explicit tick advancement; visible pumping may accumulate wall-time-like
tick units but applies at most five logical ticks per pump. Excess lag emits
`simulation.lifecycle-catch-up-capped` data and never causes an unbounded burst.
Hidden and destroyed states do not advance simulation ticks. Repeated mount,
teardown, restore, and subscription operations are idempotent and leave no
listeners, pollers, loops, subscriptions, pending loads, or resource handles
after destroy.

## Integration rules

Workers must not edit this file or any shared contract. Main may add only
barrel exports and cross-task wiring after all worker reviews pass. No worker
may integrate another worker's commit or publish any branch.

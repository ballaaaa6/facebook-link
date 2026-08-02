# Simulation Pipeline and Command Contracts

## Purpose and authority

This document owns the Phase 1 specification for simulation command, result,
event, tick, and lifecycle ordering. `decisions/0005-simulation-state-machine.md`
owns the pure-reducer choice and 10 Hz rate. `decisions/0011-canonical-
serialization-and-hashing.md` owns canonical bytes and hash envelopes.
`ACTORS_NAVIGATION_INTERACTIONS.md` and `SAVE_SNAPSHOT_MIGRATION.md` own the
actor and persistence semantics consumed here.

The schemas in this slice are contract evidence only. They do not admit a
persistent reducer, replay implementation, browser lifecycle, or runtime
simulation package behavior.

## Versioned envelopes

- `simulation-command.schema.json` owns `office-simulation-command-v2`.
- `simulation-result.schema.json` owns `office-simulation-result-v2`.
- `simulation-event.schema.json` owns `office-simulation-event-v2`.
- `simulation-snapshot-v2.schema.json` owns `office-simulation-snapshot-v2`.
- `simulation-trace-v2.schema.json` owns `office-simulation-trace-v2`.

Every command has a typed command ID and version, an owner, issued and
scheduled ticks, source rank and sequence, a correlation envelope, a closed
payload shape, a payload digest, and the expected world revision. A command
with an actor owner must carry an actor ID; a system owner must carry a system
owner slug. The semantic validator rejects a missing or contradictory owner
before apply.

Every result names its command, tick, status, state-change flag, payload digest,
and optional stable diagnostic. A rejected command has no state mutation. A
duplicate command is idempotent only when its command version and canonical
payload digest match the accepted ledger; a different digest is
`simulation.command-id-conflict`.

Events are facts emitted after accepted transitions. Presentation effects may
consume event data but cannot create or advance an operational transition.
Event sequence is assigned by the simulation and is never derived from wall
clock, renderer order, or array position.

## Fixed tick pipeline

The accepted logical order is:

```text
ingest durable inputs
-> validate envelopes
-> deduplicate and detect ID conflicts
-> expire or cancel obsolete commands and intents
-> validate and apply commands in total order
-> assign intents and select targets
-> resolve queues and atomic reservations
-> plan or revalidate routes
-> advance movement
-> start or advance interactions
-> release and clean up resources
-> emit results and simulation events
-> check invariants
-> project hashable state and record hash
```

Snapshots are legal only after the invariant and hash boundary. Eligibility is
based on logical ticks: `notBeforeTick <= currentTick` is eligible, and
expiry/cancellation/reservation timeout with `<= currentTick` wins before a
later interaction completion in the same tick.

Same-tick command order is:

```text
scheduledTick -> sourceRank -> sourceSequence -> commandId
```

The final comparison uses the accepted UTF-16 code-unit ordering. Source rank
and source sequence order ingestion only; facility priority cannot reorder an
already accepted command. A command scheduled before the current tick is
rejected with `simulation.command-scheduled-in-past` in this contract version.

## Lifecycle and migration

The simulation state is independent from display frames, React lifecycle,
animation callbacks, and network arrival. Browser lifecycle is injected later
through the lifecycle port; it cannot advance logical time by wall-clock catch
up. V1 snapshots and traces remain frozen. A V1 in-progress action is rejected
unless complete versioned queue, reservation, intent, and correlation context
is supplied by an explicit migration.

## Required Phase 2/3 evidence

The later reducer gate must prove duplicate delivery, late delivery, stale
world revision, validation/apply races, cancellation before and during every
phase, real reducer-produced hashes, and equal results across display-frame
schedules. Those are deliberately not counted by the W1.6 contract gate.

## RC-03 bounded research closure

RC-03 closes the bounded question of capability assignment, target
revalidation, pending work, retry/cancellation identity, and explicit restore
inputs before T2 assignment implementation. This is a research and local
evidence closure only; it does not implement a reducer, scheduler, assignment
runtime, or migration registry.

### Source record and rights boundary

The sources were observed on 2026-08-02 (Asia/Bangkok) at their `master`
paths. The revision is the latest commit touching each named file at the
observation date:

| Bounded source | Observed revision and date | Rights boundary |
| --- | --- | --- |
| [Widelands `cmd_queue.h`](https://github.com/widelands/widelands/blob/master/src/commands/cmd_queue.h) | [`c40599cdce8a0c735313076486554a5670058732`](https://github.com/widelands/widelands/commit/c40599cdce8a0c735313076486554a5670058732), 2026-01-01 | Source header identifies GPL-2.0-or-later; study observations only. |
| [Widelands `worker.h`](https://github.com/widelands/widelands/blob/master/src/logic/map_objects/tribes/worker.h) | [`c40599cdce8a0c735313076486554a5670058732`](https://github.com/widelands/widelands/commit/c40599cdce8a0c735313076486554a5670058732), 2026-01-01 | Source header identifies GPL-2.0-or-later; study observations only. |
| [Widelands `request.h`](https://github.com/widelands/widelands/blob/master/src/economy/request.h) | [`c40599cdce8a0c735313076486554a5670058732`](https://github.com/widelands/widelands/commit/c40599cdce8a0c735313076486554a5670058732), 2026-01-01 | Source header identifies GPL-2.0-or-later; study observations only. |
| [Unknown Horizons `worldobject.py`](https://github.com/unknown-horizons/unknown-horizons/blob/master/horizons/util/worldobject.py) | [`1e3e6153764b05f6f5a4e2b7266751c95ee9d23b`](https://github.com/unknown-horizons/unknown-horizons/commit/1e3e6153764b05f6f5a4e2b7266751c95ee9d23b), 2017-09-16 | Source header and repository README identify GPL-2.0 for code; artwork and other content have separate licenses and are out of scope. |
| [Unknown Horizons `scheduler.py`](https://github.com/unknown-horizons/unknown-horizons/blob/master/horizons/scheduler.py) | [`e4d81d2a0ec19981b9603de2d9d738312e1bb392`](https://github.com/unknown-horizons/unknown-horizons/commit/e4d81d2a0ec19981b9603de2d9d738312e1bb392), 2018-06-01 | Source header and repository README identify GPL-2.0 for code; artwork and other content have separate licenses and are out of scope. |
| [Unknown Horizons `building.py`](https://github.com/unknown-horizons/unknown-horizons/blob/master/horizons/command/building.py) | [`056d5a570c7f8a7a8c807dffd5905fb1ae5b5bd2`](https://github.com/unknown-horizons/unknown-horizons/commit/056d5a570c7f8a7a8c807dffd5905fb1ae5b5bd2), 2017-09-19 | Source header and repository README identify GPL-2.0 for code; artwork and other content have separate licenses and are out of scope. |

No source code, maps, values, behavior tables, names, art, or data are copied
or admitted as dependencies. The observations below are clean-room study
notes; the Office implementation and fixtures use original identifiers and
local test logic.

### Neutral observations

- Widelands' command queue groups work by due time and compares a command's
  category and serial after due time so execution order is independent of
  priority-queue implementation details. Its save path traverses pending
  command buckets, and its flush operation removes queued commands.
- Widelands' worker interface separates worker meta states from named task
  operations. It carries explicit location/economy, carried-ware, and transfer
  references, exposes task start/cancel operations, and declares loader/save
  hooks for pointer and task state.
- Widelands' request is owned by its target object. It tracks an open count,
  transfer list, exact-match flag, requirements, economy association, request
  timing, and start/finish/fail/cancel transfer operations.
- Unknown Horizons' world object assigns and looks up a unique integer world ID
  and raises a not-found condition when a lookup cannot resolve an object.
- Unknown Horizons' scheduler advances an explicit tick, drains callbacks for
  that tick in queue order, supports repeat and finish callbacks, and marks or
  removes callbacks by instance or callback. It rejects a negative delay.
- Unknown Horizons' build command stores stable world IDs and command inputs,
  repeats buildability/resource checks when execution is delayed, refreshes
  derived placement data from that check, iterates tear IDs in sorted order,
  and tolerates a tear target that was already removed.

### Office decisions, owners, and migration consequence

| Observation | Office disposition | Canonical owner |
| --- | --- | --- |
| Capability and explicit request/task ownership | **Adapt** capability-only facility selection. The RC-03 local probe filters by declared capability and availability, then uses the stable facility ID comparator so equivalent input order cannot choose a different target. Visual identity and array position are ignored. | `JOBS_INTENTS_ASSIGNMENT.md`; `activity-intent`, facility-slot, and action-queue contracts |
| Due-time and stable command ordering | **Adapt** the already frozen `scheduledTick -> sourceRank -> sourceSequence -> commandId` order. Source-specific queue buckets, categories, serials, and callback objects are not adopted. | This document; `office-simulation-command-v2`, result-v2, and event-v2 |
| Stable objects and delayed execution checks | **Adapt** explicit `expectedWorldRevision`, target generation, and facility revision revalidation before apply. An unavailable target blocks and a removed target reaches a terminal local test outcome; neither may bind to a visual identity, actor position, or array slot. | `JOBS_INTENTS_ASSIGNMENT.md` and this document; facility-slot and command contracts |
| Pending work, transfer failure, and cancellation | **Adapt** stable command/intent/action IDs with explicit `pending` or `terminal` local evidence states. Retry increments an attempt record without replacing identity; cancellation uses the existing idempotent cleanup generation and releases the complete declared resource set. | `JOBS_INTENTS_ASSIGNMENT.md`, Decision 0012, and this document |
| Global object registries, pointer callbacks, game-specific categories, and automatic IDs | **Reject** as runtime design. They are source-specific mechanisms and do not replace versioned Office IDs, typed commands, injected inputs, or geometry-owned state. | Existing Office contracts; no new owner or dependency |

For migration, an in-progress action is admitted only with explicit capability,
intent, target entity, world/target revision or generation, queue/resource,
pending-command, and correlation context. Missing context uses the existing
`contract.migration-context-missing` failure; conflicting versioned references
use `contract.migration-reference-conflict`. A reader never reconstructs
assignment, retry, cancellation, or target identity from a sprite, actor
position, visual family, or array position. The RC-03 fixtures' short outcome
labels are local assertions, not a runtime diagnostic catalog.

### Focused evidence and limits

The three test-only fixtures are under
`packages/office-v2-simulation/test/fixtures/`:

- `rc-03-assignment-reorder.json` proves capability-only selection is stable
  across equivalent facility orderings.
- `rc-03-target-revalidation.json` proves unavailable and removed targets are
  revalidated without visual or array-position fallback.
- `rc-03-retry-cancellation.json` proves stable IDs, explicit pending/terminal
  retry and cancellation state, complete cleanup input, and explicit snapshot/
  trace restore inputs.

The focused acceptance command is
`node --test scripts/office-v2-rc-03-evidence.test.mjs`. The test deliberately
does not run a reducer or compute a state hash. The `stateHash` strings in the
restore fixture are labeled placeholders and are not reducer/replay evidence;
T2/W2.2 must produce and independently verify real hashes later. Frozen
`office-simulation-command-v2`, `office-simulation-result-v2`,
`office-simulation-event-v2`, `office-activity-intent-v1`,
`office-simulation-snapshot-v2`, and `office-simulation-trace-v2` interfaces
are unchanged.

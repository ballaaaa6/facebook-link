# Phase 3 Wave `P3-W3-03` Frozen Interfaces

This is a coordination reference. It does not create a new contract owner.

## Operations input and semantic projection

- The input is a typed `OperationsSnapshotDocument` using
  `office-operations-v2`. It contains role/agent-instance identity, work,
  status, freshness, structured reason, session health, feature IDs, durable
  transitions, and compact event records only.
- `projectPresentationState`-style output is derived, immutable, and
  deterministic. It may expose semantic states such as working, waiting,
  review, blocked, unavailable, and idle, but it must not invent a character,
  facility, sprite, renderer, CSS, or operational record.
- Stale, reconnecting, unavailable, disabled, and failed facts remain visible
  through structured state/diagnostic data; they are never silently rewritten
  as working or idle.

## Branch and join vocabulary

- Copy and visual are the two required content branches. Branch completions
  carry content-group identity, branch identity, attempt, artifact version,
  job, trace, workspace, workflow, completion timestamp, and durable event
  identity/context.
- A newer attempt replaces an older pending branch result. A duplicate durable
  completion with the same payload is idempotent; a changed payload conflicts;
  a stale attempt, same-attempt conflict, wrong group, or wrong scope cannot
  advance the join.
- The join is order-independent and emits at most one stable content-ready
  intent/event identity for the content group. The module does not emit a
  workflow transition on behalf of the workflow coordinator.

## Idempotent choreography intents

- Intent identity is derived from durable stream/event/group/branch identity,
  not array position, current time, or display frame.
- Duplicate, late, stale, and reconnect-delivered durable events do not repeat
  a handoff, branch completion, failure, recovery, or content-ready intent.
- Failure/recovery outputs preserve structured reason, owner, recoverability,
  source revision, and branch/group scope. Presentation intent delivery is
  transient and cannot mutate operational truth.

## Dependency and diagnostics boundary

- Operations may import only `@affiliate-ops/contracts` and
  `@affiliate-ops/office-v2-contracts` as package dependencies. It must not
  import `@affiliate-ops/workflows`, simulation, world, Web, renderer,
  database, storage, connector, or runner code.
- Existing adapter/workflow diagnostic ownership is preserved. Do not add a
  competing schema owner or silently recode an adapter failure as a
  presentation failure.
- All inputs remain unchanged. Results must be reproducible for the same
  snapshot, transition set, and event order policy.

## Cross-task non-dependency

This wave has one worker. No other worker result is required, and the worker
must not modify schemas, generated contracts, workflow producers, public
barrels, or shared planning files. Main owns any export and cross-package
integration decision after review.

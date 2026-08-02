# Phase 3 Wave `P3-W3-02` Frozen Interfaces

This is a coordination reference. It does not create a new contract owner.

## Snapshot and diagnostics

- The input is a typed `OperationsSnapshotDocument` using
  `office-operations-v2`. Its `agents` array contains operational identity,
  role, status, freshness, work, reasons, session health, feature IDs, and the
  last durable transition. It contains no character, facility, sprite, CSS,
  or renderer fields.
- `inspectOperationsSnapshot` preserves exact `adapter.*` ownership for
  freshness, unknown status, structured-reason, duplicate-instance, and event-
  window diagnostics. Inputs are not mutated.
- Structured reasons are required for `waiting`, `review`, `blocked`, and
  `failed`; a reason on another status is a state mismatch.

## Cursor semantics

- `OperationsCursor` is immutable input state with `streamId`, `streamEpoch`,
  `throughSequence`, `retentionWindowStart`, and durable event fingerprints.
- An empty snapshot window is encoded as `windowStartSequence =
  throughSequence + 1`. A non-empty window is ordered and contiguous through
  its declared `throughSequence`.
- A known event ID with the same payload digest is an idempotent duplicate. A
  known event ID with a different payload digest is `adapter.event-digest-conflict`.
- New events behind the high-water cursor are `adapter.late-event`; sequence
  gaps, stream mismatch, epoch change, and cursors older than retention require
  resynchronization. No gap or old cursor may be presented as applied current
  truth.
- Cursor output is deterministic and retains durable identity/digest pairs.

## Routing, roster, and proposal semantics

- `OperationsRoutingDocument` maps each role exactly once to a home facility
  capability, allowed interactions, and required features. Facility capability
  availability and compatible roles must agree.
- `OperationsRosterDocument` maps each agent instance exactly once to a known
  role, display name, enabled flag, optional character profile reference, and
  source revision.
- A disabled role cannot remain an active actor. An enabled role whose required
  connector/session feature is disabled or unavailable cannot produce a valid
  proposal. Unknown roles, duplicate instances, incompatible facilities, and
  missing active bindings fail with exact adapter diagnostics.
- TeamBrain is a command-console facility only (`agentEligible: false`). A
  TeamBrain roster binding or external-action proposal fails closed.
- Proposals are checked against roster identity, route interaction, binding
  enablement, and feature availability. The adapter never executes a connector
  or writes operational truth.

## Cross-task non-dependency

This wave has one worker. No other worker result is required, and the worker
must not modify schemas, generated contracts, producers, or shared planning
files. Main owns any export or cross-package integration decision after review.

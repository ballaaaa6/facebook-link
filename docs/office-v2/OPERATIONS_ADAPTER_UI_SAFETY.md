# Operations Adapter, UI, and Safety

## Dependency boundary

The engine receives a versioned read snapshot containing stable actor identity,
display status, current task, progress, update time, freshness, and allowed
proposal capabilities. It does not import database tables, connector payloads,
browser sessions, or storage implementations.

Operational records remain authoritative. Engine simulation may smooth movement
and stage presentation, but it cannot claim a task state absent from the adapter.

The existing V1 snapshot is sufficient for a data-free status lab, not for the
ten-role first floor. Operations Snapshot V2 (`office-operations-v2`) separates
`roleId` from `agentInstanceId` and carries stable workflow-run, task, job,
stage, durable-transition, feature-availability, freshness, session-health,
diagnostic-owner, recoverability, and source-revision identity. Waiting, review,
blocked, and failure reasons are structured values rather than text parsed by
the renderer.

Snapshot V2 also owns the reconnect window: `streamId`, positive
`streamEpoch`, inclusive `windowStartSequence` and `throughSequence`, an
aggregate `eventDigest`, and ordered durable event records. Each event pins a
durable event ID and payload digest. An empty window is represented by
`windowStartSequence = throughSequence + 1`; a non-empty window must be
contiguous. A sequence gap requests resynchronization, an epoch change forces
reconciliation, and a cursor older than the retained window reconciles directly
to current truth without inventing missed activity.

W3.4 adds the adapter-owned reconciliation boundary without creating a second
simulation clock. The checkpoint schema `office-operations-reconciliation-v1`
wraps the completed-boundary Snapshot V2, the generic external-input cursor,
the 10 Hz logical simulation tick, the injected external timestamp, the
choreography state, and bounded queue/intent ledgers. A durable operations event
that is eligible at `externalNow` becomes a typed external input scheduled for
the next logical tick; elapsed wall time is never converted into a tick burst.
Hidden-tab, reload, reconnect, resume, and bfcache paths therefore retain the
last completed simulation tick and reconcile only the supplied event window.

Event validity is explicit: expired events advance the durable cursor without
execution, while future events remain unconsumed and are eligible on a later
reconciliation. A known event ID with the same digest is a no-op; a changed
digest, contradictory transition policy, cursor-ahead snapshot, invalid window,
or backward clock fails closed. Stream mismatch, epoch reset, gaps, and retained
window expiry rebase to current truth and emit no historical choreography. After
reconciliation, pending operations preserve deterministic durable/enqueue order,
terminal queue items cannot be resurrected, and stale decorative or handoff
intents are coalesced by branch/group identity. The returned presentation intents
remain transient and never advance workflow state.

The V2 snapshot schema is owned by `@affiliate-ops/office-v2-contracts`; the
pure validation, cursor reconciliation, roster binding, and proposal-safety
functions are owned by `@affiliate-ops/office-v2-operations`. The schema is
additive to V1. A V1 read may be promoted only with an explicit source revision
and complete event-window/feature/session context; otherwise the adapter
rejects it with `contract.migration-context-missing` before presentation.

The roster-to-world binding is data owned:

```text
agent instance -> role -> character definition -> home facility
               -> allowed interactions -> feature availability
```

No React component, sprite filename, display name, or CSS offset owns this
mapping. Unknown roles or interactions become unavailable with a diagnostic.

The machine contracts are split into three documents:

- `operations-snapshot-v2.schema.json` owns operational truth and event windows;
- `activity-routing.schema.json` owns role-to-capability, interaction, required-feature, and command-console routing;
- `roster-binding.schema.json` owns agent-instance-to-role and optional character-definition binding.

The snapshot deliberately has no character definition, sprite, home facility,
or visual interaction fields. Those facts are rejected as an adapter-owned
snapshot binding leak. TeamBrain is represented only by a `command-console`
facility with `agentEligible: false` and never by a roster binding.

Routing and roster contracts are versioned revisions, not aliases to mutable
latest data. A migration must provide the revision, role identity, and binding
kind explicitly; an unversioned role-only record, duplicate instance, unknown
role, or incompatible facility is rejected with its adapter/contract diagnostic
and never downgraded to an empty or visual-only actor.

## Freshness states

The adapter declares `live`, `stale`, `reconnecting`, or `unavailable` with an
observed time. Stale and unavailable are visible states, not converted to idle.
Reconnect input is idempotent and cannot replay an external action.

When operations payloads require canonical digests, the operations adapter owns
their semantic normalization and declares every ordered or unordered
collection. It reuses the shared duplicate-aware canonical byte and SHA-256
envelope primitive; the Office renderer cannot choose the digest projection.

## Workflow choreography

A world handoff is emitted only after its durable transition has been observed.
The adapter exposes a stable event identity so retries and reconnects cannot
repeat a handoff. Presentation completion never advances workflow state.

Copy and visual production fan out as independently correlated jobs. Their
completion and the join into `content_ready` must be explicit in the adapter;
the Office cannot infer the join because two characters appear finished.

A disabled role is unavailable or absent. It is never rewritten as idle and
cannot be offered an interaction that would execute an external action.

Feature availability remains a product of three visible facts: role enablement,
connector enablement, and session availability. An enabled role with a disabled
connector or unavailable session cannot be presented as working and cannot
produce an allowed proposal. A disabled configured role may retain a static
facility route, but it does not create a live actor.

## UI shell

The control panel owns routing, metrics, inspector, TeamBrain, responsive layout,
and accessible alternatives. The Office page owns only its engine mount and
engine-specific inspector projection.

The empty V2 mount is a valid production state while engine gates are incomplete.
It must state that no scene is installed and must not fabricate actors or tasks.

## User actions

Spatial selection is read-only. Any requested mutation becomes a versioned action
proposal handled by existing API policy. Human review, connector feature flags,
idempotency keys, audit records, and retries remain mandatory.

The engine cannot call Gemini, Google Flow, Meta, Shopee, Discord, or browser
connectors directly.

TeamBrain is represented as a command-console facility, not an agent instance.
It may display existing answers and action proposals, but proposal execution
continues through the control plane and all existing review and audit policy.

## Required evidence

- Adapter contract tests cover all freshness and status values.
- Unknown status maps to unavailable with a diagnostic, never working.
- Engine packages have no connector or database dependency.
- Keyboard users can inspect the same semantic information as pointer users.
- Disabled external-action flags cannot be bypassed through an Office command.
- Duplicate durable transition IDs do not create duplicate movement, props, or
  handoff effects.
- The ten-role fixture covers fan-out, join, failure recovery, and an unknown
  mapping that fails safely.
- Valid and rejected Closure C fixtures pin unknown status, stale/reconnecting/
  unavailable freshness, duplicate agent/event identities, sequence gaps, epoch
  changes, digest conflicts, late events, old cursors, disabled features,
  unknown roles, incompatible facilities, unavailable sessions, and forbidden
  proposals. Each rejection uses one `adapter.*` diagnostic and preserves the
  source revision for later reconciliation.
- The W3.4 reconciliation fixture and focused suite pin intact, expired, future,
  duplicate, changed-digest, Snapshot V2-restored, cursor-ahead, epoch, gap,
  stale-intent, queue-resurrection, serialization, and backward-clock cases.
  This is bounded adapter evidence; it does not claim the reducer-integrated
  1/10/15-actor T2/T3 exit.

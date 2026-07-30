# Operations Adapter, UI, and Safety

## Dependency boundary

The engine receives a versioned read snapshot containing stable actor identity,
display status, current task, progress, update time, freshness, and allowed
proposal capabilities. It does not import database tables, connector payloads,
browser sessions, or storage implementations.

Operational records remain authoritative. Engine simulation may smooth movement
and stage presentation, but it cannot claim a task state absent from the adapter.

The existing V1 snapshot is sufficient for a data-free status lab, not for the
ten-role first floor. The next contract version must separate `roleId` from
`agentInstanceId` and carry stable workflow-run, task, stage, durable-transition,
feature-availability, freshness, session-health, and diagnostic-owner identity.
Waiting, review, blocked, and failure reasons are structured values rather than
text parsed by the renderer.

The roster-to-world binding is data owned:

```text
agent instance -> role -> character definition -> home facility
               -> allowed interactions -> feature availability
```

No React component, sprite filename, display name, or CSS offset owns this
mapping. Unknown roles or interactions become unavailable with a diagnostic.

## Freshness states

The adapter declares `live`, `stale`, `reconnecting`, or `unavailable` with an
observed time. Stale and unavailable are visible states, not converted to idle.
Reconnect input is idempotent and cannot replay an external action.

## Workflow choreography

A world handoff is emitted only after its durable transition has been observed.
The adapter exposes a stable event identity so retries and reconnects cannot
repeat a handoff. Presentation completion never advances workflow state.

Copy and visual production fan out as independently correlated jobs. Their
completion and the join into `content_ready` must be explicit in the adapter;
the Office cannot infer the join because two characters appear finished.

A disabled role is unavailable or absent. It is never rewritten as idle and
cannot be offered an interaction that would execute an external action.

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

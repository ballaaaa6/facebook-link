# Operations Adapter, UI, and Safety

## Dependency boundary

The engine receives a versioned read snapshot containing stable actor identity,
display status, current task, progress, update time, freshness, and allowed
proposal capabilities. It does not import database tables, connector payloads,
browser sessions, or storage implementations.

Operational records remain authoritative. Engine simulation may smooth movement
and stage presentation, but it cannot claim a task state absent from the adapter.

## Freshness states

The adapter declares `live`, `stale`, `reconnecting`, or `unavailable` with an
observed time. Stale and unavailable are visible states, not converted to idle.
Reconnect input is idempotent and cannot replay an external action.

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

## Required evidence

- Adapter contract tests cover all freshness and status values.
- Unknown status maps to unavailable with a diagnostic, never working.
- Engine packages have no connector or database dependency.
- Keyboard users can inspect the same semantic information as pointer users.
- Disabled external-action flags cannot be bypassed through an Office command.

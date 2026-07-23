# Data Model

The initial SQLite/D1-compatible relational schema is `packages/database/migrations/0001_initial.sql`.

## Main records

- `workspaces`, `users`, and `workspace_members`: tenant-ready ownership boundaries.
- `accounts`: publishing and provider destinations.
- `browser_profiles`: non-secret metadata plus an opaque secret reference.
- `products` and `product_snapshots`: canonical products and time-series evidence.
- `workflow_runs` and `agent_runs`: durable orchestration state.
- `affiliate_links`: destination URLs plus all five attribution dimensions.
- `content_artifacts`: versioned copy, image, and video references.
- `publications`: schedule and remote publication identity.
- `performance_metrics`: joined daily channel and affiliate outcomes.
- `strategy_versions`: reviewed configuration snapshots.
- `audit_events`: append-only trace of meaningful actions.
- `jobs`, inbox/outbox, and dead-letter records: durable idempotent execution.
- `stored_objects` and `daily_exports`: opaque local/Oracle artifact references.
- `sheet_sync_*`: mirror targets, checkpoints, attempts, and errors.
- `action_proposals`: confirmation boundary for external or sensitive actions.
- `brain_conversations` and `brain_messages`: bounded chat history and routing.

## Storage separation

- Pilot SQLite: state, indexes, metrics, references, and redacted payloads.
- Local/Oracle content-addressed filesystem: images, videos, reports, and exports.
- Optional future D1/R2: scaled control-plane state and artifacts when billing is available.
- Runner-encrypted disk: cookies, browser profiles, and profile archives.
- Secret manager: API tokens and encryption keys.

Raw credentials never enter SQLite, D1, R2, Google Sheets, logs, Git, Discord, or client-side web code.

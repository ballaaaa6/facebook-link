# Architecture

## Deployment model

```text
Browser / Discord
       |
       v
Cloudflare Web + API + Discord Worker (target control plane)
       |        |        |
       |        +-- D1 control-plane state (scale phase)
       |        +-- optional R2 content artifacts
       |        +-- Queue job envelopes (future binding)
       |
       v
Local Windows automation runner (pilot)
       |
       +-- Shopee browser profile
       +-- Gemini browser profile
       +-- Google Flow browser profile
       +-- Meta Graph API
       +-- SQLite operational state
       +-- content-addressed local object storage
       +-- Google Sheet operational mirror
       +-- encrypted local secret/profile storage

After acceptance: move the same runner boundary to Oracle Linux.
```

## Control plane

During the pilot, SQLite is the source of truth and Google Sheets is a human-readable mirror. At scale, Cloudflare owns configuration, durable workflow state, read models, public authentication, rate limits, webhook ingestion, Discord verification, and command authorization. It emits jobs but never owns interactive browser profiles.

## Execution plane

The automation runner claims jobs with leases, executes connectors, stores artifacts, reports events, and renews session health. A connector returns structured results; it does not update unrelated workflow state directly.

## Data flow

All meaningful changes produce an append-only audit event. Current state is stored alongside events for efficient dashboards. Large media is referenced by opaque content hashes. Browser profiles remain in a private encrypted area and never share the public object path.

## Reliability rules

- Job idempotency key: workflow ID + stage + attempt intent.
- External publication idempotency key: account + platform + content artifact + scheduled slot.
- One active lease per browser profile.
- Explicit retry policy by error category: transient, authentication, validation, policy, or permanent.
- Dead-letter state requires human review; it must not loop forever.
- UTC storage, `Asia/Bangkok` presentation and scheduling.
- SQLite is authoritative; sheet sync is idempotent by record ID and version.
- Chat providers may answer or propose actions, but cannot execute tools directly.

## Office Engine boundary

Office Engine V2 is an optional read-only visualization. It consumes a versioned
adapter snapshot derived from durable agent and workflow events; it does not own
operational truth, call external connectors, or write storage records directly.

Decision 0007 fixes the package import graph. Arrows point from the consumer to
the dependency it may import:

```text
@affiliate-ops/office-v2-world
  -> @affiliate-ops/office-v2-contracts

@affiliate-ops/office-v2-simulation
  -> @affiliate-ops/office-v2-world
  -> @affiliate-ops/office-v2-contracts

@affiliate-ops/office-v2-operations
  -> @affiliate-ops/contracts
  -> @affiliate-ops/office-v2-contracts

apps/web/src/features/office-v2
  -> all four Office packages
```

The world package keeps renderer-neutral projection mathematics in a separate
pure module; browser camera, input, renderer, and React concerns remain in the
Web presentation boundary. Operations adapts shared operational contracts and
does not depend on world or simulation. Packages never import applications,
services, React, renderers, database or storage implementations, connectors,
providers, or the automation runner.

The engine and its future visual assets live behind the clean-room rules in
`docs/office-v2/README.md`. Dashboard, Settings, API, and runner builds must not
require the renderer. Any new Office root or package edge requires a superseding
decision and an exact gate change.

## Scale path

Scale accounts by adding isolated profile workers and queue partitions, not by increasing concurrency inside one browser profile. Scale dashboards independently from browser runners.

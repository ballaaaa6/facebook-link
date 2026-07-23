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

## Scale path

Scale accounts by adding isolated profile workers and queue partitions, not by increasing concurrency inside one browser profile. Scale dashboards independently from browser runners.

# Cloudflare Infrastructure

The repository keeps deployable Worker/Page entry points beside their apps. Production resource IDs are intentionally absent.

## Planned bindings

| Binding | Purpose |
|---|---|
| D1 | Workflow, configuration, metrics, and audit state |
| R2 | Content artifacts, reports, and exports |
| Queue | Runner job envelopes and event ingestion |
| KV or cache | Non-authoritative short-lived read optimization |
| Secrets | API credentials, Discord keys, and runner control tokens |

Create separate development and production resources. Never reuse production secrets in local `.dev.vars` files.

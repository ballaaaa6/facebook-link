# API Worker

Cloudflare Worker boundary for authenticated dashboard requests, orchestration commands, webhook ingestion, and read models. Browser automation must never run here; it belongs in `services/automation-runner`.

Implemented scaffold endpoints:

- `GET /health`
- `GET /v1/system/manifest`

Authentication, D1 bindings, queues, and production routes are intentionally deferred until their schemas and secrets are approved.

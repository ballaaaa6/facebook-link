# Automation Runner

Long-running runtime for browser and API automation. It starts on the local Windows machine during the pilot, then moves unchanged to Oracle Linux once session recovery, idempotency, and observability pass acceptance tests.

## Connector policy

- Shopee discovery and affiliate link conversion: authenticated browser connector.
- Gemini copy: browser connector using the owner's existing paid account; no Gemini API.
- Google Flow visuals: authenticated browser connector.
- Facebook and Instagram publishing: Meta Graph API first.
- Browser publishing fallback: only when an approved API path is unavailable.
- Cookies and profile archives: encrypted local/Oracle storage only, never Git, logs, Discord, or the database.

The runner currently exposes contracts and readiness metadata but performs no external action.

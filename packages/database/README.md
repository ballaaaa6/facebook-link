# Database

Cloudflare D1-compatible SQLite migrations for durable control-plane state. Large images, videos, browser profiles, and cookie archives must not be stored in D1; only metadata and opaque storage references belong here.

Migration rules:

1. Never edit an applied migration.
2. Add a new numbered migration for every schema change.
3. Use UTC ISO-8601 timestamps.
4. Store money as integer minor units.
5. Store raw provider payloads only when required and redact sensitive fields first.

# Roadmap

## M0 — Repository foundation (complete)

- Monorepo boundaries, contracts, workflow state machine, database migration, local object storage, code-health gates, configuration, security rules, CI, art pipeline, and responsive three-route prototype.

## M1 — Observable local workflow

- Office UI reads a versioned API read model with a safe local simulation fallback.
- The working fake pipeline persists jobs, agent runs, audit events, and outbox events idempotently through SQLite.
- Complete the local runner-to-control-plane event relay and replace remaining dashboard/settings mock values.
- Replace fake Sheets transport with a credentialed connector behind the same interface.
- Office motion, stable inspection, settings, dashboard, mock brain, action proposals, and fake connectors already exist.

## M2 — One-account Shopee pilot

- Import the existing login/session recovery approach through a connector.
- Discover products, snapshot evidence, rank winners, create attributed links, and collect affiliate metrics.

## M3 — Content and Meta publishing

- Gemini browser copy, Google Flow browser visuals, QA gate, Meta Graph API scheduling, and publication reconciliation.

## M4 — Learning loop and Oracle migration

- Join Shopee and Meta metrics, strategy proposals, controlled experiments, alerts, encrypted profile migration, and seven-day Oracle acceptance.

## M5 — Multi-account scale

- Profile isolation, queue partitioning, quotas, per-account policies, rate limits, and operational dashboards.

## M6 — Rental product

- Authentication, tenant isolation, billing, onboarding, support tooling, legal terms, retention controls, and commercial asset licensing.

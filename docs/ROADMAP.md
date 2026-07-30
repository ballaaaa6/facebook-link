# Delivery Roadmap

## M0 — Safe foundation

- Maintain monorepo boundaries, repository gates, secret rules, and disabled
  external connectors.
- Keep Dashboard and Settings usable without any game-renderer dependency.
- Preserve durable workflow, attribution, storage, and audit contracts.

## M1 — Observable one-account simulation

- Persist a complete simulated workflow through SQLite.
- Expose workflow and system-health read models through the API.
- Replace dashboard mock values with read-model data.
- Reconcile jobs, agent runs, audit events, and outbox records idempotently.

## M2 — Office Engine V2 foundation and first-floor path

- Finish the world, simulation, projection, and presentation contracts.
- Prove one empty room, one placeholder actor, one target, and one interaction
  with deterministic tests before adding production art.
- Validate movement, occupancy, depth, input, camera, and responsive behavior.
- Introduce one newly produced asset family only after its provenance and
  geometry gates pass.
- Build the reusable asset factory, environment kit, room templates, and
  operations adapter needed by the accepted ground-floor headquarters target.
- Expand from one actor to the ten canonical roles and a fifteen-actor capacity
  fixture without creating fake staff or fake workflow state.
- Keep the engine an optional read-only visualization of operational state.

The target is defined in `docs/office-v2/FIRST_FLOOR_BRIEF.md`; detailed gates
are in `docs/office-v2/IMPLEMENTATION_PLAN.md`. Full first-floor visual expansion
may continue alongside M3 and M4, but it cannot display a connector or role as
working before the corresponding feature is enabled and observed.

## M3 — One-account Shopee pilot

- Import login and session recovery through a connector.
- Discover products, snapshot evidence, rank winners, create attributed links,
  and collect affiliate metrics.

## M4 — Content and Meta publishing

- Produce copy through the Gemini browser experience.
- Produce visuals through the Google Flow browser experience.
- Add content QA, Meta Graph API scheduling, and publication reconciliation.

## M5 — Learning loop and Oracle migration

- Join Shopee and Meta metrics, propose strategy versions, run controlled
  experiments, and alert on failures.
- Migrate encrypted runner state to Oracle Linux and pass a seven-day acceptance.

## M6 — Multi-account scale

- Add profile isolation, queue partitions, quotas, per-account policy, rate
  limits, and operational dashboards.

## M7 — Rental product

- Add authentication, tenant isolation, billing, onboarding, support tooling,
  legal terms, retention controls, and commercial asset licensing.

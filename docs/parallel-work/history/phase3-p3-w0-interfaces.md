# Phase 3 Wave P3-W0 Frozen Interfaces

This file freezes the interfaces used by the three RC closure workers. It is a
read-only coordination reference for workers; it is not a new contract owner.

## Existing contract versions

- `office-queue-policy-v1`
- `office-interaction-v1`
- `office-facility-slot-v1`
- `office-queue-ticket-v1`
- `office-reservation-v1`
- `office-action-queue-v1`
- `office-activity-intent-v1`
- `office-simulation-command-v2`
- `office-simulation-result-v2`
- `office-simulation-event-v2`
- `office-simulation-snapshot-v2`
- `office-simulation-trace-v2`
- `office-world-v2-v1`
- canonical hash domain `office-v2:world-kernel`

Workers must preserve these versions and their existing schema shapes. A
research closure may clarify a rule in its canonical document and add a
test-only fixture, but it may not silently widen a schema or change a
diagnostic's meaning.

## Ownership boundaries

- World geometry owns footprint, blocking, clearance, approaches, waiting
  cells, sockets, and use-slot geometry.
- Simulation owns ticks, command validation/apply, intents, queues,
  reservations, action progress, cleanup, snapshots, and hashes.
- Presentation is derived state and cannot mutate simulation or operational
  truth.
- Operations data remains an adapter input; it does not become world or
  simulation state by being displayed.
- Research fixtures are evidence for later implementation and must not claim
  reducer, replay, crowd, renderer, or asset readiness.

## Canonical decisions

- Decision 0005: pure reducer at 10 Hz, with `idle`, `planning`, `moving`,
  `interacting`, and `blocked` as the initial actor states.
- Decision 0011: semantic normalization precedes canonical bytes and a
  domain/version-separated SHA-256 envelope; ordered arrays are preserved.
- Decision 0012: full resource-set validation/acquisition, durable-before-
  decorative queue order, and deterministic deadlock victim policy.
- Phase 2 world package is pure/headless and cannot import simulation,
  operations, React, renderers, or runtime assets.

## Evidence rules for this wave

- External project sources are architecture studies only. Workers record URLs,
  observed revision/date, license/rights boundary, neutral observations, and
  an explicit adapt/reject disposition.
- No code, assets, maps, scene values, behavior tables, or branding are copied
  from external projects.
- Test-local assertion labels are not runtime diagnostic promotion. Any new
  runtime diagnostic requires a later canonical decision/schema review.
- Placeholder hashes in historical fixtures remain placeholders. RC evidence
  may compare deterministic serialized event/state descriptions but cannot
  report reducer-produced replay evidence before the T2 implementation wave.

# Office V2 Execution Backlog

This file is the worker execution layer for the Office V2 roadmap. Strategic
milestones remain in `docs/ROADMAP.md`; phase and work-package sequencing
remains in `READINESS_REMEDIATION_PLAN.md`; this file owns independently
executable leaf tasks and their current status.

## Current execution state

- Active Phase: **Phase 3 — Headless operational vertical slice**
- Phase objective: produce the first deterministic, headless actor slice with
  fixed ticks, commands, facilities, interaction cleanup, restore/replay, and
  later AutoPost operations choreography.
- Phase entry evidence: Phase 2 executable world-kernel acceptance passed at
  `e4829b68619696651c73ba6b5dced73cc28beaa0`; the pure world package is
  renderer-neutral and exports projection, placement, topology, depth, and
  canonical-world behavior.
- Phase entry blocker: the bounded RC-01, RC-02, and RC-03 research prerequisite
  is now integrated. Runtime implementation still requires the future W2
  command, reducer, hash, interaction, restore, and replay gates.
- Phase status after current wave: **ACTIVE — P3-W2-01 integrated; P3-W0
  bounded research closure accepted; T2/T3 exit criteria remain incomplete**.
- Phase exit criteria: T2 one-actor reach/use/cancel/restore/replay evidence,
  T3 crowd/queue/deadlock evidence, and the complete operations choreography
  evidence pass without renderer or asset leakage.

## Current wave: P3-W0 — T2 research-closure prerequisites

The selected assignments are READY leaf tasks from the current active Phase. No
later-Phase work was selected to fill unused worker capacity.

The three tasks are independent because each has one research question, one
canonical-document ownership group, a disjoint test fixture/script set, and no
dependency on another selected task's unintegrated output. The Main
Orchestration Session owns the shared readiness/status update after review.

Wave result: all three selected tasks completed, passed Main review, and were
integrated on the dedicated branch. Each followed
`READY → IN_PROGRESS → COMPLETED → ACCEPTED → INTEGRATED`. The wave closes only
the bounded RC prerequisite; Phase 3 remains active and no next wave is
launched by this invocation.

### P3-RC-01 — Facility, queue, and terminal-cleanup evidence

- Parent milestone: T2/T3 headless operational evidence
- Parent Phase: Phase 3 — Headless operational vertical slice
- Parent workstream/work package: Wave 2, W2.3/W2.4 facilities, queues, and cleanup
- Objective: close research slice RC-01 using bounded observations from the
  CorsixTH room/object model, adapting only neutral facility capacity,
  approach/waiting, queue, target-removal, cancellation, and cleanup facts.
- Repository evidence: `RESEARCH.md` RC-01 is planned; the canonical jobs,
  room, and crowd documents contain policy but no source-bounded closure record
  or executable RC-01 evidence; `packages/office-v2-simulation` has no runtime
  implementation yet.
- Dependencies: Phase 2 acceptance; existing facility-slot, queue-ticket,
  reservation, action-queue, interaction, geometry, and queue-policy contracts.
- Dependency status: **SATISFIED**. No selected-wave dependency.
- Parallel group: P3-W0 / RC closure group A.
- Owned implementation boundary: the RC-01 sections in
  `docs/office-v2/JOBS_INTENTS_ASSIGNMENT.md`,
  `docs/office-v2/ROOMS_SURFACES_STRUCTURES_ZONES.md`, and
  `docs/office-v2/CROWD_QUEUES_AND_DEADLOCKS.md`; the RC-01 JSON fixtures and
  focused evidence test under `packages/office-v2-simulation/test/fixtures/`
  and `scripts/office-v2-rc-01-evidence*.mjs`; its own status file.
- Forbidden boundary: other workers' canonical documents, `RESEARCH.md`,
  readiness/status documents, schemas or generated contracts, simulation
  production source, public exports, package manifests, lockfiles, and all
  renderer/asset/operations code.
- Read-only references: `RESEARCH.md`, `READINESS_REMEDIATION_PLAN.md`,
  `ACTORS_NAVIGATION_INTERACTIONS.md`, Decision 0012, existing simulation
  schemas/fixtures, and the Phase 2 world package.
- Shared interfaces: existing `office-queue-policy-v1`,
  `office-facility-slot-v1`, `office-queue-ticket-v1`,
  `office-reservation-v1`, `office-action-queue-v1`, and
  `office-interaction-v1`; no version changes are authorized.
- Acceptance criteria: source URL plus observed revision/date, license/rights
  boundary, neutral observations separated from Office decisions, explicit
  adapt/reject disposition, canonical owners named, one valid and one rejected
  facility/queue fixture, one deterministic one-actor cleanup trace, one
  contention/cancellation trace, and exact cleanup assertions for task claim,
  facility slot, cells, reservations, queue ticket, and held prop.
- Focused tests: `node --test scripts/office-v2-rc-01-evidence.test.mjs`.
- Validation commands: project preflight, the focused RC-01 test,
  `npm run office:v2:knowledge:check`, `npm run office:v2:boundaries:test`,
  `git diff --check`, and `npm run check` when the worktree is dependency-ready.
- Worker-sized scope assessment: one bounded research-closure objective with
  one canonical ownership group and no runtime implementation.
- Priority: P0 prerequisite for T2 facility/interaction work.
- Status: **INTEGRATED** — accepted by Main after review; implementation commit
  `fc3b18d248ffcb1f1a15ffbf2c66a2410802012a`, handoff commit
  `3c7472d31aa0e53ebcd47edc15f9de5a01cfda03`

### P3-RC-02 — Runtime/presentation separation and restore evidence

- Parent milestone: T2 headless operational evidence
- Parent Phase: Phase 3 — Headless operational vertical slice
- Parent workstream/work package: Wave 2, W2.3/W2.5 interaction state,
  snapshots, restore, and replay boundaries
- Objective: close research slice RC-02 using bounded observations from the
  FreeSO project structure, adapting only the separation of immutable
  definitions, placed instances, mutable runtime state, derived presentation,
  interaction progress, and save/restore facts.
- Repository evidence: `RESEARCH.md` RC-02 is planned; the four-layer runtime
  document and replay playbook define the target boundary but contain no
  source-bounded closure record or RC-02 focused evidence.
- Dependencies: Phase 2 acceptance; existing definition/instance/runtime,
  interaction, snapshot-v2, trace-v2, canonical hash, and migration contracts.
- Dependency status: **SATISFIED**. No selected-wave dependency.
- Parallel group: P3-W0 / RC closure group B.
- Owned implementation boundary: the RC-02 sections in
  `docs/office-v2/DEFINITION_INSTANCE_RUNTIME_STATE.md` and
  `docs/office-v2/REPLAY_DEBUGGING_PLAYBOOK.md`; the RC-02 JSON fixtures and
  focused evidence test under `packages/office-v2-simulation/test/fixtures/`
  and `scripts/office-v2-rc-02-evidence*.mjs`; its own status file.
- Forbidden boundary: other workers' canonical documents, `RESEARCH.md`,
  readiness/status documents, schemas or generated contracts, simulation
  production source, public exports, package manifests, lockfiles, and all
  renderer/asset/operations code.
- Read-only references: `RESEARCH.md`, `READINESS_REMEDIATION_PLAN.md`,
  `SIMULATION_TIME_RANDOMNESS_REPLAY.md`, `ACTORS_NAVIGATION_INTERACTIONS.md`,
  `SAVE_SNAPSHOT_MIGRATION.md`, Decision 0005, Decision 0011, and existing
  snapshot/trace/interaction schemas and fixtures.
- Shared interfaces: `office-simulation-snapshot-v2`,
  `office-simulation-trace-v2`, `office-interaction-v1`, the accepted
  `office-v2:world-kernel` hash domain, and the explicit four-layer ownership
  table; no version changes are authorized.
- Acceptance criteria: source URL plus observed revision/date, license/rights
  boundary, neutral observations separated from Office decisions, explicit
  adapt/reject disposition, canonical owners named, one presentation-disabled
  interaction fixture, one mid-action restore fixture, one rejected
  invalid-state fixture, and deterministic event/hash comparison assertions
  that do not promote placeholder hashes to replay evidence.
- Focused tests: `node --test scripts/office-v2-rc-02-evidence.test.mjs`.
- Validation commands: project preflight, the focused RC-02 test,
  `npm run office:v2:knowledge:check`, `npm run office:v2:boundaries:test`,
  `git diff --check`, and `npm run check` when the worktree is dependency-ready.
- Worker-sized scope assessment: one bounded research-closure objective with
  one runtime/presentation ownership group and no reducer implementation.
- Priority: P0 prerequisite for T2 interaction/replay work.
- Status: **INTEGRATED** — accepted by Main after review; implementation commit
  `b1252a0fe5b89f1514d8bc9411e37d87bdd4ac3f`, handoff commit
  `427ea87b96a9432979aa728536cc2b280b7ebd94`

### P3-RC-03 — Capability assignment, retries, and target revalidation

- Parent milestone: T2/T3 headless operational evidence
- Parent Phase: Phase 3 — Headless operational vertical slice
- Parent workstream/work package: Wave 2, W2.1/W2.3 command ordering,
  capability assignment, target validation, and retry semantics
- Objective: close research slice RC-03 using bounded observations from the
  Widelands command/task/request model and Unknown Horizons world-object,
  scheduler, and build-command model, adapting only deterministic assignment,
  capability requests, ownership/home, stable IDs, target revalidation,
  pending work, retries, and cancellation facts.
- Repository evidence: `RESEARCH.md` RC-03 is planned; the simulation pipeline
  and save documents describe these contracts but contain no source-bounded
  closure record or RC-03 focused evidence.
- Dependencies: Phase 2 acceptance; existing command/result/event, activity
  intent, facility-slot, snapshot-v2, trace-v2, migration, and canonical hash
  contracts.
- Dependency status: **SATISFIED**. No selected-wave dependency.
- Parallel group: P3-W0 / RC closure group C.
- Owned implementation boundary: the RC-03 sections in
  `docs/office-v2/SIMULATION_PIPELINE_COMMANDS.md` and
  `docs/office-v2/SAVE_SNAPSHOT_MIGRATION.md`; the RC-03 JSON fixtures and
  focused evidence test under `packages/office-v2-simulation/test/fixtures/`
  and `scripts/office-v2-rc-03-evidence*.mjs`; its own status file.
- Forbidden boundary: other workers' canonical documents, `RESEARCH.md`,
  readiness/status documents, schemas or generated contracts, simulation
  production source, public exports, package manifests, lockfiles, and all
  renderer/asset/operations code.
- Read-only references: `RESEARCH.md`, `READINESS_REMEDIATION_PLAN.md`,
  `JOBS_INTENTS_ASSIGNMENT.md`, `SIMULATION_TIME_RANDOMNESS_REPLAY.md`,
  `ACTORS_NAVIGATION_INTERACTIONS.md`, Decision 0005, Decision 0011, Decision
  0012, and existing simulation/intent/snapshot/trace fixtures.
- Shared interfaces: `office-simulation-command-v2`,
  `office-simulation-result-v2`, `office-simulation-event-v2`,
  `office-activity-intent-v1`, `office-simulation-snapshot-v2`,
  `office-simulation-trace-v2`, and versioned migration fail-closed rules; no
  version changes are authorized.
- Acceptance criteria: source URLs plus observed revisions/dates,
  license/rights boundary, neutral observations separated from Office
  decisions, explicit adapt/reject dispositions, canonical owners named, one
  reordered-equivalent assignment fixture, one unavailable/removed-target
  fixture, one retry/cancellation fixture, and assertions that target
  revalidation and restore/replay equality are deterministic without using
  visual identity or array position.
- Focused tests: `node --test scripts/office-v2-rc-03-evidence.test.mjs`.
- Validation commands: project preflight, the focused RC-03 test,
  `npm run office:v2:knowledge:check`, `npm run office:v2:boundaries:test`,
  `git diff --check`, and `npm run check` when the worktree is dependency-ready.
- Worker-sized scope assessment: one bounded research-closure objective with
  one command/migration ownership group and no reducer implementation.
- Priority: P0 prerequisite for T2 command/assignment work.
- Status: **INTEGRATED** — accepted by Main after review; implementation commit
  `21dc3fc363d2cbb1c3cf9bb459eaaf7619bdcd7a`, handoff commit
  `7ff19c44f8ddd669b5797016f46a0b6931f988a4`

## Current wave: P3-W2-01 — T2 fixed-tick command pipeline

The selected assignment was a READY leaf task from the current active Phase. No
later-Phase work was selected to fill unused worker capacity. The one-worker
count was correct because `P3-W2.1` was the only compatible READY task at wave
selection; W2.2, W2.3, and W2.6 were dependency-gated at that time.

- Task: `P3-W2.1`
- Initial worker session: `019fc0dc-cde8-77d3-9763-8e357dd521f5` / Darwin
  (shutdown before implementation); replacement session:
  `019fc0e3-ef2e-78f2-ab7a-2869368556ef` / Carver; final recovery session:
  `019fc0e6-b8a5-7030-ae1e-773184540d66` / Sagan (shutdown before handoff)
- Branch: `task/session-1-p3-w2-command-pipeline`
- Worktree: `C:\Users\WINDOW XI\.codex\worktrees\phase3-w2-command-pipeline`
- Planning commit: `7233ebf40f63190ac166069aedf9c7b30a04707b`
- Integration branch: `codex/integration/phase3-w2-command-pipeline`
- Status: **INTEGRATED** — coordinator recovery accepted by Main; original
  recovery implementation commit `758a33492f6532ee35430ed57e46917358fa6fb6`
  and integrated commit `15045a4`.

## Remaining Phase 3 leaf tasks after P3-W2-01 integration

These tasks are intentionally not selected in this invocation. They remain
candidate or blocked until the named dependencies are integrated.

### P3-W2.1 — Fixed-tick command pipeline and reducer

- Parent milestone: T2 headless vertical slice; Parent Phase: Phase 3; Parent
  workstream/work package: W2.1 command protocol.
- Objective: implement the 10 Hz ingest/validate/deduplicate/order/apply/result/event pipeline.
- Repository evidence: the simulation package now exports the W2.1 pipeline
  from `packages/office-v2-simulation/src/index.ts`; W2.1 contracts and
  fixtures exist; the focused pipeline evidence is present, while full
  reducer/replay evidence remains zero.
- Dependencies: P3-RC-02 and P3-RC-03 integrated; Phase 2 acceptance.
- Dependency status: SATISFIED; integrated in the current wave.
- Parallel group: future W2 implementation group.
- Owned implementation boundary: `packages/office-v2-simulation/src/command-pipeline.ts` and its focused test.
- Forbidden boundary: world package, operations adapter, renderer, assets, and shared generated contracts.
- Read-only references: simulation command/result/event schemas, Decision 0005,
  `SIMULATION_PIPELINE_COMMANDS.md`, and Phase 2 world exports.
- Shared interfaces: command/result/event V2 contracts.
- Acceptance criteria: total order, past-tick rejection, idempotent duplicate,
  payload conflict, stale revision, no partial mutation, and emitted facts.
- Focused tests: command-pipeline test suite.
- Validation commands: preflight, package typecheck/test, `npm run check`.
- Worker-sized scope assessment: one reducer pipeline module and focused tests.
- Priority: P0.
- Status: **INTEGRATED** — Main accepted the coordinator recovery after focused
  and complete validation; no delegated worker commit or handoff was produced.

### P3-W2.2 — Simulation normalization, PRNG, and real state hashes

- Parent milestone: T2 headless vertical slice; Parent Phase: Phase 3; Parent
  workstream/work package: W2.2 normalization and hash projection.
- Objective: implement the simulation-owned ordered/unordered normalization,
  named PRNG streams, hashable-state projection, and reducer-produced hashes.
- Repository evidence: shared canonical JSON/hash utilities exist; current
  replay hashes are placeholders and reducer/replay evidence is zero.
- Dependencies: P3-W2.1 integrated; P3-RC-02 and P3-RC-03 integrated.
- Dependency status: **SATISFIED** after `P3-W2.1` integration and Phase 3
  readiness review.
- Parallel group: future W2 implementation group.
- Owned implementation boundary: `packages/office-v2-simulation/src/state-hash.ts` and focused tests.
- Forbidden boundary: shared canonical utility implementation, renderer state, and operations records.
- Read-only references: Decision 0011, `REPLAY_DEBUGGING_PLAYBOOK.md`, and canonical contracts.
- Shared interfaces: `office-v2:world-kernel` conventions and snapshot/trace V2.
- Acceptance criteria: real deterministic hashes, domain separation, preserved
  ordered arrays, declared unordered sorting, and first-field divergence.
- Focused tests: state-hash/replay hash suite.
- Validation commands: preflight, package typecheck/test, `npm run check`.
- Worker-sized scope assessment: one normalization/hash module and focused tests.
- Priority: P0.
- Status: **READY** — recommended for the next Phase 3 wave; not launched in
  this invocation.

### P3-W2.3 — One-actor intents, facilities, action queues, and interaction

- Parent milestone: T2 headless vertical slice; Parent Phase: Phase 3; Parent
  workstream/work package: W2.3 activity/facility runtime.
- Objective: implement capability assignment and one geometric actor's
  requested-to-using interaction lifecycle using existing world geometry.
- Repository evidence: facility/action contracts exist, but package runtime is empty.
- Dependencies: P3-RC-01 and P3-RC-03 integrated; P3-W2.1 integrated.
- Dependency status: **SATISFIED** after RC-01, RC-03, and `P3-W2.1`
  integration.
- Parallel group: future W2 implementation group.
- Owned implementation boundary: `packages/office-v2-simulation/src/activity-runtime.ts` and focused tests.
- Forbidden boundary: queues/deadlocks beyond the one-actor contract, operations,
  renderer, and assets.
- Read-only references: jobs, interaction, geometry, placement, and navigation contracts.
- Shared interfaces: activity-intent, facility-slot, action-queue, reservation, and interaction V1.
- Acceptance criteria: reach, wait, acquire, use, complete, cancel, timeout,
  unreachable, and exactly-once cleanup for one actor.
- Focused tests: activity/interaction suite.
- Validation commands: preflight, package typecheck/test, `npm run check`.
- Worker-sized scope assessment: one one-actor runtime module and focused tests.
- Priority: P0.
- Status: **READY** — recommended for the next Phase 3 wave; not launched in
  this invocation.

### P3-W2.4 — Queue, reservation, fairness, and deadlock runtime

- Parent milestone: T3 crowd and operations; Parent Phase: Phase 3; Parent
  workstream/work package: W2.4 queues and deadlocks.
- Objective: implement normalized atomic resource acquisition, queue ordering,
  bounded wait, cycle detection, and deterministic yield/block behavior.
- Repository evidence: policy and numeric profiles exist; runtime queue evidence is absent.
- Dependencies: P3-W2.3 integrated; RC-01 integrated.
- Dependency status: BLOCKED until `P3-W2.3` integrates.
- Parallel group: future T3 implementation group.
- Owned implementation boundary: `packages/office-v2-simulation/src/queues.ts` and focused tests.
- Forbidden boundary: operations adapter, renderer, assets, and workflow sources.
- Read-only references: Decision 0012 and crowd fixtures.
- Shared interfaces: queue-policy V1 and reservation/action contracts.
- Acceptance criteria: 1/10/15 actor profiles, no partial claims, deterministic
  fairness, cleanup, victim/yield, and missing-yield diagnostics.
- Focused tests: queue/deadlock suite.
- Validation commands: preflight, package typecheck/test, `npm run check`.
- Worker-sized scope assessment: one queue runtime module and focused tests.
- Priority: P1.
- Status: BLOCKED.

### P3-W2.5 — Snapshot migration, restore, replay, and divergence

- Parent milestone: T2 headless vertical slice; Parent Phase: Phase 3; Parent
  workstream/work package: W2.5 replay and diagnostics.
- Objective: implement versioned migration, mid-route/queue/interaction restore,
  replay runner, first divergence, and secret-safe bug bundle.
- Repository evidence: snapshot/trace contracts and migration rules exist;
  runtime registry and replay evidence are absent.
- Dependencies: P3-W2.1, P3-W2.2, and P3-W2.3 integrated; RC-02/03 integrated.
- Dependency status: BLOCKED until `P3-W2.1`, `P3-W2.2`, and `P3-W2.3`
  integrate.
- Parallel group: future T2 replay group.
- Owned implementation boundary: `packages/office-v2-simulation/src/replay.ts` and focused tests.
- Forbidden boundary: external connector payloads, credentials, renderer state, and operations truth.
- Read-only references: snapshot/trace schemas, save/migration doc, replay playbook.
- Shared interfaces: V2 snapshot/trace and hash envelope.
- Acceptance criteria: restored and uninterrupted event/hash equality, fail-closed
  versions, first divergence, and secret allowlist.
- Focused tests: replay/restore suite.
- Validation commands: preflight, package typecheck/test, `npm run check`.
- Worker-sized scope assessment: one replay/migration module and focused tests.
- Priority: P0.
- Status: BLOCKED.

### P3-W2.6 — Fixed-tick lifecycle port

- Parent milestone: T2 headless vertical slice; Parent Phase: Phase 3; Parent
  workstream/work package: W2.6 lifecycle boundary.
- Objective: implement injected mounted/visible/hidden/restoring/destroyed
  lifecycle with capped catch-up and idempotent subscriptions.
- Repository evidence: lifecycle policy and fixture shape exist; no runtime port exists.
- Dependencies: P3-W2.1 integrated; RC-02 integrated.
- Dependency status: **SATISFIED** after RC-02 and `P3-W2.1` integration.
- Parallel group: future T2 lifecycle group.
- Owned implementation boundary: `packages/office-v2-simulation/src/lifecycle.ts` and focused tests.
- Forbidden boundary: browser renderer implementation and operations event production.
- Read-only references: simulation pipeline, lifecycle fixture, and simulation foundations.
- Shared interfaces: injected lifecycle contract and 10 Hz tick semantics.
- Acceptance criteria: capped catch-up, no hidden-time burst, no duplicate listeners/pollers/loops.
- Focused tests: lifecycle suite.
- Validation commands: preflight, package typecheck/test, `npm run check`.
- Worker-sized scope assessment: one lifecycle port and focused tests.
- Priority: P1.
- Status: **READY** — recommended for the next Phase 3 wave; not launched in
  this invocation.

### P3-W3.1 — Workflow ownership and operations adapter verification

- Parent milestone: T3 crowd and operations; Parent Phase: Phase 3; Parent
  workstream/work package: W3.1 workflow/role ownership.
- Objective: execute the accepted Product Ranker/Growth Strategist ownership
  and system-owned content join checks against the current workflow sources.
- Repository evidence: Closure C contract tests exist; W3 runtime verification is absent.
- Dependencies: P3-RC-03 and P3-W2.3 integrated.
- Dependency status: BLOCKED.
- Parallel group: future W3 operations group.
- Owned implementation boundary: a focused operations evidence test only; shared workflow sources remain main-integration-owned.
- Forbidden boundary: workflow ownership docs, agent catalog, connector actions, and simulation source.
- Read-only references: ADR 0003, workflows, agent catalog, operations fixtures.
- Shared interfaces: existing workflow/operations contracts.
- Acceptance criteria: exactly one winner owner, system join owner, no connector execution while disabled.
- Focused tests: W3.1 evidence suite.
- Validation commands: preflight, focused workspace tests, `npm run check`.
- Worker-sized scope assessment: one evidence test with no producer changes.
- Priority: P1.
- Status: BLOCKED.

### P3-W3.2 — Operations Snapshot V2 cursor and roster adapter

- Parent milestone: T3 crowd and operations; Parent Phase: Phase 3; Parent
  workstream/work package: W3.2 snapshot/roster binding.
- Objective: implement durable cursor reconciliation, role/agent-instance
  separation, feature availability, and data-owned roster binding.
- Repository evidence: operations V2 contracts and V1 adapter exist; runtime V2 is absent.
- Dependencies: P3-W2.3 and P3-W2.5 integrated; P3-W3.1 integrated.
- Dependency status: BLOCKED.
- Parallel group: future W3 operations group.
- Owned implementation boundary: new V2 operations adapter module and focused tests.
- Forbidden boundary: operations database migration, connector side effects, renderer, and simulation reducer.
- Read-only references: operations docs, schemas, Closure C fixtures, and workflow sources.
- Shared interfaces: operations snapshot V2, routing, roster, event-window contracts.
- Acceptance criteria: contiguous window, duplicate/conflict, gap/epoch/retention,
  disabled/unavailable role, and TeamBrain rejection behavior.
- Focused tests: operations cursor/roster suite.
- Validation commands: preflight, operations package tests, `npm run check`.
- Worker-sized scope assessment: one adapter module and focused tests.
- Priority: P1.
- Status: BLOCKED.

### P3-W3.3 — Fan-out/join and failure choreography

- Parent milestone: T3 crowd and operations; Parent Phase: Phase 3; Parent
  workstream/work package: W3.3 copy/visual join.
- Objective: implement pure semantic presentation projection and idempotent
  choreography intents for copy/visual branches and content-ready joins.
- Repository evidence: Closure C schemas/fixtures exist; runtime choreography is absent.
- Dependencies: P3-W3.2 integrated and P3-W2.5 integrated.
- Dependency status: BLOCKED.
- Parallel group: future W3 operations group.
- Owned implementation boundary: operations choreography module and focused tests.
- Forbidden boundary: external publishing, workflow state writes, renderer, and simulation truth.
- Read-only references: Closure C docs, operations fixtures, and feature flags.
- Shared interfaces: content-group/branch/attempt/join contracts and operations V2.
- Acceptance criteria: duplicate/late/stale/retry/failure/recovery handling with no repeated intents.
- Focused tests: fan-out/join suite.
- Validation commands: preflight, operations package tests, `npm run check`.
- Worker-sized scope assessment: one pure choreography module and focused tests.
- Priority: P1.
- Status: BLOCKED.

### P3-W3.4 — Operations reconciliation and two-clock integration

- Parent milestone: T3 crowd and operations; Parent Phase: Phase 3; Parent
  workstream/work package: W3.4 lifecycle/reconnect integration.
- Objective: map operations event windows to generic external-input cursors and
  coalesce obsolete presentation intents across reload/reconnect/resume.
- Repository evidence: policy and contracts exist; integration evidence is absent.
- Dependencies: P3-W2.4, P3-W2.5, P3-W2.6, P3-W3.2, and P3-W3.3 integrated.
- Dependency status: BLOCKED.
- Parallel group: future T3 integration group.
- Owned implementation boundary: one integration adapter module and focused tests.
- Forbidden boundary: renderer selection, real connectors, and primary branch.
- Read-only references: operations lifecycle and simulation lifecycle documents.
- Shared interfaces: generic external-input cursor, operations V2, snapshot/trace V2.
- Acceptance criteria: intact-window and expired-window reconciliation with no hidden catch-up burst.
- Focused tests: reconnect/resume/reconciliation suite.
- Validation commands: preflight, workspace tests, `npm run check`.
- Worker-sized scope assessment: one cross-package integration module and tests.
- Priority: P1.
- Status: BLOCKED.

## Recommended next wave

`P3-W2-02` should select the three compatible READY leaf tasks `P3-W2.2`
(simulation normalization/PRNG/state hashes), `P3-W2.3` (one-actor
intents/facilities/interaction), and `P3-W2.6` (fixed-tick lifecycle port).
They have disjoint ownership and no dependency on one another's unintegrated
output. The Main Orchestration Session must select and launch that wave only in
a later invocation.

## Selection rule and status transitions

Only READY tasks from the active Phase may enter a wave. The allowed flow is
`READY → IN_PROGRESS → COMPLETED → ACCEPTED → INTEGRATED`; review failures use
`REVIEW_FAILED`, and genuine dependency failures use `BLOCKED`. A worker may
modify only its own status file. The Main Orchestration Session updates this
backlog and the shared phase records after review and integration.

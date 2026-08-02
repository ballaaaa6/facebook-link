# Worker Session 2 Task Specification

- Session: 2
- Task ID: `P3-RC-02`
- Task name: Runtime/presentation separation and restore research closure
- Parent Phase: Phase 3 — Headless operational vertical slice
- Wave ID: `P3-W0`
- Worker branch: `task/session-2-p3-rc-02-runtime-replay`
- Worker worktree: `C:\Users\WINDOW XI\.codex\worktrees\phase3-rc-02-runtime-replay`
- Original base commit: `e4829b68619696651c73ba6b5dced73cc28beaa0`
- Planning commit: `fb78bc31e27b30b6a1ba57259517c63f7c684724`
- Status file: `docs/parallel-work/session-2-status.md`

## Objective

Close research slice RC-02 from `docs/office-v2/RESEARCH.md` before T2
interaction and replay implementation. Study the bounded FreeSO project
structure only for neutral observations about immutable definitions, placed
instances, mutable runtime state, derived presentation, interaction progress,
commands, snapshots, and restore. Adapt or reject each observation for Office
V2 using the accepted four-layer and versioned snapshot/trace contracts. Do not
implement the reducer or replay runner.

You are implementing one leaf task inside the current active Phase. You are not
responsible for completing the entire Phase or starting the next Phase.

## Repository evidence and current behavior

- RC-02 is listed as `planned` in the research closure matrix.
- `DEFINITION_INSTANCE_RUNTIME_STATE.md` and
  `REPLAY_DEBUGGING_PLAYBOOK.md` define the target boundary but contain no
  bounded source record or RC-02 executable evidence.
- Existing interaction, snapshot-v2, trace-v2, canonical hash, and migration
  contracts are frozen and test-only at this stage.
- `packages/office-v2-simulation/src/index.ts` is an empty scaffold. No
  persistent reducer, hash producer, or replay runtime may be added.

## Required final behavior

The owned canonical documents must contain an RC-02 closure section that
separates source observations from Office decisions and records source URL,
observed revision/date, license/rights boundary, adapt/reject disposition,
canonical owner, migration consequence, and focused acceptance command. The
focused evidence must prove:

1. a presentation-disabled interaction state description;
2. a mid-action restore description with required state carried explicitly;
3. a rejected invalid-state case that cannot be reconstructed from position or
   presentation data; and
4. deterministic comparison of event/state descriptions without promoting
   placeholder hashes to reducer/replay evidence.

## In scope

- Read the FreeSO project-structure source listed in `RESEARCH.md` and record
  only neutral, bounded observations.
- Update only the RC-02 sections of the two owned canonical documents.
- Add the three test fixtures and focused Node test listed in ownership.
- Keep fixture assertion labels local to the RC-02 test; do not introduce a
  runtime diagnostic catalog or change a schema.
- Update `session-2-status.md` with exact files, commands, results, commit, and
  handoff.

## Out of scope

- Any reducer, route planner, queue engine, snapshot migration registry, replay
  runner, operations, renderer, asset, workflow, database, connector, or
  browser implementation.
- `RESEARCH.md`, readiness records, execution backlog, parallel plan,
  knowledge manifests/adapters, schemas, generated TypeScript, package barrels,
  package manifests, or lockfiles.
- Copying FreeSO code, maps, data, scene values, behavior tables, or content.
- Claiming T2/T3 promotion or closing Phase 3.

## Owned files

- `docs/office-v2/DEFINITION_INSTANCE_RUNTIME_STATE.md`
- `docs/office-v2/REPLAY_DEBUGGING_PLAYBOOK.md`
- `packages/office-v2-simulation/test/fixtures/rc-02-interaction-disabled.json`
- `packages/office-v2-simulation/test/fixtures/rc-02-mid-action-restore.json`
- `packages/office-v2-simulation/test/fixtures/rc-02-invalid-state.json`
- `scripts/office-v2-rc-02-evidence.mjs`
- `scripts/office-v2-rc-02-evidence.test.mjs`
- `docs/parallel-work/session-2-status.md`

## Forbidden files

All paths listed as Main Orchestration Session integration-only or owned by
Sessions 1 and 3 in `docs/parallel-work/ownership.md`, especially
`RESEARCH.md`, `READINESS_MATRIX.md`, `READINESS_REMEDIATION_PLAN.md`, the
execution backlog, other status files, schemas, generated contracts, and
production source.

## Read-only references and frozen interfaces

Read `AGENTS.md`, the build-office-v2-engine skill, `docs/office-v2/README.md`,
`FOUNDATIONS.md`, `KNOWLEDGE_COMPLETENESS_AUDIT.md`, `READINESS_MATRIX.md`,
`READINESS_REMEDIATION_PLAN.md`, `RESEARCH.md`,
`SIMULATION_TIME_RANDOMNESS_REPLAY.md`, `ACTORS_NAVIGATION_INTERACTIONS.md`,
`SAVE_SNAPSHOT_MIGRATION.md`, Decision 0005, Decision 0011, the interaction,
snapshot, trace, canonical JSON/hash, and migration contracts, and the Phase 2
world acceptance record. Preserve `office-interaction-v1`,
`office-simulation-snapshot-v2`, `office-simulation-trace-v2`, and the
`office-v2:world-kernel` hash-domain conventions.

## Ordered implementation requirements

1. Run project preflight from the assigned worktree before changing behavior.
2. Inspect the named FreeSO source page and record revision/date and rights
   boundary; do not copy implementation or content.
3. Add the source observation/disposition and canonical ownership sections.
4. Add presentation-disabled, mid-action-restore, and invalid-state fixtures
   under the simulation test fixture boundary, not the knowledge-manifest
   fixture root.
5. Implement focused deterministic tests for explicit state/event facts and
   required restore fields. Do not compute or claim a real reducer hash.
6. Run focused validation and repository preflight/checks.
7. Update only the owned status file, commit the complete task, and hand off.

## Required tests and validation

- `node --test scripts/office-v2-rc-02-evidence.test.mjs`
- `node .agents/skills/build-office-v2-engine/scripts/preflight.mjs`
- `npm run office:v2:knowledge:check`
- `npm run office:v2:boundaries:test`
- `git diff --check`
- `npm run check` if the isolated worktree is dependency-ready; otherwise
  record the exact setup blocker and the focused results.

## Acceptance criteria

- RC-02 source record is bounded, neutral, rights-safe, and linked to the
  existing layer/snapshot/replay owners.
- All three fixtures exist and are exercised by the focused test.
- Presentation state cannot advance durable state in the evidence model; restore
  requires explicit progress/resource/correlation facts; invalid state fails
  closed.
- Placeholder fixture hashes remain explicitly non-evidence.
- No schema, generated file, package manifest, lockfile, runtime source, or
  forbidden path changed.
- Status file records the final commit and a concise handoff.

## Handoff requirements

In the final status file and worker response, provide the implementation commit
SHA, exact changed files, source URL/revision, tests and results, any
deviations, known limitations, and the statement that the Main Orchestration
Session must review and integrate the commit. Stop immediately after the
handoff; do not integrate, publish, or launch another task.

# Worker Session 1 Task Specification

- Session: 1
- Task ID: `P3-RC-01`
- Task name: Facility, queue, and terminal-cleanup research closure
- Parent Phase: Phase 3 — Headless operational vertical slice
- Wave ID: `P3-W0`
- Worker branch: `task/session-1-p3-rc-01-facility-queue`
- Worker worktree: `C:\Users\WINDOW XI\.codex\worktrees\phase3-rc-01-facility-queue`
- Original base commit: `e4829b68619696651c73ba6b5dced73cc28beaa0`
- Planning commit: recorded by the Main Orchestration Session before launch
- Status file: `docs/parallel-work/session-1-status.md`

## Objective

Close research slice RC-01 from `docs/office-v2/RESEARCH.md` before T2 facility
and interaction implementation. Study the bounded CorsixTH room/object model
only for neutral observations about room prerequisites, facility capacity,
approach and waiting positions, queueing, use, target removal, cancellation,
and terminal cleanup. Adapt or reject each observation for Office V2 using the
already accepted contracts. Do not implement the reducer or runtime queues.

You are implementing one leaf task inside the current active Phase. You are not
responsible for completing the entire Phase or starting the next Phase.

## Repository evidence and current behavior

- RC-01 is listed as `planned` in the research closure matrix.
- `JOBS_INTENTS_ASSIGNMENT.md`, `ROOMS_SURFACES_STRUCTURES_ZONES.md`, and
  `CROWD_QUEUES_AND_DEADLOCKS.md` define policy but do not contain a bounded
  source record or RC-01 executable evidence.
- Existing V1/V2 facility, queue, reservation, action-queue, interaction, and
  geometry schemas are the frozen contracts.
- `packages/office-v2-simulation/src/index.ts` is an empty scaffold. No
  persistent queue or reducer behavior may be added by this task.

## Required final behavior

The owned canonical documents must contain an RC-01 closure section that
clearly separates source observations from Office decisions and records the
source URL, observed revision/date, license/rights boundary, adapt/reject
disposition, canonical owner, migration consequence, and focused acceptance
command. The focused evidence must prove:

1. a valid facility/queue description with capacity, approach/waiting, and
   terminal cleanup facts;
2. a rejected case for a missing/invalid approach, partial resource claim, or
   otherwise declared RC-01 failure;
3. one deterministic one-actor cleanup trace;
4. one contention/cancellation trace; and
5. exact cleanup of task claim, facility/use slot, approach/waiting cell,
   every reservation, queue ticket, and held prop, with repeated cleanup a
   no-op.

These are research-closure fixtures and test evidence. They must not be
reported as reducer-produced replay, crowd, or T3 evidence.

## In scope

- Read the CorsixTH source pages listed in `RESEARCH.md` and record only
  neutral, bounded observations.
- Update only the RC-01 sections of the three owned canonical documents.
- Add the four test fixtures and the focused Node test listed in ownership.
- Keep fixture assertion labels local to the RC-01 test; do not introduce a
  runtime diagnostic catalog or change a schema.
- Update `session-1-status.md` with exact files, commands, results, commit, and
  handoff.

## Out of scope

- Any reducer, queue engine, A*, movement, snapshot, replay, operations,
  renderer, asset, workflow, database, connector, or browser implementation.
- `RESEARCH.md`, readiness records, execution backlog, parallel plan,
  knowledge manifests/adapters, schemas, generated TypeScript, package barrels,
  package manifests, or lockfiles.
- Copying CorsixTH code, maps, data, behavior tables, timings, or content.
- Claiming T2/T3 promotion or closing Phase 3.

## Owned files

- `docs/office-v2/JOBS_INTENTS_ASSIGNMENT.md`
- `docs/office-v2/ROOMS_SURFACES_STRUCTURES_ZONES.md`
- `docs/office-v2/CROWD_QUEUES_AND_DEADLOCKS.md`
- `packages/office-v2-simulation/test/fixtures/rc-01-facility-queue-valid.json`
- `packages/office-v2-simulation/test/fixtures/rc-01-facility-queue-rejected.json`
- `packages/office-v2-simulation/test/fixtures/rc-01-one-actor-cleanup.json`
- `packages/office-v2-simulation/test/fixtures/rc-01-contention-cleanup.json`
- `scripts/office-v2-rc-01-evidence.mjs`
- `scripts/office-v2-rc-01-evidence.test.mjs`
- `docs/parallel-work/session-1-status.md`

## Forbidden files

All paths listed as Main Orchestration Session integration-only or owned by
Sessions 2 and 3 in `docs/parallel-work/ownership.md`, especially
`RESEARCH.md`, `READINESS_MATRIX.md`, `READINESS_REMEDIATION_PLAN.md`, the
execution backlog, other status files, schemas, generated contracts, and
production source.

## Read-only references and frozen interfaces

Read `AGENTS.md`, the build-office-v2-engine skill, `docs/office-v2/README.md`,
`FOUNDATIONS.md`, `KNOWLEDGE_COMPLETENESS_AUDIT.md`, `READINESS_MATRIX.md`,
`READINESS_REMEDIATION_PLAN.md`, `RESEARCH.md`,
`ACTORS_NAVIGATION_INTERACTIONS.md`, Decision 0012, the existing facility,
queue, reservation, action-queue, interaction, and geometry schemas, and the
Phase 2 world acceptance record. Preserve all existing versions, including
`office-queue-policy-v1`, `office-facility-slot-v1`,
`office-queue-ticket-v1`, `office-reservation-v1`,
`office-action-queue-v1`, and `office-interaction-v1`.

## Ordered implementation requirements

1. Run project preflight from the assigned worktree before changing behavior.
2. Inspect the named CorsixTH source pages and record revision/date and rights
   boundary; do not copy implementation or content.
3. Add the source observation/disposition and canonical ownership sections.
4. Add valid/rejected facility/queue and cleanup/contending fixtures under the
   simulation test fixture boundary, not the knowledge-manifest fixture root.
5. Implement the focused test using deterministic local data and exact
   assertions. Keep it independent of browser time and external connectors.
6. Run focused validation and the repository preflight/checks.
7. Update only the owned status file, commit the complete task, and hand off.

## Required tests and validation

- `node --test scripts/office-v2-rc-01-evidence.test.mjs`
- `node .agents/skills/build-office-v2-engine/scripts/preflight.mjs`
- `npm run office:v2:knowledge:check`
- `npm run office:v2:boundaries:test`
- `git diff --check`
- `npm run check` if the isolated worktree is dependency-ready; otherwise
  record the exact setup blocker and the focused results.

## Acceptance criteria

- RC-01 source record is bounded, neutral, rights-safe, and linked to the
  existing canonical owners.
- Valid and rejected fixtures exist and are exercised by the focused test.
- One-actor cleanup and contention/cancellation tests prove all resource
  categories and idempotent repeated cleanup.
- No schema, generated file, package manifest, lockfile, runtime source, or
  forbidden path changed.
- Status file records the final commit and a concise handoff.

## Handoff requirements

In the final status file and worker response, provide the implementation commit
SHA, exact changed files, source URLs/revisions, tests and results, any
deviations, known limitations, and the statement that the Main Orchestration
Session must review and integrate the commit. Stop immediately after the
handoff; do not integrate, publish, or launch another task.

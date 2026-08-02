# Worker Session 3 Task Specification

- Session: 3
- Task ID: `P3-RC-03`
- Task name: Capability assignment, retries, and target-revalidation research closure
- Parent Phase: Phase 3 — Headless operational vertical slice
- Wave ID: `P3-W0`
- Worker branch: `task/session-3-p3-rc-03-assignment`
- Worker worktree: `C:\Users\WINDOW XI\.codex\worktrees\phase3-rc-03-assignment`
- Original base commit: `e4829b68619696651c73ba6b5dced73cc28beaa0`
- Planning commit: `fb78bc31e27b30b6a1ba57259517c63f7c684724`
- Status file: `docs/parallel-work/session-3-status.md`

## Objective

Close research slice RC-03 from `docs/office-v2/RESEARCH.md` before T2 command
and assignment implementation. Study the bounded Widelands command/task/request
model and Unknown Horizons world-object, scheduler, and build-command model
only for neutral observations about deterministic assignment, capability
requests, ownership/home, stable IDs, priorities, target revalidation, pending
work, retries, restore, and cancellation. Adapt or reject each observation for
Office V2 using the accepted command, intent, snapshot, trace, and migration
contracts. Do not implement the reducer or assignment runtime.

You are implementing one leaf task inside the current active Phase. You are not
responsible for completing the entire Phase or starting the next Phase.

## Repository evidence and current behavior

- RC-03 is listed as `planned` in the research closure matrix.
- `SIMULATION_PIPELINE_COMMANDS.md` and `SAVE_SNAPSHOT_MIGRATION.md` define the
  target policy but contain no bounded source record or RC-03 executable
  evidence.
- Existing command/result/event, activity-intent, facility-slot, snapshot-v2,
  trace-v2, canonical hash, and migration contracts are frozen and test-only.
- `packages/office-v2-simulation/src/index.ts` is an empty scaffold. No
  persistent command reducer or assignment runtime may be added.

## Required final behavior

The owned canonical documents must contain an RC-03 closure section that
separates source observations from Office decisions and records source URLs,
observed revisions/dates, license/rights boundary, adapt/reject dispositions,
canonical owners, migration consequence, and focused acceptance command. The
focused evidence must prove:

1. reordered-equivalent capability assignment is stable;
2. unavailable and removed targets are revalidated and fail/transition without
   inventing a visual identity or array-position fallback;
3. retry and cancellation preserve stable IDs and explicit pending/terminal
   state; and
4. restore/replay inputs remain explicitly recorded, with no claim of
   reducer-produced hash evidence.

## In scope

- Read the bounded Widelands and Unknown Horizons sources listed in `RESEARCH.md`
  and record only neutral observations.
- Update only the RC-03 sections of the two owned canonical documents.
- Add the three test fixtures and focused Node test listed in ownership.
- Keep fixture assertion labels local to the RC-03 test; do not introduce a
  runtime diagnostic catalog or change a schema.
- Update `session-3-status.md` with exact files, commands, results, commit, and
  handoff.

## Out of scope

- Any reducer, A*, movement, queue engine, snapshot migration registry, replay
  runner, operations, renderer, asset, workflow, database, connector, or
  browser implementation.
- `RESEARCH.md`, readiness records, execution backlog, parallel plan,
  knowledge manifests/adapters, schemas, generated TypeScript, package barrels,
  package manifests, or lockfiles.
- Copying Widelands or Unknown Horizons code, maps, data, scene values,
  behavior tables, or content.
- Claiming T2/T3 promotion or closing Phase 3.

## Owned files

- `docs/office-v2/SIMULATION_PIPELINE_COMMANDS.md`
- `docs/office-v2/SAVE_SNAPSHOT_MIGRATION.md`
- `packages/office-v2-simulation/test/fixtures/rc-03-assignment-reorder.json`
- `packages/office-v2-simulation/test/fixtures/rc-03-target-revalidation.json`
- `packages/office-v2-simulation/test/fixtures/rc-03-retry-cancellation.json`
- `scripts/office-v2-rc-03-evidence.mjs`
- `scripts/office-v2-rc-03-evidence.test.mjs`
- `docs/parallel-work/session-3-status.md`

## Forbidden files

All paths listed as Main Orchestration Session integration-only or owned by
Sessions 1 and 2 in `docs/parallel-work/ownership.md`, especially
`RESEARCH.md`, `READINESS_MATRIX.md`, `READINESS_REMEDIATION_PLAN.md`, the
execution backlog, other status files, schemas, generated contracts, and
production source.

## Read-only references and frozen interfaces

Read `AGENTS.md`, the build-office-v2-engine skill, `docs/office-v2/README.md`,
`FOUNDATIONS.md`, `KNOWLEDGE_COMPLETENESS_AUDIT.md`, `READINESS_MATRIX.md`,
`READINESS_REMEDIATION_PLAN.md`, `RESEARCH.md`,
`JOBS_INTENTS_ASSIGNMENT.md`, `SIMULATION_TIME_RANDOMNESS_REPLAY.md`,
`ACTORS_NAVIGATION_INTERACTIONS.md`, Decision 0005, Decision 0011, Decision
0012, the command/result/event, intent, snapshot, trace, migration, and
canonical hash contracts, and the Phase 2 world acceptance record. Preserve
the existing V2 versions and fail-closed migration rules.

## Ordered implementation requirements

1. Run project preflight from the assigned worktree before changing behavior.
2. Inspect the named Widelands and Unknown Horizons sources and record their
   revisions/dates and rights boundary; do not copy implementation or content.
3. Add the source observation/disposition and canonical ownership sections.
4. Add reordered assignment, target-revalidation, and retry/cancellation
   fixtures under the simulation test fixture boundary, not the
   knowledge-manifest fixture root.
5. Implement focused deterministic tests for stable IDs, capability-only
   selection, target generation/revision, retry, cancellation, and explicit
   restore inputs. Do not compute or claim a real reducer hash.
6. Run focused validation and repository preflight/checks.
7. Update only the owned status file, commit the complete task, and hand off.

## Required tests and validation

- `node --test scripts/office-v2-rc-03-evidence.test.mjs`
- `node .agents/skills/build-office-v2-engine/scripts/preflight.mjs`
- `npm run office:v2:knowledge:check`
- `npm run office:v2:boundaries:test`
- `git diff --check`
- `npm run check` if the isolated worktree is dependency-ready; otherwise
  record the exact setup blocker and the focused results.

## Acceptance criteria

- RC-03 sources are bounded, neutral, rights-safe, and linked to canonical
  command/migration owners.
- All three fixtures exist and are exercised by the focused test.
- Capability selection is independent of visual identity and array order;
  target removal/revision is explicit; retries and cancellation are stable and
  fail closed when required context is absent.
- Placeholder fixture hashes remain explicitly non-evidence.
- No schema, generated file, package manifest, lockfile, runtime source, or
  forbidden path changed.
- Status file records the final commit and a concise handoff.

## Handoff requirements

In the final status file and worker response, provide the implementation commit
SHA, exact changed files, source URLs/revisions, tests and results, any
deviations, known limitations, and the statement that the Main Orchestration
Session must review and integrate the commit. Stop immediately after the
handoff; do not integrate, publish, or launch another task.

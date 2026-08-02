# Worker Session 1 Task Specification

- Session: 1
- Task ID: `P3-W2.1`
- Task name: Fixed-tick command pipeline and reducer
- Parent Phase: Phase 3 — Headless operational vertical slice
- Wave ID: `P3-W2-01`
- Worker branch: `task/session-1-p3-w2-command-pipeline`
- Worker worktree: `C:\Users\WINDOW XI\.codex\worktrees\phase3-w2-command-pipeline`
- Original base commit: `3358c318c18eebfd586cd413cee6e026f41dc48d`
- Planning commit: to be recorded by Main before launch
- Status file: `docs/parallel-work/session-1-status.md`

## Objective

Implement the first Phase 3 runtime unit: a pure, renderer-free fixed-tick
command pipeline for the accepted `office-simulation-command-v2`,
`office-simulation-result-v2`, and `office-simulation-event-v2` contracts. The
pipeline must ingest commands, validate them, order eligible same-tick inputs,
deduplicate command IDs, apply only the command facts in this leaf's scope, and
emit deterministic results/events without claiming replay hashes.

You are implementing one leaf task inside the current active Phase. You are not
responsible for completing the entire Phase or starting the next Phase.

## Repository evidence and current behavior

- `packages/office-v2-simulation/src/index.ts` is an empty scaffold.
- The V2 command/result/event schemas and generated TypeScript contracts exist
  and are drift-checked.
- `SIMULATION_PIPELINE_COMMANDS.md` freezes the pipeline order, command
  ownership, scheduled-tick rule, duplicate semantics, and event boundary.
- Phase 2 world-kernel exports are pure and renderer-neutral.
- RC-02 and RC-03 prerequisite closures are integrated; reducer/replay evidence
  is still zero.

## Required final behavior

The module and focused tests must prove:

1. same-tick commands sort by `scheduledTick`, `sourceRank`,
   `sourceSequence`, then UTF-16 `commandId` code units;
2. a command scheduled before the current tick rejects with
   `simulation.command-scheduled-in-past` and leaves state unchanged;
3. a duplicate command ID with the same command version and payload digest
   returns `idempotent-duplicate` without a second mutation or event;
4. a duplicate command ID with a different version or payload digest rejects
   with `simulation.command-id-conflict` and leaves the accepted ledger intact;
5. a stale `expectedWorldRevision` rejects without partial mutation;
6. malformed owner identity (actor without `actorId`, or system without a
   `systemOwner`) rejects before apply;
7. accepted command facts produce schema-shaped results and deterministic event
   IDs/sequences at the applying tick;
8. explicit tick advancement is deterministic and independent of wall-clock or
   presentation state.

## In scope

- `packages/office-v2-simulation/src/command-pipeline.ts`
- `packages/office-v2-simulation/test/command-pipeline.test.ts`
- A small serializable state/pipeline API in the owned module that Main can
  re-export after review.
- Focused unit/invariant tests for the behavior above.

## Out of scope

- `packages/office-v2-simulation/src/index.ts` or package manifests; Main owns
  public exports and repository test wiring.
- Facilities, capabilities, target selection, routes, movement, queues,
  reservations, interaction progress, snapshot migration, replay runner,
  PRNG/state hashes, Operations V2, renderer, browser lifecycle, assets,
  workflows, connectors, or database code.
- Schema edits, generated contract edits, new dependencies, new runtime
  diagnostics beyond the named command-pipeline outcomes, or external actions.

## Owned files

- `packages/office-v2-simulation/src/command-pipeline.ts`
- `packages/office-v2-simulation/test/command-pipeline.test.ts`
- `docs/parallel-work/session-1-status.md`

## Forbidden files

All paths listed as Main integration-only in `docs/parallel-work/ownership.md`,
especially the package barrel, package manifest, backlog, readiness records,
parallel plan, interfaces, final report, schemas, generated contracts, world
package, operations code, renderer/assets, and all other worker status files.

## Read-only references and frozen interfaces

Read `AGENTS.md`, the `build-office-v2-engine` skill, `docs/office-v2/README.md`,
`FOUNDATIONS.md`, `KNOWLEDGE_COMPLETENESS_AUDIT.md`, `READINESS_MATRIX.md`,
`READINESS_REMEDIATION_PLAN.md`, `EXECUTION_BACKLOG.md`,
`SIMULATION_PIPELINE_COMMANDS.md`, `SIMULATION_TIME_RANDOMNESS_REPLAY.md`,
`ACTORS_NAVIGATION_INTERACTIONS.md`, `SAVE_SNAPSHOT_MIGRATION.md`, Decision
0005, Decision 0011, the command/result/event/snapshot/trace/interaction schemas
and fixtures, the generated contracts, canonical JSON/hash utilities, and the
Phase 2 acceptance record. Preserve all existing versions and clean-room
boundaries.

## Ordered implementation requirements

1. Confirm the assigned worktree and run Office V2 preflight before edits.
2. Implement a pure serializable pipeline state and explicit tick transition
   API. Use the generated command/result/event types where practical.
3. Validate owner fields and tick/revision preconditions before mutation.
4. Implement the frozen total ordering with a local UTF-16 comparator.
5. Track accepted command version/digest/result identity for idempotency and
   conflict detection.
6. Apply only W2.1 command facts; do not invent facility or interaction state.
7. Emit deterministic result/event records and assert no event for idempotent
   duplicates or rejected commands unless the existing contract explicitly
   requires a rejection fact.
8. Add focused tests for every acceptance criterion, including unchanged-state
   assertions on all failure paths.
9. Run focused validation, typecheck, preflight, and the repository gate when
   available. Update only the owned status file, commit the task, and hand off.

## Required tests and validation

- `node --test packages/office-v2-simulation/test/command-pipeline.test.ts`
- `npm run typecheck --workspace @affiliate-ops/office-v2-simulation`
- `node .agents/skills/build-office-v2-engine/scripts/preflight.mjs`
- `git diff --check`
- `npm run check` if the isolated worktree is dependency-ready; otherwise
  record the exact setup blocker and the focused results.

## Acceptance criteria

- The module is pure, serializable, deterministic, and renderer/operations
  independent.
- All eight required behaviors have focused tests and pass.
- The worker changed only owned files; no schema, generated file, manifest,
  lockfile, public export, or forbidden path changed.
- The status file records the implementation commit, exact files, commands and
  results, known limitations, and a concise handoff.

## Handoff requirements

In the status file and worker response, provide the implementation commit SHA,
exact changed files, test/validation results, any deviations or limitations,
and the statement that the Main Orchestration Session must review and integrate
the commit. Stop immediately after the handoff; do not integrate, publish,
push the integration branch, or launch another task.

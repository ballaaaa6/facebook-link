# Worker Session 2 Task Specification

- Session: 2
- Task ID: `P3-W2.5`
- Task name: Snapshot migration, restore, replay, and divergence
- Parent Phase: Phase 3 — Headless operational vertical slice
- Wave ID: `P3-W2-03`
- Worker branch: `task/session-2-p3-w2-replay`
- Worker worktree: `C:\Users\WINDOW XI\.codex\worktrees\phase3-p3-w2-03-replay`
- Original base commit: `65499e200c672440d92b3405723056064fa0a88c`
- Planning artifacts commit: `ca6d1b5e55c75ff75194fd60505fb5158b8cc1ae`.
- Worker starting commit: the planning-lock commit recorded in
  `parallel-plan.md` before launch.
- Status file: `docs/parallel-work/session-2-status.md`

## Objective

Implement a pure, injected snapshot/restore/replay boundary that runs the
accepted fixed-tick state transition and hash functions, compares interrupted
and restored runs, reports the first divergence, and emits a secret-safe debug
bundle without promoting placeholder hashes.

## Repository evidence and dependencies

`P3-W2.1`, `P3-W2.2`, `P3-W2.3`, RC-02, and RC-03 are integrated. Existing
command, activity, lifecycle, canonical JSON/hash, and simulation state-hash
modules are frozen inputs. Snapshot/trace schemas and save/replay documents
require explicit versions, complete in-progress state, and fail-closed
migrations.

Dependency status: **SATISFIED**. No selected-wave dependency.

Read-only references:

- `docs/office-v2/SIMULATION_TIME_RANDOMNESS_REPLAY.md`
- `docs/office-v2/SAVE_SNAPSHOT_MIGRATION.md`
- `docs/office-v2/REPLAY_DEBUGGING_PLAYBOOK.md`
- `docs/office-v2/DEFINITION_INSTANCE_RUNTIME_STATE.md`
- `docs/office-v2/decisions/0005-simulation-state-machine.md`
- `docs/office-v2/decisions/0011-canonical-serialization-and-hashing.md`
- snapshot, trace, command, result, event, action-queue, reservation, and
  facility-slot schemas
- `packages/office-v2-simulation/src/command-pipeline.ts`
- `packages/office-v2-simulation/src/state-hash.ts`
- `docs/parallel-work/interfaces.md`

## Required final behavior

- Runs a deterministic injected replay from an explicit initial state and
  ordered inputs, returning per-tick frames, results, events, and real hashes.
- Supports restore from a completed frame/snapshot and reaches the same final
  events and state hash as an uninterrupted run.
- Preserves ordered inputs/events and normalizes only declared unordered state
  collections.
- Rejects unknown future versions, missing migration paths, incompatible
  definitions, non-boundary restore points, and incomplete in-progress resource
  context with stable fail-closed diagnostics.
- Provides a first-divergence report containing tick, subsystem, stable path,
  expected value, and actual value.
- Creates a secret-safe bug bundle from an explicit allowlist and excludes
  cookies, tokens, browser profiles, connector payloads, and unrelated
  operational records.
- Treats historical placeholder hashes as labels only; it never reports them as
  reducer/replay evidence.

## In scope

- `replay.ts`, its focused tests, and its package-local fixture.
- Generic injected step/migration/hash interfaces that do not duplicate the
  command reducer or canonical serializer.
- Pure replay comparison, restore validation, divergence, and bug-bundle
  projection.

## Out of scope

- Changes to command pipeline, activity runtime, state-hash utility, lifecycle,
  queue implementation, schemas, generated contracts, world, operations,
  renderer, assets, connectors, or workflow sources.
- Persistent storage, browser lifecycle, or external event execution.
- Public barrel exports; Main will decide and perform any required export.
- Phase 3/T2 closure claims beyond the evidence produced by these tests.

## Owned files and forbidden files

Owned files are exactly those listed in `docs/parallel-work/ownership.md` for
Session 2. Do not edit any other implementation or shared documentation file.

## Ordered implementation requirements

1. Define explicit versioned replay frame/input/result interfaces and validate
   restore boundaries before materialization.
2. Implement deterministic uninterrupted replay over an injected step/hash
   function and capture real per-frame hashes.
3. Implement restore/replay equivalence and first-divergence comparison.
4. Implement a small one-direction migration registry with fail-closed unknown
   and missing-path behavior.
5. Implement the secret-safe bug-bundle allowlist and negative secret tests.
6. Add fixtures and tests for successful and rejected paths.

## Required tests and validation

`packages/office-v2-simulation/test/replay.test.ts` must cover deterministic
replay, restored-versus-uninterrupted equality, ordered-array preservation,
unknown/missing migration, invalid restore boundary, incomplete resource state,
first divergence, domain/hash evidence, and secret omission.

Run:

```text
node .agents/skills/build-office-v2-engine/scripts/preflight.mjs
npm run --workspace @affiliate-ops/office-v2-simulation typecheck
node --test packages/office-v2-simulation/test/replay.test.ts
git diff --check
```

## Acceptance criteria

- Focused tests pass with actual computed hashes from the existing hash
  boundary, not repeated sample strings.
- Restored and uninterrupted runs agree on event sequence and final hash.
- Divergence and migration diagnostics are stable and secret-safe.
- No presentation state, connector data, or credentials enter the simulation
  hash or bug bundle.
- No existing package contract or worker-owned boundary is modified.
- The worker status file records the commit, files, tests, and limitations.

## Expected deliverables and handoff

- One focused implementation commit on the assigned branch.
- Updated Session 2 status file with `COMPLETED`, commit hash, changed files,
  validation output, acceptance checklist, and known limitations.
- Final handoff message to Main naming the commit and stopping immediately.

You are implementing one leaf task inside the current active Phase. You are
not responsible for completing the entire Phase or starting the next Phase.
Do not integrate, cherry-pick, merge, push the integration branch, modify the
primary branch, or create a pull request.

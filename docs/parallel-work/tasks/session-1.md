# Worker Session 1 Task Specification

- Session: 1
- Task ID: `P3-W3.3`
- Task name: Fan-out/join and failure choreography
- Parent Phase: Phase 3 — Headless operational vertical slice
- Wave ID: `P3-W3-03`
- Worker branch: `task/session-1-p3-w3-03-choreography`
- Worker worktree: `C:\Users\WINDOW XI\.codex\worktrees\phase3-p3-w3-03-choreography`
- Original base commit: `799248b6a7612ca5c45ae06f94a86b4203765ed8`
- Planning artifacts commit: to be recorded in the planning-lock metadata
  before worker launch.
- Status-file path: `docs/parallel-work/session-1-status.md`

## Objective

Implement one pure operations choreography boundary for the two-branch content
fan-out/join and its failure/recovery presentation intents. The module must
project current semantic state from Snapshot V2 and consume explicit durable
branch transitions without writing workflow state, executing connectors, or
depending on a renderer.

You are implementing one leaf task inside the current active Phase. You are not
responsible for completing the entire Phase or starting the next Phase.

## Repository evidence

Phase 3 already integrates the fixed-tick command, normalization/hash,
one-actor interaction, lifecycle, queue/replay, ownership, and P3-W3.2
Snapshot V2 cursor/roster adapter slices. The operations package currently
contains cursor reconciliation, roster binding, feature safety, and proposal
checks, but no pure choreography module for branch completion, content-ready
joins, semantic projection, or failure/recovery intents. Shared workflow
contracts and the workflow package already prove the authoritative
`content_ready` join behavior; this task adds the operations-facing derived
choreography boundary without creating a second workflow owner.

Dependencies are **SATISFIED**: Phase 2 acceptance, P3-W2.5 replay/restore,
P3-W3.1 ownership verification, and P3-W3.2 operations adapter are integrated.
No selected-wave dependency exists.

## Read-only references

- `docs/office-v2/OPERATIONS_ADAPTER_UI_SAFETY.md`
- `docs/office-v2/FAILURE_DIAGNOSTICS.md`
- `docs/office-v2/READINESS_REMEDIATION_PLAN.md` W3.3
- `docs/office-v2/schemas/operations-snapshot-v2.schema.json`
- `docs/office-v2/schemas/activity-routing.schema.json`
- `docs/office-v2/schemas/roster-binding.schema.json`
- `docs/office-v2/fixtures/operations-closure-c.json`
- `docs/office-v2/fixtures/invalid/operations-adapter-rejections.json`
- `packages/contracts/src/workflow.ts`
- `packages/workflows/src/content-join.ts` and its focused tests
- `packages/office-v2-operations/src/index.ts`
- `packages/office-v2-operations/test/operations.test.ts`
- `docs/parallel-work/interfaces.md`

## Current behavior

`@affiliate-ops/office-v2-operations` validates Snapshot V2 event windows,
roster bindings, feature availability, and safe proposals. It does not yet
produce a deterministic semantic presentation projection or a stateful pure
choreography result for copy/visual branch completion, retry replacement,
content-ready join, failure, recovery, duplicate, stale, and reconnect paths.

## Required final behavior

- Project an immutable, deterministic semantic view from Snapshot V2 that
  preserves agent-instance/role identity, work/stage, freshness, feature
  availability, structured reasons, source revision, and recoverability.
- Keep stale, reconnecting, unavailable, disabled, and failed facts visible;
  never turn them into working or idle. A failure may map to a blocked semantic
  presentation state only when its structured failure reason remains attached.
- Consume explicit branch transition inputs carrying content-group, branch,
  attempt, artifact version, job/trace scope, durable event identity, and
  failure/recovery context. Do not infer branch identity from array order,
  display names, or sprite/facility names.
- Accept copy and visual completions in either order; keep only the current
  accepted attempt per branch; allow a higher retry to replace a pending
  attempt; reject or safely ignore stale and conflicting duplicates.
- Emit a stable, idempotent content-ready choreography intent only when both
  required branches have valid current completions, and never emit it twice for
  the same content group. The intent is presentation-only; the workflow
  coordinator remains the durable `content_ready` owner.
- Emit deterministic branch-started/completed/failed/recovered/handoff intent
  records at most once per durable transition. Late, duplicate, stale, or
  reconnect-delivered transitions cannot repeat work or advance a branch.
- Preserve exact existing adapter/workflow diagnostic ownership and return
  deterministic diagnostics/results without mutating any input document.

## In-scope work

- `packages/office-v2-operations/src/choreography.ts`
- `packages/office-v2-operations/test/choreography.test.ts`
- `packages/office-v2-operations/test/fixtures/p3-w3-3-choreography.json`
- `docs/parallel-work/session-1-status.md`

Use existing generated/shared types where possible. Define only the smallest
module-local input, state, output, and diagnostic shapes required for explicit
branch transitions and pure results. Keep the module renderer-free and
side-effect free. Main owns the existing public barrel export.

## Out-of-scope work

- Any schema, generated type, migration, workflow source, agent catalog,
  package manifest, lockfile, database/storage code, connector action, runner
  side effect, renderer, asset, Web, simulation, or world change.
- A second workflow transition or `content_ready` owner, automatic connector
  execution, operational truth write, browser timer, animation callback, or
  visual fallback.
- New adapter diagnostic codes, visual binding, character placement, facility
  geometry, or a claim that T2/T3, crowd replay, complete AutoPost, renderer,
  or asset acceptance is complete.
- Shared backlog, plan, ownership, interfaces, task specification, or final
  integration report edits.

## Owned files and forbidden files

Owned files are exactly those listed in `docs/parallel-work/ownership.md` for
Session 1. The existing `src/index.ts`, generated contracts, schemas,
workflow producers, and all shared planning files are forbidden.

## Frozen interfaces

Read `docs/parallel-work/interfaces.md` before editing. In particular, use
`office-operations-v2` Snapshot V2 as operational input, the shared content
branch/completion vocabulary, durable event identity/digest semantics, and
idempotent presentation intents. Operations may import only shared contracts
and Office contracts; it must not import the workflows package.

## Ordered implementation requirements

1. Read the repository instructions and every task reference before editing.
2. Inspect the existing adapter and workflow join contracts; identify the
   smallest operations-facing choreography boundary that does not duplicate
   workflow state ownership.
3. Define explicit, versioned-at-the-module-boundary transition/state/result
   shapes. Use stable identity keys and existing diagnostic ownership; do not
   use array position or wall-clock arrival for identity.
4. Implement semantic Snapshot V2 projection as a pure deterministic function.
5. Implement pure branch/retry/join/failure/recovery reduction with
   order-independent copy/visual handling, idempotent duplicate delivery,
   changed-payload conflict handling, stale-attempt protection, and one-time
   content-ready intent emission.
6. Add fixture-driven tests for valid projection, both branch orders, duplicate
   completion, changed payload, stale and same-attempt conflict, higher retry,
   join-once, failure/recovery, late/reconnect delivery, disabled/unavailable
   semantics, determinism, and no input mutation.
7. Run the required validation and record exact results in the status file.
8. Commit only the owned implementation/tests/fixture/status files on the
   assigned worker branch, send a precise handoff to Main, and stop immediately.

## Required tests and validation

The focused suite is `packages/office-v2-operations/test/choreography.test.ts`.
It must cover:

- semantic projection of live, waiting/review, blocked/failed, stale,
  reconnecting, unavailable, disabled, and idle records;
- copy-first and visual-first completion with one stable join intent;
- duplicate durable delivery and same-ID changed-payload conflict;
- stale attempt, same-attempt conflict, higher retry replacement, group/scope
  mismatch, branch failure, and recovery;
- late/out-of-order/reconnect events do not repeat intents;
- deterministic output under input reorder where the contract declares order
  irrelevant; and
- input immutability.

Run:

```text
node .agents/skills/build-office-v2-engine/scripts/preflight.mjs
npm run --workspace @affiliate-ops/office-v2-operations typecheck
npm run --workspace @affiliate-ops/office-v2-operations test
git diff --check
```

## Acceptance criteria

- Focused choreography tests pass and demonstrate every W3.3 policy rule.
- Existing P3-W3.2 adapter behavior and Closure C schemas/fixtures remain
  unchanged and green.
- Duplicate, stale, conflict, failure, recovery, and reconnect paths are
  deterministic, idempotent, and cannot execute external work or mutate input.
- Copy and visual branches remain distinct and `content_ready` remains
  system/workflow-coordinator-owned.
- No forbidden file changes occur and no generated contract is edited.
- The worker status file records `COMPLETED`, commit hash, changed files,
  validation output, acceptance checklist, and known limitations.

## Expected deliverables and handoff

- One focused implementation commit on the assigned worker branch.
- Updated `docs/parallel-work/session-1-status.md` with branch/worktree,
  commit, files, tests, acceptance checklist, and limitations.
- Final handoff message to Main naming the task commit and stopping immediately.

The worker must not integrate or cherry-pick other branches, modify the primary
branch, push the integration branch, create a pull request, or start another
task/wave/Phase.

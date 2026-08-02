# Worker Session 1 Task Specification

- Session: 1
- Task ID: `P3-W2.4`
- Task name: Queue, reservation, fairness, and deadlock runtime
- Parent Phase: Phase 3 — Headless operational vertical slice
- Wave ID: `P3-W2-03`
- Worker branch: `task/session-1-p3-w2-queues`
- Worker worktree: `C:\Users\WINDOW XI\.codex\worktrees\phase3-p3-w2-03-queues`
- Original base commit: `65499e200c672440d92b3405723056064fa0a88c`
- Planning artifacts commit: `ca6d1b5e55c75ff75194fd60505fb5158b8cc1ae`.
- Worker starting commit: the planning-lock commit recorded in
  `parallel-plan.md` before launch.
- Status file: `docs/parallel-work/session-1-status.md`

## Objective

Implement one pure, renderer-free queue/resource runtime for the accepted
`office-queue-policy-v1` semantics. It must normalize complete resource sets,
serve stable queue tickets, acquire all-or-none, perform idempotent cleanup,
and resolve bounded wait-for cycles without inventing movement.

## Repository evidence and dependencies

`P3-W2.1`, `P3-W2.3`, RC-01, Phase 2, the queue schemas, and Decision 0012 are
integrated. `activity-runtime.ts` already proves one-actor resource cleanup;
this task adds the multi-request queue and wait-for boundary. T3 crowd and
replay promotion remain later acceptance gates.

Dependency status: **SATISFIED**. No selected-wave dependency.

Read-only references:

- `docs/office-v2/ACTORS_NAVIGATION_INTERACTIONS.md`
- `docs/office-v2/CROWD_QUEUES_AND_DEADLOCKS.md`
- `docs/office-v2/JOBS_INTENTS_ASSIGNMENT.md`
- `docs/office-v2/decisions/0012-queue-reservation-and-deadlock-policy.md`
- queue, reservation, action-queue, facility-slot, and activity-intent schemas
- `docs/office-v2/fixtures/simulation-contracts-v2.json`
- `packages/office-v2-simulation/src/activity-runtime.ts`
- `docs/parallel-work/interfaces.md`

## Required final behavior

- Validates non-empty stable resource keys and rejects duplicates before any
  state mutation.
- Normalizes a requested resource set by the frozen UTF-16 comparator.
- Commits a complete claim or no newly requested claim at all.
- Orders waiting tickets by durable/decorative priority, enqueue tick, and
  ticket ID, independent of input or render order.
- Releases claims and tickets exactly once on cancellation, completion,
  timeout, target removal, or explicit cleanup.
- Tracks a declared no-progress threshold and wait-for edges.
- Selects a deterministic deadlock victim using the accepted priority, latest
  intent, and greatest actor-ID tie-breakers.
- Routes a victim only to a declared legal yield cell, or returns
  `simulation.deadlock-no-yield-cell` with stable context.
- Produces bounded results for the one-, ten-, and fifteen-request fixture
  profiles without claiming full navigation or T3 replay evidence.

## In scope

- `queues.ts`, its focused tests, and its package-local fixture.
- Pure data structures and functions needed for queue order, atomic claims,
  cleanup, wait-for edges, cycle detection, victim selection, and yield choice.
- Stable diagnostics and immutable state transitions.

## Out of scope

- Navigation/pathfinding or world occupancy changes.
- Changes to `activity-runtime.ts`, command pipeline, hash utility, lifecycle,
  schemas, generated contracts, operations adapter, renderer, assets, or
  workflow sources.
- Public barrel exports; Main will decide and perform any required export.
- Phase 3/T3 closure claims.

## Owned files and forbidden files

Owned files are exactly those listed in `docs/parallel-work/ownership.md` for
Session 1. Do not edit any other implementation or shared documentation file.

## Ordered implementation requirements

1. Define a versioned pure queue state/input/result boundary and validate all
   numeric/identity inputs.
2. Implement the stable resource comparator and all-or-none claim logic.
3. Implement queue ticket ordering and idempotent release/cleanup.
4. Implement wait-for cycle detection after the configured no-progress tick
   threshold, deterministic victim selection, and legal-yield/no-yield output.
5. Add focused fixtures and tests for success and failure paths.
6. Keep all state immutable from the caller's perspective.

## Required tests and validation

`packages/office-v2-simulation/test/queues.test.ts` must cover reverse-input
normalization, duplicate resources, atomic contention, durable-before-
decorative ordering, enqueue/ticket tie-breaks, idempotent cleanup, target or
reservation removal, bounded wait, deterministic victim selection, legal yield,
missing-yield failure, and bounded 1/10/15 request profiles.

Run:

```text
node .agents/skills/build-office-v2-engine/scripts/preflight.mjs
npm run --workspace @affiliate-ops/office-v2-simulation typecheck
node --test packages/office-v2-simulation/test/queues.test.ts
git diff --check
```

## Acceptance criteria

- The focused suite is green and demonstrates every required policy rule.
- No existing package contract or worker-owned boundary is modified.
- No queue result depends on array order, wall-clock time, display name, or
  presentation state.
- The no-yield diagnostic is exact and does not teleport or stack an actor.
- The worker status file records the commit, files, tests, and limitations.

## Expected deliverables and handoff

- One focused implementation commit on the assigned branch.
- Updated Session 1 status file with `COMPLETED`, commit hash, changed files,
  validation output, acceptance checklist, and known limitations.
- Final handoff message to Main naming the commit and stopping immediately.

You are implementing one leaf task inside the current active Phase. You are
not responsible for completing the entire Phase or starting the next Phase.
Do not integrate, cherry-pick, merge, push the integration branch, modify the
primary branch, or create a pull request.

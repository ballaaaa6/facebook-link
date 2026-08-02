# Worker Session 2 Task Specification

- Session: 2
- Task ID: `P3-W2.3`
- Task name: One-actor intents, facilities, action queues, and interaction
- Parent Phase: Phase 3 — Headless operational vertical slice
- Wave ID: `P3-W2-02`
- Worker branch: `task/session-2-p3-w2-activity-runtime`
- Worker worktree: `C:\Users\WINDOW XI\.codex\worktrees\phase3-w2-activity-runtime`
- Original base commit: `925439a5f6f29580d82767e2177433a35195bc71`
- Planning commit: `2635abb87d014240fe4992b8120f99fde0431e7e`
- Status file: `docs/parallel-work/session-2-status.md`

## Objective

Implement a pure, renderer-free one-actor activity runtime that binds an
accepted intent to a capability-matching facility/use slot, progresses through
the one-actor interaction phases, and releases every owned resource exactly
once on every terminal path. This is one leaf inside Phase 3; it is not the
crowd/deadlock engine or the whole T2 gate.

## Repository evidence and current behavior

- The activity-intent, facility-slot, action-queue, reservation, queue-ticket,
  and command/result/event contracts already exist and are drift-checked.
- RC-01 and RC-03 fixtures define facility capacity, target generation,
  retry/cancellation, and complete cleanup facts.
- `ACTORS_NAVIGATION_INTERACTIONS.md` defines requested, en-route, waiting,
  acquired, using, completion, cancellation, timeout, unreachable, and
  exactly-once cleanup policy.
- The simulation package has no one-actor activity runtime; `P3-W2.1` only
  records accepted command facts.

## Required final behavior

1. Provide a serializable API in `src/activity-runtime.ts` with explicit tick
   advancement and no wall-clock, renderer, React, or operations imports.
2. Accept a one-actor intent and choose an available facility slot by
   capability and stable identity, never by sprite/family name or array order.
3. Model the observable phases `requested`, `en-route`, `waiting`, `acquired`,
   `using`, and terminal `released`, `canceled`, or `failed`.
4. Reserve the complete declared resource set all-or-none; on contention,
   retain a stable waiting ticket without claiming a partial set.
5. Prove reachability/unreachable behavior using a small supplied geometric
   test model; do not introduce a navigation package or copy world maps.
6. Handle completion, cancellation, timeout, target removal, route
   invalidation, and unreachable approach through one idempotent cleanup path
   that releases task claim, facility slot, approach/waiting cells,
   reservations, queue ticket, and held prop facts as applicable.
7. Emit deterministic serializable transition facts with stable IDs and no
   duplicate release on repeated terminal input.
8. Add focused tests covering reach/use/complete, wait/acquire, cancel,
   timeout, unavailable/removed target, unreachable approach, preemption
   boundary, and exactly-once cleanup.

## In scope

- `packages/office-v2-simulation/src/activity-runtime.ts`
- `packages/office-v2-simulation/test/activity-runtime.test.ts`
- A small local test-model type/API needed to demonstrate one actor and one
  facility without changing world contracts.

## Out of scope

Multi-actor fairness/deadlock resolution, persistent snapshot/replay,
state-hash implementation, command-pipeline edits, public exports, package
manifests, schemas, generated contracts, renderer/presentation, operations,
connectors, assets, workflows, database code, and new dependencies.

## Read-only references and frozen interfaces

Read `interfaces.md`, `ACTORS_NAVIGATION_INTERACTIONS.md`,
`JOBS_INTENTS_ASSIGNMENT.md`, `CROWD_QUEUES_AND_DEADLOCKS.md`,
`SIMULATION_PIPELINE_COMMANDS.md`, Decision 0005, Decision 0012, the generated
activity/facility/action/reservation/queue contracts, RC-01/03 fixtures, and
the Phase 2 world package. Do not edit any of them.

## Validation and acceptance

Run:

- `node --test packages/office-v2-simulation/test/activity-runtime.test.ts`
- `npm run typecheck --workspace @affiliate-ops/office-v2-simulation`
- `node .agents/skills/build-office-v2-engine/scripts/preflight.mjs`
- `git diff --check`
- `npm run check` when the worktree is dependency-ready

The worker changed only the two implementation/test files and its own status
file. The status file must record the implementation commit, exact files,
commands/results, known limitations, and this handoff statement: “The Main
Orchestration Session must review and integrate this commit.” Commit the task
and stop immediately after handoff; do not integrate or publish.

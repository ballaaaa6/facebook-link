# Worker Session 3 Task Specification

- Session: 3
- Task ID: `P3-W2.6`
- Task name: Fixed-tick lifecycle port
- Parent Phase: Phase 3 — Headless operational vertical slice
- Wave ID: `P3-W2-02`
- Worker branch: `task/session-3-p3-w2-lifecycle`
- Worker worktree: `C:\Users\WINDOW XI\.codex\worktrees\phase3-w2-lifecycle`
- Original base commit: `925439a5f6f29580d82767e2177433a35195bc71`
- Planning commit: `2635abb87d014240fe4992b8120f99fde0431e7e`
- Status file: `docs/parallel-work/session-3-status.md`

## Objective

Implement an injected, renderer-free lifecycle port that controls explicit
logical tick pumping across mounted/visible/hidden/restoring/destroyed states,
caps catch-up, and cleans up subscriptions idempotently. This is one leaf
inside Phase 3; it is not the renderer lifecycle implementation or T4.

## Repository evidence and current behavior

- Decision 0005 fixes simulation time at ten logical ticks per second and keeps
  display frames outside simulation truth.
- The W2.6 policy caps visible catch-up at five logical ticks per pump and
  emits `simulation.lifecycle-catch-up-capped` for excess lag.
- The lifecycle fixture defines the five states, browser-style transitions,
  and zero-resource invariant after destroy.
- `packages/office-v2-simulation` has no lifecycle port; no browser globals or
  renderer implementation is admitted in this phase.

## Required final behavior

1. Provide a serializable/injected API in `src/lifecycle.ts` with states
   `mounted`, `visible`, `hidden`, `restoring`, and `destroyed`.
2. Provide idempotent mount/show/hide/pagehide/pageshow/bfcache/context and
   teardown/remount transitions matching the accepted lifecycle fixture.
3. Advance logical ticks only through an injected pump/advance callback while
   visible; hidden, restoring, and destroyed states must not silently advance
   simulation time.
4. Apply at most five accumulated logical ticks per visible pump. Return a
   deterministic `simulation.lifecycle-catch-up-capped` diagnostic/data record
   when more are pending, with no unbounded burst.
5. Support injected subscriptions/listeners/pollers/loads/resources and make
   teardown/destroy release every handle exactly once. Repeated mount/unmount
   and restore must not duplicate callbacks or loops.
6. Prove that different display-frame schedules reaching the same logical tick
   produce identical callback/tick results.
7. Add focused tests for every lifecycle state, pagehide/pageshow and bfcache
   restore, capped catch-up, repeated mount/unmount, idempotent teardown, and
   zero-resource cleanup after destroy.

## In scope

- `packages/office-v2-simulation/src/lifecycle.ts`
- `packages/office-v2-simulation/test/lifecycle.test.ts`
- A small injected port/resource model needed by the focused tests.

## Out of scope

Browser DOM APIs, React, renderer candidates, asset loading, operations
reconciliation, command-pipeline edits, public exports, package manifests,
schemas, generated contracts, external actions, and new dependencies.

## Read-only references and frozen interfaces

Read `interfaces.md`, `SIMULATION_TIME_RANDOMNESS_REPLAY.md`,
`SIMULATION_PIPELINE_COMMANDS.md`, `SAVE_SNAPSHOT_MIGRATION.md`, Decision 0005,
the lifecycle fixture/schema, the simulation contract fixture, and the
renderer lifecycle policy only as a contract reference. Keep this module
headless and presentation-neutral.

## Validation and acceptance

Run:

- `node --test packages/office-v2-simulation/test/lifecycle.test.ts`
- `npm run typecheck --workspace @affiliate-ops/office-v2-simulation`
- `node .agents/skills/build-office-v2-engine/scripts/preflight.mjs`
- `git diff --check`
- `npm run check` when the worktree is dependency-ready

The worker changed only the two implementation/test files and its own status
file. The status file must record the implementation commit, exact files,
commands/results, known limitations, and this handoff statement: “The Main
Orchestration Session must review and integrate this commit.” Commit the task
and stop immediately after handoff; do not integrate or publish.

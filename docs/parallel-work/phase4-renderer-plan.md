# Phase 4 Renderer Selection — Parallel Wave Plan

Status: **COMPLETE — Canvas 2D selected; Phase 5 not started**

Recorded: `2026-08-03` (Asia/Bangkok)

## Repository assessment

- Repository: `D:\antigravity\shopee link`
- Remote: `origin` -> `https://github.com/ballaaaa6/facebook-link.git`
- Verified primary: `main`, `origin/main`, and remote symbolic `HEAD`
- Primary commit at planning: `428f01bb0958a0ba15c82180015e7eeeab86c2ce`
- Integration branch: `codex/integration/phase4-renderer-selection`
- Initial status: clean; no local development server was started.
- Office V2 preflight: PASS.
- Existing worktrees and historical Phase 3 records are preserved; this wave
  uses new Phase 4-specific worktrees and coordination files.

## Selected active Phase

- Phase ID: **Phase 4**
- Phase name: **Renderer benchmark and selection**
- Parent milestone: M2 — Office Engine V2 foundation and first-floor path
- Objective: implement the shared presentation port, immutable snapshot/camera
  and semantic-picking boundary, identical Canvas 2D and PixiJS 8.19.0
  candidates, deterministic benchmark evidence, and T4 lifecycle,
  accessibility, responsive, and budget acceptance.
- Entry evidence: Phase 3 is complete at the verified integration base;
  `npm run office:v2:phase3:acceptance` passed 15/15 twice; Closure E owns the
  renderer-port, immutable presentation snapshot, benchmark, lifecycle,
  accessibility, golden, and property/model contracts; generated contracts and
  boundary checks pass.
- Status before execution: **NOT STARTED / INCOMPLETE**.

## Phase 4 exit criteria

1. The renderer port covers mount, immutable snapshot render, camera, semantic
   pick, resize, bundle load/unload/swap, visible missing-asset failure,
   deterministic capture, context recovery, teardown, and remount.
2. Canvas 2D and exactly PixiJS 8.19.0 render the same fixture-only geometric
   bundle, snapshots, camera, picking, viewport matrix, and lifecycle protocol.
3. The frozen actor profiles (1, 10, 15, 25, 50), viewports
   (1440x900, 1024x768, 390x844), warm-up (120), samples (300), repetitions
   (5), cold/warm runs, and required metrics are executed or fail closed.
4. Semantic DOM/keyboard/pointer parity, focus refresh/removal, non-color
   cues, reduced motion, forced colors, hidden/resume, remount cleanup, and
   context recovery pass with no leaked presentation resources.
5. The benchmark report records variance, environment, hashes, budgets, and a
   numeric winner. The losing renderer is removed from production dependencies
   and production code; its reproducible proof/report remains in Phase 4
   evidence.
6. Golden and property/model evidence is pinned and reproducible, and the
   selected renderer remains presentation-only: no world, simulation,
   operations, asset-admission, or browser-clock state crosses the boundary.

## Remaining leaf-task graph

```text
P4-W5.1 snapshot/camera/picking ─┐
                                ├─> P4-W5.3 Canvas candidate ─┐
P4-W5.2 port/lifecycle ─────────┘                            │
                                ├─> P4-W5.4 Pixi candidate ──┼─> P4-W5.5 benchmark/report
                                └─> P4-W5.6 semantic/QA lab ─┘             │
                                                                            ├─> P4-W5.7 property/model + golden
                                                                            └─> P4-EXIT-01 Main T4 closure
```

Graph rules:

- Edges mean integrated output is required; same-wave output never satisfies
  a dependency.
- `P4-W5.1` and `P4-W5.2` have no dependency on one another and have disjoint
  files, so they are the first READY frontier.
- `P4-W5.3` and `P4-W5.4` are independent only after both first-wave leaves
  are integrated. The Pixi dependency admission is Main-owned before that
  wave and is not invented by a worker.
- `P4-W5.5` and `P4-W5.6` share the integrated candidate base but own separate
  harness/UI files and may run together after both candidates are accepted.
- `P4-W5.7` consumes the completed benchmark/QA evidence and is one focused
  evidence task; Phase closure and renderer decision remain Main-owned.
- `P4-EXIT-01` is not a worker task. Main owns winner selection, loser removal,
  superseding decision, status publication, final validation, and push.

## First READY frontier and worker count

READY: `P4-W5.1`, `P4-W5.2`.

Actual worker count: **2**. Both tasks are one-objective leaves with exclusive
Web-feature file sets, stable generated contracts, focused tests, and no
same-wave dependency. No third valid Phase 4 leaf has a stable independent
write set before the shared presentation boundary exists; unused capacity is
intentional.

## Planning and integration strategy

Main first commits this plan, the frozen interfaces, ownership, task
specifications, public contract exports, and workspace links. Each worker then
starts from that exact planning commit in an isolated worktree, runs focused
checks, commits, and stops after handoff. Main reviews complete diffs and
acceptance evidence, integrates both commits, reruns the Phase 4 gates
available at that point, and recalculates the graph before the next wave.

The integration branch will be reconciled with remote `main` before final
publication. `main` remains unchanged and no pull request is claimed unless a
supported authenticated mechanism is available.

## Wave execution summary

- Wave `P4-W5-01`: two workers were dispatched for W5.1/W5.2; both initial
  sessions and both bounded replacement sessions stalled without commits. Main
  recovered the exact scopes in `8ab0cf5`.
- Wave `P4-W5-02`: two workers were dispatched for W5.3/W5.4; both sessions
  stalled without commits. Main recovered the exact candidate scopes in
  `ac9d883`.
- Wave `P4-W5-03`: two workers were dispatched for W5.5/W5.6; both sessions
  stalled without commits. Main recovered the evidence harness and QA lab in
  `ff435b6`, then added the admitted property/golden gates and QA evidence.
- Main-only W5.7 completed the 300-run benchmark, 1,000-run exploration
  profile, three pinned Canvas goldens, and four browser QA checks. P4-EXIT-01
  is Main-closed by the decision/readiness/final-report commit; the integration
  branch is the only publication target and `main` remains unchanged.

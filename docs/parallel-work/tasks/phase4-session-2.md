# Phase 4 Worker Task Specification — Session 2

- Task ID: `P4-W5.2`
- Title: Shared renderer port lifecycle and resource handles
- Phase: Phase 4 — Renderer benchmark and selection
- Wave: `P4-W5-01`
- Repository: `D:\antigravity\shopee link`
- Branch/worktree: assigned by Main before launch and recorded in the worker
  status handoff
- Integrated base: `428f01bb0958a0ba15c82180015e7eeeab86c2ce` plus the Phase 4
  planning commit
- Status file: `docs/parallel-work/phase4-session-2-status.md`

## Objective

Implement the shared presentation-only renderer port and lifecycle/resource
manager. It must provide the exact Closure E operation set, abortable and
reference-counted bundle handles, visible fail-closed missing-asset behavior,
context recovery, and zero-resource teardown/remount semantics without owning
world, simulation, operations, or asset-admission state.

## Read-only evidence and interfaces

- `docs/office-v2/RENDERER_QA_SPECIFICATION.md`
- `docs/office-v2/schemas/renderer-port.schema.json`
- `docs/office-v2/schemas/lifecycle-fixture.schema.json`
- `docs/office-v2/fixtures/renderer-qa-contracts-v1.json`
- `docs/parallel-work/phase4-renderer-interfaces.md`
- generated renderer-port, presentation-snapshot, and lifecycle fixture types

## In scope

- typed renderer port interfaces and a renderer-agnostic lifecycle/resource
  state machine under the Web Office V2 renderer directory;
- mount/render/set-camera/pick/resize/load/unload/swap/missing-asset/capture/
  context-loss/teardown/remount operation contracts;
- idempotent abortable reference-counted load handles and deterministic
  diagnostics/resource snapshots;
- focused tests covering every lifecycle fixture event, duplicate teardown,
  remount, pending-load settlement, missing-asset inspector independence,
  context recovery, and zero-resource invariants;
- own status handoff with exact commands, evidence, and limitations.

## Out of scope

Snapshot/camera/picking implementation files, Canvas/Pixi drawing, React page
composition, schemas/generated files, production assets, simulation/world/
operations producers, benchmark execution, accessibility UI, package manifests,
lockfiles, backlog or final reports.

## Acceptance and validation

- The public operation set matches `office-renderer-port-v1` exactly.
- All public operations are presentation-only and do not mutate a supplied
  snapshot or expose a renderer object through the snapshot.
- Teardown settles pending loads and leaves a structured missing-asset state;
  repeated teardown/remount is safe and deterministic.
- `npm run --workspace @affiliate-ops/web typecheck`
- focused test command for the owned renderer-port test
- `git diff --check`
- `node .agents/skills/build-office-v2-engine/scripts/preflight.mjs`

Commit the owned files, leave the worktree clean, provide a structured handoff,
and stop. Do not integrate or begin a downstream candidate task.

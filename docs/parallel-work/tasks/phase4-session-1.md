# Phase 4 Worker Task Specification — Session 1

- Task ID: `P4-W5.1`
- Title: Immutable presentation snapshot, camera, and semantic picking
- Phase: Phase 4 — Renderer benchmark and selection
- Wave: `P4-W5-01`
- Repository: `D:\antigravity\shopee link`
- Branch/worktree: assigned by Main before launch and recorded in the worker
  status handoff
- Integrated base: `428f01bb0958a0ba15c82180015e7eeeab86c2ce` plus the Phase 4
  planning commit
- Status file: `docs/parallel-work/phase4-session-1-status.md`

## Objective

Build the renderer-neutral presentation snapshot, bounded camera transforms,
and deterministic semantic picking helpers inside the Web presentation
boundary. This leaf must be independently useful to both Canvas and Pixi
candidates without importing a renderer or mutating world/simulation truth.

## Read-only evidence and interfaces

- `docs/office-v2/RENDERER_QA_SPECIFICATION.md`
- `docs/office-v2/WORLD_COORDINATES_PROJECTION_CAMERA.md`
- `docs/office-v2/RENDERING_DEPTH_OCCLUSION.md`
- `docs/office-v2/INPUT_PICKING_AND_DEBUG_OVERLAYS.md`
- `docs/office-v2/fixtures/renderer-qa-contracts-v1.json`
- `docs/parallel-work/phase4-renderer-interfaces.md`
- generated presentation snapshot, common V2, and world projection/depth types

## In scope

- immutable/deep-frozen snapshot construction/validation with explicit
  rejection of renderer/DOM/browser-clock/mutable-state fields;
- deterministic camera clamp, fit-to-world, projection, inverse ground-pick,
  bounded zoom, viewport, and floor focus helpers;
- semantic picking that resolves stable entity IDs from snapshot-derived
  projected contacts using the documented depth/ID tie rules;
- focused tests for input immutability, snapshot forbidden-state rejection,
  camera determinism/viewport cases, edge picking, stable tie selection, and
  no mutation or simulation command side effect;
- own status handoff with exact commands, evidence, and limitations.

## Out of scope

Renderer drawing, port lifecycle, Canvas/Pixi dependencies, React page
composition, schemas/generated files, production assets, simulation/world
producers, benchmark execution, accessibility UI, package manifests, lockfiles,
backlog or final reports.

## Acceptance and validation

- Helpers use `office-projection-v1` through the world package; no duplicate
  projection formula is authored in the Web feature.
- The result is deterministic for equal input and independent of array
  insertion order where the contract declares order irrelevant.
- `npm run --workspace @affiliate-ops/web typecheck`
- focused test command for the owned renderer-presentation test
- `git diff --check`
- `node .agents/skills/build-office-v2-engine/scripts/preflight.mjs`

Commit the owned files, leave the worktree clean, provide a structured handoff,
and stop. Do not integrate or begin a downstream candidate task.

# Phase 4 Worker Task Specification — Session 4

- Task ID: `P4-W5.4`
- Title: PixiJS 8.19.0 renderer candidate
- Phase: Phase 4 — Renderer benchmark and selection
- Wave: `P4-W5-02`
- Repository: `D:\antigravity\shopee link`
- Branch/worktree: assigned by Main before launch and recorded in the worker
  status handoff
- Integrated base: `6f8a0ec` (`feat(office-v2): freeze shared synthetic renderer scene`)
- Status file: `docs/parallel-work/phase4-session-4-status.md`

## Objective

Implement the PixiJS candidate behind the frozen `RendererBackend` port using
the already Main-admitted exact dependency `pixi.js@8.19.0`. It must consume
the same immutable snapshot, camera, and renderer-neutral synthetic scene as
Canvas without importing world, simulation, operations, or asset-admission
producers. Its geometric output must be directly comparable with Canvas at the
same camera and viewport.

## Read-only evidence and interfaces

- `docs/office-v2/RENDERER_QA_SPECIFICATION.md`
- `docs/office-v2/RENDERING_DEPTH_OCCLUSION.md`
- `docs/parallel-work/phase4-renderer-interfaces.md`
- `apps/web/src/features/office-v2/renderer/renderer-port.ts`
- `apps/web/src/features/office-v2/renderer/candidate-scene.ts`
- `docs/office-v2/fixtures/lab/renderer-benchmark-bundle-v1.json`
- PixiJS 8.19.0 package and license admission in
  `docs/office-v2/DEPENDENCY_LEDGER.md`

## In scope

- a `RendererBackend` factory using the real PixiJS 8.19.0 `Application` and
  presentation display objects;
- deterministic floor/entity drawing from the shared synthetic scene,
  resize, capture, missing-asset overlay, context recovery, and teardown;
- semantic picking delegated to the shared immutable snapshot/camera helper;
- focused tests for backend revision, scene consumption, deterministic capture
  shape, idempotent cleanup, and no producer-state ownership;
- own status handoff with exact commands, evidence, and limitations.

## Out of scope

Canvas code, shared renderer/camera/scene/port changes, React page composition,
benchmark reports or winner selection, accessibility lab, schemas/generated
files, package manifests/lockfiles, production assets, and world/simulation/
operations producers.

## Acceptance and validation

- Imports only the exact admitted `pixi.js@8.19.0`; no second renderer or
  unpinned dependency is introduced.
- Uses the shared `office-projection-v1` camera and synthetic scene; no second
  projection formula or browser-clock animation is authored.
- Implements the backend contract without exposing mutable renderer state in a
  presentation snapshot.
- `npm run --workspace @affiliate-ops/web typecheck`
- focused Pixi test command;
- `git diff --check`;
- `node .agents/skills/build-office-v2-engine/scripts/preflight.mjs`.

Commit only the owned files, leave the worktree clean, provide a structured
handoff, and stop. Do not integrate or begin W5.5/W5.6.

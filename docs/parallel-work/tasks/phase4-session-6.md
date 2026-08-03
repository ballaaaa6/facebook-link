# Phase 4 Worker Task Specification — Session 6

- Task ID: `P4-W5.6`
- Title: Semantic DOM, responsive, and lifecycle QA lab
- Phase: Phase 4 — Renderer benchmark and selection
- Wave: `P4-W5-03`
- Repository: `D:\antigravity\shopee link`
- Branch/worktree: assigned by Main before launch and recorded in the worker
  status handoff
- Integrated base: `df3e438` (`docs(office-v2): record Phase 4 candidate recovery`)
- Status file: `docs/parallel-work/phase4-session-6-status.md`

## Objective

Turn the existing development lab into a browser-verifiable Office V2
renderer surface. It must mount either candidate by query, render the same
fixture-only snapshot, expose a semantic DOM list/inspector with keyboard and
pointer parity, and exercise responsive resize, hidden/resume, remount, and
context-recovery cleanup without leaking presentation resources.

## Read-only evidence and interfaces

- `docs/office-v2/RENDERER_QA_SPECIFICATION.md`
- `docs/office-v2/INPUT_PICKING_AND_DEBUG_OVERLAYS.md`
- `docs/office-v2/fixtures/renderer-qa-contracts-v1.json`
- integrated renderer port, snapshot, camera, scene, Canvas, and Pixi code
- `apps/web/src/main.tsx` development lab query contract (`lab=office-engine-v2`)

## In scope

- `OfficeEngineV2LabPage` browser composition with candidate selection,
  deterministic fixture actor profiles, semantic DOM/listbox/inspector,
  keyboard traversal and pointer picking parity, non-color state cues, and
  reduced-motion/forced-color-friendly styles;
- responsive viewport controls and lifecycle buttons/events used by QA;
- focused component/contract tests and own status handoff.

## Out of scope

Benchmark collector/script and generated report/artifacts, candidate/shared
renderer changes, package manifests/lockfiles, final winner/decision/readiness
closure, schemas/generated files, production assets, and world/simulation/
operations producers.

## Acceptance and validation

- The page remains a development-only lab and does not admit synthetic assets
  into runtime manifests.
- Semantic identity/label/state/freshness is available without visual color;
  focus remains stable across refresh/removal and pointer/keyboard selection
  reaches the same inspector.
- `npm run --workspace @affiliate-ops/web typecheck`;
- focused lab tests;
- `git diff --check`;
- `node .agents/skills/build-office-v2-engine/scripts/preflight.mjs`.

Commit only the owned files, leave the worktree clean, provide a structured
handoff, and stop. Do not integrate or begin W5.7.

# Phase 4 Worker Task Specification — Session 5

- Task ID: `P4-W5.5`
- Title: Deterministic renderer benchmark harness and collector
- Phase: Phase 4 — Renderer benchmark and selection
- Wave: `P4-W5-03`
- Repository: `D:\antigravity\shopee link`
- Branch/worktree: assigned by Main before launch and recorded in the worker
  status handoff
- Integrated base: `df3e438` (`docs(office-v2): record Phase 4 candidate recovery`)
- Status file: `docs/parallel-work/phase4-session-5-status.md`

## Objective

Implement the renderer-neutral benchmark protocol and collector for the two
integrated candidates. The harness must pin the actor profiles, viewport
matrix, 120-frame warmup, 300 samples, five cold/warm repetitions, required
metrics, variance policy, source revision, and scene/snapshot/bundle hashes.
It must fail closed on incomplete runs and must not select a winner.

## Read-only evidence and interfaces

- `docs/office-v2/RENDERER_QA_SPECIFICATION.md`
- `docs/office-v2/fixtures/renderer-qa-contracts-v1.json`
- `docs/office-v2/fixtures/lab/renderer-benchmark-bundle-v1.json`
- `docs/office-v2/schemas/renderer-benchmark.schema.json`
- `docs/parallel-work/phase4-renderer-interfaces.md`
- integrated Canvas/Pixi candidate backends and shared synthetic scene

## In scope

- a typed benchmark protocol/collector under the Web renderer boundary;
- deterministic sample planning, p50/p95/variance helpers, invalid-run
  diagnostics, and required metric coverage;
- a Playwright-based Node collector that can consume a later QA-lab endpoint
  without embedding a second renderer or rewriting goldens;
- focused protocol/collector tests and own status handoff.

## Out of scope

Candidate implementation changes, QA page/CSS, final generated benchmark
report/artifacts, winner selection, dependency removal, decision/readiness
closure, schemas/generated files, package manifests/lockfiles, production
assets, and world/simulation/operations producers.

## Acceptance and validation

- Candidate set is exactly `canvas-2d` and `pixijs-8.19.0`.
- Protocol constants exactly match Closure E; incomplete samples are excluded
  with stable diagnostics and no winner is emitted.
- `npm run --workspace @affiliate-ops/web typecheck`;
- focused benchmark tests;
- `git diff --check`;
- `node .agents/skills/build-office-v2-engine/scripts/preflight.mjs`.

Commit only the owned files, leave the worktree clean, provide a structured
handoff, and stop. Do not integrate or begin W5.7.

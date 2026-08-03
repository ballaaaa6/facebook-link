# Phase 4 Final Integration Report — Renderer Selection and T4 Closure

- Repository: `D:\antigravity\shopee link`
- Active phase: **Phase 4 — Renderer benchmark and selection**
- Phase result: **COMPLETE — Canvas 2D selected**
- Next phase: **Phase 5 asset factory not started**
- Integration branch: `codex/integration/phase4-renderer-selection`
- Remote: `origin` (`https://github.com/ballaaaa6/facebook-link.git`)
- Primary at entry and throughout: `main` remained at
  `428f01bb0958a0ba15c82180015e7eeeab86c2ce`; `origin/main` was unchanged.

## Backlog and dependency graph

The active DAG was:

```text
W5.1 snapshot/camera/picking ─┐
                              ├─> W5.3 Canvas ─┐
W5.2 port/lifecycle ──────────┘                ├─> W5.5 benchmark ─┐
                              ├─> W5.4 Pixi ──┘                    ├─> W5.7 evidence ─> P4-EXIT-01
                              └─> W5.6 semantic/QA ────────────────┘
```

W5.1/W5.2 were the first READY frontier; W5.3/W5.4 became READY only after
their shared boundary integrated; W5.5/W5.6 ran together after both candidates;
W5.7 and final selection stayed Main-only. No Phase 5 task was opened.

## Worker assignments and handoffs

Each wave used two isolated worktrees, never more than the permitted three.

- W5.1: Curie `019fc52a-65b6-7bb0-8da3-a83e6af43b71`, replacement Sartre
  `019fc52e-e3a3-7c62-8ecf-e41e57d63a14` — stalled; no commit accepted.
- W5.2: Copernicus `019fc52a-6687-7031-b8e2-fc41a23eae37`, replacement Carson
  `019fc52e-e423-74f3-9c0e-10f647ebf0ef` — stalled; no commit accepted.
- W5.3: Leibniz `019fc53b-eb97-7823-a35e-fa36dcb2c806` — stalled; no commit
  accepted.
- W5.4: Ampere `019fc53b-ec1c-72f2-a339-4d150b934205` — stalled; no commit
  accepted.
- W5.5: Feynman `019fc543-97f4-7593-a957-f1f800f136c0` — stalled; no commit
  accepted.
- W5.6: Franklin `019fc543-9879-7431-bc0f-acc83d432158` — stalled; no commit
  accepted.

Main preserved the clean worker worktrees and recovered each exact owned scope;
no worker branch was cherry-picked and no worker integrated or pushed.

## Main integration commits

- `cce45a0` — Phase 4 planning base and contracts.
- `5bcd070` — exact PixiJS/Playwright evidence-tool admission.
- `8ab0cf5` — recovered shared snapshot/camera/picking and renderer port.
- `6f8a0ec` — frozen shared synthetic renderer scene.
- `ac9d883` — recovered Canvas/Pixi candidate adapters.
- `ff435b6` — recovered benchmark harness and semantic/lifecycle lab.
- `b7dda14` — admitted fast-check and added property/golden gates.
- `f1778ae` — corrected deterministic evidence hashes to unsigned 64-hex output.
- `c066f44` — added executable browser QA evidence recording.

The source-pinned renderer evidence revision is
`f1778ae81034920b89de766423ce086629a65103`; later commits only add closure
documentation and static/evidence validation wiring.

## Selection evidence

The generated benchmark report records 300/300 valid runs and 0 invalid runs:

- Canvas 2D: mean render/tick p95 **0.2429 ms**, maximum **0.5 ms**; context
  recovery p95 mean **0.1553 ms**; remount/cleanup p95 mean **1.596 ms**.
- PixiJS 8.19.0: mean render/tick p95 **1.2389 ms**, maximum **3.805 ms**;
  context recovery p95 mean **253.5733 ms**; remount/cleanup p95 mean
  **34.8353 ms**.

Both candidates received the same immutable snapshot, synthetic scene, camera,
viewport matrix, semantic-picking path, lifecycle operations, and fixture-only
bundle. Canvas 2D wins the numeric and lifecycle rule and is recorded in
[Decision 0016](../office-v2/decisions/0016-canvas-2d-renderer-selection.md).
PixiJS remains only as development-lab proof; the production build was checked
to contain no Pixi reference.

## T4 evidence artifacts

- [benchmark evidence](../../artifacts/office-v2/phase4/renderer-benchmark-evidence.json)
  — protocol, 300 runs, summaries, diagnostics, hashes, and `winner: null` at
  collector level;
- [browser QA evidence](../../artifacts/office-v2/phase4/renderer-qa-evidence.json)
  — four passing candidate/viewport checks;
- [golden evidence](../../artifacts/office-v2/phase4/renderer-golden-evidence.json)
  — three pinned Canvas manifests and captures;
- [property/model evidence](../../artifacts/office-v2/phase4/property-model-evidence.json)
  — seed `20260801`, 100 CI runs, 1,000 exploration runs;
- [Phase 4 QA specification](../office-v2/RENDERER_QA_SPECIFICATION.md),
  [readiness matrix](../office-v2/READINESS_MATRIX.md), and
  [dependency ledger](../office-v2/DEPENDENCY_LEDGER.md).

## Validation

`npm run check` passes after adding the Phase 4 model, golden, and QA static
checks. This includes repository structure, clean-room, package boundaries,
contradictions, generated contracts, knowledge, world evidence, assets,
architecture, code health, duplicate detection, all workspace typechecks and
tests, the seeded model CI suite, golden validation, QA validation, and the
production build. The independent exploration profile and the full browser
benchmark were also run explicitly and passed.

The local development server at `127.0.0.1:4173` was reused during browser QA;
it was started only for this task and is stopped during final cleanup. Codex
runtime processes and worker worktrees are not terminated by project cleanup.

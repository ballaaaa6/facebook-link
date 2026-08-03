# Phase 4 Session 7 Status — Property, Golden, and T4 Evidence

- Task: `P4-W5.7`
- Owner: **Main Orchestration Session; no worker dispatched**
- Status: **COMPLETED — evidence accepted; P4-EXIT-01 closure follows**
- Source-pinned evidence revision: `f1778ae81034920b89de766423ce086629a65103`

## Evidence completed

- `fast-check` 4.9.0 was admitted with exact lockfile integrity and ledger
  record in `b7dda14`.
- Independent depth/semantic-picking and lifecycle models pass the pinned seed
  `20260801` at 100 CI runs and 1,000 exploration runs.
- Three Canvas 2D golden manifests/captures cover 1440x900, 1024x768, and
  390x844 with the no-rewrite policy; the static validator passes.
- The QA artifact records Canvas/Pixi desktop/phone parity, hidden/resume,
  context recovery, remount cleanup, focus fallback, forced colors, reduced
  motion, and zero page-level horizontal overflow.
- The benchmark report records 300/300 valid runs and leaves collector winner
  null until this Main-owned decision.

## Main decision input

Canvas 2D wins the recorded selection rule: it has lower render/tick p95 across
the matrix and materially lower context-recovery/remount latency, while all
semantic, lifecycle, accessibility, responsive, golden, and property/model
checks pass. Pixi remains only as retained development-lab proof until the
closure docs are committed; it is absent from the production build.

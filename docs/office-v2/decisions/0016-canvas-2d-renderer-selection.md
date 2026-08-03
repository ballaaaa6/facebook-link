# Decision 0016 — Canvas 2D Renderer Selection

- Status: **Accepted**
- Date: `2026-08-03`
- Owner: Main Orchestration Session
- Supersedes: `decisions/0002-renderer.md` for the Phase 4 candidate decision
- Scope: synthetic Office V2 presentation boundary and T4 renderer selection

## Context

Decision 0002 deliberately deferred Canvas 2D versus PixiJS selection until
both candidates executed the same renderer-neutral snapshot, camera, scene,
semantic-picking, viewport, and lifecycle protocol. Phase 4 implemented that
boundary without changing world, simulation, operations, asset admission, or
browser-clock ownership.

## Evidence

The source-pinned evidence revision is
`f1778ae81034920b89de766423ce086629a65103`. The exact protocol is recorded as
`office-renderer-benchmark-v1`:

- candidates: Canvas 2D and PixiJS 8.19.0;
- actor profiles: 1, 10, 15, 25, and 50;
- viewports: 1440x900, 1024x768, and 390x844;
- cold and warm runs, five repetitions, 120 warmup frames, and 300 measured
  samples per descriptor;
- Chromium 151.0.7922.34, DPR 1, reduced-motion benchmark environment, and
  fixture bundle SHA-256 recorded in the report;
- 300/300 runs valid, 0 invalid, with variance and all required metric families
  retained in `artifacts/office-v2/phase4/renderer-benchmark-evidence.json`.

Across the matrix, Canvas 2D measured mean render/tick p95 of 0.2429 ms
(maximum 0.5 ms), context-recovery p95 mean of 0.1553 ms, and remount/cleanup
p95 mean of 1.596 ms. PixiJS 8.19.0 measured mean render/tick p95 of 1.2389 ms
(maximum 3.805 ms), context-recovery p95 mean of 253.5733 ms, and
remount/cleanup p95 mean of 34.8353 ms. Both candidates passed the semantic and
lifecycle QA artifact; the numeric and lifecycle comparison therefore selects
Canvas 2D.

Independent evidence also passes: the seeded depth/semantic-picking and
lifecycle models pass 100 CI runs and 1,000 exploration runs; three Canvas
golden manifests/captures pass the no-rewrite validator; and four browser QA
checks pass keyboard/pointer parity, focus fallback, responsive overflow,
forced colors, reduced motion, hidden/resume, context recovery, and remount.

## Decision

Select **Canvas 2D** as the Office V2 presentation renderer for the current
synthetic T4 boundary. It is the zero-library baseline and is now the only
renderer selected by the numeric and lifecycle evidence.

PixiJS 8.19.0 is not a production dependency or production bundle reference.
It remains only as a development-only benchmark/QA candidate and its evidence
report remains under `artifacts/office-v2/phase4/` for auditability. The
production build was checked to contain no Pixi reference. Removing the
development proof candidate later is a separate cleanup and does not alter the
accepted Canvas decision.

## Consequences and boundaries

- The selected renderer consumes immutable presentation snapshots and camera
  state through the exact 13-operation renderer port.
- Renderer resources, DOM/canvas objects, and lifecycle handles stay inside the
  presentation feature; world and simulation truth remains external.
- Synthetic geometric fixtures are test-only and do not admit runtime assets or
  production catalogs.
- Phase 5 asset-factory implementation, runtime asset admission, and full
  first-floor visual acceptance remain unopened.
- A future renderer change requires a new benchmark protocol/report and a new
  superseding decision; this evidence is not silently reused.

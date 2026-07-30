# Pilot Device and Performance Matrix

## Required environments

| Class | Viewport | Purpose |
| --- | --- | --- |
| Pilot desktop | 1440x900 | Primary acceptance and 60 fps renderer target |
| Compact desktop/tablet | 1024x768 | Layout, camera fit, and interaction density |
| Phone | 390x844 | Semantic parity, inspector access, and bounded camera |

The pilot desktop hardware and browser build are recorded with the Phase 3
benchmark. Visual baselines are generated and compared in the same controlled
environment.

## Measured budgets

Before choosing a renderer, record the baseline for 1, 10, 25, and 50 actors and
for small and target-sized rooms:

- simulation tick p50 and p95;
- render frame p50 and p95;
- draw calls and visible sprite count;
- decoded texture and GPU memory estimate;
- JavaScript bundle contribution;
- initial asset load and first interactive time;
- pointer-picking and inspector response time.

The simulation remains correct below 60 display frames per second. A performance
optimization cannot weaken deterministic ordering, asset validation,
accessibility, or operations safety.

## Promotion rule

Budgets become numeric in `decisions/0002-renderer.md` after the geometric
benchmark. A regression requires evidence and an approved decision, not a silent
threshold increase.

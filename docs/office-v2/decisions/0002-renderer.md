# Decision 0002 — Renderer Behind a Port and Benchmark Gate

- Status: accepted
- Date: 2026-07-31
- Owners: presentation and web

## Context

The engine is embedded in an existing React/Vite control panel. A renderer
choice must not leak into world or simulation contracts, and installing a large
rendering dependency before measuring the slice would make removal expensive.

## Options considered

- Canvas 2D: minimal bundle and complete control, with manual batching,
  interaction, accessibility overlay, and resource management.
- PixiJS 8: maintained scene graph, WebGL/WebGPU/Canvas backends, asset loading,
  events, render layers, and accessibility support, with additional bundle and
  lifecycle cost.

## Decision

Define a renderer port and keep production free of either dependency until
Phase 3. Benchmark Canvas 2D against exactly PixiJS 8.19.0 using the same
geometric snapshot, camera, picking, depth bands, viewport matrix, and cleanup
tests. Record numeric budgets and select one implementation by updating this
record with a superseding decision.

Until then, renderer status is deliberately deferred, not unresolved. React
owns the mount and accessible inspector; no React component owns simulation.

## Consequences

Phase 1 and Phase 2 remain headless. Renderer-specific agent skills are not
installed before the benchmark. The losing proof is removed without changing
world, simulation, projection, fixtures, or adapter contracts.

## Evidence

`PILOT_DEVICE_AND_PERFORMANCE_MATRIX.md`, Phase 3 benchmark results, responsive
captures, bundle analysis, and lifecycle tests.

# Phase 4 Renderer Frozen Interfaces

This document is a coordination reference. Canonical behavior remains owned by
the Office V2 renderer QA specification and generated contracts.

## Presentation snapshot

- Input is one `office-presentation-snapshot-v1` value from
  `@affiliate-ops/office-v2-contracts`.
- The snapshot contains derived identity, floor-local transform, semantic
  state, render-part references, labels, selection/focus, freshness, tick, and
  world hash only.
- It contains no reducer methods, mutable simulation state, operational
  payload, texture, DOM node, renderer object, or browser clock.
- Snapshot construction and camera/picking helpers are deterministic and do
  not mutate their inputs.

## Camera and picking

- Camera state owns explicit building/floor focus, bounded zoom, viewport, and
  floor-local bounds. It uses `office-projection-v1` and delegates projection
  mathematics to `@affiliate-ops/office-v2-world`.
- Pointer coordinates are inverse-camera transformed, ground-picked, and
  resolved by registered semantic hit radius, depth, and stable entity ID.
- Picking returns an inspect result/intent only. It never issues a simulation
  command or changes operational truth.

## Renderer port

- The port operation set is exactly the generated Closure E set:
  `mount`, `renderSnapshot`, `setCamera`, `pickSemantic`, `resize`,
  `loadBundle`, `unloadBundle`, `swapBundle`, `showMissingAsset`,
  `captureDeterministic`, `handleContextLoss`, `teardown`, and `remount`.
- Every operation is presentation-only and idempotent at the public boundary.
- Bundle loads are abortable; handles are idempotent and reference-counted;
  teardown settles pending loads and leaves the inspector usable after a
  missing-asset failure.
- Context recovery recreates presentation resources without changing the
  supplied snapshot/world hash.

## Candidate and evidence boundary

- Canvas 2D and PixiJS 8.19.0 receive the same frozen snapshot, camera,
  fixture-only synthetic bundle, and lifecycle protocol.
- Candidate-specific drawing code may own only presentation resources. World,
  simulation, operations, and asset admission remain external inputs.
- Benchmark reports retain scene/snapshot/bundle hashes, source revision,
  environment, metric samples, variance, and invalid-run diagnostics.
- No test-only synthetic bundle may enter `assets/office-v2/manifests/` or
  `assets/office-v2/runtime/`.

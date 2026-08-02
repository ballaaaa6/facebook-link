# Renderer and QA Specification Closure E

## Purpose and ownership

This document owns the W1.6 Closure E specification for presentation and QA.
It defines renderer-neutral data contracts and harness boundaries; it does not
implement a renderer, choose Canvas 2D or PixiJS, admit assets, or claim
benchmark, browser, accessibility, lifecycle, visual, property, or model
evidence. The owning runtime boundary remains
`apps/web/src/features/office-v2`.

Decision 0002 remains accepted and deliberately deferred. The Phase 4
experiment must compare Canvas 2D with exactly PixiJS 8.19.0 using the same
geometric scene, immutable snapshot, camera, semantic picking, viewport matrix,
and cleanup protocol before any winner is recorded.

## Versioned contracts

| Contract | Version and owner | Valid evidence | Rejected evidence and stable diagnostic | Migration/rejection effect |
| --- | --- | --- | --- | --- |
| Renderer port | `office-renderer-port-v1`, presentation | `renderer-qa-contracts-v1.json#renderer-port` | Missing required lifecycle operation: `presentation.renderer-port-contract-invalid` | A different operation set requires a new port version; old descriptors reject before mount. |
| Presentation snapshot | `office-presentation-snapshot-v1`, presentation | `#presentation-snapshot` | Renderer object, DOM node, mutable method, or browser clock: `presentation.snapshot-owned-state-forbidden` | Snapshot revisions are fail-closed; a migration must produce a new immutable snapshot and hash. |
| Benchmark protocol | `office-renderer-benchmark-v1`, presentation/QA | `#benchmark-protocol` | Candidate/winner or unfrozen sample plan: `presentation.benchmark-protocol-invalid` | Protocol changes require a new protocol version and a new report; no prior result is reused. |
| Accessibility fixture | `office-accessibility-fixture-v1`, presentation/QA | `#accessibility` | Missing semantic parity or focus fallback case: `presentation.accessibility-coverage-incomplete` | Fixture revisions add cases or version; omissions block the acceptance run. |
| Lifecycle fixture | `office-renderer-lifecycle-v1`, presentation/QA | `#lifecycle` | Duplicate resource or pending load after teardown: `presentation.lifecycle-cleanup-incomplete` | Lifecycle changes require a new fixture version; the old harness remains immutable. |
| Golden manifest | `office-golden-manifest-v1`, presentation/QA | `#golden-manifest` | Missing environment pin or rewrite-on-check policy: `presentation.golden-manifest-invalid` | A changed environment or threshold creates a new manifest; normal checks never rewrite goldens. |
| Property/model profile | `office-property-model-profile-v1`, QA | `#property-model-profile` | Unadmitted executable dependency or missing independent model: `presentation.property-model-profile-invalid` | The pinned profile remains specification-only until dependency admission and a later gate. |
| Synthetic benchmark bundle | `office-renderer-benchmark-bundle-v1`, presentation/QA | `fixtures/lab/renderer-benchmark-bundle-v1.json` | Production/runtime admission path: `presentation.synthetic-bundle-fixture-only` | The bundle is rejected outside fixture/lab roots and never enters a catalog or runtime manifest. |

All diagnostics above are presentation-owned because they describe the
presentation contract or harness. Adapter, simulation, world, and asset
diagnostics retain their original owner and are not converted into
`presentation.*` errors.

## Renderer port

The port is a presentation-only capability boundary with these operations:

`mount`, `renderSnapshot`, `setCamera`, `pickSemantic`, `resize`, `loadBundle`,
`unloadBundle`, `swapBundle`, `showMissingAsset`, `captureDeterministic`,
`handleContextLoss`, `teardown`, and `remount`.

`renderSnapshot` accepts one immutable `office-presentation-snapshot-v1`.
World, simulation, operations, and asset admission state are supplied by their
owners and are never held or mutated by a renderer implementation. Bundle loads
are abortable; load and unload handles are idempotent and reference-counted.
Teardown settles every pending load, removes all presentation-owned resources,
and leaves the semantic inspector available when a bundle fails. Context
recovery recreates renderer resources without changing the simulation hash.

## Immutable presentation snapshot

The snapshot contains only derived world/entity identity, floor-local
transform, semantic state, exact render-part references, human-readable label,
selection/focus state, and freshness. It contains no reducer methods, textures,
DOM nodes, browser clocks, renderer objects, mutable simulation state, or
operations payloads. Keyboard order is semantic and independent of visual depth.

## Benchmark protocol

The protocol is frozen before measurement:

- candidates: `canvas-2d` and `pixijs-8.19.0` only;
- actor profiles: 1, 10, 15, 25, and 50;
- viewports: 1440x900, 1024x768, and 390x844;
- identical geometric/test-only scene, bundle, camera, and immutable snapshot;
- warm-up 120 frames, 300 measured samples, 5 repetitions per cold and warm run;
- retain scene, snapshot, and bundle hashes with the tested source revision;
- report p50/p95 tick and render time, draw calls, visible sprites,
  decoded/GPU-memory estimates, bundle/load/first-interactive timing, picking
  and inspector latency, resize/hidden/resume, remount/cleanup, and context
  recovery;
- variance is reported, never hidden; invalid or incomplete runs are excluded
  with a diagnostic and cannot be used to select a winner;
- winner rule is deferred until valid numeric evidence, lifecycle acceptance,
  and semantic DOM parity all pass. This closure records no winner.

The synthetic bundle is geometric and test-only. It belongs under fixture/lab
roots and is forbidden from `assets/office-v2/manifests/`,
`assets/office-v2/runtime/`, production catalogs, and runtime admission.

## Accessibility contract and fixtures

The shared semantic DOM entity list/tree is the accessible source for entity
identity, label, state, and inspection. Pointer selection and keyboard
selection expose the same semantic inspector. Keyboard traversal follows
stable semantic order, not screen depth. Selection remains focused across a
snapshot refresh when its entity remains; when removed, focus moves to the next
stable entity or the list root.

Fixtures cover 1, 10, and 15 actors; all six operational states (`working`,
`waiting`, `review`, `blocked`, `unavailable`, `idle`); stale, disabled, and
removed actors; long labels; pointer/keyboard parity; non-color cues; reduced
motion; forced colors; target viewports; and refresh/removal focus behavior.

## Lifecycle contract and fixtures

The injected lifecycle state set is `mounted`, `visible`, `hidden`,
`restoring`, and `destroyed`. Fixtures cover `pagehide`/`pageshow`, bfcache
restore, unmount during an abortable bundle load, repeated remount, hidden and
resume, bundle swap, and WebGL context recovery. After teardown or destroy,
there are zero animation frames, timers, listeners, pollers, subscriptions,
intents, resource handles, or pending loads. Recovery renders the latest
snapshot and preserves its simulation hash.

## Goldens and property/model profile

The golden manifest pins browser, fonts and hashes, viewport, camera, tick,
seed, animation time, world and snapshot hashes, projection/style profile,
test family/atlas/catalog/bundle, renderer revision, OS image, locale, DPR,
font hashes, forced-color and reduced-motion preferences, threshold, reviewer,
and update policy. Geometry assertions are separate from screenshot comparison;
normal checks never rewrite goldens.

The property/model profile pins fast-check 4.9.0, MIT license,
`xorshift128plus`, CI seed `20260801`, 100 CI runs, 1000 exploration runs,
shrink-path retention, counterexample promotion, and independent depth,
picking, and lifecycle models. It is a profile only: fast-check is not
installed or admitted and this closure claims zero property/model evidence.

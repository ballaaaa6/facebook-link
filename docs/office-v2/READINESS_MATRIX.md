# Office V2 Readiness Matrix

This matrix is the release authority for starting or expanding engine work. A
topic is ready only when its decision, contract, examples, automated evidence,
and migration rule all exist. Prose alone never marks a row ready.

| Topic | Decision | Contract | Fixtures | Automated evidence | Status |
| --- | --- | --- | --- | --- | --- |
| Projection and grid | `decisions/0001-projection-grid.md` | `schemas/world.schema.json` | `projection-roundtrip.json` | knowledge gate and Phase 1 property tests | Ready for Phase 1 |
| Renderer boundary | `decisions/0002-renderer.md` | renderer port in Phase 3 | geometric benchmark scene | Phase 3 benchmark | Intentionally deferred |
| Map authoring | `decisions/0003-map-authoring.md` | world and structure schemas | minimal office and structure fixtures | schema gate | Ready for Phase 1 |
| Navigation | `decisions/0004-navigation-movement.md` | snapshot and interaction schemas | `navigation-reservations.json` | fixture gate and Phase 2 tests | Ready for Phase 2 |
| State machines | `decisions/0005-simulation-state-machine.md` | snapshot and trace schemas | replay and cancellation fixtures | fixture gate and Phase 2 replay tests | Ready for Phase 2 |
| Asset export | `decisions/0006-asset-authoring-export.md` | asset and provenance schemas | valid and rejected asset fixtures | asset admission gate | Ready for first family |
| Placement | world-model documents | entity and structure schemas | placement fixture | fixture gate and Phase 1 property tests | Ready for Phase 1 |
| Depth and occlusion | rendering document | entity render metadata | depth and cutaway fixtures | fixture gate and Phase 3 golden tests | Ready for renderer proof |
| Connectivity | connectivity document | connectivity schema | connected desk and rejected mask fixtures | fixture gate | Ready for first family |
| Operations adapter | operations document | operations snapshot schema | operations states fixture | schema gate | Ready for adapter implementation |

## Blocking policy

- `Ready` means implementation may begin behind the named gate.
- `Intentionally deferred` is an accepted decision with a bounded experiment;
  it is not an invitation to choose a dependency inside a feature component.
- A failed schema, fixture, provenance, clean-room, type, test, build, or
  migration check blocks promotion.
- A changed accepted invariant requires a new decision or schema version. Do
  not silently edit historical fixtures to make new behavior pass.

## Current entry point

Phase 1 may implement pure world, coordinate, projection, placement, and
serialization contracts with geometric data. Runtime art and a renderer remain
blocked until their later gates pass.

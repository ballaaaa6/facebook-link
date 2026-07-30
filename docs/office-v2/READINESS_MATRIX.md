# Office V2 Readiness Matrix

This matrix is the release authority for starting or expanding engine work. A
topic is ready only when its decision, contract, examples, automated evidence,
and migration rule all exist. Prose alone never marks a row ready.

| Topic | Decision | Contract | Fixtures | Automated evidence | Status |
| --- | --- | --- | --- | --- | --- |
| Projection and grid | `decisions/0001-projection-grid.md` | `schemas/world.schema.json` | `projection-roundtrip.json` | knowledge gate and Phase 2 property tests | Ready for Phase 2 |
| Renderer boundary | `decisions/0002-renderer.md` | renderer port in Phase 4 | geometric benchmark scene | Phase 4 benchmark | Intentionally deferred |
| Map authoring | `decisions/0003-map-authoring.md` | world and structure schemas | minimal office and structure fixtures | schema gate | Ready for Phase 2 |
| Navigation | `decisions/0004-navigation-movement.md` | snapshot and interaction schemas | `navigation-reservations.json` | fixture gate and Phase 3 tests | Ready for Phase 3 |
| State machines | `decisions/0005-simulation-state-machine.md` | snapshot and trace schemas | replay and cancellation fixtures | fixture gate and Phase 3 replay tests | Ready for Phase 3 |
| Asset export | `decisions/0006-asset-authoring-export.md` | asset and provenance schemas | valid and rejected asset fixtures | asset admission gate | Ready for Phase 5 factory proof |
| Placement | world-model documents | entity and structure schemas | placement fixture | fixture gate and Phase 2 property tests | Ready for Phase 2 |
| Depth and occlusion | rendering document | entity render metadata | depth and cutaway fixtures | fixture gate and Phase 4 golden tests | Ready for renderer proof |
| Connectivity | connectivity document | connectivity schema | connected desk and rejected mask fixtures | fixture gate | Ready for first family |
| Operations adapter V1 boundary | operations document | operations snapshot schema | operations states fixture | schema gate | Ready for data-free lab only |
| First-floor target | `FIRST_FLOOR_BRIEF.md` | target contracts below | no target-sized fixture | acceptance walkthrough and capacity gates | Target locked; contracts missing |
| Building, floors, exterior, and portals | decision required | no building schema | no multi-floor or exterior fixture | migration and portal tests | Not ready |
| Scene composition and room templates | decision required | no scene-plan or room-template schema | no density or capacity fixture | deterministic compiler tests | Not ready |
| Operations choreography | workflow ownership must be resolved | operations snapshot V2 required | no ten-role handoff fixture | adapter and deduplication tests | Not ready |
| Ten-to-fifteen actor crowds | reservation decision incomplete | snapshot contract must expand | only two-request reservation evidence | queue, deadlock, and replay tests | Not ready |
| Measurable visual style | style-profile decision required | no style-profile schema | no palette or scale board | image and geometry gates | Not ready |
| Runtime asset bundle | asset family contracts exist | catalog, atlas, and scene-bundle contracts missing | no admitted family | registry and visual gates | Partially ready |
| Environment and character kits | production bibles exist | character and semantic-variant contracts incomplete | no runtime art | contact sheets and slice integration | Not ready |

## Blocking policy

- `Ready` means implementation may begin behind the named gate.
- `Intentionally deferred` is an accepted decision with a bounded experiment;
  it is not an invitation to choose a dependency inside a feature component.
- A failed schema, fixture, provenance, clean-room, type, test, build, or
  migration check blocks promotion.
- A changed accepted invariant requires a new decision or schema version. Do
  not silently edit historical fixtures to make new behavior pass.

## Current entry point

Phase 1 closes the target-specific contracts above. Existing ready rows may be
used for bounded contract probes, but the executable world kernel is Phase 2.
Bulk art, the large map, and renderer integration remain blocked until the
applicable roadmap exits pass.

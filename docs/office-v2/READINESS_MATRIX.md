# Office V2 Readiness Matrix

This matrix is the release authority for starting or expanding engine work. A
topic is ready only when its decision, contract, examples, automated evidence,
and migration rule all exist. Prose alone never marks a row ready.

`KNOWLEDGE_COMPLETENESS_AUDIT.md` records the evidence-level audit behind this
matrix. Its current verdict is no-go for the large floor, bulk art, renderer
integration, and target crowds. A `Ready for Phase` label below authorizes only
the narrow behavior named in that row; it does not imply target readiness.
`READINESS_REMEDIATION_PLAN.md` defines the ordered remediation and T0–T6
promotion ladder; planning a gate does not change any status in this matrix.

| Topic | Decision | Contract | Fixtures | Automated evidence | Status |
| --- | --- | --- | --- | --- | --- |
| Forward projection | `decisions/0001-projection-grid.md` | projection section and common types | five integer cases in `projection-roundtrip.json` | current knowledge gate | Ready for a bounded pure-function probe |
| Sub-cell projection, inverse picking, and camera | decision requires clarification | coordinate types and camera contract incomplete | no edge, sub-cell, zoom, crop, or camera fixture | property and viewport tests missing | Not ready |
| Renderer boundary | `decisions/0002-renderer.md` | renderer port in Phase 4 | geometric benchmark scene | Phase 4 benchmark | Intentionally deferred |
| Canonical JSON map shape | `decisions/0003-map-authoring.md` | current world and structure schemas | minimal hand-authored office and structures | schema gate only | Ready for a bounded data probe |
| Editor import and scene compilation | editor-neutral principle only | authoring profile, conversion report, room template, and scene-plan contracts missing | no reorder, unknown-class, offset, or compiler fixture | converter and semantic compiler missing | Not ready |
| Single-actor four-way navigation | `decisions/0004-navigation-movement.md` | current snapshot contract | one executable path | current gate, with cost-unit correction required | Ready for a bounded algorithm probe only |
| Commands and state-machine lifecycle | `decisions/0005-simulation-state-machine.md` | snapshot and trace schemas are shape-only | placeholder hashes and shallow cancellation examples | no reducer replay or restore proof | Not ready |
| Basic asset manifest admission | `decisions/0006-asset-authoring-export.md` | current asset and provenance schemas | valid and rejected manifest fixtures | path, hash, PNG header, dimensions, and uniqueness checks | Ready for gate development only |
| Placement | world-model documents | entity and structure schemas | narrow placement fixture | a few executable rotations and clearance cases | Ready for a bounded algorithm probe only |
| Depth and occlusion | rendering document | entity render metadata | simple depth and cutaway fixtures | simple band-sort gate only | Not ready for multipart or tall-object rendering |
| Connectivity | connectivity document | connectivity schema | connected desk and rejected mask fixtures | basic mask resolver | Ready for a bounded mask probe; art contract conflicts remain |
| Operations adapter V1 boundary | operations document | operations snapshot schema | operations states fixture | schema gate | Ready for data-free lab only |
| First-floor target | `FIRST_FLOOR_BRIEF.md` | target contracts below | no target-sized fixture | acceptance walkthrough and capacity gates | Target locked; contracts missing |
| Building, floors, exterior, and portals | decision required | no building schema | no multi-floor or exterior fixture | migration and portal tests | Not ready |
| Scene composition and room templates | decision required | no scene-plan or room-template schema | no density or capacity fixture | deterministic compiler tests | Not ready |
| Operations choreography | workflow ownership must be resolved | operations snapshot V2 required | no ten-role handoff fixture | adapter and deduplication tests | Not ready |
| Ten-to-fifteen actor crowds | reservation decision incomplete | snapshot contract must expand | only two-request reservation evidence | queue, deadlock, and replay tests | Not ready |
| Measurable visual style | style-profile decision required | no style-profile schema | no palette or scale board | image and geometry gates | Not ready |
| Runtime asset bundle | asset family principles exist | catalog, atlas, render-part, and scene-bundle contracts missing | no admitted family | compiler, orphan, pixel, geometry, and visual gates missing | Not ready |
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

Phase 1 closes the target-specific contracts and the P0 contradictions recorded
in `KNOWLEDGE_COMPLETENESS_AUDIT.md`. Existing narrow rows may be used for
disposable or pure contract probes only. Persistent world/simulation code starts
after Closure A and the applicable parts of Closure B are accepted. Bulk art,
the large map, target crowds, and renderer integration remain blocked until the
minimum safe-to-produce gate passes.

The immediate target is T1 — Semantic Foundation in
`READINESS_REMEDIATION_PLAN.md`. T1 remains blocked until the current gate is
made honest and identity, coordinate, geometry, building, reference-closure, and
deterministic scene-compilation evidence passes.

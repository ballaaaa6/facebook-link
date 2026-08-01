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
T0 passed on 2026-08-01. W1.3–W1.5 contract slices and bounded T1 semantic
foundation evidence passed on 2026-08-02. This does not promote persistent
engine, renderer, crowd, or asset status; W1.6 cross-track specification
closure remains before Phase 2 authorization.

| Topic | Decision | Contract | Fixtures | Automated evidence | Status |
| --- | --- | --- | --- | --- | --- |
| Package ownership and import direction | `decisions/0007-package-ownership-and-import-boundaries.md` | four package manifests, generated-type boundary, and Web composition root | positive graph plus bare, manifest, relative, forbidden-import, generated-boundary, fake-root, and reverse-consumer negatives | `office:v2:boundaries:test` executes the negative matrix; boundary, architecture, clean-room, and generated-contract gates enforce the current tree | W0.1, W0.3, and the W1.1 contract slice complete; no persistent engine behavior authorized |
| Forward projection | `decisions/0001-projection-grid.md` | projection section and common types | five integer cases in `projection-roundtrip.json` | T0 gate executes 5/5 bounded cases | Ready for a bounded pure-function probe |
| Sub-cell projection, inverse picking, and camera | `decisions/0008-coordinate-and-facing-semantics.md` | V2 branded coordinate types plus named facing and cell/sub-cell transforms; full camera contract pending | common V2 valid/rejected cases plus negative/boundary sub-cell transform tests; no zoom, crop, or camera fixture | schema/diagnostic, generated-drift, compile-time, and pure transform tests pass; property and viewport tests remain missing | W1.1 bounded contract/probe complete; full projection, inverse picking, and camera implementation not ready |
| Renderer boundary | `decisions/0002-renderer.md` | renderer port in Phase 4 | geometric benchmark scene | Phase 4 benchmark | Intentionally deferred |
| Canonical JSON map shape | `decisions/0003-map-authoring.md` | current world and structure schemas | minimal hand-authored office and structures | schema-shape evidence reported separately | Ready for a bounded data probe |
| Editor import and scene compilation | `decisions/0014-v2-runtime-world-format.md` | `scene-plan.schema.json`, `world-v2.schema.json`, `compiled-building.schema.json`, and `compilation-report.schema.json` | target-floor, reorder/hash, and five fail-closed compiler cases | canonical bytes/hashes, reference graph, schema, compiler, and exact-diagnostic gates | W1.5/T1 bounded evidence complete; no persistent world or renderer |
| Single-actor four-way navigation | `decisions/0004-navigation-movement.md` | current snapshot contract | preserved V1 path plus V2 six-step/cost-600 oracle | T0 gate uses cardinal and heuristic units of 100 | Ready for a bounded algorithm probe only |
| Commands and state-machine lifecycle | `decisions/0005-simulation-state-machine.md` | snapshot and trace schemas are shape-only | placeholder hashes and shallow cancellation examples | T0 reports reducer/replay evidence as zero | Not ready |
| Basic asset manifest admission | `decisions/0006-asset-authoring-export.md` | current asset and provenance schemas | valid and rejected manifest fixtures | path, hash, PNG header, dimensions, and uniqueness checks | Ready for gate development only |
| Placement | world-model documents | entity and structure schemas | narrow placement fixture | T0 executes all four bounded rotation/clearance cases | Ready for a bounded algorithm probe only |
| Geometry authority and reference closure | `decisions/0009-geometry-authority.md` | `geometry.schema.json`, `entity-definition-v2.schema.json`, `entity-instance.schema.json`, `definition-bundle.schema.json`, typed versioned refs | valid bundle plus dangling, wrong-kind, missing-version, version-mismatch, orientation, rotation, duplicate, agreement, asset-occupancy, and render-cycle rejections | schema/generator drift, public-world graph, pure transform/agreement, mutation, and preflight gates | W1.2 complete; no persistent world kernel, renderer, or runtime assets authorized |
| Depth and occlusion | `decisions/0013-render-parts-and-proof-workstation.md` | render-part DAG contract remains W4.2 work | simple depth and structure fixtures | two band-sort cases; three separate door-traversability cases do not prove cutaway rendering or occlusion | Policy ratified; no multipart renderer or tall-object proof admitted |
| Connectivity | `decisions/0013-render-parts-and-proof-workstation.md` | V1 connectivity plus bounded proof-workstation V2 definition | connected desk, proof workstation, and rejected mask fixtures | exact east-west mask set `0,2,8,10`; unsupported north-south and corner masks fail exactly | Ready for the bounded mask probe only; no runtime art admitted |
| Operations adapter V1 boundary | operations document | operations snapshot schema | operations states fixture | explicitly schema-shape only | Ready for data-free lab only |
| First-floor target | `FIRST_FLOOR_BRIEF.md` | target topology, room-template, and scene-plan contracts | target-sized ground-floor fixture with 10 assigned and 5 reserved slots | capacity, entrance, site-boundary, core, and T1 compiler gates | W1.3–W1.5 bounded target contract complete; persistent/visual target remains blocked |
| Building, floors, exterior, and portals | `decisions/0010-building-floor-site-and-portal-ownership.md` | `building.schema.json` plus pure topology validator | one-floor, future two-floor, target-floor, and exact invalid topology fixtures | schema, portal closure, migration, order, and boundary tests | W1.3 complete; no persistent load/save or cross-floor gameplay |
| Scene composition and room templates | `decisions/0014-v2-runtime-world-format.md` | room-template and four scene/world/report schemas | capacity/circulation plus target-floor compiler fixtures | pure room validator, canonical compiler, reorder/hash, reference, and exact rejection tests | W1.4–W1.5/T1 bounded evidence complete |
| Operations choreography | project ADR 0003 | winner ownership and deterministic copy/visual join implemented in shared workflow contracts | pilot has parallel branch completions and one system join event; no ten-role handoff fixture | workflow, catalog, and runner persistence tests cover ownership, reorder, retry, idempotency, and correlation | Workflow conflict resolved; Office adapter V2 and W3.1 evidence remain not ready |
| Ten-to-fifteen actor crowds | `decisions/0012-queue-reservation-and-deadlock-policy.md` | snapshot and queue contracts must expand | only two-request reservation evidence | queue, deadlock, cleanup, and replay engines are absent | Policy ratified; implementation not ready |
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

W0.1 package ownership and W0.3 contradiction resolution are complete. The P0
register locks all twelve dispositions and preserves the original V1 JSON
evidence by hash. W1.1 and W1.2 closed identity, coordinates, geometry, and
reference closure. W1.3–W1.5 now close building topology, room composition,
canonical scene compilation, and bounded T1 semantic-foundation evidence. The
target-floor compiler is pure and renderer-neutral. W1.6 remains the next
authorized package for cross-track Phase 1 specification closure. The P0
register is intentionally not rewritten by this wave; it remains the historical
W0.3 promotion baseline. Persistent world/simulation code, bulk art, target
crowds, and renderer integration remain blocked until later gates pass.

The bounded T1 — Semantic Foundation evidence in
`READINESS_REMEDIATION_PLAN.md` passed on 2026-08-02. T0, W0.1, W0.3, and
W1.1–W1.5 contract slices are complete; W1.6 remains before Phase 2
authorization. Closure still reports reducer/replay `0`, property/model `0`,
basic-only asset admission, no renderer, no runtime asset manifest, and no new
dependency admission.

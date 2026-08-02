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
foundation evidence passed on 2026-08-02. W1.6 cross-track specification
closure passed on 2026-08-02 and authorizes the pure Phase 2 world kernel. This
does not promote persistent engine, renderer, crowd, or production-asset
status.

The immutable Phase 1 closure point is recorded in
[PHASE_1_EXIT_HANDOFF.md](PHASE_1_EXIT_HANDOFF.md). Phase 2 implementation must
use [PHASE_2_WORLD_KERNEL_ACCEPTANCE.md](PHASE_2_WORLD_KERNEL_ACCEPTANCE.md) for
its entry and exit evidence. Visual production remains separately gated by
[STYLE_PROFILE_APPROVAL.md](STYLE_PROFILE_APPROVAL.md), with pre-registered
proof risks in [VISUAL_PROOF_RISK_REGISTER.md](VISUAL_PROOF_RISK_REGISTER.md).

| Topic | Decision | Contract | Fixtures | Automated evidence | Status |
| --- | --- | --- | --- | --- | --- |
| Package ownership and import direction | `decisions/0007-package-ownership-and-import-boundaries.md` | four package manifests, generated-type boundary, and Web composition root | positive graph plus bare, manifest, relative, forbidden-import, generated-boundary, fake-root, and reverse-consumer negatives | `office:v2:boundaries:test` executes the negative matrix; boundary, architecture, clean-room, and generated-contract gates enforce the current tree | W0.1, W0.3, and the W1.1 contract slice complete; no persistent engine behavior authorized |
| Forward projection | `decisions/0001-projection-grid.md` | projection section and common types | five integer cases in `projection-roundtrip.json` | T0 gate executes 5/5 bounded cases | Ready for a bounded pure-function probe |
| Sub-cell projection, inverse picking, and camera | `decisions/0008-coordinate-and-facing-semantics.md` | V2 branded coordinate types plus named facing and cell/sub-cell transforms; full camera contract pending | common V2 valid/rejected cases plus negative/boundary sub-cell transform tests; no zoom, crop, or camera fixture | schema/diagnostic, generated-drift, compile-time, and pure transform tests pass; property and viewport tests remain missing | W1.1 bounded contract/probe complete; full projection, inverse picking, and camera implementation not ready |
| Renderer boundary | `decisions/0002-renderer.md` | `renderer-port.schema.json`, `presentation-snapshot.schema.json` and renderer QA contracts | renderer QA, lifecycle, accessibility, golden, and synthetic benchmark fixtures | W1.6 Closure E bounded contract evidence; Phase 4 benchmark remains pending | W1.6 specification complete; renderer implementation and selection intentionally deferred |
| Canonical JSON map shape | `decisions/0003-map-authoring.md` | current world and structure schemas | minimal hand-authored office and structures | schema-shape evidence reported separately | Ready for a bounded data probe |
| Editor import and scene compilation | `decisions/0014-v2-runtime-world-format.md` | `scene-plan.schema.json`, `world-v2.schema.json`, `compiled-building.schema.json`, and `compilation-report.schema.json` | target-floor, reorder/hash, and five fail-closed compiler cases | canonical bytes/hashes, reference graph, schema, compiler, and exact-diagnostic gates | W1.5/T1 bounded evidence complete; no persistent world or renderer |
| Single-actor four-way navigation | `decisions/0004-navigation-movement.md` | current snapshot contract | preserved V1 path plus V2 six-step/cost-600 oracle | T0 gate uses cardinal and heuristic units of 100 | Ready for a bounded algorithm probe only |
| Commands and state-machine lifecycle | `decisions/0005-simulation-state-machine.md` plus `SIMULATION_PIPELINE_COMMANDS.md` | versioned command/result/event, intent, facility-slot, queue-ticket, reservation, action-queue, snapshot-v2, and trace-v2 schemas | valid/rejected simulation contract fixtures plus bounded ordering, idempotency, cleanup, tick-boundary, and lifecycle cases | knowledge gate reports 103/103 semantic cases and 51 exact diagnostics; reducer/replay remains zero | W1.6 Closure B contract slice complete; reducer/runtime lifecycle not ready |
| Basic asset manifest admission | `decisions/0006-asset-authoring-export.md` | current asset and provenance schemas | valid and rejected manifest fixtures | path, hash, PNG header, dimensions, and uniqueness checks | Ready for gate development only |
| Placement | world-model documents | entity and structure schemas | narrow placement fixture | T0 executes all four bounded rotation/clearance cases | Ready for a bounded algorithm probe only |
| Geometry authority and reference closure | `decisions/0009-geometry-authority.md` | `geometry.schema.json`, `entity-definition-v2.schema.json`, `entity-instance.schema.json`, `definition-bundle.schema.json`, typed versioned refs | valid bundle plus dangling, wrong-kind, missing-version, version-mismatch, orientation, rotation, duplicate, agreement, asset-occupancy, and render-cycle rejections | schema/generator drift, public-world graph, pure transform/agreement, mutation, and preflight gates | W1.2 complete; no persistent world kernel, renderer, or runtime assets authorized |
| Depth and occlusion | `decisions/0013-render-parts-and-proof-workstation.md` | render-part DAG contract remains W4.2 work | simple depth and structure fixtures | two band-sort cases; three separate door-traversability cases do not prove cutaway rendering or occlusion | Policy ratified; no multipart renderer or tall-object proof admitted |
| Connectivity | `decisions/0013-render-parts-and-proof-workstation.md` | V1 connectivity plus bounded proof-workstation V2 definition | connected desk, proof workstation, and rejected mask fixtures | exact east-west mask set `0,2,8,10`; unsupported north-south and corner masks fail exactly | Ready for the bounded mask probe only; no runtime art admitted |
| Operations adapter V1 boundary | operations document | operations snapshot schema | operations states fixture | explicitly schema-shape only | Ready for data-free lab only |
| First-floor target | `FIRST_FLOOR_BRIEF.md` | target topology, room-template, and scene-plan contracts | target-sized ground-floor fixture with 10 assigned and 5 reserved slots | capacity, entrance, site-boundary, core, and T1 compiler gates | W1.3–W1.5 bounded target contract complete; persistent/visual target remains blocked |
| Building, floors, exterior, and portals | `decisions/0010-building-floor-site-and-portal-ownership.md` | `building.schema.json` plus pure topology validator | one-floor, future two-floor, target-floor, and exact invalid topology fixtures | schema, portal closure, migration, order, and boundary tests | W1.3 complete; no persistent load/save or cross-floor gameplay |
| Scene composition and room templates | `decisions/0014-v2-runtime-world-format.md` | room-template and four scene/world/report schemas | capacity/circulation plus target-floor compiler fixtures | pure room validator, canonical compiler, reorder/hash, reference, and exact rejection tests | W1.4–W1.5/T1 bounded evidence complete |
| Operations choreography | project ADR 0003 | winner ownership, Operations Snapshot V2, routing, roster binding, and deterministic copy/visual join contracts | Closure C valid/rejected snapshot, routing, roster, event-window, disabled, stale, reconnect, and fan-out/join fixtures | knowledge gate plus Closure C focused evidence and workspace workflow/runner tests | W1.6 Closure C specification complete; runtime Operations V2 and W3.1–W3.4 evidence remain not ready |
| Ten-to-fifteen actor crowds | `decisions/0012-queue-reservation-and-deadlock-policy.md` | snapshot and queue contracts must expand | only two-request reservation evidence | queue, deadlock, cleanup, and replay engines are absent | Policy ratified; implementation not ready |
| Measurable visual style | `decisions/0015-visual-style-and-asset-contracts.md` | `style-profile.schema.json` plus asset geometry/render-part contracts | Closure D valid/rejected style, provenance, render-part, catalog/bundle, migration, and semantic-variant fixtures | knowledge gate, asset gate, generated-contract drift, and Closure D focused evidence | W1.6 Closure D specification complete; owner visual approval, production export, and T4/T5 evidence remain pending |
| Runtime asset bundle | `decisions/0006-asset-authoring-export.md` plus `decisions/0015-visual-style-and-asset-contracts.md` | source-set, export-recipe, atlas, asset-catalog, scene-bundle, review, and migration contracts | Closure D valid/rejected asset pipeline fixture | basic asset gate plus bounded Closure D semantic evidence; no runtime manifests | W1.6 asset specification complete; runtime asset factory and T5 proof remain not ready |
| Environment and character kits | production bibles plus `decisions/0015-visual-style-and-asset-contracts.md` | character-definition and semantic-variant contracts with render-part references | Closure D semantic variant and render-part fixtures; no production pixels | knowledge and clean-room gates | W1.6 semantic contract complete; no runtime art or family admission |

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
target-floor compiler is pure and renderer-neutral. W1.6 cross-track Phase 1
specification closure is now complete and the pure Phase 2 world kernel is
authorized. The P0 register is intentionally not rewritten by this wave; it
remains the historical W0.3 promotion baseline. Persistent world/simulation
code, bulk art, target crowds, and renderer integration remain blocked until
later gates pass.

The handoff record is the audit point for the completed Phase 1 contract
closure; it does not promote later phases. Before Phase 2 can be marked passed,
every row in the Phase 2 acceptance record must contain committed evidence.
The style approval and visual risk records remain later controls for visual
assets and integrated presentation.

The bounded T1 — Semantic Foundation evidence in
`READINESS_REMEDIATION_PLAN.md` passed on 2026-08-02. T0, W0.1, W0.3, and
W1.1–W1.6 bounded contract slices are complete; Phase 2 pure world-kernel work
is authorized. The integrated W1.6 run reports 186 files, 58 schemas, 66
fixtures, 184/184 semantic cases, and 101 exact diagnostics. Reducer/replay
`0`, property/model `0`, basic-only asset admission, no renderer admission, no
runtime asset manifest, and no new dependency admission remain unchanged.

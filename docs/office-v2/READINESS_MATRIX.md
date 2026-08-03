# Office V2 Readiness Matrix

This matrix is the release authority for starting or expanding engine work. A
topic is ready only when its decision, contract, examples, automated evidence,
and migration rule all exist. Prose alone never marks a row ready.

`KNOWLEDGE_COMPLETENESS_AUDIT.md` records the evidence-level audit behind this
matrix. Its current verdict remains no-go for the large floor, bulk art, and
production asset integration; the synthetic Phase 4 renderer T4 gate is now
complete, while the separate Phase 3 headless crowd exit does not admit full
visual or load/performance crowd readiness. A `Ready for Phase` label below
authorizes only
the narrow behavior named in that row; it does not imply target readiness.
`READINESS_REMEDIATION_PLAN.md` defines the ordered remediation and T0–T6
promotion ladder; planning a gate does not change any status in this matrix.
T0 passed on 2026-08-01. W1.3–W1.5 contract slices and bounded T1 semantic
foundation evidence passed on 2026-08-02. W1.6 cross-track specification
closure passed on 2026-08-02 and authorizes the pure Phase 2 world kernel. The
Phase 2 world-kernel wave integrated on 2026-08-02: projection, inverse ground
picking, placement/occupancy, topology normalization, depth ordering, reference
rejection, and canonical world evidence passed the executable acceptance
record. This closes only the pure headless kernel gate; it does not promote
persistent engine, renderer, crowd, or production-asset status.

The immutable Phase 1 closure point is recorded in
[PHASE_1_EXIT_HANDOFF.md](PHASE_1_EXIT_HANDOFF.md). Phase 2 implementation must
use [PHASE_2_WORLD_KERNEL_ACCEPTANCE.md](PHASE_2_WORLD_KERNEL_ACCEPTANCE.md) for
its entry and exit evidence. Visual production remains separately gated by
[STYLE_PROFILE_APPROVAL.md](STYLE_PROFILE_APPROVAL.md), with pre-registered
proof risks in [VISUAL_PROOF_RISK_REGISTER.md](VISUAL_PROOF_RISK_REGISTER.md).

Phase 4/T4 closed on 2026-08-03 in the Main integration branch. The exact
Canvas 2D versus PixiJS 8.19.0 benchmark matrix produced 300 valid runs; the
source-pinned browser QA artifact covers semantic parity, accessibility,
responsive overflow, reduced motion, forced colors, hidden/resume, context
recovery, and remount cleanup; three no-rewrite Canvas goldens and the seeded
property/model evidence pass. Canvas 2D is selected for the synthetic
presentation boundary. Phase 5 technical asset-factory evidence is integrated
on its dedicated integration branch. The original `workstation-basic/v1`
candidate is recorded as geometry `rework-required`, visual `rejected`, and
commercial `pending` and is preserved as historical evidence. Bounded rework
`P5-W6.5-R1` produces a 2:1 dimetric `workstation-basic/v2` candidate, which
remains spec-only pending independent geometry, visual, and commercial owner
review. No runtime manifest has been admitted; T5 and the full first-floor
visual acceptance remain blocked, and Phase 6 has not started.

| Topic | Decision | Contract | Fixtures | Automated evidence | Status |
| --- | --- | --- | --- | --- | --- |
| Package ownership and import direction | `decisions/0007-package-ownership-and-import-boundaries.md` | four package manifests, generated-type boundary, and Web composition root | positive graph plus bare, manifest, relative, forbidden-import, generated-boundary, fake-root, and reverse-consumer negatives | `office:v2:boundaries:test` executes the negative matrix; boundary, architecture, clean-room, and generated-contract gates enforce the current tree | W0.1, W0.3, and the W1.1 contract slice complete; no persistent engine behavior authorized |
| Forward projection | `decisions/0001-projection-grid.md` | projection section and common types | five integer cases in `projection-roundtrip.json` | T0 gate executes 5/5 bounded cases | Ready for a bounded pure-function probe |
| Sub-cell projection, inverse picking, and camera | `decisions/0008-coordinate-and-facing-semantics.md` | V2 branded coordinate types plus named facing and cell/sub-cell transforms; full camera contract pending | common V2 valid/rejected cases plus projection round-trip and inverse-picking boundary tests; no zoom, crop, or camera fixture | schema/diagnostic, generated-drift, compile-time, pure transform, projection, and inverse-picking tests pass; property and viewport tests remain missing | Phase 2 bounded projection and inverse picking passed; camera and viewport behavior remain deferred |
| Renderer boundary | `decisions/0016-canvas-2d-renderer-selection.md` supersedes `decisions/0002-renderer.md` | `renderer-port.schema.json`, `presentation-snapshot.schema.json`, benchmark, lifecycle, accessibility, golden, and property/model contracts | source-pinned Canvas/Pixi benchmark, renderer QA evidence, three Canvas goldens, seeded independent models, and the fixture-only bundle | `npm run check`; 300/300 valid renderer runs; 100 CI/1,000 exploration model runs; four browser QA checks; golden validator | **Phase 4/T4 COMPLETE — Canvas 2D selected for synthetic presentation; production assets and full-floor acceptance remain later gates** |
| Canonical JSON map shape | `decisions/0003-map-authoring.md` | current world and structure schemas | minimal hand-authored office and structures | schema-shape evidence reported separately | Ready for a bounded data probe |
| Editor import and scene compilation | `decisions/0014-v2-runtime-world-format.md` | `scene-plan.schema.json`, `world-v2.schema.json`, `compiled-building.schema.json`, and `compilation-report.schema.json` | target-floor, reorder/hash, and five fail-closed compiler cases | canonical bytes/hashes, reference graph, schema, compiler, and exact-diagnostic gates | W1.5/T1 bounded evidence complete; no persistent world or renderer |
| Single-actor four-way navigation | `decisions/0004-navigation-movement.md` | current snapshot contract | preserved V1 path plus V2 six-step/cost-600 oracle | T0 gate uses cardinal and heuristic units of 100 | Ready for a bounded algorithm probe only |
| Commands and state-machine lifecycle | `decisions/0005-simulation-state-machine.md` plus `SIMULATION_PIPELINE_COMMANDS.md` | versioned command/result/event, intent, facility-slot, queue-ticket, reservation, action-queue, snapshot-v2, and trace-v2 schemas | valid/rejected simulation contract fixtures plus bounded ordering, idempotency, cleanup, tick-boundary, lifecycle, P3-W0 research-closure cases, the P3-W2.1 command-pipeline suite, the P3-W2.2/P3-W2.3/P3-W2.4/P3-W2.5/P3-W2.6 focused suites, W3.1 ownership evidence, and integrated T2/T3 evidence | knowledge gate reports 184/184 semantic cases and 101 exact diagnostics; RC-01/02/03 focused probes pass; the unified Phase 3 gate passes 15/15 twice with T2 nine-scenario one-actor evidence, T3 exact 1/10/15 crowd evidence, and the full repository gate | W1.6 Closure B, P3-W0 bounded research closure, P3-W2.1 through P3-W2.6, and P3-EXIT-01/02 are integrated; Phase 3 headless reducer/replay evidence is complete, while renderer and later visual gates remain deferred |
| Basic asset manifest admission | `decisions/0006-asset-authoring-export.md` | current asset and provenance schemas | valid and rejected manifest fixtures | path, hash, PNG integrity, dimensions, alpha/contact policy, provenance, duplicate, orphan, and admission checks | Phase 5 admission gate integrated; zero runtime manifests admitted |
| Placement | world-model documents | entity and structure schemas | `placement-rotation-clearance.json` plus immutable occupancy cases | Phase 2 package tests cover rotation, support, clearance, use slots, overlap, and semantic occupancy | Phase 2 placement and occupancy evidence passed; persistent simulation remains deferred |
| Geometry authority and reference closure | `decisions/0009-geometry-authority.md` | `geometry.schema.json`, `entity-definition-v2.schema.json`, `entity-instance.schema.json`, `definition-bundle.schema.json`, typed versioned refs | valid bundle plus dangling, wrong-kind, missing-version, version-mismatch, orientation, rotation, duplicate, agreement, asset-occupancy, and render-cycle rejections | schema/generator drift, public-world graph, pure transform/agreement, mutation, and preflight gates | W1.2 and Phase 2 reference-closure evidence passed; no persistent world, renderer, or runtime assets authorized |
| Depth and occlusion | `decisions/0013-render-parts-and-proof-workstation.md` | render-part DAG contract remains W4.2 work; pure depth ordering is now `office-depth-ordering-v1` | `depth-occlusion.json` plus equal/adjacent/rotated/overlap tie tests | deterministic band/contact/elevation/ID ordering and cycle rejection pass in the world package | Phase 2 depth-input evidence passed; no multipart renderer, tall-object visual, or occlusion proof admitted |
| Connectivity | `decisions/0013-render-parts-and-proof-workstation.md` | V1 connectivity plus bounded proof-workstation V2 definition | connected desk, proof workstation, and rejected mask fixtures | exact east-west mask set `0,2,8,10`; unsupported north-south and corner masks fail exactly | Ready for the bounded mask probe only; no runtime art admitted |
| Operations adapter V1 boundary | operations document | operations snapshot schema | operations states fixture | explicitly schema-shape only | Ready for data-free lab only |
| First-floor target | `FIRST_FLOOR_BRIEF.md` | target topology, room-template, and scene-plan contracts | target-sized ground-floor fixture with 10 assigned and 5 reserved slots | capacity, entrance, site-boundary, core, and T1 compiler gates | W1.3–W1.5 bounded target contract complete; persistent/visual target remains blocked |
| Building, floors, exterior, and portals | `decisions/0010-building-floor-site-and-portal-ownership.md` | `building.schema.json` plus pure topology and structural-edge normalization | one-floor, future two-floor, target-floor, and exact invalid topology fixtures | schema, portal closure, migration, order, structural-edge, and boundary tests | W1.3 plus Phase 2 topology normalization passed; no persistent load/save or cross-floor gameplay |
| Scene composition and room templates | `decisions/0014-v2-runtime-world-format.md` | room-template and four scene/world/report schemas plus versioned world-kernel envelope | capacity/circulation plus target-floor compiler and canonical-world fixtures | pure room validator, canonical compiler, reorder/hash, reference, and exact rejection tests | W1.4–W1.5/T1 plus Phase 2 canonical world evidence passed |
| Operations choreography | project ADR 0003 | winner ownership, Operations Snapshot V2, routing, roster binding, deterministic copy/visual join, and two-clock reconciliation contracts | Closure C valid/rejected snapshot, routing, roster, event-window, disabled, stale, reconnect, fan-out/join, W3.4 reconciliation fixture, focused ownership/reconciliation suites, and the ten-role Phase 3 trace | knowledge gate plus Closure C focused evidence, W3.1 3/3, W3.4 12/12, operations 30/30, runner 18/18, and the unified Phase 3 gate 15/15 twice | P3-EXIT-03 completes reducer-adjacent workflow/runner/persistence/reconciliation evidence for all ten roles; Phase 3 choreography is complete, while real connector actions remain feature-gated |
| Ten-to-fifteen actor crowds | `decisions/0012-queue-reservation-and-deadlock-policy.md` | snapshot and queue contracts plus pure queue runtime | queue fixture profiles for 1/10/15 requests, atomic reservation, fairness, cleanup, wait-for cycles, deterministic yield/block, and integrated replay/restore checkpoints | P3-W2.4 queue suite passes 12/12 and P3-W2.5 replay suite passes 8/8; T3 passes exact 1/10/15 scenarios, 12 restore checkpoints, equal hashes/event suffixes, contention, and leak checks; the unified gate passes | P3-EXIT-02 completes the headless crowd closure; the 15-actor case is synthetic geometric capacity evidence, and performance/renderer proof remain deferred |
| Measurable visual style | `decisions/0015-visual-style-and-asset-contracts.md` | `style-profile.schema.json` plus asset geometry/render-part contracts | Closure D valid/rejected style, provenance, render-part, catalog/bundle, migration, and semantic-variant fixtures | knowledge gate, asset gate, generated-contract drift, Closure D evidence, and Phase 5 review boards | W1.6 Closure D specification plus Phase 5 technical evidence integrated; owner geometry/visual approval remains pending |
| Runtime asset bundle | `decisions/0006-asset-authoring-export.md` plus `decisions/0015-visual-style-and-asset-contracts.md` | source-set, export-recipe, atlas, asset-catalog, scene-bundle, review, and migration contracts | Closure D valid/rejected asset pipeline fixture plus the rejected v1 and bounded dimetric v2 workstation proof families | admission, deterministic factory, board, registry, orphan/missing, and full repository gates; no runtime manifests | Phase 5 technical factory evidence integrated; v1 is rejected, v2 is spec-only and T5 is blocked pending explicit owner review |
| Environment and character kits | production bibles plus `decisions/0015-visual-style-and-asset-contracts.md` | character-definition and semantic-variant contracts with render-part references | Closure D semantic variant and render-part fixtures; no production pixels | knowledge and clean-room gates | W1.6 semantic contract complete; no runtime art or family admission |
| Phase 3 research-closure prerequisites | `RESEARCH.md` RC-01/02/03 plus their canonical receiving documents | existing facility, queue, interaction, command, snapshot, trace, and migration contracts; no version changes | RC-01 valid/rejected facility and cleanup fixtures; RC-02 presentation-disabled, restore, and invalid-state fixtures; RC-03 assignment, target, retry, cancellation, and restore-input fixtures | focused probes pass 5/5, 4/4, and 1/1; preflight, boundaries, knowledge, and full repository checks pass; Phase 3 exit evidence is tracked separately below | P3-W0 bounded research closure accepted; it is a prerequisite record, not the final Phase 3 status |
| Phase 3 exit evidence | `docs/parallel-work/phase3-final-integration-report.md` and `scripts/office-v2-phase3-exit.mjs` | integrated reducer, crowd, operations, replay/restore, and audit-safe evidence contracts | T2 nine-scenario one-actor evidence; T3 exact 1/10/15 crowd matrix with 12 restore checkpoints; ten-role operations trace; deterministic unified gate report | `npm run office:v2:phase3:acceptance` passes 15/15 twice; validator tests 4/4; repeated reports byte-identical; full `npm run check` passes | **COMPLETE** on 2026-08-03 at gate-evaluation HEAD `8acd2af6ff524eaf2d7b02e5c4bd97d9a03c98af`; Phase 4 renderer/assets work remains deferred |

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
remains the historical W0.3 promotion baseline. Bulk art, renderer integration,
and visual/load-performance crowd work remain blocked until later gates pass;
the headless Phase 3 crowd exit is recorded in the matrix above.

The handoff record is the audit point for the completed Phase 1 contract
closure; it does not promote later phases. Before Phase 2 can be marked passed,
every row in the Phase 2 acceptance record must contain committed evidence.
The style approval and visual risk records remain later controls for visual
assets and integrated presentation.

The bounded T1 — Semantic Foundation evidence in
`READINESS_REMEDIATION_PLAN.md` passed on 2026-08-02. T0, W0.1, W0.3, and
W1.1–W1.6 bounded contract slices are complete; Phase 2 pure world-kernel work
is authorized. The integrated W1.6 run reports 186 files, 58 schemas, 66
fixtures, 184/184 semantic cases, and 101 exact diagnostics. The knowledge
probe's reducer/replay `0`, property/model `0`, basic-only asset admission, no
renderer admission, no runtime asset manifest, and no new dependency admission
remain unchanged; the separate Phase 3 runtime suites now add bounded queue,
replay, ownership, reducer, crowd, and operations exit evidence without
claiming visual or asset readiness. The
integrated Phase 2 world-kernel acceptance now proves the bounded pure
projection, inverse-picking, placement, occupancy, topology, depth, reference,
and canonicalization rows. Renderer, runtime asset, property/model, and visual
evidence remain closed by later gates.

The Phase 3 headless exit is complete on 2026-08-03. The unified gate passed
15/15 twice at gate-evaluation HEAD
`8acd2af6ff524eaf2d7b02e5c4bd97d9a03c98af` with T2 nine-scenario one-actor
evidence, T3 exact 1/10/15 evidence, and the complete ten-role operations
trace. This row-level closure does not start Phase 4 or admit production
assets.

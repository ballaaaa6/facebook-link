# Office Engine V2

## Purpose

Build a small deterministic management-game visualization for the affiliate
operations system. Operational records remain authoritative; the engine reads
them and presents agents, tasks, handoffs, facilities, and time as a coherent
world.

The desired feel is readable, warm, compact, and lively in the broad tradition
of top-down management games. The project must use original code, composition,
characters, and visual assets rather than copying a proprietary game's pixels,
characters, branding, or exact scene design.

## Clean-room boundary

- No compatibility adapter is permitted.
- No renderer code, scene offsets, maps, registries, tests, or visual pixels may
  be copied from another branch or Git history.
- Runtime visual assets may enter only through a new, versioned source,
  provenance, extraction, geometry, and validation record.
- Missing assets fail visibly. There is no silent fallback to an earlier file.
- The affiliate Dashboard, Settings, API, workflow, and runner must continue to
  build and operate without the engine.

## Dependency direction

```text
operational events -> read adapter -> simulation snapshot
                                      |
world definition -> simulation -------+
                                      |
                                      v
                                  projection
                                      |
                                      v
                                 presentation
```

Presentation never mutates world state. The engine never writes operational
truth directly. User intent becomes a command, the simulation validates it, and
only the resulting state is rendered.

## Current state

The clean-room boundary, data-free development lab, repository guards,
machine-readable readiness pack, accepted foundation decisions, and validation
fixtures exist. T0 passed on 2026-08-01: every declared fixture case executes,
and the gate reports schema, semantic, and reducer/replay evidence separately.
The current rejected fixtures match exact diagnostics. The evidence audit
remains no-go for renderer integration, production art, and the later T4–T6
gates. The headless Phase 3 T2/T3/operations exit is recorded separately
below; it does not admit a renderer or runtime assets.
The production Office route remains an empty V2 mount. Renderer selection is
deliberately deferred behind the accepted benchmark decision; no production
runtime art has been admitted.

W0.1 completed on 2026-08-01. Decision 0007 approves the four headless Office
packages and the presentation-only Web composition boundary; their empty
scaffolds, manifest graph, exact clean-room roots, and negative import/dependency
tests now pass. W0.3 completed on 2026-08-02: Decisions 0008–0013 and project
ADR 0003 are accepted, all twelve P0 dispositions are registered and checked,
and the historical V1 evidence set is hash-locked. W1.1 completed on
2026-08-02 for the common identity/coordinate contract slice: the V2 schema,
valid and rejected fixtures, exact diagnostics, deterministic generated types,
compile-time namespace negatives, and renderer-neutral facing and cell/sub-cell
transforms are now gated. W1.2 completed on 2026-08-02: geometry,
entity-definition, entity-instance, and definition-bundle schemas; deterministic
multi-schema generation; public-package reference closure; cardinal geometry
transforms and agreement; and exact rejection/drift evidence are now gated.
The W1.5 evidence run reports 114 inventoried files, 24 schemas, 37 fixtures,
87/87 semantic cases, and 35 exact diagnostics. No persistent world or
simulation behavior, renderer, runtime asset, or new dependency was admitted;
reducer/replay and property/model evidence remain zero.
W1.3, W1.4, and W1.5 completed on 2026-08-02: building topology,
room-program validation, canonical scene compilation, the target-floor fixture,
and bounded T1 evidence are now gated. The current evidence is 114 inventoried
files, 24 schemas, 37 fixtures, 87/87 semantic cases, and 35 exact diagnostics.
No persistent world or simulation behavior, renderer, runtime asset, or new
dependency was admitted; reducer/replay and property/model evidence remain
zero. W1.6 cross-track Phase 1 specification closure completed on 2026-08-02
after integrating Operations Snapshot V2, visual/asset contracts, and renderer/
QA contracts. The historical W0.3 closure register remains unchanged as its
pre-T1 baseline, and the Phase 2 pure world kernel is now authorized.

The W1.6 Closure B slice is recorded separately: simulation command,
result, event, intent, facility-slot, queue-ticket, reservation, action-queue,
snapshot-v2, and trace-v2 contracts now have valid/rejected fixtures and
bounded semantic probes. The current knowledge run reports 147 inventoried
files, 34 schemas, 56 fixtures, 103/103 executed semantic cases, and 51 exact
diagnostics. Reducer/replay, property/model, renderer, and runtime-asset
evidence remain zero or none; this historical slice remains bounded.

The integrated W1.6 record now reports 186 inventoried files, 58 schemas,
66/66 fixture files, 184/184 semantic cases, and 101 exact diagnostics. Full
`npm run check` and the project preflight pass. Closure C covers operations
snapshot, routing, roster, event windows, and fan-out/join; Closure D covers
style, asset geometry, provenance, catalog/bundle, and semantic variants; and
Closure E covers renderer-port, benchmark, accessibility, lifecycle, golden,
and property/model specifications. These are specification and bounded-probe
results only: reducer/replay remains 0, property/model evidence remains 0,
asset admission remains basic-only, renderer admission remains none, and no
runtime asset manifest is admitted.

The pure Phase 2 world-kernel wave integrated on 2026-08-02. Its public
headless package now exposes deterministic projection and inverse ground
picking, geometry-aware placement and immutable occupancy snapshots, topology
and structural-edge normalization, depth ordering with multipart cycle
rejection, and a versioned canonical world envelope. The integrated acceptance
record and final report cover 70 Office world tests, the full repository check,
and canonical target-floor hash evidence. This does not claim a renderer,
visual proof, runtime asset, persistent simulation, property/model, or crowd
gate; those remain later controls.

The historical Phase 3 `P3-W0` research-closure wave integrated on 2026-08-02. RC-01
facility/queue/cleanup, RC-02 runtime/presentation/restore, and RC-03
assignment/retry/target-revalidation now have bounded source records,
clean-room dispositions, canonical receiving docs, test-only fixtures, and
focused evidence (5/5, 4/4, and 1/1). This clears the bounded research
prerequisite for selecting a later T2 implementation wave. The `P3-W2.1`
fixed-tick command pipeline is now integrated as a pure, renderer-free command
result/event boundary with focused 8/8 evidence. The current `P3-W2-02` wave is
also integrated: `state-hash.ts` supplies the real deterministic
normalization/hash boundary with named PRNG streams (8/8), `activity-runtime.ts`
supplies the bounded one-actor facility/interaction lifecycle (7/7), and
`lifecycle.ts` supplies the injected fixed-tick lifecycle port with capped
catch-up and cleanup (7/7). The `P3-W2-03` wave is now integrated as well:
`queues.ts` supplies the pure queue/reservation/fairness/deadlock boundary
(12/12), `replay.ts` supplies injected replay, completed-boundary restore,
migration, divergence, and secret-safe bundle evidence (8/8), and the W3.1
ownership evidence verifies role/join/disabled-feature boundaries (3/3).
The `P3-W3-02` recovery adds fail-closed Snapshot V2 cursor reconciliation,
deterministic roster/route checks, feature/proposal safety, and focused adapter
evidence (9/9). The `P3-W3-03` wave adds a pure, renderer-free semantic
Snapshot V2 presentation projection plus idempotent copy/visual fan-out, join,
retry, failure, recovery, reconnect, and handoff choreography. Its focused
choreography coverage passes 8/8 and the operations package passes 17/17. These
were bounded module/runtime/operations evidence before the Phase 3 exit wave.

Before the exit wave, the final currently-ready Phase 3 leaf, `P3-W3.4`, was
integrated as a pure operations reconciliation adapter. It wraps Snapshot V2
with a generic
external-input cursor, explicit external time, the unchanged 10 Hz simulation
tick, deterministic queue/intent ledgers, and current-truth rebasing for gaps,
epoch changes, and expired retention. Its focused suite passes 12/12 and the
operations package passes 29/29. This is bounded two-clock/reconnect evidence;
the exit gate below is the later closure record.

The Phase 3 exit gate passed on 2026-08-03 at gate-evaluation HEAD
`b3115669ce0eb45f4440f228560d4ac7a0bcf26c`. It records Phase 3 as **COMPLETE**:
T2 has nine reducer-backed one-actor scenarios, T3 has exactly 1/10/15 actors
with synthetic-capacity disclosure for the 15-actor case and 12 equal restore
checkpoints, and Operations has the complete ten-role trace. The command
`npm run office:v2:phase3:acceptance` passed 15/15 checks twice, its validator
tests passed 4/4, and repeated reports were byte-identical. Evidence is under
`artifacts/office-v2/phase3/`; this is headless and renderer-neutral, and does
not start Phase 4.

The historical 186-file W1.6 number is closure evidence at the handoff commit.
The Phase 1 exit handoff, Phase 2 acceptance record, visual style approval
record, and visual proof risk register were added afterward as administrative
controls. They do not add semantic cases or claim runtime evidence.

## Knowledge rule

Documentation is not accepted as a rule by itself. A production rule must have
all applicable evidence:

- one canonical term and owner;
- one data shape or schema;
- one valid example and one failure example;
- one automated invariant or acceptance check;
- one explicit version and migration policy.

Decision records are added under `decisions/` only when a choice is made. They
must not restate the canonical documents.

## Source of truth

The promotion-control records are:

- PHASE_1_EXIT_HANDOFF.md: immutable Phase 1 closure and Phase 2 receiving boundary
- PHASE_2_WORLD_KERNEL_ACCEPTANCE.md: executable Phase 2 entry and exit evidence
- STYLE_PROFILE_APPROVAL.md: visual-owner approval before production asset work
- VISUAL_PROOF_RISK_REGISTER.md: visual-proof risk routing and status

- `FOUNDATIONS.md`: concepts and invariants the implementation must understand
- `PRODUCT_AND_GAME_LOOP.md`: visible product behavior and non-goals
- `FIRST_FLOOR_BRIEF.md`: accepted ground-floor target, capacity, zones, and acceptance
- `GLOSSARY_AND_INVARIANTS.md`: one vocabulary for code, art, and QA
- `READINESS_MATRIX.md`: implementation authority and outstanding gates
- `KNOWLEDGE_COMPLETENESS_AUDIT.md`: evidence-level audit and closure backlog
- `READINESS_REMEDIATION_PLAN.md`: ordered remediation work, test ladder,
  commit boundaries, and promotion gates
- `WORLD_COORDINATES_PROJECTION_CAMERA.md`: world-to-screen mathematics
- `WORLD_MODEL_OCCUPANCY_PLACEMENT.md`: spatial truth and placement rules
- `ROOMS_SURFACES_STRUCTURES_ZONES.md`: floors, edges, doors, and cutaways
- `RENDERING_DEPTH_OCCLUSION.md`: render bands and deterministic visibility
- `CONNECTIVITY_AUTO_TILING.md`: neighbor masks and connected variants
- `SIMULATION_TIME_RANDOMNESS_REPLAY.md`: deterministic execution rules
- `ACTORS_NAVIGATION_INTERACTIONS.md`: movement, reservations, and sockets
- `CHARACTERS_ANIMATION_HELD_PROPS.md`: presentation contracts for actors
- `INPUT_PICKING_AND_DEBUG_OVERLAYS.md`: semantic input and diagnostics
- `SAVE_SNAPSHOT_MIGRATION.md`: persisted forms and compatibility policy
- `MAP_AUTHORING_AND_IMPORT.md`: editor-neutral canonical world flow
- `ART_DIRECTION_PIXEL_SPEC.md`: original visual-language constraints
- `FURNITURE_PRODUCTION_BIBLE.md`: furniture-family production rules
- `CHARACTER_PRODUCTION_BIBLE.md`: character-family production rules
- `ASSET_PIPELINE_PROVENANCE_VALIDATION.md`: runtime asset admission gates
- `OPERATIONS_ADAPTER_UI_SAFETY.md`: control-plane integration boundary
- `TESTING_ACCEPTANCE_BUDGETS.md`: release evidence and budgets
- `PILOT_DEVICE_AND_PERFORMANCE_MATRIX.md`: benchmark environments and metrics
- `FAILURE_DIAGNOSTICS.md`: stable error ownership and evidence
- `IMPLEMENTATION_PLAN.md`: gated vertical delivery sequence
- `RESEARCH.md`: primary projects and documentation used for engineering study
- `DEPENDENCY_LEDGER.md`: observed versions, licenses, and adoption state
- `decisions/*.md`: accepted choices and bounded deferrals
- `schemas/*.schema.json`: machine-readable engine and asset vocabulary
- `registers/p0-resolution-register.json`: exact W0.3 P0 dispositions and
  historical V1 evidence hashes
- `fixtures/*.json`: canonical valid examples for implementation tests
- `templates/*`: briefs and definitions that start from the accepted contracts
- `apps/web/src/features/office-v2/foundation.ts`: executable layer vocabulary
- `scripts/office-v2-knowledge-check.mjs`: schema and semantic fixture gate
- `scripts/office-v2-contracts-generate.mjs`: deterministic V2 type generation
  and generated-byte drift gate
- `scripts/office-v2-contradictions-check.mjs`: P0 resolution and historical
  evidence gate
- `scripts/office-v2-boundary-check.mjs`: package and reverse-consumer import gate
- `scripts/office-v2-asset-check.mjs`: runtime asset admission gate
- `scripts/office-v2-world-reference-evidence.mjs`: public world reference-closure adapter
- `scripts/office-v2-world-w1-2-evidence.test.mjs`: W1.2 rejection and drift evidence
- `scripts/office-v2-clean-room-check.mjs`: repository isolation guard
- `.agents/skills/build-office-v2-engine`: repository-scoped workflow router

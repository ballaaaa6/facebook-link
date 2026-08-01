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
The current four rejected fixtures match exact diagnostics. The evidence audit
remains no-go for persistent engine work, the large floor, target crowds,
renderer integration, and production art until the named Phase 1 closures
pass. The production Office route remains an empty V2 mount. Renderer selection
is deliberately deferred behind the accepted benchmark decision; no production
runtime art has been admitted.

W0.1 completed on 2026-08-01. Decision 0007 approves the four headless Office
packages and the presentation-only Web composition boundary; their empty
scaffolds, manifest graph, exact clean-room roots, and negative import/dependency
tests now pass. W0.3 completed on 2026-08-02: Decisions 0008–0013 and project
ADR 0003 are accepted, all twelve P0 dispositions are registered and checked,
and the historical V1 evidence set is hash-locked. W1.1 is the next authorized
work package. No world or simulation behavior, renderer, runtime asset, or new
dependency was admitted; reducer/replay and property/model evidence remain
zero, and T1 remains blocked.

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
- `scripts/office-v2-contradictions-check.mjs`: P0 resolution and historical
  evidence gate
- `scripts/office-v2-boundary-check.mjs`: package and reverse-consumer import gate
- `scripts/office-v2-asset-check.mjs`: runtime asset admission gate
- `scripts/office-v2-clean-room-check.mjs`: repository isolation guard
- `.agents/skills/build-office-v2-engine`: repository-scoped workflow router

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

The clean-room boundary, a data-free development lab, repository guards, and
the canonical knowledge base exist. The production Office route is an empty V2
mount until the headless contracts and renderer gates are passed. No renderer
library or production asset pipeline has been chosen.

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
- `GLOSSARY_AND_INVARIANTS.md`: one vocabulary for code, art, and QA
- `WORLD_COORDINATES_PROJECTION_CAMERA.md`: world-to-screen mathematics
- `WORLD_MODEL_OCCUPANCY_PLACEMENT.md`: spatial truth and placement rules
- `RENDERING_DEPTH_OCCLUSION.md`: render bands and deterministic visibility
- `CONNECTIVITY_AUTO_TILING.md`: neighbor masks and connected variants
- `SIMULATION_TIME_RANDOMNESS_REPLAY.md`: deterministic execution rules
- `ACTORS_NAVIGATION_INTERACTIONS.md`: movement, reservations, and sockets
- `CHARACTERS_ANIMATION_HELD_PROPS.md`: presentation contracts for actors
- `ART_DIRECTION_PIXEL_SPEC.md`: original visual-language constraints
- `ASSET_PIPELINE_PROVENANCE_VALIDATION.md`: runtime asset admission gates
- `OPERATIONS_ADAPTER_UI_SAFETY.md`: control-plane integration boundary
- `TESTING_ACCEPTANCE_BUDGETS.md`: release evidence and budgets
- `IMPLEMENTATION_PLAN.md`: gated vertical delivery sequence
- `RESEARCH.md`: primary projects and documentation used for engineering study
- `schemas/*.schema.json`: machine-readable world and asset vocabulary
- `fixtures/*.json`: canonical valid examples for implementation tests
- `apps/web/src/features/office-v2/foundation.ts`: executable layer vocabulary
- `scripts/office-v2-clean-room-check.mjs`: repository isolation guard

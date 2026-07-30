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

Only the documented boundaries, a data-free development lab, and repository
guards exist. No renderer library or production asset pipeline has been chosen.

## Source of truth

- `FOUNDATIONS.md`: concepts and invariants the implementation must understand
- `IMPLEMENTATION_PLAN.md`: gated vertical delivery sequence
- `RESEARCH.md`: primary projects and documentation used for engineering study
- `apps/web/src/features/office-v2/foundation.ts`: executable layer vocabulary
- `scripts/office-v2-clean-room-check.mjs`: repository isolation guard

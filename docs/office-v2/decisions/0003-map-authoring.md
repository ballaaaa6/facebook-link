# Decision 0003 — Canonical Office JSON with Optional Editor Adapters

- Status: accepted
- Date: 2026-07-31
- Owners: world and asset pipeline

## Context

The runtime needs stable identities, arbitrary footprints, structural edges,
zones, sockets, and versioned validation. Editor-specific files contain useful
authoring metadata but may also contain pixels, free-form offsets, and tool
semantics that should not become simulation truth.

## Options considered

- Runtime reads Tiled JSON/TMX directly: convenient but couples the engine to an
  editor format and permits unowned properties.
- Custom visual room editor now: too much scope before the first slice.
- Canonical project JSON with adapters: explicit, testable, and editor-neutral.

## Decision

Use `office-world-v1` JSON validated by project schemas as the only runtime world
format. Hand-authored fixtures are permitted. Tiled 1.12.2 may be evaluated
later as an authoring tool through a deterministic converter; its export is
never consumed directly by runtime.

The foundation includes no room editor. Every imported property must map to a
canonical field or fail conversion.

## Consequences

The first slice can start without an editor dependency. Later adapters record
tool and converter versions, input and output hashes, and diagnostics. Changing
authoring tools does not migrate runtime worlds.

## Evidence

World, entity, and structure schemas; valid and invalid world fixtures; and the
knowledge gate.

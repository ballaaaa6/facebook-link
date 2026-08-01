# Decision 0014 — V2 Runtime World and Scene Compilation Boundary

- Status: accepted
- Date: 2026-08-02
- Owners: contracts, world, and projection

## Context

Decision 0003 records the historical V1 map-authoring boundary. It deliberately
does not define the renderer-neutral runtime world needed by the clean-room V2
first-floor slice. The scene compiler needs one explicit input contract, one
floor-local output contract, and one report that makes reference closure and
canonical hashes auditable.

## Decision

Adopt the following versioned V2 boundary:

- `office-scene-plan-v1` is the authoring input. It names a versioned scene and
  building, maps each floor to an exact room template, declares reserved stair
  and lift cores, and declares which authoring collections are unordered.
- `office-world-v2-v1` is a renderer-neutral, floor-local output. It owns
  bounds, room references, actor capacity, floor-local facility occupancy,
  reserved cores, and portal references. It contains no site cells, pixels,
  CSS offsets, renderer branches, or character identities.
- `office-compiled-building-v1` composes the independent floor worlds with a
  presentation-only site envelope. Site sidewalk, road, curb, planting, and
  backdrop context cannot enter world occupancy, pathfinding, capacity, or
  interaction truth.
- `office-compilation-report-v1` records the compiler version, source-plan
  hash, canonical world hash, complete reference graph, and stable diagnostics.
- The compiler rejects unresolved references, duplicate or array-index-derived
  IDs, unsupported semantic variants, site occupancy leaks, and direct V1
  world input. It never infers identity from array position, elevation, or a
  generic `worldId`.

Canonical bytes use `office-canonical-json-v1`, and domain-separated hashes use
`office-sha256-envelope-v1`. Ordered arrays preserve authoring order; arrays
declared unordered are normalized by a unique total key before hashing.

## Consequences

The target floor can be compiled twice in clean directories and compared by
bytes and hashes without starting a renderer or simulation reducer. Reordering
authoring collections is harmless when the contract declares them unordered,
while a semantic field change is visible in the source and world hashes.

Historical V1 schemas and fixtures remain frozen evidence and are not accepted
as V2 runtime world input.

This decision does not authorize persistent save/load, actors, queues,
simulation, rendering, or visual assets. Those remain downstream gates.

## Evidence

`SCENE_COMPOSITION_GRAMMAR.md`, the four V2 scene/world schemas, the target-floor
fixture, the compiler unit tests, and the knowledge runner provide the bounded
T1 evidence for this decision.

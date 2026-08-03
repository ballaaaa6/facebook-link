---
name: compose-office-v2-room
description: Compose and validate an Office V2 room or scene plan through authoritative floor, geometry, room-template, world, and scene-bundle contracts. Use for room layout, circulation, facility placement, asset references, or renderer-neutral composition.
---

# Compose Office V2 Room

Read `AGENTS.md`, `docs/office-v2/README.md`,
`docs/office-v2/ROOMS_SURFACES_STRUCTURES_ZONES.md`,
`docs/office-v2/MAP_AUTHORING_AND_IMPORT.md`, and
`docs/office-v2/SCENE_COMPOSITION_GRAMMAR.md`. Run
`node .agents/skills/build-office-v2-engine/scripts/preflight.mjs` and stop on
failure.

1. Author a versioned `office-room-template-v1` against an explicit floor
   reference. Declare bounds, legal entrances, required facility groups,
   capacity, actor and prop slots, circulation, adjacency, focal points,
   density, and decoration in the document described by
   `docs/office-v2/schemas/room-template.schema.json`.
2. Resolve every placed definition through
   `docs/office-v2/schemas/geometry.schema.json`,
   `definition-bundle.schema.json`, and `entity-definition-v2.schema.json`.
   Preserve geometry-owned footprint, blocking cells, clearance, approach
   cells, orientations, sockets, and use slots. Validate with
   `validateRoomTemplate` from
   `packages/office-v2-world/src/room-template-validation.ts` and use
   `packages/office-v2-world/test/room-template-validation.test.ts` as the
   focused contract evidence.
3. Compile a renderer-neutral scene plan with `compileScenePlan` from
   `packages/office-v2-world/src/scene-plan-compiler.ts`. Validate
   `scene-plan.schema.json`, `world-v2.schema.json`,
   `compiled-building.schema.json`, `compilation-report.schema.json`, and
   `scene-bundle.schema.json`; run
   `packages/office-v2-world/test/scene-plan-compiler.test.ts` and
   `npm run check`.
4. Keep room templates and scene plans as composition inputs. Do not put actor
   identity, occupancy, reservations, queues, interaction lifecycle, or
   facility state in pixels, decorations, CSS, or renderer code. Do not derive
   IDs from array positions, infer floors from elevation, use `latest`, or add
   scene-specific offsets. Keep asset catalog and scene-bundle references
   versioned and set `missingAssetPolicy` to `fail-closed`.
5. Stop on missing floor or geometry authority, dangling or wrong-version
   references, blocked or unreachable entrances/facilities, capacity or
   circulation violations, prop overlap, decoration navigation impact, site
   occupancy leakage, unsupported orientation/connectivity, or any failed
   schema/compiler diagnostic. Do not repair a failure with a visual fallback;
   fix the owning contract or report the blocked composition.

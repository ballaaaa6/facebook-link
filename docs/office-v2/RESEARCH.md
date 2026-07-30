# Office Engine V2 Research Index

Use primary documentation and source repositories. Study architecture and
engineering techniques; do not copy protected visual identity or game content.

## Simulation architecture

- [OpenRCT2](https://github.com/OpenRCT2/OpenRCT2) — long-lived deterministic
  simulation, entity systems, maps, and save compatibility.
- [OpenTTD](https://github.com/OpenTTD/OpenTTD) — tile-world simulation,
  pathfinding, commands, and separation between game state and presentation.
- [CorsixTH](https://github.com/CorsixTH/CorsixTH) — room-object placement,
  interaction points, animation-oriented objects, and management-sim behavior.
- [FreeSO](https://github.com/riperiperi/FreeSO) — object interactions, avatars,
  routing, and client-side simulation for an isometric social world.

## Rendering and maps

- [PixiJS](https://github.com/pixijs/pixijs) — maintained WebGL/WebGPU 2D
  renderer with a scene graph, asset loading, interaction, and batching.
- [PixiJS skills](https://github.com/pixijs/pixijs-skills) — official agent
  guidance to review if PixiJS is selected for implementation.
- [Tiled](https://github.com/mapeditor/tiled) and its
  [object-layer manual](https://doc.mapeditor.org/en/stable/manual/objects/) —
  map data, custom properties, object layers, templates, and export structure.
- [Tiled custom properties](https://doc.mapeditor.org/en/stable/manual/custom-properties/),
  [terrains](https://doc.mapeditor.org/en/latest/manual/terrain/), and
  [tileset alignment](https://doc.mapeditor.org/en/stable/manual/editing-tilesets/) —
  typed authoring metadata, Wang-style connections, external tilesets, and
  bottom-aligned isometric objects.
- [Unity 2D Extras](https://github.com/Unity-Technologies/2d-extras) — reference
  implementations for grid brushes, tile rules, and 2D authoring concepts.
- [Godot TileMap documentation](https://docs.godotengine.org/en/stable/tutorials/2d/using_tilemaps.html) —
  independent render, collision, navigation, occlusion, and terrain layers.
- [OpenTTD viewport source](https://docs.openttd.org/source/d3/d91/viewport__func_8h) —
  sortable world bounds and parent/child sprite groups for complex occlusion.

## State, pathfinding, and verification

- [XState](https://github.com/statelyai/xstate) — explicit state machines and
  actor-model concepts; use as a design reference before adding a dependency.
- [EasyStar.js](https://github.com/prettymuchbryce/easystarjs) — compact A* grid
  pathfinding reference suitable for evaluating route contracts.
- [fast-check](https://github.com/dubzzz/fast-check) — property-based testing for
  projection, path legality, bounds, and deterministic invariants.
- [Playwright](https://playwright.dev/docs/intro) — browser interaction,
  responsive screenshots, and accessibility-oriented web testing.
- [pixelmatch](https://github.com/mapbox/pixelmatch) — small visual-difference
  primitive for reviewed screenshot gates.

## Pixel production

- [Aseprite documentation](https://www.aseprite.org/docs/) and
  [CLI reference](https://www.aseprite.org/docs/cli/) — layers, tags, slices,
  sprite sheets, JSON metadata, and deterministic batch-export concepts.

## Data validation

- [JSON Schema Draft 2020-12](https://json-schema.org/draft/2020-12) — canonical
  schema dialect for Office definitions and fixtures.
- [Ajv](https://ajv.js.org/json-schema.html) — Node validator used by repository
  gates, with the Draft 2020-12 entry point explicitly selected.

## Research rule

For every dependency candidate, record the exact version, license, maintenance
state, bundle/runtime cost, and reason for choosing or rejecting it at the time
of adoption. A useful repository is evidence to study, not automatic permission
to install it.

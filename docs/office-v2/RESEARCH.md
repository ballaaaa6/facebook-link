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
- [Unity 2D Extras](https://github.com/Unity-Technologies/2d-extras) — reference
  implementations for grid brushes, tile rules, and 2D authoring concepts.

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

- [Aseprite documentation](https://www.aseprite.org/docs/) — layers, tags,
  slices, sprite sheets, and animation-export concepts.

## Research rule

For every dependency candidate, record the exact version, license, maintenance
state, bundle/runtime cost, and reason for choosing or rejecting it at the time
of adoption. A useful repository is evidence to study, not automatic permission
to install it.

# Office Engine V2 Research and Knowledge Acquisition Plan

## Purpose

Office V2 already has enough general game-engine knowledge to begin its pure
world kernel. The remaining problem is turning that knowledge into project-owned
contracts, authoring tools, deterministic fixtures, and acceptance gates so a
new asset family can be created once and assembled without scene-by-scene fixes.

The target visual category is an original **2:1 dimetric/isometric pixel-art
management simulation**, or more briefly a **2:1 isometric pixel-art office
simulation**. Genre references explain readability and density; they do not
authorize copying a proprietary game's pixels, layout, characters, UI, palette,
branding, data, offsets, or implementation.

Research is evidence, not dependency approval. Every adopted tool or library
must still pass `DEPENDENCY_LEDGER.md` and an applicable decision record.

## Direct engineering sources

### Renderer, scene graph, assets, and input

- [PixiJS scene graph](https://pixijs.com/8.x/guides/concepts/scene-graph),
  [render layers](https://pixijs.com/8.x/guides/concepts/render-layers), and
  [performance guidance](https://pixijs.com/8.x/guides/concepts/performance-tips)
  inform the renderer-port benchmark, stable render bands, static/dynamic scene
  separation, batching, and lifecycle tests.
- [PixiJS Assets](https://pixijs.com/8.x/guides/components/assets),
  [textures](https://pixijs.com/8.x/guides/components/textures), and
  [culling](https://pixijs.com/8.x/guides/components/application/culler-plugin)
  inform versioned bundles, atlases, texture metadata, explicit load/unload,
  and target-floor culling. Office V2 still owns missing-asset failure.
- [PixiJS events](https://pixijs.com/8.x/guides/components/events) informs
  pointer and touch behavior. Semantic world queries remain authoritative for
  picking; alpha or hit areas are presentation aids.
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) is
  the zero-library comparison candidate. It receives the same snapshot, camera,
  depth, picking, and cleanup contract as PixiJS.

These sources must produce the Phase 4 renderer port, benchmark implementation,
numeric result, and superseding renderer decision. They do not choose PixiJS in
advance.

### Map and room authoring

- [Tiled introduction](https://doc.mapeditor.org/en/stable/manual/introduction/),
  [custom properties](https://doc.mapeditor.org/en/stable/manual/custom-properties/),
  [objects](https://doc.mapeditor.org/en/stable/manual/objects/), and
  [templates](https://doc.mapeditor.org/en/stable/manual/using-templates/)
  inform optional typed authoring for buildings, floors, rooms, zones,
  structure edges, entity instances, and vertical connectors.
- [Tiled terrain sets](https://doc.mapeditor.org/en/latest/manual/terrain/),
  [JSON format](https://doc.mapeditor.org/en/stable/reference/json-map-format/),
  and [layer coordinates](https://doc.mapeditor.org/en/stable/manual/layers/)
  inform connected variants and the converter boundary.
- [Godot TileMap guidance](https://docs.godotengine.org/en/stable/tutorials/2d/using_tilemaps.html)
  and [Unity 2D Extras](https://github.com/Unity-Technologies/2d-extras) are
  secondary references for keeping render, collision, navigation, occlusion,
  and terrain concerns independent.

Tiled is optional authoring input, never runtime truth. A pinned converter must
translate editor data to canonical Office JSON, convert projected/editor
coordinates to world cells, reject unknown classes, sort stable identifiers,
and hash both input and output. Editor pixel offsets never become simulation
coordinates.

### Sprite and asset production

- [Aseprite CLI](https://www.aseprite.org/docs/cli/),
  [sprite sheets](https://www.aseprite.org/docs/sprite-sheet/),
  [slices and pivots](https://www.aseprite.org/docs/slices/), and
  [export API](https://www.aseprite.org/api/command/ExportSpriteSheet) inform a
  deterministic export recipe using versioned source files, palette, layers,
  tags, slices, PNG output, and JSON metadata.

Source slices may carry pivot and ground-contact metadata. Interaction sockets
remain explicit in the Office manifest. A tool export is admitted only after
hash, geometry, alpha, frame, palette, clip, socket, seam, contact-sheet, atlas,
registry, provenance, commercial, and visual checks pass.

### State, pathfinding, commands, and replay

- [XState transitions](https://stately.ai/docs/transitions),
  [guards](https://stately.ai/docs/guards),
  [actors](https://stately.ai/docs/actors), and
  [testing](https://stately.ai/docs/testing) inform state/event/guard/action,
  entry/exit/cancel, and mailbox vocabulary. The first interaction reducer stays
  project-owned; a dependency is not required merely to use those principles.
- [EasyStar.js](https://github.com/prettymuchbryce/easystarjs) is an independent
  comparison oracle for grid costs and directional restrictions. Runtime still
  begins with the accepted deterministic four-way A* and project-owned tie-break.
- [OpenRCT2 ReplayManager](https://github.com/OpenRCT2/OpenRCT2/blob/develop/src/openrct2/ReplayManager.h)
  and [OpenTTD command model](https://github.com/OpenTTD/OpenTTD/blob/master/src/command_func.h)
  inform initial snapshot/version, tick-stamped command IDs, seeded streams,
  periodic state hashes, first-divergence reporting, and validate/apply separation.

These sources must result in real reducer-produced replay hashes, not sample hash
strings, plus crowd and cancellation fixtures that replay byte-identically.

### Verification and accessibility

- [fast-check configuration](https://fast-check.dev/docs/configuration/) and
  [model-based testing](https://fast-check.dev/docs/advanced/model-based-testing/)
  inform reproducible seeded tests for projection inverse, rotation, placement,
  occupancy order, routing, reservations, cancellation, and replay.
- [Playwright visual comparisons](https://playwright.dev/docs/test-snapshots),
  [emulation](https://playwright.dev/docs/emulation), and
  [accessibility testing](https://playwright.dev/docs/accessibility-testing)
  inform locked seed/tick/camera/animation/clock captures, viewport evidence,
  keyboard tests, and reviewed golden updates.
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/),
  [keyboard access](https://www.w3.org/WAI/WCAG22/Understanding/keyboard),
  [use of color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color), and
  [reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow) inform DOM and
  keyboard equivalents, non-color status cues, reduced motion, and responsive
  inspector parity.

Geometric assertions remain separate from screenshot comparison. Golden images
are accepted only in one recorded environment with a named human reviewer.

## Indirect architecture studies

These projects are useful for questions and patterns, not for importing their
runtime code or content into Office V2.

- [OpenRCT2](https://github.com/OpenRCT2/OpenRCT2) and
  [OpenTTD](https://github.com/OpenTTD/OpenTTD): deterministic commands, maps,
  long-running simulation, replay, saves, migrations, and performance.
- [CorsixTH room base](https://raw.githubusercontent.com/CorsixTH/CorsixTH/master/CorsixTH/Lua/room.lua),
  [staff room](https://raw.githubusercontent.com/CorsixTH/CorsixTH/master/CorsixTH/Lua/rooms/staff_room.lua),
  [object base](https://raw.githubusercontent.com/CorsixTH/CorsixTH/master/CorsixTH/Lua/entities/object.lua),
  and [use-object action](https://raw.githubusercontent.com/CorsixTH/CorsixTH/master/CorsixTH/Lua/humanoid_actions/use_object.lua):
  room minimums, required and optional objects, capacity, entrance and queue,
  footprints, approach positions, reservations, use, and cancellation cleanup.
- [FreeSO project structure](https://github.com/riperiperi/FreeSO/wiki/Project-structure):
  separation of simulation VM and presentation, command serialization,
  snapshots, room maps, routing, and static versus dynamic world data.

The usable output of a study is a neutral observation, project decision,
project schema, valid and rejected fixture, and original implementation test.
No source values, scene composition, behavior table, art, or branding becomes a
default merely because an open project uses it.

## Knowledge closure program

| Missing capability | Sources to study | Project-owned output required before bulk production | Acceptance evidence |
| --- | --- | --- | --- |
| Building, floors, exterior, and future vertical travel | Tiled typed objects and layers; Godot layer separation | building/floor/portal decision, schema, save boundary, exterior ownership | one-floor target fixture, two-floor portal fixture, rejected identifiers and invalid portal |
| Room program, capacity, and circulation | CorsixTH room/object patterns; Tiled templates | room-template and scene-plan schemas, required/optional facility rules, clearance and adjacency grammar | invalid capacity, blocked entrance, narrow aisle, deterministic composition fixtures |
| AutoPost-to-world choreography | repository workflow, agent catalog, feature flags, and operations adapter | operations snapshot V2, activity routing, roster/facility binding, fan-out/join contract | ten-role trace, duplicate-event rejection, disabled-role and unknown-role failures |
| Ten-to-fifteen actor crowds | deterministic A*, reservations, queues, state-machine cancellation | queue priority, capacity, timeout, target removal, deadlock policy, real replay hash | shared-facility queue, narrow-door contention, cancel, target removal, 15-actor replay |
| Measurable original visual language | Aseprite production metadata; target brief | style-profile schema with scale, palette roles, outlines, shadows, density, padding, and zoom | geometry board, palette board, character/furniture/door lineup, native-scale owner review |
| Repeatable asset factory | Aseprite CLI, Pixi asset and texture contracts | source recipe, family scaffold, atlas and catalog schemas, registry compiler, review-board generators | byte-identical rebuild, altered/missing file failure, alpha/socket/seam/clip/atlas checks |
| Reusable character identities | shared rig and slice metadata principles | character definition, identity layers, four facings, semantic clip map, ground contact and sockets | turnaround, seated/standing contacts, held-prop ownership, ten-identity lineup |
| Reusable furniture and structures | connectivity masks, room objects, interaction approaches | semantic variant key, render parts, interaction catalog, prop-slot ownership | workstation connectivity, door/window corners, occupied chair, monitor states, socket tests |
| Renderer and accessible UI | PixiJS, Canvas, Playwright, WCAG | renderer port, benchmark decision, DOM inspector and input parity | 1/10/15/25/50 actors, three viewports, context loss, cleanup, keyboard and reduced motion |

The roadmap owns sequencing. This table owns where each missing piece is learned
and what concrete repository evidence converts the research into usable
knowledge.

## Clean-room acquisition method

Apply the same process to every external technique:

```text
state one engineering question
-> inspect primary documentation or observable source behavior
-> record a neutral observation with source and license
-> write an Office-owned decision
-> write an Office-owned schema
-> add one valid and one rejected fixture
-> implement new code from the Office contract
-> prove deterministic and visual acceptance
```

Never acquire:

- Kairosoft or another game's pixels, maps, characters, UI, names, palettes,
  signature layout, scene offsets, animation timings, or extracted data;
- code from another branch, V1, Git history, or an external project without an
  explicit dependency and license decision;
- a generated full-scene image as a sprite sheet or map;
- an asset with missing source version, provenance, deterministic recipe,
  geometry, review evidence, or commercial approval;
- a random agent skill that silently chooses architecture or bypasses gates.

Reference images and generated whole-room concepts are mood and composition
inputs only. Runtime art is rebuilt as original transparent modular families so
floor, wall, door, furniture, character, prop, and effect layers can be placed,
validated, changed, and reused independently.

## Skill strategy

The repository skill `.agents/skills/build-office-v2-engine` remains the routing
authority now. Installing more general game-development skills does not close a
missing contract.

During Phase 5, after its underlying scripts and schemas exist, create three
small project skills that call those real tools rather than restating prose:

1. `author-office-v2-asset-family` scaffolds a brief, source, export recipe,
   manifest, contact sheets, and admission run.
2. `compose-office-v2-room` assembles accepted families through room templates,
   capacity, clearance, and deterministic decoration rules.
3. `review-office-v2-visuals` runs native-scale boards, target viewports,
   accessibility checks, golden comparison, and owner sign-off.

Review the [official PixiJS skills](https://github.com/pixijs/pixijs-skills) only
if PixiJS wins the Phase 4 renderer decision. Renderer-specific guidance cannot
override Office world, simulation, asset, accessibility, or clean-room rules.

## Dependency and rights rule

At adoption time, record exact version, integrity, license, maintenance state,
browser or Node support, bundle/runtime cost, alternatives, decision owner,
notices, and removal path in `DEPENDENCY_LEDGER.md`. Tool output and required
source-game assets need separate rights review; a tool or engine license does
not automatically license bundled art or data.

Tiled and Aseprite are authoring-tool candidates behind export boundaries, not
runtime dependencies. Open-source management games remain architecture studies
unless a later explicit decision approves a narrowly scoped dependency. Petdex
references remain prototype-only and `pending-commercial-review`.

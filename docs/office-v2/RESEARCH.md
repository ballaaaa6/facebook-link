# Office Engine V2 Research and Knowledge Acquisition Plan

## Purpose

Office V2 has enough general game-engine knowledge for bounded pure-function
probes, but `KNOWLEDGE_COMPLETENESS_AUDIT.md` finds it is not yet safe to begin a
persistent world kernel, the large floor, target crowds, or production art. The
remaining work is turning the research into project-owned decisions, contracts,
authoring tools, deterministic fixtures, and acceptance gates so a new asset
family can be created once and assembled without scene-by-scene fixes.

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
coordinates. Tiled's isometric shape-object positions use a projected convention
based on tile height, so the Office 64-by-32 transform requires explicit fixtures.
The profile must pin map-format, tool, and project compatibility versions and
hash every project, template, external tileset, and class-registry dependency.

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

[RFC 8785 JSON Canonicalization Scheme](https://www.rfc-editor.org/rfc/rfc8785.html)
is the primary candidate for invariant JSON hashing. Office must either accept
it or record an equally precise alternative, including number constraints,
recursive property ordering, array-order ownership, encoding, and negative-zero
behavior from the [verified errata](https://www.rfc-editor.org/errata/rfc8785).
Office also needs a separate semantic normalization contract for collections
declared unordered; `JSON.stringify` alone is not the replay contract.

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

### Browser and renderer lifecycle

- [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)
  normally pauses in background tabs and the
  [Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API)
  documents background throttling. A project lifecycle port, not browser
  timers, owns pause, reconcile, coalesce, and resume behavior.
- [HTML page transitions](https://html.spec.whatwg.org/multipage/nav-history-apis.html)
  require explicit `pagehide` and `pageshow` handling for bfcache restores.
  Restored heaps must refresh and resubscribe without duplicate listeners,
  pollers, intents, animation loops, or operations events.
- The [WebGL specification](https://registry.khronos.org/webgl/specs/latest/1.0/index.html)
  and [WEBGL_lose_context](https://registry.khronos.org/webgl/extensions/WEBGL_lose_context/)
  make context loss and restoration testable. Restored contexts require
  registry-driven resource recreation while world and simulation state remain
  unchanged.
- Playwright screenshot baselines are environment-specific. The capture
  protocol must freeze the Office tick, seed, camera, assets, fonts, browser,
  viewport, DPR, renderer and preferences; a normal test run never updates a
  golden.

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
- [Unknown Horizons world objects](https://github.com/unknown-horizons/unknown-horizons/blob/master/horizons/util/worldobject.py),
  [scheduler](https://github.com/unknown-horizons/unknown-horizons/blob/master/horizons/scheduler.py),
  and [build command](https://github.com/unknown-horizons/unknown-horizons/blob/master/horizons/command/building.py):
  stable world IDs, deterministic tick scheduling, stable application order,
  and placement revalidation when a command executes.
- [Widelands command queue](https://github.com/widelands/widelands/blob/master/src/commands/cmd_queue.h),
  [worker tasks](https://github.com/widelands/widelands/blob/master/src/logic/map_objects/tribes/worker.h),
  and [request model](https://github.com/widelands/widelands/blob/master/src/economy/request.h):
  deterministic command order, explicit worker tasks and homes, capability
  requests, ownership, transfer cancellation, and persisted pending commands.
- [KeeperRL task map](https://github.com/miki151/keeperrl/blob/master/task_map.h),
  [tasks](https://github.com/miki151/keeperrl/blob/master/task.h), and
  [level links](https://github.com/miki151/keeperrl/blob/master/level.h):
  task identity, ownership, priority, transfer and cancellation separated from
  level and landing-point identity.
- [OpenRA map format](https://github.com/OpenRA/OpenRA/wiki/Map-format) and
  [trait reference](https://docs.openra.net/en/release/traits/): versioned map
  packages, upgrade tooling, named actors, cell and sub-cell positions, and
  composable data-defined capabilities with explicit dependencies.

The usable output of a study is a neutral observation, project decision,
project schema, valid and rejected fixture, and original implementation test.
No source values, scene composition, behavior table, art, or branding becomes a
default merely because an open project uses it.

The game/codebase survey is now broad enough for the target architecture. More
unbounded browsing is not a readiness gate. The next research occurs only to
answer a named unresolved decision or evaluate a bounded tool candidate.

## Knowledge closure program

| Missing capability | Sources to study | Project-owned output required before bulk production | Acceptance evidence |
| --- | --- | --- | --- |
| Building, floors, exterior, and future vertical travel | Tiled typed objects and layers; Godot layer separation | building/floor/portal decision, schema, save boundary, exterior ownership | one-floor target fixture, two-floor portal fixture, rejected identifiers and invalid portal |
| Room program, capacity, and circulation | CorsixTH room/object patterns; Tiled templates | room-template and scene-plan schemas, required/optional facility rules, clearance and adjacency grammar | invalid capacity, blocked entrance, narrow aisle, deterministic composition fixtures |
| AutoPost-to-world choreography | repository workflow, agent catalog, feature flags, and operations adapter | operations snapshot V2, activity routing, roster/facility binding, fan-out/join contract | ten-role trace, duplicate-event rejection, disabled-role and unknown-role failures |
| Ten-to-fifteen actor crowds | deterministic A*, reservations, queues, state-machine cancellation | queue priority, capacity, timeout, target removal, deadlock policy, real replay hash | shared-facility queue, narrow-door contention, cancel, target removal, 15-actor replay |
| Measurable original visual language | Aseprite production metadata and official tutorials for palette, color, animation, layers, tags, and slices; target brief; original office/material reference set; the bounded W4.3 3D-assisted candidate | style-profile schema with scale, palette roles, outlines, shadows, density, padding, and zoom; a recorded authoring-method decision | geometry board, palette board, character/furniture/door lineup, native-scale owner review, and original-material authoring experiment |
| Repeatable asset factory | Aseprite CLI, Pixi asset and texture contracts | source recipe, family scaffold, atlas and catalog schemas, registry compiler, review-board generators | byte-identical rebuild, altered/missing file failure, alpha/socket/seam/clip/atlas checks |
| Reusable character identities | shared rig and slice metadata principles | character definition, identity layers, four facings, semantic clip map, ground contact and sockets | turnaround, seated/standing contacts, held-prop ownership, ten-identity lineup |
| Reusable furniture and structures | connectivity masks, room objects, interaction approaches | semantic variant key, render parts, interaction catalog, prop-slot ownership | workstation connectivity, door/window corners, occupied chair, monitor states, socket tests |
| Renderer and accessible UI | PixiJS, Canvas, Playwright, WCAG | renderer port, benchmark decision, DOM inspector and input parity | 1/10/15/25/50 actors, three viewports, context loss, cleanup, keyboard and reduced motion |

The roadmap owns sequencing. This table owns where each missing piece is learned
and what concrete repository evidence converts the research into usable
knowledge.

## Research closure slices before Phase 3/T2

Status: planned. These slices make the next research work persistent and
auditable without expanding the Phase 2 boundary. Phase 2 remains authorized
to proceed with the accepted world contracts and is not blocked by these
studies. A slice becomes a prerequisite only for the later implementation unit
that consumes its result.

The source list below is a focused execution plan, not a request to browse
without a named question. Each slice must close into an existing canonical
owner; this section does not become a second owner for simulation, operations,
renderer, or accessibility rules.

### Closure matrix

| ID | Source focus | Bounded questions | Office receiving owners | Required closure evidence | Gate |
| --- | --- | --- | --- | --- | --- |
| RC-01 | [CorsixTH room/object model](https://github.com/CorsixTH/CorsixTH), limited to room prerequisites, capacity, approach/waiting positions, queueing, use, and cancellation | How are facility capacity, approach cells, waiting positions, queue order, target removal, and terminal cleanup represented? Which observations are useful for an Office facility without copying game-specific rules? | `ROOMS_SURFACES_STRUCTURES_ZONES.md`, `JOBS_INTENTS_ASSIGNMENT.md`, `CROWD_QUEUES_AND_DEADLOCKS.md`; `facility-slot`, `queue-ticket`, `reservation`, and `action-queue` schemas | One valid and one rejected facility/queue fixture; one deterministic one-actor trace; one contention or cancellation trace; exact cleanup assertions | Before Phase 3/T2 facility and interaction implementation; expanded crowd evidence remains T3 |
| RC-02 | [FreeSO project structure](https://github.com/riperiperi/FreeSO/wiki/Project-structure), limited to simulation/presentation separation, object interaction, static/dynamic world data, commands, and snapshots | Which facts belong to immutable definitions, placed instances, mutable runtime state, and derived presentation? How does an interaction expose preconditions, progress, result, save, and restore without letting presentation commit simulation truth? | `DEFINITION_INSTANCE_RUNTIME_STATE.md`, `JOBS_INTENTS_ASSIGNMENT.md`, `SIMULATION_PIPELINE_COMMANDS.md`, `REPLAY_DEBUGGING_PLAYBOOK.md`; definition, instance, action, snapshot, and trace schemas | One interaction fixture with presentation disabled; one mid-action restore fixture; one rejected invalid-state fixture; identical reducer-produced trace/hash evidence | Before Phase 3/T2 interaction and replay implementation |
| RC-03 | [Widelands command/task/request model](https://github.com/widelands/widelands), [Unknown Horizons world objects/scheduler/build command](https://github.com/unknown-horizons/unknown-horizons), limited to deterministic assignment, capability requests, ownership/home, target revalidation, pending work, and cancellation | How are jobs assigned by capability rather than visual identity? How are stable IDs, priorities, target changes, pending commands, and ownership preserved across retries and restore? Which rules are useful for the AutoPost office and which are rejected as out of scope? | `JOBS_INTENTS_ASSIGNMENT.md`, `SIMULATION_PIPELINE_COMMANDS.md`, `SAVE_SNAPSHOT_MIGRATION.md`, `REPLAY_DEBUGGING_PLAYBOOK.md`; intent, command, queue, snapshot, and migration contracts | Reordered-equivalent assignment fixture; unavailable/removed-target fixture; retry and cancellation fixture; restore/replay equality with real hashes | Before the W2/T2 assignment implementation; multi-actor queue and deadlock promotion remains T3 |
| RC-04 | [WAI-ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/), limited to semantic entity lists/inspectors, keyboard traversal, focus retention/fallback, and pointer/keyboard parity | Which semantic UI patterns make spatial entities inspectable without requiring a pointer? How should focus behave when a snapshot refreshes, an entity becomes stale, or the selected entity is removed? | `INPUT_PICKING_AND_DEBUG_OVERLAYS.md`, `OPERATIONS_ADAPTER_UI_SAFETY.md`, `RENDERER_QA_SPECIFICATION.md`; accessibility and lifecycle fixture schemas | Keyboard/pointer parity fixture; stale/removed entity focus fixture; long-label and reduced-motion cases; reviewed accessibility/lifecycle evidence | Before renderer accessibility and lifecycle acceptance in Phase 4/T4 |

### Required closure record

Every research slice must record all of the following before its status can
change from planned:

1. The engineering question and the bounded source scope.
2. Source URL, revision or observed date, license, and rights boundary.
3. Neutral observations, separated from Office decisions.
4. An explicit disposition: adopt, adapt, or reject, with the reason.
5. The existing canonical document and schema that own the adopted rule.
6. One valid fixture and one rejected fixture, including stable diagnostics.
7. The original implementation test and the acceptance command that proves it.
8. Any migration, dependency, or clean-room consequence.

If a study produces no rule, it must be recorded as `observed-only` or
`rejected`; a link or prose summary alone is not knowledge closure.

### Execution order and boundaries

1. Finish the Phase 2 world-kernel acceptance using the already accepted
   projection, geometry, topology, serialization, and hash contracts. RC-01
   through RC-04 are not Phase 2 entry or exit requirements.
2. Close RC-01, RC-02, and RC-03 before implementing the Phase 3/T2 behavior
   that depends on facilities, interactions, assignment, or replay. The slices
   may be studied in parallel, but each closes independently with its own
   evidence.
3. Close RC-04 before renderer accessibility and lifecycle implementation. It
   does not change the world or simulation contracts.
4. Update the receiving canonical document first, then its schema, fixtures,
   diagnostics, and implementation tests. Do not create a second summary file
   that owns the same rule.
5. Do not import external game code, maps, assets, behavior tables, branding,
   or scene values. Open-source game repositories remain architecture studies
   unless a separate dependency and license decision explicitly admits a
   narrowly scoped tool.
6. Run the focused evidence and `npm run check` after each closed slice. Only
   then may the readiness record reference the result.

## VIS-01 — Original visual production before Phase 5/T5

Status: planned. The existing art direction, character, furniture, geometry,
and asset-pipeline documents define the Office-owned contracts. VIS-01 adds the
bounded craft and authoring study needed to turn those contracts into original
production material. It does not replace `ART_DIRECTION_PIXEL_SPEC.md`, does
not select a renderer, and does not admit runtime assets.

### Sources and bounded questions

| Source or material | What it informs | Office-owned question |
| --- | --- | --- |
| [Aseprite tutorials](https://www.aseprite.org/docs/tutorial/) and [color/palette guide](https://www.aseprite.org/docs/tutorial/color-bar-tutorial/) | Palette handling, color roles, indexed color, animation review, and repeatable drawing workflow | What palette roles, contrast steps, color variance, and animation review rules make the warm Office style readable at native scale and supported zoom stops? |
| [Aseprite CLI](https://www.aseprite.org/docs/cli/), [sprite-sheet export](https://www.aseprite.org/docs/sprite-sheet/), and [slices](https://www.aseprite.org/docs/slices/) | Layer/tag/slice metadata, frame export, padding, JSON metadata, and scripted output | Which source layers, frame tags, slices, naming rules, and export arguments are required for deterministic character, furniture, and environment families? |
| Original office, furniture, material, lighting, and human-pose references | Silhouette, material edges, believable proportions, contact poses, and visual density without copying a game | Which real-world observations can be reconstructed into an original modular family while preserving the locked geometry, scale, lighting, and palette contract? Every retained reference needs provenance and rights status. |
| The existing W4.3 fixed-camera 3D-assisted/hybrid experiment, with an optional [Blender camera/render reference](https://docs.blender.org/manual/en/latest/render/cameras/index.html) | A bounded comparison between hand-pixel, fixed-camera 3D-assisted, and hybrid authoring | Which method minimizes revision cost and geometry/facing drift for this family? Do not select one method for every family by assumption; the experiment must use original test material and record the losing alternatives. |

### Required VIS-01 outputs

VIS-01 closes only when the following project-owned evidence exists:

1. An approved or explicitly rejected numeric style profile covering native
   pixel density, palette roles, outline, light/shadow, detail density,
   transparent padding, and supported zoom stops.
2. A style board, palette board, character scale/turnaround board, furniture
   scale board, light/dark alpha board, and native-scale viewport review.
3. A character animation board covering idle, move, interact, blocked feedback,
   ground-contact stability, held-item attachment, and reduced-motion behavior.
4. One connected-workstation proof family with original source, provenance,
   export recipe, isolated/left-end/middle/right-end variants, geometry and
   socket registration, seated composite, catalog/bundle references, and review
   hashes.
5. A decision recording the winning authoring profile for that family, exact
   tool/version/dependencies, deterministic arguments, and the rejection or
   non-adoption reason for the alternatives.
6. One valid and one rejected evidence case for each applicable alpha, palette,
   frame, contact, socket, facing, clip, seam, provenance, and export rule.
7. Two clean builds with byte-identical outputs and a visual-owner review at
   native scale before any family is admitted to runtime.

### VIS-01 boundaries

- Game screenshots and open-source projects may inform readability, density,
  and production questions; they do not provide pixels, palettes, layouts,
  characters, animation timings, or runtime data.
- A generated or assisted whole-room image is a mood/composition reference,
  not a runtime sheet or map. Assisted material must record its brief or prompt,
  tool/model/version, selection, redraw or reconstruction, cleanup, source
  hash, and commercial review.
- Aseprite documentation informs a possible source profile; it does not admit
  Aseprite as a runtime dependency. The selected profile must still be recorded
  in `DEPENDENCY_LEDGER.md` with version, license, and removal path.
- VIS-01 is a Phase 5/T5 production-readiness input. It is not a Phase 2 entry
  or exit requirement, and it cannot be used to claim final pixels, renderer
  readiness, or a populated office.

### VIS-01 closure record

The closure record must name the bounded question, source URLs or reference
identifiers, observed revision/date, license and commercial status, neutral
observations, adopt/adapt/reject disposition, canonical receiving documents,
style/geometry boards, fixtures, exact diagnostics, clean-build hashes, and
the visual reviewer. If a source produces no Office rule, record it as
`observed-only` or `rejected` rather than leaving an unbounded recommendation.

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

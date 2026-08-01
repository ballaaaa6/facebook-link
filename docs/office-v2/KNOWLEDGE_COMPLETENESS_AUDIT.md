# Office Engine V2 Knowledge Completeness Audit

Status: audited on 2026-07-31; T0 gate evidence re-audited on 2026-08-01.
Re-audit after every Phase 1 closure wave.

## Purpose and authority

This document answers one question: does the repository contain enough proven
knowledge to build the complete first floor without discovering foundational
rules one sprite or component at a time?

It is an evidence audit, not a second owner for engine behavior. Canonical
domain documents own rules, `READINESS_MATRIX.md` owns implementation authority,
and `IMPLEMENTATION_PLAN.md` owns sequence. When this audit identifies a gap,
the gap is closed in the named canonical document, schema, fixture, and tool.

The audit inspected the complete clean-room Office V2 pack, all schemas,
fixtures, templates and validation scripts, the empty V2 runtime boundary, and
the current AutoPost workflow and agent catalog. It did not inspect V1, legacy
Office code, other branches, Git history, or proprietary game data.

## Executive verdict

**No-go** for the large first-floor map, bulk furniture or character production,
renderer integration, or a production 10-to-15-actor office.

**Go** only for Phase 1 contract closure and tightly bounded disposable or pure
geometric probes. Three narrow areas are close enough for such probes:

- the forward 2:1 projection;
- a simple four-neighbor connectivity-mask resolver;
- single-actor four-direction A*.

T0 now passes: the foundation gate reports only the schema-shape, bounded
semantic, and exact-diagnostic evidence that it executes. This correction does
not change the no-go decision for persistent engine work or production content.

The pack is a strong architectural foundation, but it is not yet the desired
production system:

```text
approved family source
-> deterministic export
-> geometry and pixel validation
-> catalog registration
-> room-template placement
-> canonical scene compilation
-> deterministic simulation and replay
-> runtime load with no local offsets or fallback
```

The missing work is not another general tutorial or a larger pile of prose. It
is project-owned decisions, unambiguous data authority, schemas, valid and
rejected fixtures, semantic compilers, and executable acceptance evidence.

No engineering process can guarantee zero revisions. The achievable standard
is that revisions stay inside a declared family or contract instead of forcing
scene-specific offsets, renderer branches, save rewrites, or repeated fixes to
every placed instance.

## Target being audited

The accepted target is an original **2:1 dimetric/isometric pixel-art office
management simulation** with:

- one large ground floor and visible street or site context;
- ten assigned AutoPost role stations and capacity for fifteen actors;
- work, review, meeting, pantry, lounge, reliability, entrance, circulation,
  and reserved future vertical-circulation areas;
- reusable characters, furniture, structures, props, and interactions;
- operational records as truth and the office as a deterministic presentation;
- a future second floor that does not require changing first-floor identity,
  coordinates, saves, or asset contracts.

Reference images define mood, density, and readability only. They do not define
runtime geometry and cannot be cut into a map or sprite library.

## Evidence scale

A topic is evaluated by its strongest real evidence, not by the number of files
that mention it.

| Level | Meaning | Production implication |
| --- | --- | --- |
| E0 | Absent | The project would invent the rule during implementation |
| E1 | Principle named | Useful vocabulary, but different implementers may disagree |
| E2 | Explicit project contract | Expected behavior is written but not machine enforced |
| E3 | Schema and representative examples | Data shape is constrained; cross-record behavior may still be wrong |
| E4 | Executable invariant with correct failure diagnostics | A narrow behavior is implementation-ready |
| E5 | Integrated vertical-slice proof | Producer, compiler, runtime, cleanup, and failure path agree |
| E6 | Target-sized acceptance evidence | The rule survives the complete floor and 15-actor load |
| E7 | Production evidence | Pilot device, lifecycle, migration, accessibility, and review pass |

Bulk production requires E5 in every upstream asset and world dependency. The
large floor requires E6 in composition, navigation, queues, operations, replay,
and performance. A schema alone is E3 at most.

## Current evidence inventory

| Domain | Current evidence | Candid result |
| --- | --- | --- |
| Product and game loop | E2 | Product intent and non-goals are clear; exact spatial program is not compiled |
| First-floor target | E2 | Capacity and zones are named; no target geometric fixture exists |
| Forward 2:1 projection | E4, narrow | Five integer-cell examples support a pure function only |
| Sub-cell positions, inverse picking, and camera | E2 | Coordinate units, diamond-edge ambiguity, zoom, fit, crop, and negative bounds lack executable evidence |
| Placement and occupancy | E4, narrow | A few rotation, clearance, and overlap cases do not cover the documented rules |
| Surfaces, structures, zones, and cutaways | E3 overall with narrow E4 door traversal | Both definitions validate and all three structure-traversability cases execute, including collision independence from a cutaway visibility flag; cutaway rendering, zone semantics, structural normalization, and room integration remain absent |
| Building, floors, exterior, and portals | E1 | No accepted decision, schema, migration, or two-floor contract fixture |
| Room templates and scene composition | E1 | No capacity, adjacency, entrance, density, or deterministic compiler contract |
| Connectivity | E4, narrow | Basic masks work; rotations, geometry, semantic state, and seam continuity are unproved |
| Definition, instance, and runtime state | E1 | The layers are implied but not separately contracted or version-pinned |
| Facilities and use slots | E1 | Capacity is named; slot allocation, capability, queue, and mutable state are absent |
| Interaction lifecycle | E3-E4, narrow | All three sample cases execute through a shallow duration/cancel/timeout truth table; there is no reducer, acquisition, queue, or cleanup lifecycle proof |
| Fixed ticks, commands, and phase order | E2 | Ten hertz is fixed; within-tick subsystem and same-tick command order are not |
| Randomness and replay | E3, shape only | No reducer produces the sample hashes; canonical serialization and PRNG algorithm are open |
| Single-actor navigation | E4, narrow | The versioned path oracle executes six steps at 100 units per step and asserts final cost 600; movement, replanning, and crowds remain unproved |
| Crowds, queues, fairness, and deadlocks | E1 | Current accepted navigation scope explicitly excludes the target crowd |
| Jobs, intents, assignment, and preemption | E0-E1 | Operations status would otherwise become per-role animation special cases |
| Save and migration | E2 | No migration registry, mid-action restore fixture, or executable round trip |
| Operations adapter V1 | E3-E4, lab only | Suitable for the data-free status lab, not authoritative choreography |
| Operations adapter V2 and roster binding | E1 | No durable cursor, role/instance split, fan-out/join, capability binding, or ten-role trace |
| Character animation | E3, shape only | No character-definition schema, seated contract, per-frame contacts, or complete clip fixture |
| Character production | E2 | No identity-layer decision, rig proof, asymmetric-facing policy, or admitted character |
| Furniture production | E2-E3, fragments | Geometry authority, render parts, semantic variants, and composite evidence are unresolved |
| Numeric visual style | E1 | Scale, palette, outlines, lighting, padding, tolerances, and zoom stops remain pending |
| Asset provenance and admission | E4, basic only | The gate checks paths, hashes, PNG signature and dimensions, not actual pixel or geometry promises |
| Atlas, catalog, bundle, and load lifecycle | E0-E1 | No contracts, compiler, orphan detection, unload, or recovery proof |
| Map authoring and import | E2 | No pinned profile, converter, canonical report, or invalid-input suite |
| Depth and occlusion | E3-E4, narrow | Simple band sorting passes; tall and multipart objects can still occlude actors incorrectly |
| Renderer | E2, intentionally deferred | No port, benchmark, lifecycle proof, or selection exists |
| Diagnostics and debug tools | E2 plus narrow E4 checks | The three current rejected fixtures match exact stable codes; no diagnostic catalog/schema, replay diff, bug bundle, or trace viewer exists |
| Accessibility and responsive behavior | E2 | No executable canvas-to-DOM semantic or 15-actor keyboard strategy |
| Performance | E2 | No pinned pilot hardware and no measured numeric budget |
| Complete runtime floor | E0 by design | The V2 mount is empty and no runtime assets are admitted |

No whole domain is at production evidence. Existing `Ready for Phase` rows refer
to bounded implementation authority, not readiness for the target floor.

### T0 closure record — 2026-08-01

The knowledge gate now computes and reports its evidence instead of relying on
manual totals:

- 68 inventoried knowledge files, 12 loaded schemas, and all 15 registered
  fixture files producing explicit evidence;
- all 26 declared semantic cases executed exactly once, including the three
  previously skipped structure-traversability cases; the cutaway case proves
  only that a presentation flag does not change collision;
- the preserved navigation V1 fixture plus a new V2 oracle that asserts six
  steps, cardinal and heuristic units of 100, and final cost 600;
- exact matches for `asset.commercial-review`,
  `connectivity.missing-variant`, and `world.occupied`;
- adversarial evidence that a wrong expected diagnostic and an unhandled new
  fixture case fail the harness;
- per-invocation state isolation, proven by a failed temporary run followed by
  a passing repository run in the same process;
- schema-shaped replay evidence reported separately from reducer/replay
  evidence, which remains zero; property/model evidence also remains zero until
  its pinned dependency profile is admitted and executed.

This is T0 only. It does not prove pointer picking, crowd behavior, real state
hashes, a reproducible asset factory, or any target-floor behavior.

### Semantic schema smoke test

During the audit, four copies of currently valid fixtures were mutated into
states that should be rejected by the intended rules. All four still passed
their individual JSON Schemas:

| Mutation accepted by the current schema | Missing semantic evidence |
| --- | --- |
| Duplicate world entity IDs and duplicate surface cells | collection uniqueness and occupancy identity |
| A globally stale operations snapshot containing a working actor | freshness-to-state consistency |
| `assetFamilyVersion` without `assetFamilyId` | dependent-field integrity |
| Duplicate simulation trace input IDs | command/event idempotency and uniqueness |

Other cross-record invariants still outside JSON Schema validation include
dangling definition IDs, out-of-bounds zone cells, duplicate sockets and
connectivity masks, unsupported surfaces or orientations, nonexistent target
sockets, asset/entity geometry disagreement, unordered state hashes, and
malformed reservation resource keys. These belong in the semantic linter and
behavior gates, not in prose.

## P0 contradictions and rework traps

These must be resolved before persistent engine or production-art work. They
are not cosmetic documentation issues.

### One fact currently has several possible owners

Footprint, render height, anchors, sockets, approaches, and variants appear
across entity, asset, interaction, and connectivity contracts. No cross-contract
validator proves that they agree. A desk can therefore pass each schema while
having a different footprint or nonexistent socket in another file.

Required resolution: one immutable geometry authority, with other manifests
referencing or carrying validated generated projections of it.

### Cell and sub-cell values are ambiguous

`common.schema.json` exposes a generic integer position while documents use
whole cells for placement and four sub-cell units for movement. Fixtures look
like whole-cell values. The project needs distinct types for cell, sub-cell,
local sprite geometry, projected screen pixel, and floor-local position.

### Simulation and art use different facing names

World data uses north/east/south/west; the character bible uses
north-east/south-east/south-west/north-west. The mapping is not a versioned
contract or fixture, so characters, props, sockets, and paths can interpret the
same facing differently.

### The first connected desk contract disagrees with its fixture

The furniture bible calls the first workstation east-west only, while the
fixture includes north/south ends and a vertical middle. Art cannot be
commissioned until the supported masks and rotations are one accepted set.

### A* cost correction — closed for the bounded T0 probe

Decision 0004 fixes cardinal step cost at `100`. The preserved V1 path fixture
is supplemented by `navigation-reservations-v2.json`, whose executable oracle
uses the same unit for the Manhattan heuristic and asserts six steps and cost
`600`. Later movement and crowd evidence remain separate gates.

### Replay hashes are placeholders

The replay fixture uses repeated sample strings such as `aaaa...`; no reducer
produces or verifies them. Shape validation must not be reported as replay
evidence.

### The asset gate implements only a small part of the specification

It does not decode RGBA pixels and therefore cannot prove alpha edges, palette,
frame bounds, contact drift, socket alignment, connected seams, atlas overlap,
clip completeness, review boards, or reproducible export. It also does not
reject every orphan source, recipe, runtime, or registry file.

### Current rejected-fixture diagnostics — closed for T0 scope

All three current rejected fixtures now emit an independently derived stable
diagnostic and compare it exactly with the expected code. Mutation tests prove
that an invalid document with the wrong expected reason fails the harness.

### Operational stage ownership conflicts

Workflow documentation assigns the `selected` transition to Growth Strategist,
while the agent catalog says Product Ranker selects winners. Choreography cannot
bind roles to stations until the operational owner is authoritative.

### Capacity is not the live workforce

The floor reserves fifteen positions, but current feature flags enable only six
roles. Ten and fifteen actors may be deterministic load fixtures; production
must spawn only real, enabled records and show disabled stations as unavailable.

### Exterior and floor structure have competing interpretations

The exterior is described as presentation context and also as an environment
surface connected to the entrance. `surface-structure.schema.json` also permits
`floor` while the world already owns surfaces. These choices affect bounds,
camera, picking, bundles, saves, and future floors.

### A global upper render band is not a complete occlusion model

Rendering every `upper` part after every world actor can make a tall cabinet or
desk front cover an actor who is geometrically in front. Multipart objects need
explicit depth attachment or occlusion dependencies and target fixtures; split
sprites must not become a universal manual workaround.

## Comparable systems studied

The following are primary source or project documentation observations. The
Office implications are clean-room inferences; no code, content, values, maps,
timings, or visual designs are adopted.

| Source | Directly observed technique | Office-owned implication |
| --- | --- | --- |
| [OpenRCT2 GameAction](https://github.com/OpenRCT2/OpenRCT2/blob/develop/src/openrct2/actions/GameAction.hpp), [runner](https://github.com/OpenRCT2/OpenRCT2/blob/develop/src/openrct2/actions/GameActionRunner.cpp), and [replay](https://github.com/OpenRCT2/OpenRCT2/blob/develop/src/openrct2/ReplayManager.cpp) | Serializable actions separate query from execution; command ordering, snapshots, checksums, and replay mismatch evidence are explicit | Split validation from apply, totally order same-tick commands, and produce a replayable bug bundle with reducer hashes |
| [OpenTTD command model](https://github.com/OpenTTD/OpenTTD/blob/master/src/command_func.h), [random streams](https://github.com/OpenTTD/OpenTTD/blob/master/src/core/random_func.hpp), and [save/load](https://github.com/OpenTTD/OpenTTD/tree/master/src/saveload) | Commands test before execute, gameplay and interactive RNG are distinct, and saves use versioned compatibility paths | Separate simulation and presentation randomness; persist queues, pending work, and RNG state; test each migration |
| [CorsixTH room](https://github.com/CorsixTH/CorsixTH/blob/master/CorsixTH/Lua/room.lua), [object](https://github.com/CorsixTH/CorsixTH/blob/master/CorsixTH/Lua/entities/object.lua), [queue](https://github.com/CorsixTH/CorsixTH/blob/master/CorsixTH/Lua/queue.lua), and [use-object action](https://github.com/CorsixTH/CorsixTH/blob/master/CorsixTH/Lua/humanoid_actions/use_object.lua) | Rooms own entrances, occupants, objects and en-route users; objects expose orientation-specific use positions and reservations; interruption performs cleanup | Model facility slots and waiting state explicitly; reserve before arrival; release on cancel, removal, disable, timeout, or stale intent |
| [FreeSO project structure](https://github.com/riperiperi/FreeSO/wiki/Project-structure), [routing](https://github.com/riperiperi/FreeSO/blob/master/TSOClient/tso.simantics/Engine/VMRoutingFrame.cs), and [marshal](https://github.com/riperiperi/FreeSO/blob/master/TSOClient/tso.simantics/Marshals/VMMarshal.cs) | Simulation VM, renderer, marshalled state, content service, room maps, routing state, and authoring/debug tooling are separate; clients can start from full VM state | Keep world and simulation renderer-free, route through room/portal topology before local cells, and make floor IDs part of state now |
| [Unknown Horizons world objects](https://github.com/unknown-horizons/unknown-horizons/blob/master/horizons/util/worldobject.py), [scheduler](https://github.com/unknown-horizons/unknown-horizons/blob/master/horizons/scheduler.py), and [build command](https://github.com/unknown-horizons/unknown-horizons/blob/master/horizons/command/building.py) | Stable world IDs, scheduled ticks, deterministic ordering, and placement revalidation at execution are explicit | Compile stable IDs, never depend on object iteration order, and validate placement both at authoring and command apply |
| [Widelands command queue](https://github.com/widelands/widelands/blob/master/src/commands/cmd_queue.h), [worker tasks](https://github.com/widelands/widelands/blob/master/src/logic/map_objects/tribes/worker.h), and [request model](https://github.com/widelands/widelands/blob/master/src/economy/request.h) | Commands use deterministic order; workers have explicit tasks and homes; capability requests and in-flight transfers are canceled when ownership disappears | Separate home facility, job claim, capability request, spatial reservation, and interaction; save pending commands |
| [KeeperRL task map](https://github.com/miki151/keeperrl/blob/master/task_map.h), [tasks](https://github.com/miki151/keeperrl/blob/master/task.h), and [level links](https://github.com/miki151/keeperrl/blob/master/level.h) | Tasks have identity, ownership, priority, transfer and cancel state; levels link through stable landing identities | Keep task and spatial ledgers separate and give future portal endpoints stable IDs rather than screen coordinates |
| [OpenRA map format](https://github.com/OpenRA/OpenRA/wiki/Map-format) and [trait reference](https://docs.openra.net/en/release/traits/) | Maps have a versioned package, named actors, cell/sub-cell positions, separated metadata and binary layers, upgrade tooling, and composable traits with declared dependencies | Version a scene bundle, compile references, provide an upgrade path, and compose semantic capabilities instead of branching on art or component names |
| [Unknown Horizons repository format](https://github.com/unknown-horizons/unknown-horizons) | Maps and component-based object definitions are stored separately | Keep reusable definitions separate from placed instances and mutable state |

The eight game/codebase studies above cover the required architecture questions.
More broad game browsing is now lower value than converting the findings into
Office-owned evidence. Proprietary Kairosoft titles remain genre and visual
references only because their internal implementation is not public evidence.

## Authoring and rendering sources studied

- [Tiled objects](https://doc.mapeditor.org/en/stable/manual/objects/),
  [templates](https://doc.mapeditor.org/en/stable/manual/using-templates/),
  [custom properties](https://doc.mapeditor.org/en/stable/manual/custom-properties/),
  and [terrain sets](https://doc.mapeditor.org/en/stable/manual/terrain/) support
  typed reusable authoring. Office still needs a pinned profile and converter;
  editor offsets and random selection cannot enter runtime truth. Tiled
  [layer coordinates](https://doc.mapeditor.org/en/stable/manual/layers/) also
  use an isometric object-position convention that is not automatically the
  Office 64-by-32 world grid, while its
  [JSON format](https://doc.mapeditor.org/en/latest/reference/json-map-format/)
  distinguishes format and writing-tool versions. The profile must pin both,
  hash templates, project classes and external tilesets, assign stable Office
  IDs independently of editor IDs, and reject path escape or unsupported
  transform data.
- [Aseprite CLI](https://www.aseprite.org/docs/cli/),
  [slices](https://www.aseprite.org/docs/slices/), and
  [sprite sheets](https://www.aseprite.org/docs/sprite-sheet/) expose layers,
  tags, frames, pivots, padding, trim, extrusion, and JSON metadata. Office must
  pin the executable, arguments, input order, color profile, and output set and
  prove two clean exports are byte-identical.
- [PixiJS Assets](https://pixijs.com/8.x/guides/components/assets),
  [textures](https://pixijs.com/8.x/guides/components/textures),
  [scene graph](https://pixijs.com/8.x/guides/concepts/scene-graph), and
  [render layers](https://pixijs.com/8.x/guides/concepts/render-layers) provide
  candidate loading, atlas, sorting, and lifecycle primitives. They do not own
  Office world depth, missing-asset behavior, or resource lifetime.
- [Godot TileSet](https://docs.godotengine.org/en/stable/tutorials/2d/using_tilesets.html)
  and [asset import](https://docs.godotengine.org/en/stable/tutorials/assets_pipeline/import_process.html)
  demonstrate separation of visual, collision, navigation, occlusion, custom
  data, generated imports, and migration proxies. Those are schema questions,
  not a reason to adopt Godot.
- [OpenGraphics](https://github.com/OpenRCT2/OpenGraphics) and
  [Blender RCT Graphics](https://github.com/OpenRCT2/Blender-RCT-Graphics)
  justify benchmarking a fixed-camera 3D-to-pixel-assisted furniture and
  environment workflow against native Aseprite authoring. The project must
  decide from original test assets; these projects are not runtime dependencies
  or style sources.
- [RFC 8785](https://www.rfc-editor.org/rfc/rfc8785.html) specifies an invariant
  JSON representation suitable for hashing. Office must accept it or record a
  precise alternative and account for its
  [verified errata](https://www.rfc-editor.org/errata/rfc8785); `JSON.stringify`
  alone is not a cross-runtime contract. Canonical byte serialization is
  separate from project-owned normalization of semantically unordered arrays.

## Required closure pack

The content below is mandatory. A subject may be added to an existing canonical
document instead of creating a duplicate owner, but it may not be omitted to
reduce the file count.

### Closure A — identity, coordinates, and topology

Complete before persistent world or save implementation:

1. Separate branded types for building, floor, room, entity definition,
   instance, cell, sub-cell, local pixel, screen pixel, facility, socket,
   command, event, intent, and tick.
2. Lock the world-cardinal to screen-facing mapping for all four directions.
3. Declare one geometry authority and the generated or validated fields allowed
   in entity, asset, interaction, atlas, and renderer records.
4. Define immutable definition, placed instance, mutable simulation state, and
   derived view as separate layers with independent versions.
5. Decide building, floor, exterior/site, entrance, and vertical-portal
   ownership. Elevation must not substitute for floor identity.
6. Define room bounds, entrance, required and optional facility groups,
   capacity, circulation, adjacency, focal points, prop slots, and density.
7. Define deterministic scene compilation, stable ID generation, reference
   closure, authoring version, and canonical output hashing.

New canonical documents planned:

- `DEFINITION_INSTANCE_RUNTIME_STATE.md`;
- `BUILDING_FLOORS_EXTERIOR.md`;
- `SCENE_COMPOSITION_GRAMMAR.md`.

Required machine evidence includes building, room-template, scene-plan,
definition-bundle, and geometry schemas; target-floor and two-floor envelope
fixtures; and duplicate ID, dangling reference, blocked entrance, invalid
portal, capacity, adjacency, and canonical reorder failures.

### Closure B — commands, jobs, facilities, and deterministic lifecycle

Complete before the persistent headless vertical slice:

1. Decide the fixed tick phase order from input ingestion through hashing.
2. Add typed command and result envelopes, validate/apply separation,
   idempotency, same-tick total order, and revalidation at apply time.
3. Pin the PRNG algorithm, version, stream derivation, state, and the boundary
   between simulation and decorative randomness.
4. Define an activity intent with workflow/task/event correlation, capability,
   priority, issue tick, cancellation policy, and presentation-only flag.
5. Select facilities by capability rather than renderer or asset name.
6. Model each use slot, approach candidates, waiting cells, facing, actor and
   prop sockets, target generation, availability, capacity, and queue state.
7. Separate requested, en-route, waiting, acquired, using, released, canceled,
   and failed phases.
8. Decide queue ordering, capacity, aging or fairness, timeouts, route
   invalidation, target removal, deadlock prevention or resolution, and a
   deterministic victim if cycles are broken.
9. Define preemption of decorative activity by durable operational work and
   cleanup of task claim, facility slot, approach cell, and held prop.
10. Define the two clocks: real operational time and the 10 Hz presentation
    simulation, including reload, reconnect, missed/late/out-of-order event,
    background-tab pause, bfcache restore, and choreography coalescing. Browser
    animation frames and timers never own logical progress; resume reconciles
    durable state and forbids an unbounded catch-up tick burst.
11. Define a restorable snapshot containing pending commands, scheduled inputs,
    intents, action queues, facility state, wait queues, reservations, held
    props, RNG state, world revision, and consumed durable event IDs.
12. Define two separate deterministic transforms: a semantic normalizer that
    stable-sorts only collections declared unordered, followed by RFC 8785 or a
    recorded canonical equivalent. Define the hashable state projection and a
    hash algorithm/domain/version envelope, then generate replay hashes from
    the real reducer. The parser must reject duplicate keys before information
    is lost and the contract must cover negative zero, lone surrogates,
    non-finite numbers, Unicode forms, UTF-16 key order, and preserved array
    order.

New canonical documents planned:

- `SIMULATION_PIPELINE_COMMANDS.md`;
- `JOBS_INTENTS_ASSIGNMENT.md`;
- `CROWD_QUEUES_AND_DEADLOCKS.md`;
- `REPLAY_DEBUGGING_PLAYBOOK.md`.

Required machine evidence includes command, event, result, activity-intent,
facility-slot, operations-snapshot-v2, simulation-snapshot-v2, and trace-v2
contracts. Fixtures must cover one, ten, and fifteen actors; same-tick ordering;
duplicate input; narrow doors; head-on passage; swaps; shared facilities;
multi-resource deadlock; starvation; every cancellation phase; target removal;
world revision; stale/reconnect; mid-action save/load; and first divergence.

### Closure C — AutoPost choreography

Complete before role-specific presentation or character assignment:

1. Resolve Product Ranker versus Growth Strategist winner-selection ownership.
2. Separate `roleId` from `agentInstanceId` and identity art from both.
3. Carry workflow run, task/job, stage, durable event, ordering cursor,
   structured reason, failed-from stage, freshness, session health, feature
   availability, diagnostic owner, and recoverability.
4. Define copy/visual fan-out and `content_ready` join semantics.
5. Make roster binding data-owned:

```text
agent instance -> role -> character definition -> home facility capability
               -> allowed interactions -> feature availability
```

6. Keep TeamBrain a command-console facility, never a fake employee.
7. Deduplicate presentation intents after reload or reconnect and never let
   animation advance durable operational truth.

Update `OPERATIONS_ADAPTER_UI_SAFETY.md` and the agent/workflow sources rather
than creating another operations owner. Add activity-routing and roster-binding
schemas plus ten-role, fan-out/join, disabled, unknown, stale-one-actor,
duplicate, late, out-of-order, reconnect, and failure-owner fixtures.

### Closure D — numeric visual language and reusable assets

Complete before final pixels or any art batch:

1. Lock native pixel density, character standing and seated envelopes, desk,
   chair, door, wall, window and floor scale, wall/cutaway height, canvas
   classes, transparent padding, palette roles, allowed variance, outline,
   light vector, shadow policy, material edges, detail-density bands, signage
   and font policy, contact/socket tolerances, zoom stops, and filtering.
2. Define world anchor, sprite origin, depth contact, footprint, clearance,
   sockets, orientation transforms, frame bounds, atlas trimming invariance,
   and arbitrary render parts with explicit depth attachment.
3. Define character source layers, identity variants, four facings, mirror
   safety, standing/seated/typing/drinking/meeting states, held props, static
   reduced-motion fallbacks, per-frame ground contact, and chair/desk composite
   ownership.
4. Define furniture and environment semantic state separately from art:
   isolated/connected variants, occupied chairs, monitor state, doors, windows,
   glass, corners, ends, cutaways, and prop slots.
5. Define an AI-assisted normalization workflow: immutable concept provenance,
   selection, redraw/reconstruction, pixel cleanup, palette normalization,
   facing consistency, transparent extraction, geometry registration, human
   review, similarity/commercial review, and versioning. Whole-room generated
   images remain mood references.
6. Record a decision comparing native Aseprite, fixed-camera 3D-assisted export,
   and a hybrid pipeline using original test material and measured revision
   cost. Do not choose from intuition.
7. Pin source tool binary and version, structured arguments, dependencies,
   locale/color profile, stable output names, clean build directory, and output
   set. Two clean builds must be byte-identical.
8. Define atlas metadata, catalog reference closure, bundles by lifecycle,
   preload/upload/unload, floor switch, context recovery, asset migration, and
   fail-closed behavior without `latest` aliases.

New canonical documents planned:

- `ASSET_GEOMETRY_REGISTRATION_RENDER_PARTS.md`;
- `ATLAS_CATALOG_BUNDLE_LIFECYCLE.md`.

Extend the existing art direction, character, furniture, asset pipeline, map
authoring, testing, performance, and dependency documents. Required contracts
include style profile, export recipe, source set, sprite frame, render part,
character definition, semantic variant, atlas, asset catalog, scene bundle,
asset review, migration, and Tiled authoring profile.

Required evidence includes scale/palette/light boards, asymmetric-facing
rejection, contact trails, seated workstation composites, tall-object crossings,
wall/door/window/glass/cutaway cases, every supported connected-desk mask and
rotation, seam remove/restore, atlas and orphan failures, two clean rebuilds,
source layer/tag/slice rename failures, bundle unload/recovery, and explicit old
version migration.

### Closure E — renderer, authoring tools, QA, and production lifecycle

Complete before a populated target scene is accepted:

1. Define the renderer port for mount, render, camera, pick, resize, load,
   unload, bundle swap, missing-asset screen, context loss, deterministic
   capture, teardown, and remount.
2. Replace global-band assumptions with fixture-proved world ordering,
   multipart dependencies, cutaway, glass, tall-object, and effect policy.
3. Decide native-scale versus fit-to-world zoom behavior and prevent fractional
   pixel blur at all supported viewports.
4. Define static batching, dynamic separation, spatial indexing, culling,
   decoded texture memory, atlas limits, load time, and lifecycle leak budgets.
5. Pin pilot Windows/browser/GPU evidence and record numeric thresholds only
   after the identical Canvas 2D and PixiJS benchmark.
6. Define the semantic DOM entity list or tree, focus synchronization, keyboard
   traversal, inspector parity, non-color cues, reduced motion, and 15-actor
   behavior. Fixtures cover 1, 10, and 15 actors; keyboard order stays
   independent of visual depth; pointer and keyboard selection agree; focus
   survives refresh and target removal; and all operational states work under
   forced colors and target viewports. Automated scans are supplemented by
   manual screen-reader, zoom, motion, and non-color review.
7. Pin visual-golden browser, fonts, viewport, camera, tick, seed, animation
   time, world and snapshot hashes, renderer revision, OS image, device-pixel
   ratio, color preferences, thresholds, reviewer, and update process.
   Geometry tests remain independent and normal checks never rewrite goldens.
8. Define an injected browser lifecycle port with mounted, visible, hidden,
   restoring, and destroyed states. Cover `pagehide`/`pageshow`, unmount during
   load, resubscription, deduplication, and repeated remount without duplicate
   animation frames, pollers, listeners, intents, or subscriptions.
9. For WebGL candidates, rebuild every texture, buffer, program, extension, and
   renderer state after context restoration. Keep the semantic DOM inspector
   usable, leave simulation hash unchanged, render the latest snapshot, and
   fail closed if bundle recovery fails.
10. Define a pinned property/model-test profile with version, random type,
    seed, run count, shrink path, counterexample promotion, and a simpler
    independent reference model. Retain failure seeds from longer exploration
    runs as CI artifacts.

Required tools before the target floor:

- schema-to-TypeScript drift gate;
- canonical serializer and hasher;
- semantic normalizer with declared ordered and unordered collection policy;
- world/reference semantic linter;
- room and scene-plan compiler;
- circulation and capacity validator;
- optional pinned Tiled-to-canonical converter and report;
- replay runner, first-divergence diff, and secret-safe bug bundle;
- occupancy, route, reservation, queue, portal, depth, and stale-data inspector;
- asset-family scaffolder and pinned export runner;
- Aseprite layer/tag/slice inspector;
- real PNG RGBA, alpha, palette, frame, contact, socket, and seam validator;
- deterministic atlas, catalog, and scene-bundle compiler with orphan detection;
- neutral board, contact sheet, composite, and locked golden generator;
- asset migration tool and clean rebuild CI job;
- renderer benchmark and lifecycle harness;
- property/model test profiles and counterexample-to-fixture promotion tool.

## Planned evidence volume

The pack currently contains 69 inventoried knowledge files after Decision 0007;
the T0 closure record above correctly records the 68 files present when that
gate passed. Closing the target does not require hundreds of pages, but it does
require materially more machine-readable evidence. The current planning budget
is:

| Kind | Minimum planned change | Notes |
| --- | --- | --- |
| New canonical documents | 9 | The named files in Closures A, B, and D; existing owners are extended for the rest |
| Existing canonical documents with major updates | 12 or more | Coordinates, world, rooms, simulation, interactions, operations, art, character, furniture, assets, testing, and map authoring |
| New or major-version schemas | About 20 | Exact physical file count may shrink through shared definitions; semantic coverage may not |
| Fixture families | At least 30 | Each family can contain many valid and rejected cases |
| Executable compilers, validators, and harnesses | About 15 | Documentation is not considered closure without the applicable tool |
| Production asset families before bulk approval | Exactly 1 proof family | Connected workstation first; batch production stays closed until it passes end to end |

This is a scope budget, not a success metric. One strong schema plus semantic
validator is better than several overlapping documents.

## Required gate corrections

T0 completed the immediate gate-reporting corrections: every declared case is
executed, rejected fixtures compare exact diagnostics, accepted A* cost units
are asserted, and schema-shaped replay is reported separately from reducer
evidence. The broader gates still require these corrections before their later
promotions:

- split forward projection from inverse picking and camera readiness;
- split single-actor pathfinding from crowd readiness;
- report basic manifest admission separately from a reproducible asset factory;
- enforce collection uniqueness, bounds, reference closure, and cross-contract
  geometry agreement;
- generate and independently verify real state hashes;
- decode PNG pixels and implement every asset check promised by the canonical
  specification;
- reject orphan source, recipe, runtime, atlas, catalog, and review material.

## Minimum safe-to-produce gate

Do not start the large map, ten character identities, or a furniture batch
until all conditions are true:

1. Cell, sub-cell, screen-facing, and floor-local semantics are accepted.
2. One geometry authority and a cross-reference validator exist.
3. Building, floor, exterior, portal, room-template, and scene-plan contracts
   compile deterministically.
4. The geometric first-floor fixture contains ten stations, five reserve slots,
   every shared facility, legal entrances and circulation, exterior context,
   and a reserved vertical core.
5. That fixture passes one-, ten-, and fifteen-actor reachability, contention,
   queue, cancellation, fairness, and bounded-wait tests.
6. Operations Snapshot V2 and the complete AutoPost fan-out/join trace pass
   duplicate, stale, reconnect, disabled, and failure cases.
7. Mid-route, mid-queue, mid-interaction, and held-prop save/load continue to
   the same real reducer hash as an uninterrupted run.
8. Numeric style profile and native-scale geometry boards are owner-approved.
9. Character, furniture, environment, interaction, render-part, atlas, catalog,
   and scene-bundle contracts pass valid and rejected evidence.
10. One connected-workstation family rebuilds byte-identically through source,
    export, pixel/geometry validation, catalog, scene, runtime, and composite
    review.
11. Missing, malformed, misaligned, unapproved, incompatible, and orphan assets
    each fail with the correct diagnostic.
12. Renderer benchmark, lifecycle, accessibility, and supported viewport policy
    are accepted before the populated visual composition.

After this gate, adding ordinary content should be a family-level operation.
Exceptional geometry or behavior still requires a declared new family or
contract version; it must never be hidden as a scene-specific offset.

## Deliberately non-blocking for the first-floor foundation

The following may remain deferred unless product scope changes:

- actual second-floor gameplay beyond the identity and portal envelope;
- moving traffic, exterior pedestrians, weather, and a simulated city;
- economy, employee needs, hiring, construction, and a player room editor;
- audio, music, advanced particles, and elaborate decorative idles;
- a general-purpose ECS, scripting VM, or imported simulation engine;
- live external connector execution while its feature flag is disabled.

These exclusions keep the closure work focused on the real risk: a reusable,
deterministic, operationally honest office rather than a general game engine.

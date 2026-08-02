# Office Engine V2 Production Roadmap

The destination is the complete ground-floor headquarters in
`FIRST_FLOOR_BRIEF.md`. Build it through reusable vertical slices. A phase may
begin only after the prior phase's exit evidence passes; art volume never hides
an unresolved world, simulation, or asset-pipeline decision.

## Roadmap principles

- Build contracts, fixtures, and diagnostics before producers and consumers.
- Prove one reusable family and interaction before making a large art batch.
- Keep operations truth, deterministic simulation, and visual presentation
  separate at every phase.
- Reserve fifteen actor slots but instantiate only real adapter records.
- Treat the small room as a construction proof for the large floor, not as a
  competing production map.
- Study open systems for architecture and testing methods only. Do not copy
  proprietary pixels, characters, branding, layouts, scene data, or code that
  has not passed a dependency and license decision.

## Phase 0 — Clean-room baseline

Status: complete.

- Retain the affiliate control panel and operations packages.
- Remove the prior game subsystem and all runtime visual material.
- Add the clean-room guard, data-free lab, and empty production mount.
- Establish the canonical knowledge pack, decisions, schemas, fixtures,
  templates, project skill, and validation gates.

Exit: the full repository gate passes with no game renderer or runtime art, the
Office shell communicates the empty state, valid fixtures pass, and rejected
fixtures fail for their declared reason.

## Phase 1 — First-floor knowledge and contract closure

Status: contract closure complete on 2026-08-02. W1.1 through W1.5 are
complete for their bounded identity/coordinate, geometry/reference, topology,
room, and scene-compiler slices. W1.6 now integrates Closure B plus the
Operations Snapshot V2, visual/asset, and renderer/QA specification closures.
The integrated knowledge run reports 186 files, 58 schemas, 66 fixtures,
184/184 semantic cases, and 101 exact diagnostics. The target brief and
contract/compiler evidence exist; simulation reducer, renderer, and
asset-factory implementation remain later work.
`KNOWLEDGE_COMPLETENESS_AUDIT.md` is the evidence inventory for this phase. Its
P0 contradictions must close before persistent engine implementation, and its
minimum safe-to-produce gate must pass before the large floor or any art batch.
`READINESS_REMEDIATION_PLAN.md` owns the dependency-ordered remediation, commit
sequence, and cross-phase T0–T6 promotion evidence. Phase 1 now authorizes the
pure Phase 2 world kernel; later executable implementation remains in the
phases below.

### Identity and deterministic execution

- Establish one geometry authority and validate all entity, asset, interaction,
  atlas, and renderer references against it.
- Separate cell, sub-cell, local-pixel, screen-pixel, floor-local, and facing
  types and prove their transforms.
- Separate immutable definitions, placed instances, mutable runtime state, and
  derived presentation; version-pin every reference.
- Define fixed tick phase order, typed command/result/event envelopes,
  validate/apply behavior, same-tick ordering, canonical serialization, PRNG
  algorithm and streams, and real reducer-produced replay hashes.
- Define activity intents, capability-based facility selection, use-slot state,
  actor action queues, preemption, cleanup, and the operational/presentation
  two-clock boundary.

### Operational truth

- Resolve the ownership conflict between Product Ranker and Growth Strategist
  for winner selection and update the catalog and workflow documentation.
- Define operations snapshot V2 with separate role and agent-instance IDs,
  workflow run, task, stage, durable transition, structured wait/review/block
  reason, freshness, session health, feature availability, and diagnostic owner.
- Define fan-out and join semantics for copy and visual production before
  `content_ready` so two jobs never appear as one ambiguous handoff.
- Define the data-owned roster binding:

```text
agent instance -> role -> character definition -> home facility
               -> allowed interactions -> feature availability
```

### Building and composition

- Decide and version building, floor, exterior, and vertical-portal ownership.
- Define whether each floor is an independent world and how floor-local saves,
  loading, camera selection, routing, and migration work.
- Define room templates, facility slots, prop slots, circulation clearance,
  density bands, focal points, and deterministic decoration streams.
- Define the first-floor geometric fixture with ten assigned stations, five
  reserved actor slots, shared facilities, entrance, sidewalk, road context,
  and a reserved stair or lift core.

### Visual production

- Lock a measurable style profile for the original warm 2:1 pixel-art cutaway:
  character scale, wall height, canvas classes, palette roles, outline width,
  light and shadow direction, detail budget, transparent padding, native scale,
  and supported zoom stops.
- Define environment-kit, character-modularity, sprite-atlas, room-template,
  contact-sheet, and visual-review contracts with valid and rejected fixtures.
- Define the contracts, rejected fixtures, diagnostic ownership, and automated
  evidence requirements for PNG alpha, frame bounds, contact tolerance, socket
  containment, palette drift, seams, atlas registry, and review evidence.

### Planned contract pack

Create or extend these canonical files during the named phase; do not create a
second document that owns the same rule.

| Capability | Canonical documentation | Machine-readable output |
| --- | --- | --- |
| Definition, instance, geometry, and runtime state | new `DEFINITION_INSTANCE_RUNTIME_STATE.md`; extend coordinates and world documents | geometry and definition-bundle contracts, cross-reference fixtures and semantic linter |
| Building, floor, exterior, and portals | new `BUILDING_FLOORS_EXTERIOR.md` | `building.schema.json`, target-floor and future two-floor fixtures |
| Room program and circulation | extend `ROOMS_SURFACES_STRUCTURES_ZONES.md` | `room-template.schema.json`, capacity and blocked-entrance fixtures |
| Deterministic scene composition | new `SCENE_COMPOSITION_GRAMMAR.md` | `scene-plan.schema.json`, density and adjacency fixtures |
| Commands and simulation pipeline | new `SIMULATION_PIPELINE_COMMANDS.md`; extend simulation and save documents | command/event/result and snapshot/trace V2 schemas, real replay and mid-action restore fixtures |
| Jobs, intents, and facilities | new `JOBS_INTENTS_ASSIGNMENT.md`; extend actor and interaction documents | activity-intent, facility-slot, action-queue, preemption and cleanup fixtures |
| Operations choreography | extend `OPERATIONS_ADAPTER_UI_SAFETY.md` | operations snapshot V2, `activity-routing.schema.json`, ten-role and fan-out/join fixtures |
| Crowds, queues, and deadlocks | new `CROWD_QUEUES_AND_DEADLOCKS.md` | shared-facility, narrow-door, target-removal, and 15-actor fixtures |
| Numeric visual target | extend `ART_DIRECTION_PIXEL_SPEC.md` | `style-profile.schema.json`, geometry, palette, and scale boards |
| Asset geometry and render parts | new `ASSET_GEOMETRY_REGISTRATION_RENDER_PARTS.md`; extend depth rules | sprite-frame and render-part contracts, contact, composite, tall-object and trimming fixtures |
| Asset factory and runtime bundle | new `ATLAS_CATALOG_BUNDLE_LIFECYCLE.md`; extend `ASSET_PIPELINE_PROVENANCE_VALIDATION.md` | export-recipe, source-set, atlas, asset-catalog, scene-bundle, review and migration schemas plus compiler fixtures |
| Character, furniture, and interactions | extend the two production bibles and `ACTORS_NAVIGATION_INTERACTIONS.md` | character-definition and semantic-variant contracts plus interaction-catalog fixture |
| Replay and diagnosis | new `REPLAY_DEBUGGING_PLAYBOOK.md`; extend failure diagnostics | canonical serializer, bug-bundle, first-divergence, trace-view and diagnostic fixtures |
| Renderer and visual acceptance | extend decision 0002, the performance matrix, and testing budgets | benchmark report, reviewed goldens, accessibility and lifecycle evidence |

Exit: every target feature has one canonical owner, contract, valid fixture,
rejected fixture, applicable Phase 1 executable contract/semantic evidence, and
migration effect; every P0 contradiction in the audit is resolved. The target
geometric fixture compiles deterministically and no production asset needs a
scene-specific pixel offset or an unresolved scale decision. This exit
authorizes Phase 2; it does not claim that the T2–T6 implementation gates in
`READINESS_REMEDIATION_PLAN.md` have already passed.

## Phase 2 — Executable world kernel

Phase 1 W1.1–W1.5 create the branded identity, coordinate, geometry, topology,
room, and scene contracts plus their generated TypeScript types. Phase 2
consumes those types to implement the pure world kernel; contract closure does
not claim that runtime world behavior, placement, inverse picking, or
persistence already exists.

The explicit Phase 2 entry and exit record is
PHASE_2_WORLD_KERNEL_ACCEPTANCE.md. Its projection round-trip, inverse-picking,
rotated-placement, occupancy, depth, reference-closure, and canonical
serialization rows must be accepted before the later headless simulation wave
starts. Visual style approval and visual-proof risks remain later-phase
controls.

- Define branded identifier types for building, floor, room, entity, cell,
  facility, command, and tick.
- Implement world bounds, floor-local coordinates, footprints, anchors,
  structures, occupancy, zones, room templates, and placement diagnostics.
- Implement `office-projection-v1`, inverse ground picking, depth inputs,
  canonical serialization, and version rejection behind pure interfaces.
- Add unit and property tests using geometric data only.

Exit: projection round-trips, invalid-world rejection, rotated placement,
structural normalization, stable depth, and byte-identical serialization pass
without React or a renderer library.

Phase 2 executable world-kernel acceptance passed on 2026-08-02 at the
integration branch. The accepted slice remains pure and headless; persistent
simulation, renderer, production assets, property/model evidence, and visual
proof remain deferred to their later gates.

## Phase 3 — Headless operational vertical slice

The `P3-W2.1` fixed-tick command pipeline is integrated as the first pure
simulation runtime unit. `P3-W2-02` adds the deterministic state-hash/PRNG
boundary, a bounded one-actor facility/interaction runtime, and an injected
fixed-tick lifecycle port with five-tick catch-up capping, hidden-time discard,
and idempotent cleanup. Focused suites pass 8/8, 7/7, and 7/7 respectively, and
the complete repository gate passes. These are bounded simulation modules;
multi-actor queues/deadlocks, restore/replay, reducer-produced end-to-end hash
traces, and Operations V2 choreography remain required before the Phase 3 exit.

- Build one geometric room with one actor, one workstation, one target, blocked
  cells, one waiting position, and one unreachable case.
- Implement fixed ticks, idempotent commands, internal four-way A*, movement,
  reservations, queues, cancellation, and one interaction reducer.
- Adapt one fake but schema-valid workflow transition into presentation intent
  without writing back to operational truth.
- Record a complete trace and prove replay equality with presentation disabled.

Exit: the actor reaches and uses the target, releases every resource after
cancel or timeout, exposes an unreachable reason, and replays identically.

## Phase 4 — Renderer benchmark and selection

- Define one renderer port for mount, snapshot render, camera, picking, resize,
  resource load, context recovery, diagnostics, and teardown.
- Benchmark a minimal Canvas 2D implementation against the pinned PixiJS 8
  candidate using identical geometric scenes at 1, 10, 15, 25, and 50 actors.
- Measure frame time, draw calls, textures, decoded memory, bundle contribution,
  load time, picking latency, responsive behavior, and cleanup.
- Select one renderer by superseding decision 0002 and remove the losing proof.

Exit: desktop, compact, and phone evidence passes, the numeric budget is
recorded, and no renderer component owns world or simulation state.

## Phase 5 — Reproducible asset factory

- Implement deterministic source export, sprite-sheet or atlas metadata,
  manifest generation, provenance, and runtime registry generation.
- Implement neutral geometry boards, alpha boards, seam matrices, character
  turnarounds, animation contact sheets, and light/dark review backgrounds.
- Implement automated checks promised by the asset specification and make every
  diagnostic name the family, version, variant, file, and owning rule.
- Produce the first approved connected-workstation family end to end: versioned
  source, deterministic export, manifest, provenance, isolated/left-end/middle/
  right-end variants, seated socket, neutral board, runtime registry, admission
  gate, and the Phase 3 small-room interaction using a geometric actor.
- Create and validate three project workflow skills:
  `author-office-v2-asset-family`, `compose-office-v2-room`, and
  `review-office-v2-visuals`.

Exit: rebuilding an unchanged source produces byte-identical outputs and
metadata; missing, altered, unapproved, geometrically invalid, or unregistered
material fails before runtime import; the first workstation family passes the
complete source-to-runtime slice before any environment or furniture batch.

## Phase 6 — Environment kit and empty first-floor shell

- Produce original floor, transition, wall, corner, end, door, window, glass,
  column, entrance, and cutaway families.
- Produce the exterior sidewalk, curb, road, planting, backdrop, and reserved
  vertical-circulation shell as separately owned presentation families.
- Assemble the complete first-floor geometry through room templates and
  canonical world data, initially without populated desks or characters.
- Prove every required route, room boundary, cutaway, camera fit, and structural
  depth case with geometric and approved environment assets.

Exit: the large empty floor is deterministic, traversable, inspectable, and
responsive; removing presentation assets leaves identical world truth.

## Phase 7 — Reusable furniture and character systems

- Extend the approved connected-workstation family only with target-required
  rotations or connections, then expand the furniture catalog through the same
  proven pipeline.
- Add chairs, boards, review and meeting tables, storage, printer, reliability
  equipment, pantry, lounge, plant, and declared prop-slot families in reviewed
  batches.
- Complete one modular original character body with four facings, idle, move,
  interact, and blocked clips, attachment sockets, and reduced-motion states.
- Produce ten identity variants that preserve the shared geometry and animation
  contract; keep identity separate from operational role and state.
- Add only the held props required by accepted interactions.

Exit: every family can be added by brief, source, export, manifest, gate, and
family ID without CSS offsets, renderer branches, or manual registry edits.

## Phase 8 — Ten-role AutoPost office integration

- Implement operations snapshot V2 and roster-to-facility binding for all ten
  canonical roles.
- Map durable workflow events to idempotent presentation intents and visible
  handoffs across discovery, ranking, strategy, attribution, content, QA,
  publishing, analytics, and session recovery.
- Represent disabled feature flags as unavailable or empty stations, never
  working or idle actors.
- Add TeamBrain as a command-console facility that can display answers and
  action proposals but cannot execute connectors.
- Prove 10- and 15-actor routes, reservations, facility capacities, queues,
  cancellation, stale data, retries, and transition deduplication.

Exit: the complete simulated AutoPost workflow is traceable across the floor,
and the visual trace cannot advance or repeat durable work.

## Phase 9 — Full first-floor composition and acceptance

- Populate the approved room templates while preserving all circulation and
  interaction constraints.
- Add controlled prop-slot decoration, original signage, feedback effects, and
  exterior composition without embedding semantic state in background pixels.
- Verify visual density, focal hierarchy, character readability, wall cutaways,
  glass, tall-object occlusion, picking, labels, and inspector parity.
- Run full contract, property, replay, visual, accessibility, responsive,
  performance, context-loss, cleanup, and clean-room acceptance.

Exit: every acceptance item in `FIRST_FLOOR_BRIEF.md` passes and production can
render the floor from a valid adapter snapshot with no hidden fallback.

## Phase 10 — Future multi-floor expansion

- Activate the accepted building and floor contract with a second test floor.
- Add stair or lift portal interactions, floor switching, lazy asset loading,
  cross-floor intent policy, save migration, and camera continuity.
- Keep each floor independently testable and renderable; do not enlarge one
  world coordinate plane until it behaves like multiple floors by accident.

Exit: two geometric floors load, save, switch, and route through declared
portals without changing first-floor snapshots or asset families.

## Relationship to the affiliate roadmap

- M1 provides trustworthy simulated read models for Phase 8 fixtures.
- M3 may replace discovery, ranking, attribution, and Shopee metrics simulations
  with live records after their product gates pass.
- M4 may activate copy, visual, QA, scheduling, publishing, and reconciliation
  displays after Gemini, Flow, and Meta connectors pass their own gates.
- Office work may proceed in parallel, but it cannot show a connector or role as
  working before the corresponding feature is enabled and observed.
- The Office remains optional and must never block the one-account pilot.

## Definition of done for any phase deliverable

1. The owning architectural layer and canonical rule are explicit.
2. Valid input, failures, versioning, migration, and feature availability are
   documented and machine-checked where applicable.
3. Deterministic tests cover behavior and retry or cancellation.
4. Presentation has reviewed native-scale and viewport evidence where relevant.
5. Accessibility and reduced motion preserve semantic parity.
6. Performance is measured against the current recorded budget.
7. No external connector, proprietary asset, retired Office path, or hidden
   fallback enters the engine boundary.
8. Repository, knowledge, asset, clean-room, type, test, and build gates pass.

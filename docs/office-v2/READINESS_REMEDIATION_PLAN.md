# Office Engine V2 Readiness Remediation and Test Plan

## Purpose and authority

This document turns the evidence gaps in `KNOWLEDGE_COMPLETENESS_AUDIT.md`
into dependency-ordered work packages and test gates. It owns remediation
order, integration boundaries, commit boundaries, and promotion evidence from
Phase 1 contract closure through the later safe-to-produce review.

It does not own product behavior or engine rules:

- `FIRST_FLOOR_BRIEF.md` owns the target floor and capacity;
- the canonical topic documents own accepted behavior;
- `KNOWLEDGE_COMPLETENESS_AUDIT.md` owns the evidence inventory and gap verdict;
- `IMPLEMENTATION_PLAN.md` owns the macro delivery phases;
- this plan owns how the gaps close and which test may start next.

If this plan conflicts with an accepted decision, schema, or canonical topic
document, the accepted source wins and this plan must be corrected. Completing a
checkbox in this document never substitutes for executable evidence.

## Outcome

The remediation program is complete when the project can compile the complete
geometric first floor, run deterministic 1-, 10-, and 15-actor headless
scenarios, replay and restore them, translate the complete AutoPost workflow
without inventing work, benchmark a renderer through one shared port, and build
one connected workstation family from source to runtime. At that point ordinary
rooms, furniture, and characters can be added by versioned data and asset
families instead of scene-specific corrections.

Phase 1 itself closes the decisions, contracts, schemas, fixtures, diagnostics,
tool interfaces, and bounded non-persistent probes required by the roadmap.
Persistent world, simulation, renderer, and asset-factory implementations remain
in Phases 2–5 respectively. This plan keeps their downstream acceptance visible
so a Phase 1 choice cannot defer rework into a later phase.

The current status remains **no-go** for the large visual floor, bulk furniture,
ten character identities, persistent simulation, and renderer integration. The
only authorized implementation work is the closure sequence and the narrow test
probes named below.

## The next test, precisely

W0.3 completed on 2026-08-02. W1.1 closed its common identity/coordinate
contract slice, W1.2 closed geometry authority/reference closure, and W1.3–W1.5
closed topology, room composition, and deterministic scene compilation on
2026-08-02. The bounded T1 semantic-foundation evidence now passes. **W1.6 —
Cross-track Phase 1 specification closure completed on 2026-08-02**: Closure B
and the integrated Operations Snapshot V2, visual/asset, and renderer/QA
closures pass their bounded contract evidence. The historical W0.3 closure
register remains unchanged as a pre-T1 promotion baseline.

The completed promotion target is **T1 — Semantic Foundation**. It is a
headless contract/compiler test, not a visual prototype. The evidence is
bounded to contract closure and does not claim persistent simulation, renderer,
crowd, or asset readiness.

The bounded T1 record is complete because Wave 0 is green and Wave 1 supplies
the coordinate, identity, geometry, building, room, reference, and scene
contracts. It passes because:

1. every declared valid and rejected fixture case executes;
2. every rejected case produces its exact stable diagnostic code;
3. cell, sub-cell, floor-local, local-pixel, and screen-pixel values cannot be
   interchanged accidentally;
4. the four world directions map to the four screen facings exactly;
5. one versioned geometry record is authoritative across definitions, assets,
   interactions, instances, and render parts;
6. duplicate IDs, dangling references, mismatched versions, conflicting
   geometry, invalid portals, blocked entrances, and illegal capacity fail;
7. the same scene plan compiles to byte-identical canonical world JSON twice;
8. `npm run check` remains green.

Passing T1 proves the semantic foundation. Phase 2 starts only after the full
Phase 1 cross-track specification record also passes. Neither result authorizes
art, a populated room, a renderer, or claims about crowd readiness.

### W1.6 Closure B record — simulation contract slice

The simulation contract slice adds versioned command, result, event, activity
intent, facility-slot, queue-ticket, reservation, action-queue, snapshot-v2,
and trace-v2 schemas. The knowledge gate executes valid and rejected fixtures,
same-tick ordering, command idempotency/conflict, atomic resource-key
normalization, tick-boundary expiry, cleanup-set completeness, and capped
presentation catch-up. The current run reports 147 files, 34 schemas, 56
fixtures, 103/103 semantic cases, and 51 exact diagnostics. This is bounded
contract evidence only; reducer/replay and crowd execution remain zero.

### W1.6 Integrated Closure C–E record — 2026-08-02

The Integrator merged Closure C, Closure D, and Closure E into
`codex/office-v2-w1-6-integration` from `origin/main`, preserving the separate
session merge commits and resolving shared registries deterministically. The E
ready tag peels to the same commit as its branch tip and required no scope
change.

Closure C owns the Operations Snapshot V2, activity routing, roster binding,
event-window/reconnect semantics, diagnostic ownership, and copy/visual
fan-out/join. Closure D owns the measurable style profile, asset geometry and
render parts, provenance/export, atlas/catalog/bundle lifecycle, and semantic
variants. Closure E owns the renderer port, immutable presentation snapshot,
benchmark protocol, accessibility, lifecycle, golden, property/model, and
fixture-only benchmark bundle contracts.

The integrated evidence is:

- 186 inventoried knowledge files;
- 58 loaded schemas;
- 66/66 fixture files evidenced;
- 184/184 declared semantic cases executed;
- 101 exact diagnostics matched;
- Closure C, D, and E focused tests passing;
- generated contracts drift-free;
- `npm run check` and project preflight passing.

This record closes Phase 1 specification work only. Reducer/replay and
property/model evidence remain `0`; asset admission remains `basic-only`;
renderer admission remains `none`; runtime asset manifests remain `0`; no
production PNG, runtime renderer, connector, or new dependency is admitted.
The pure Phase 2 world kernel is authorized. The Phase 3 `P3-W0` wave has now
accepted bounded RC-01/02/03 research closure records, but T2–T6 implementation
gates remain future work; no reducer, replay runner, or reducer-produced hash
is promoted by that prerequisite wave.

## Working decisions to ratify

These are the recommended defaults that remove the known contradictions. Each
must be accepted in the named canonical owner or a new superseding decision
before dependent implementation. They are not silently accepted by appearing
in this plan.

| Question | Working default | Required owner and proof |
| --- | --- | --- |
| Geometry authority | A versioned world geometry definition owns anchor basis, footprint, clearance, world/sub-cell sockets, use-slot geometry, and rotation. Asset contracts separately own canvas/frame bounds, sprite origin, pixel contacts, trimming, and render-part/composite dependencies. Neither may repeat the other's facts. | `DEFINITION_INSTANCE_RUNTIME_STATE.md`, asset geometry document, schemas, cross-reference validator |
| Position types | `CellPosition` is integral. `SubCellPosition` uses pinned fixed-point units; a generic `position` type is forbidden. Local pixels and screen pixels are separate branded values. | coordinates document, common schema V2, transform fixtures |
| Facing | Simulation stores world north/east/south/west. Under `office-projection-v1`, those display as north-east/south-east/south-west/north-west respectively. Art mirror policy is presentation metadata. | projection decision clarification and four-direction fixture |
| First desk connectivity | The proof workstation supports east-west only: isolated, east end, west end, and middle masks. Unsupported north-south or corner placement fails. | furniture bible, connectivity schema and fixtures |
| Path cost | One cardinal step costs 100 and the Manhattan heuristic uses the same unit. | decision 0004 and executable path oracle |
| Floor identity | Each floor is an independently versioned floor-local world referenced by a building. Elevation never identifies a floor. | building/floor decision, schema, one- and two-floor fixtures |
| Exterior ownership | The site/building envelope owns presentation-only sidewalk, curb, road context, entrance relation, and backdrop references. It cannot enter indoor occupancy or pathfinding. Floor 1 owns its interior and the declared entrance portal. | building/exterior contract and boundary fixture |
| Occlusion | There is no universal global `upper` solution. Multipart render dependencies, depth contacts, structures, glass, cutaway state, and effects are resolved explicitly. | asset geometry document, depth fixtures, renderer port |
| Winner selection | Product Ranker produces ranked candidates and evidence. Growth Strategist selects the winner and proposes or references a strategy version. Activation remains a separately audited, policy-approved fact with human review available. | workflow and agent-catalog sources plus contract tests |
| Capacity | Ten workstations are assigned, five actor slots are reserved, and live actors equal enabled adapter-backed agent instances. Capacity never creates fake employees. | first-floor brief, roster binding, target fixture |
| TeamBrain | TeamBrain is a command-console facility, not an employee or workflow actor. | operations adapter contract and roster rejection fixture |
| Renderer and authoring tools | Canvas versus PixiJS and native 2D versus fixed-camera 3D-assisted versus hybrid remain measured decisions. | benchmark reports and superseding decisions |

Explicit decisions or accepted canonical revisions are required for coordinate
and facing semantics, geometry ownership, floor/site/portal ownership,
serialization and hashing, workflow selection/join ownership, queue/deadlock
policy, and render-part/occlusion ownership. The product owner is asked to
approve visual style and composition boards, not low-level coordinate or
serialization rules.

## Evidence ladder and promotion rules

| Gate | What it proves | Required scenario | What it unlocks |
| --- | --- | --- | --- |
| T0 — Honest foundation gate | Current checks report only evidence they execute | all existing valid and rejected cases | contract closure work |
| T1 — Semantic foundation | identity, geometry, topology, references, and deterministic scene compilation agree | geometric one-room plus target-floor envelope | Phase 2 world kernel after the full Phase 1 specification record |
| T2 — Headless vertical slice | one actor can accept, route, wait, use, cancel, restore, and replay | one actor, one workstation, one unreachable target | renderer-port implementation and bounded asset proof tooling |
| T3 — Crowd and operations | real operations choreography survives contention and lifecycle events | 1, 10, and 15 actors; shared facility; narrow door; complete AutoPost trace | target-floor simulation and first reusable family |
| T4 — Renderer and UX proof | selected renderer, viewport policy, lifecycle, semantics, and budgets are evidence-backed | identical scenes at 1/10/15/25/50 actors and three viewports | production asset-factory integration |
| T5 — Asset factory proof | one family is reproducible, registered, composable, and fail-closed | connected workstation source-to-runtime slice | T6 review and disposable, non-runtime second-family/tooling trials only |
| T6 — Minimum safe-to-produce | every audit condition is integrated | complete geometric first floor plus T1–T5 evidence | Phases 6–9 production work |

A higher gate cannot compensate for a lower failed gate. Screenshots do not
prove world geometry, a schema-shaped trace does not prove replay, and a smooth
animation does not prove operational truth.

## Relationship to roadmap phases

| Roadmap phase | Remediation work executed there | Promotion result |
| --- | --- | --- |
| Phase 1 — contract closure | Wave 0; all decisions and machine contracts; Wave 1 compiler tooling; fixture/harness specifications for later waves | T0 and T1 contract authority |
| Phase 2 — world kernel | pure coordinates, projection, placement, occupancy, structures, reference closure, and canonical world implementation | executable world-kernel acceptance |
| Phase 3 — headless slice | Waves 2 and 3 reducer, routing, queues, replay, restore, and operations integration | T2 and T3 |
| Phase 4 — renderer selection | renderer port, identical Canvas/Pixi candidates, lifecycle, accessibility, responsive evidence, and numeric decision | T4 |
| Phase 5 — asset factory | Wave 6 production tooling and the one connected-workstation family | T5 |
| End of Phase 5 | integrated audit review | T6 and permission for bulk environment/furniture/character production |

Documentation and fixtures for a later phase may be prepared in Phase 1, but
they do not claim that the later executable gate has passed.

## Two-pass execution rule

Every Wave 2–6 capability is split into two passes even when its requirements
are described together below:

1. **Phase 1 specification pass** — canonical owner, decision, schema, stable
   reference shape, valid and rejected fixtures, exact diagnostics, migration
   effect, dependency decision, and harness/tool interface. Bounded pure probes
   may execute, but no persistent reducer, renderer candidate, production export
   tool, or runtime asset is claimed.
2. **Roadmap implementation pass** — original implementation and integrated
   evidence in its assigned Phase 2–5 gate.

All specification passes complete before Phase 1 closes or the Phase 2 world
kernel starts. Later wave headings therefore describe the complete capability;
their implementation paragraphs do not move their contract work out of Phase 1.

## Dependency map

```text
Phase 1 / Wave 0: honest gates + accepted contradiction resolutions
   |
   v
Phase 1 / Wave 1: identity -> geometry -> building -> room/scene compiler -> T1
   |
   v
Phase 1 / W1.6: specification pass for Waves 2–6 -> Phase 1 record
   |
   v
Phase 2: executable world kernel
   |
   v
Phase 3 / Waves 2–3: reducer -> jobs/facilities -> queues/replay -> operations -> T2/T3
   |
   v
Phase 4 / Wave 5: shared renderer candidates -> renderer/UX decision -> T4
   |
   v
Phase 5 / Wave 6: export/catalog tooling -> connected-workstation proof -> T5
   |
   v
Wave 7: integrated safe-to-produce review -> T6
```

Wave 4 is the Phase 1 visual/asset specification track consumed later by Phases
4–5. Visual style exploration may run alongside Phase 1 world/simulation
specification after projection, facing, scale units, and geometry ownership are
locked. Final pixels and asset batches remain blocked until their later gates.

## Wave 0 — Make the existing gates honest

### W0.1 Register ownership and package boundaries

Status: completed on 2026-08-01. Decision 0007 approves the four exact package
roots and Web composition boundary. Empty package scaffolds, manifest and source
import enforcement, exact clean-room roots, generated-type boundary reservation,
handwritten-duplicate rejection, and the negative boundary matrix pass. No
engine behavior or new external dependency was admitted; reducer/replay and
property/model evidence remain zero.

Deliverables:

- add a contract-ownership table to `REPOSITORY_LAYOUT.md` before creating
  runtime packages;
- approve these exact roots or supersede them in one ADR:
  `packages/office-v2-contracts`, `packages/office-v2-world`,
  `packages/office-v2-simulation`, `packages/office-v2-operations`, and the
  existing `apps/web/src/features/office-v2` presentation/renderer boundary;
- enforce the import graph `contracts <- world <- simulation`, with operations
  depending only on shared operational contracts and Office contracts, and the
  web feature composing packages without being imported by them;
- expand the clean-room allowlist only in the same commit that introduces an
  approved root; never add a broad wildcard;
- name the generated TypeScript boundary and forbid hand-maintained schema
  duplicates;
- record the diagnostic-code namespace and which layer emits each family.

Evidence and exit:

- architecture and clean-room checks reject an Office file outside an approved
  root;
- dependency-direction tests reject applications imported by packages;
- contracts/world/simulation/operations reject imports from React, renderer,
  database, connectors, automation runner, or provider implementations;
- every planned contract has exactly one canonical owner.

### W0.2 Correct test semantics before adding coverage

Status: completed on 2026-08-01. The gate executes 26/26 declared semantic
cases, matches the three rejected diagnostics present at W0.2 exactly, asserts the
six-step A* cost of 600 under 100-unit step and heuristic costs, isolates every
invocation, computes its report, and states that reducer/replay evidence is
zero. The property/model profile is pinned but remains non-executable until its
dependency admission is complete.

Deliverables:

- change the A* executable probe from cost `+1` to the accepted cost `+100`;
- distinguish schema-shape checks from semantic and reducer checks in output;
- execute every case inside every fixture instead of counting fixture groups;
- compare the emitted diagnostic code with `expectedFailure` exactly;
- reset accumulated check failures for each invocation so imported checks are
  repeatable in one process;
- add tests proving an intentionally wrong expected diagnostic fails the gate;
- replace manual inventory totals with a computed count in the final report.

Also pin a property/model-test profile with library version, random type, CI
seed, run count, shrink-path retention, exploration profile, and
counterexample-to-fixture promotion. A passing random run without a reproducible
profile is not evidence.

Before first executable use, admit fast-check or its selected alternative in
`DEPENDENCY_LEDGER.md` with exact version, integrity, license, runtime boundary,
maintenance state, alternatives, and removal path. Apply the same admission
rule later to PixiJS, Playwright, PNG tooling, and any licensed Aseprite binary.

Version the navigation fixture with an asserted path cost. The existing
six-step route must assert cost `600`, and the check must expose step, heuristic,
and final cost units; changing `+1` to `+100` without a cost assertion is not a
correction.

Evidence and exit:

- one deliberately invalid fixture fails for the expected reason and another
  fails the harness because its expected reason is wrong;
- the gate reports case counts by evidence class;
- no message implies inverse projection, crowd replay, or full asset-factory
  readiness when only a narrow probe ran.

### W0.3 Ratify contradiction resolutions

Status: completed on 2026-08-02. Decisions 0008–0013 ratify coordinate/facing,
geometry, building/floor/site/portal, serialization/hash, queue/reservation,
and render-part/proof-workstation ownership. Project ADR 0003 resolves Product
Ranker/Growth Strategist ownership and the deterministic copy/visual join.

The machine-readable `registers/p0-resolution-register.json` maps all twelve
audit headings to an owner, accepted decision set, canonical documents,
intended contract versions, migration or rejection effect, implementation
gate, test owner, and disposition. `office:v2:contradictions:check` validates
that register and hash-locks the 27 pre-W0.3 V1 schemas and fixtures. No
accepted historical JSON was rewritten.

Evidence and exit:

- all twelve P0 IDs are present exactly once and reference accepted decisions;
- shared workflow, catalog, and pilot tests prove winner ownership, branch
  correlation, order-independent join, system audit ownership, and idempotent
  persistence;
- reverse Office imports from workflows, API, runner, and non-Office Web code
  fail the boundary gate;
- reducer/replay and property/model evidence remain zero;
- asset admission remains basic-only, with no renderer, runtime asset manifest,
  new dependency admission, world implementation, or simulation reducer;
- W1.1 was the next package at this historical W0.3 handoff; its bounded
  contract slice is now complete, and the current W1.3–W1.5 bounded T1 record
  passes while the historical promotion baseline remains unchanged.

## Wave 1 — Identity, geometry, topology, and composition

### W1.1 Branded identity and coordinate vocabulary

Status: completed on 2026-08-02 for the common identity/coordinate contract
slice. The package now has a versioned V2 schema, deterministic generated
TypeScript, exact valid/rejected evidence, compile-time namespace isolation,
and renderer-neutral pure facing and cell/sub-cell transforms. Full projection,
inverse picking, camera, geometry, and persistent world behavior remain later
work.

Canonical changes:

- create `DEFINITION_INSTANCE_RUNTIME_STATE.md`;
- extend `WORLD_COORDINATES_PROJECTION_CAMERA.md` and
  `GLOSSARY_AND_INVARIANTS.md`;
- add `common-v2.schema.json` rather than widening ambiguous V1 definitions.

Machine contracts:

- building, floor, room, entity-definition, entity-instance, facility, socket,
  command, event, intent, and tick IDs;
- separate cell, fixed-point sub-cell, floor-local, local-pixel, sprite-pixel,
  and screen-pixel shapes;
- a four-direction world-facing to screen-facing transform;
- versioned references containing both ID and version where mutation would be
  ambiguous.

Define the schema-to-TypeScript generator location, generated-file ownership,
and drift command in this package before any compile-time type-negative test.
Generated branded types are never maintained as a second hand-written contract.

Fixtures and tests:

- all four directions and inverse mapping;
- negative and boundary cells, sub-cell boundaries, elevation, and camera
  origin cases;
- compile-time type rejection plus schema rejection for cross-space values;
- duplicate identifiers, forbidden `latest`, missing version, and type/ID
  namespace collision.

Exit: no canonical schema field named only `position` can cross an architectural
boundary, and all conversions happen through named pure functions.

Evidence and exit:

- `common-v2.schema.json` is generated into the contracts package with a
  SHA-256 source marker; the check fails on missing, unexpected, or changed
  generated bytes;
- valid and rejected common V2 fixtures execute through the knowledge gate with
  exact stable diagnostics, including cross-space and namespace failures;
- the contracts package has `@ts-expect-error` checks for cross-namespace and
  cross-space assignments;
- `@affiliate-ops/office-v2-world` exposes only the named W1.1 pure operations
  `cellOriginToSubCell`, `splitSubCellPosition`, and the two facing transforms;
- W1.2 owns the completed geometry-authority and reference-closure contracts;
  W1.3–W1.5 own the completed topology, room, and scene/compiler contracts.

### W1.2 One geometry authority and reference closure

Status: completed on 2026-08-02. The contract boundary is locked in
`DEFINITION_INSTANCE_RUNTIME_STATE.md`, `GLOSSARY_AND_INVARIANTS.md`, and the
world, actor, asset, connectivity, render, and save documents. Schema,
deterministic generation, bundle closure, geometry agreement, and rejection
evidence now pass in dependency order. This status does not authorize a world
kernel, renderer, runtime asset, or simulation implementation.

Machine contracts:

- `geometry.schema.json` for footprint, clearance, anchor basis, sockets,
  use slots, and orientation transforms in world/sub-cell space;
- `entity-instance.schema.json` for version-pinned placement and orientation;
- `definition-bundle.schema.json` for immutable version-pinned definition sets;
- stable `interaction-ref`, `asset-ref`, `render-part-ref`, and
  `character-profile-ref` schemas so T1 can prove closure without creating
  partial definitions that later phases must mutate;
- semantic reference rules for assets, interactions, animation, connectivity,
  and instances.

Contract decisions for this wave:

- cell offsets own footprint, blocking, clearance, approach, and waiting
  candidates; sub-cell offsets own socket and attachment positions;
- cardinal orientations are explicit quarter-turns from the north basis, and
  unsupported orientations fail instead of being inferred;
- every reference is `{ id: { kind, value }, version }` with a positive version;
  the closure key is `${kind}:${value}@${version}`;
- geometry is the only spatial authority; definitions, interactions, assets,
  connectivity, animation, character profiles, and render parts reference it;
- V1 repeated geometry fields remain frozen and migrate only with complete
  context plus an agreement proof, otherwise the reader fails closed;
- render-part dependencies are presentation-only and acyclic, and assets cannot
  add occupancy, clearance, sockets, or use slots.

Tooling:

- a schema-to-TypeScript drift gate;
- a world/reference semantic linter that constructs one reference graph;
- a geometry agreement check that compares all permitted duplicates to the
  authoritative definition.

The linter enforces the ownership split: interactions reference use-slot IDs;
assets reference world geometry and own only pixel/frame facts; render parts own
only presentation composition; placed instances own placement and orientation.

Rejected evidence:

- dangling definition, asset, socket, clip, interaction, or variant;
- conflicting footprint, anchor, socket, facing, or version;
- invalid rotated clearance, duplicate socket, and render attachment cycle;
- an asset attempting to change simulation occupancy.

Evidence and exit:

- at the W1.2 closure point, the knowledge gate inventoried 89 files, loaded 18 schemas, evidenced 21/21
  fixtures, executes 70/70 semantic cases, and compares 15 exact diagnostics;
- the generated contract gate emits five deterministic modules and detects
  external Office imports, cycles, descriptor collisions, and unexpected files;
- the world package closes the canonical bundle as a 14-node/11-edge stable
  graph, rejects unresolved or mismatched references, and keeps graph order
  independent;
- pure geometry tests cover all four cardinal round trips, asymmetric
  footprint/clearance/socket/use-slot transforms, invalid rotations, duplicate
  members, agreement conflicts, and asset occupancy rejection;
- preflight and `npm run check` pass with historical hashes intact,
  reducer/replay `0`, property/model `0`, basic-only asset admission, no
  renderer, no runtime manifest, and no new dependency admission.

Exit: changing authoritative geometry either updates all permitted derived
evidence deterministically or fails before runtime import. W1.3–W1.5 now own
the topology, room, and scene/compiler contracts; bounded T1 evidence passes.

### W1.3 Building, floor, exterior, entrance, and portals

Status: completed on 2026-08-02. The building topology schema, one-floor and
future two-floor fixtures, target-floor envelope, pure validator, migration
rejections, portal closure evidence, and knowledge adapter are green. This
closes topology ownership only; persistent save/load and cross-floor gameplay
remain later work.

Canonical changes:

- create `BUILDING_FLOORS_EXTERIOR.md`;
- record an accepted floor/site/portal decision;
- extend save and camera documents with floor selection and migration behavior.

Machine contracts and fixtures:

- `building.schema.json` with building, independent floor references, site
  envelope, entrances, and vertical portals;
- a one-floor target envelope;
- a future two-floor envelope using stairs or lift portals without implementing
  second-floor gameplay;
- rejected duplicate floor, missing landing, portal direction mismatch,
  exterior/interior overlap, and elevation-as-floor cases.

Exit: floor 1 is independently addressable, serializable, and migration-
specified, and a future second floor can be referenced without changing floor-1
coordinates or entity IDs. Actual persistent load/save and restore evidence
belongs to Phases 2–3.

### W1.4 Room templates, capacity, and circulation

Status: completed on 2026-08-02. The room-template schema, target room fixture,
capacity/circulation/placement validator, deterministic navigation projection,
and exact rejected cases are green. This remains pure geometry; queues,
reservations, and runtime actor state remain later work.

Canonical changes:

- extend `ROOMS_SURFACES_STRUCTURES_ZONES.md`;
- create or version `room-template.schema.json`.

The contract must include room bounds, legal entrances, required/optional
facility groups, minimum and maximum capacity, actor and prop slots,
circulation widths, adjacency constraints, focal points, density bands, and
deterministic decoration slots.

At this phase, `placementSlot` is geometric: stable ID, cells, clearance,
allowed definition category, and capacity contribution. Runtime facility
capability, use-slot availability, queues, and action progress belong to W2.3
and bind to these slots later.

Fixtures must reject blocked entrances, unreachable required facilities,
insufficient capacity, over-capacity, narrow aisles, illegal adjacency,
overlapping prop slots, and a room whose visual decoration changes navigation.

Exit: the validator proves ten assigned workstations, five reserve actor slots,
shared facilities, and legal circulation using geometry only.

Product checkpoint: approve the ground-floor envelope, entrance, reserved
vertical core, zone adjacency, and focal hierarchy before the target fixture in
W1.5 is finalized.

### W1.5 Deterministic scene plan and target-floor compiler

Status: completed on 2026-08-02. The canonical serializer/hash primitives,
Decision 0014, generated scene/world/building/report contracts, pure scene
compiler, target-floor fixture, reference report, reorder/hash checks, and
five fail-closed compiler diagnostics are green. No renderer, PNG, CSS offset,
character identity, persistent world, or simulation reducer is admitted.

Canonical changes:

- create `SCENE_COMPOSITION_GRAMMAR.md`;
- add `scene-plan.schema.json`, `world-v2.schema.json`,
  `compiled-building.schema.json`, and `compilation-report.schema.json` plus a
  pinned compiler-version envelope;
- add a decision that explicitly supersedes decision 0003 for V2 runtime world
  format before any `office-world-v2` output is accepted;
- preserve V1 schema IDs and define explicit fail-closed V1 rejection unless a
  context-complete migration is later implemented.

Compiler responsibilities:

- expand room templates, facility groups, structural edges, portals, actor
  slots, and prop slots into canonical world data;
- generate stable IDs from declared source identities, never array position;
- stable-sort only collections declared unordered;
- reject every unresolved reference and unsupported semantic variant;
- emit a conversion report, canonical hash, source-plan hash, compiler version,
  and complete reference graph;
- preserve declared decoration seeds and slots but defer decorative expansion
  until its PRNG stream is accepted; visual decoration cannot affect T1 output.

Before the compiler, implement the shared semantic normalizer, raw duplicate-key
rejecting loader, RFC 8785-compatible canonical byte serializer, and SHA-256
domain/version envelope needed for scene output. W2.2 reuses these primitives
for simulation state; it does not introduce them after T1.

Target fixture:

- one large ground-floor envelope;
- ten assigned workstations and five reserved actor slots;
- work, review/meeting, reliability, pantry, and lounge facilities;
- a legal entrance from exterior context;
- sidewalk and road context owned by the site envelope;
- a reserved stair or lift core;
- no production PNG, CSS offset, renderer branch, or character identity.

Exit and T1:

- compile the target plan twice in clean directories and compare canonical
  bytes and hashes;
- reorder authoring input without changing semantic output;
- change one semantic value and prove the hash and exact report change;
- pass every W1 valid and rejected case plus the full repository gate.

### W1.6 Cross-track Phase 1 specification closure

The specification pass defined above is complete for every Wave 2–6 capability
before implementing the world kernel. This includes commands/results/events,
simulation normalization/PRNG/state projection, intents/facilities/actions,
crowds/queues/deadlocks, Snapshot/Trace V2, Operations Snapshot V2/event windows,
roster/routing, lifecycle, numeric style with owner-approved boards, asset pixel
geometry/render parts, source-neutral export, atlas/catalog/bundles, semantic
variants, renderer port, benchmark protocol, accessibility, goldens, and
property/model profiles.

Each capability has its canonical owner, accepted decision where needed,
versioned schema or stable reference shape, valid/rejected fixtures, exact
diagnostic catalog, migration/rejection effect, admitted dependency plan, and
harness/tool interface. Executable implementation gates remain T2–T5.

Phase 1 is complete for contract closure because its accepted decisions,
contracts, schemas, valid/rejected fixtures, exact diagnostics, tool
interfaces, bounded probes, T1 record, W1.6 cross-track record, migration
effects, generated drift gate, and full repository check all pass. This
completion authorizes—rather than claims—the executable Phase 2 world kernel.

### Post-T1 Phase 2 — Executable world kernel

Implement the accepted V2 contracts behind pure interfaces for bounds,
floor-local coordinates, projection/inverse ground picking, footprints,
orientation, placement, occupancy, surfaces, normalized structural edges,
zones, reference closure, canonical serialization, and version rejection.
Keep React, renderer, browser time, operations records, and mutable simulation
out of this kernel.

Property and fixture evidence covers projection and inverse edge behavior,
rotated asymmetric placement, overlap/clearance/support, structure
normalization, stable depth inputs, input reorder, and byte-identical world
serialization. Only after this world-kernel acceptance passes may Wave 2's
persistent headless simulation reducer begin.

The executable entry and exit evidence is recorded in
PHASE_2_WORLD_KERNEL_ACCEPTANCE.md. This checklist does not change contract
ownership: READINESS_MATRIX.md remains the status authority and this plan
remains the sequence authority. Every required exit row must pass before the
Wave 2 persistent reducer is promoted.

The Phase 2 executable world-kernel acceptance passed on 2026-08-02 after
integrating the three pure worker slices. Projection/inverse picking,
placement/occupancy, topology and structural-edge normalization, depth
ordering, reference rejection, and canonical-world hashing are now committed
evidence. This promotion does not authorize the Wave 2 persistent reducer,
renderer, production assets, property/model gate, or visual proof.

The focused research closure slices that feed later work are recorded in
`RESEARCH.md` under "Research closure slices before Phase 3/T2". The Phase 3
`P3-W0` wave accepted RC-01 through RC-03 with canonical source/disposition
records and bounded fixture evidence. This clears the research prerequisite for
selecting a later W2/T2 implementation unit that consumes their facility,
interaction, assignment, or replay rules; it does not claim the runtime
follow-on evidence. `P3-W2.1` now supplies the first pure fixed-tick
command/result/event pipeline with 8/8 focused evidence; it does not claim
facility/interaction runtime, lifecycle, queue/crowd, restore/replay, or real
reducer-produced state-hash evidence. Those T2/T3 gates remain required in
Waves 2–3. RC-04 must close before
renderer accessibility and lifecycle acceptance. These slices are not Phase 2
entry or exit requirements and do not authorize a broader Phase 2 scope.

## Wave 2 — Commands, simulation, jobs, facilities, crowds, and replay

### W2.1 Fixed tick pipeline and command protocol

Create `SIMULATION_PIPELINE_COMMANDS.md` and versioned command, result, and event
contracts. Lock the 10 Hz tick phases in this order or supersede it with an
equally explicit tested order:

```text
ingest durable inputs
-> validate envelopes
-> deduplicate and detect ID conflicts
-> expire or cancel obsolete commands and intents
-> validate and apply commands in total order
-> assign intents and select targets
-> resolve queues and atomic reservations
-> plan or revalidate routes
-> advance movement
-> start or advance interactions
-> release and clean up resources
-> emit results and simulation events
-> check invariants
-> project hashable state and record hash
```

Snapshots are legal only after the invariant/hash boundary.

The protocol must define command ID, actor, issued tick, scheduled tick,
correlation, expected world revision, validation result, apply result,
idempotent duplicate response, and stable failure code. Apply revalidates
against current state. Same-tick order is `scheduledTick`, declared source rank,
source sequence, then command ID using the pinned canonical key order.

Source rank and sequence control ingestion order only; facility and activity
priority cannot retroactively reorder commands. The contract must choose and
test a single policy for a newly received command scheduled in the past—reject
or explicitly normalize to a recorded future tick. A duplicate command ID is
idempotent only when command version and canonical payload digest match the
ledger; a different digest fails as `simulation.command-id-conflict`.

Tests cover same-tick ordering, duplicate delivery, late delivery, stale world
revision, validation/apply race, rejected command with no mutation, and command
retry with byte-identical result.

### W2.2 Simulation normalization, PRNG, and state hashes

Deliverables:

- reuse the accepted raw loader, semantic normalizer, canonical serializer, and
  hash envelope from W1.5;
- define which simulation collections are ordered and unordered;
- pin hash algorithm, domain, version envelope, and hashable-state projection;
- pin the PRNG algorithm, state representation, version, and named stream
  derivation for simulation; decorative randomness uses a separate stream;
- generate replay hashes from the reducer, never from fixture literals.

RFC 8785 preserves string contents; it does not silently normalize Unicode.
The contract explicitly rejects lone surrogates, non-finite and unsafe runtime
numbers, and either rejects negative zero or normalizes it before hashing under
one tested rule. Duplicate keys are rejected by the raw loader before
`JSON.parse`. Name and test the exact UTF-16 code-unit comparator against
cross-process/reference vectors.

Tests cover those outcomes plus Unicode spelling, preserved ordered arrays,
shuffled unordered inputs, cross-process output, stream independence, and a
one-field first divergence.

Exit: independent verification reproduces the same canonical bytes and state
hash from the same accepted snapshot.

### W2.3 Activity intents, actor queues, and facilities

Create `JOBS_INTENTS_ASSIGNMENT.md` and separate contracts for immutable
facility definition, placed facility instance/reference, mutable facility
runtime state, queue ticket, reservation, action progress, activity intent, and
actor action queue. Define:

- deterministic intent ID, source kind, opaque workflow/task/event correlation,
  capability, priority, issue/not-before/expiry ticks, cancellation,
  preemption/resume policy, coalesce key, target-selector version, and
  presentation-only status relative to operational truth;
- capability-based facility selection, never sprite- or family-name selection;
- facility use slots, approach candidates, waiting cells, actor/prop sockets,
  capacity, target generation, availability, and queue state;
- requested, en-route, waiting, acquired, using, released, canceled, and failed
  phases;
- preemption of decorative work by durable operational work;
- one cleanup matrix for task claims, facility slots, cells, reservations,
  queues, and held props in every terminal path.

Durable operational and decorative are different source classifications; both
remain presentation-only with respect to operational truth. Mutable queue and
availability state cannot enter authored world geometry.

Tests exercise every cancellation phase, unavailable and removed targets,
preemption, unreachable approaches, capacity changes, retry, and exactly-once
resource release.

### W2.4 Crowds, queues, fairness, and deadlocks

Create `CROWD_QUEUES_AND_DEADLOCKS.md`. Lock queue ordering, aging/fairness,
bounded waiting, timeouts, route invalidation, head-on passage, swaps,
multi-resource acquisition order, deadlock detection, and deterministic victim
selection if a cycle is broken.

The working policy normalizes a requested resource set in stable key order,
validates all resources, then commits the complete set or none; an actor does
not keep one facility resource while waiting for another. Queue order is
priority class, enqueue tick, then stable ticket ID, with FIFO fairness inside a
priority class. Durable work outranks cancelable decorative work. A no-progress
wait-for graph selects the lowest-priority, latest-intent, greatest-actor-ID
victim and sends it to a declared yield cell; missing yield geometry produces a
stable blocked diagnostic rather than an improvised movement exception.

Fixture profiles:

- one actor baseline;
- ten active actors with distinct homes;
- fifteen geometric actors using the five reserve slots;
- two actors at a narrow door;
- shared pantry, printer, review table, and reliability facility;
- head-on corridor, attempted swap, removed target, changed world revision,
  starvation pressure, and multi-resource cycle.

Every fixture declares service durations, deadlock-detection ticks, maximum
completion-or-block tick, legal yield cells, and which cells, transit slots,
facilities, and reservations participate in its wait-for graph. “No progress”
and “bounded wait” without numeric fixture bounds are invalid assertions.

Ten- and fifteen-actor cases are specified here but execute for T3. T2 remains
a one-actor vertical slice.

Executable crowd exit (T3): every scenario has a bounded result, no leaked
claim, deterministic wait order, and reducer-produced replay hash. Performance
numbers are recorded but do not weaken determinism.

Phase 1 exits this package when policies, numeric fixture bounds, schemas,
diagnostics, and harness interfaces are accepted. T2 executes only the one-actor
case. The executable 10/15-actor replay-hash and bounded-wait exit above is part
of T3.

### W2.5 Snapshot V2, restore, replay, and diagnostics

Create `REPLAY_DEBUGGING_PLAYBOOK.md` and versioned snapshot/trace contracts.
Snapshots are taken only after a completed tick hash boundary. Persist
definitions by versioned reference and include pending commands, scheduled
inputs, command payload-digest/result ledger, intents, action phase/progress,
action queues, route/facility revisions, facility state, queue tickets, wait
queues, reservations, held props, RNG state/draw counts, world revision,
deterministic emitted-event sequence or pending simulation-event outbox,
cleanup generation/idempotency state, and generic
external-input cursors/digests. Operations V2 maps its durable event cursor to
that generic contract later.

Renderer/effect delivery and acknowledgement live in a separate runtime
snapshot and cannot mutate the simulation hash. If an acknowledgement must
affect simulation, it enters as an explicitly recorded deterministic input.

Define checkpoint and retention rules for command payload/result ledgers,
consumed external-input digests, and event IDs so idempotency state cannot grow
forever. A retry older than the retained window must resynchronize or fail with
a stable diagnostic; it never reapplies silently.

Provide a migration registry, replay runner, first-divergence diff, and
secret-safe bug bundle containing versions, seeds, commands, hashes, and the
smallest relevant state difference. Its allowlist serializer is tested with
fake cookies, tokens, browser-profile paths, raw connector payloads, and
unrelated operational records, all of which must be absent.

Restore fixtures start mid-route, mid-queue, mid-interaction, and while holding
a prop. Each restored run must finish with the same event sequence and real
hash as the uninterrupted run. V1 rejects fail closed unless a migration is
given every required versioned context; it may not synthesize missing revision,
intent, facility, or correlation facts. Unknown future versions, missing
migrations, and incompatible definition versions also fail closed.

### W2.6 Fixed-tick and generic browser lifecycle

Define the boundary between durable real timestamps and presentation ticks.
Inject a lifecycle port with mounted, visible, hidden, restoring, and destroyed
states. Background pause and bfcache restore discard accumulated wall time and
never execute an unbounded catch-up burst. Operations reconciliation is deferred
to W3.4 after its event-window contract exists.

The working visible-tab policy is an accumulator capped at five logical ticks
per pump. Excess lag emits a diagnostic and is reconciled without silently
changing tick meaning. Frame-schedule comparisons stop at the same logical tick,
not merely the same wall duration.

Tick boundaries are explicit: `notBeforeTick <= currentTick` is eligible;
expiry, cancellation, and reservation timeout with boundary
`<= currentTick` run before command application and therefore win over an
interaction that would otherwise complete later in that tick. Boundary fixtures
cover every equal-tick case.

Tests prove repeated mount/unmount and pagehide/pageshow do not duplicate
listeners, pollers, animation loops, subscriptions, or pending loads. Logical
progress must not depend on `requestAnimationFrame`.

Exit and T2: the one-actor workstation slice reaches, waits, interacts,
cancels, times out, handles duplicate/stale commands without resource leaks,
reports unreachable state, and restores mid-route, mid-queue, mid-interaction,
and while holding a prop to the same event sequence and state hash as an
uninterrupted run. Multiple display-frame schedules produce the same result
through the injected lifecycle port; real browser acceptance remains T4.

## Wave 3 — AutoPost operations choreography

### W3.1 Verify accepted workflow and role ownership

Consume and re-verify the owners corrected in W0.3 instead of adding an
Office-specific workflow:

- `packages/workflows/src/index.ts` and `docs/WORKFLOWS.md`;
- `packages/agent-catalog/src/index.ts` and `config/agents.json`;
- shared workflow contracts and their producer/consumer tests;
- the automation-runner pilot producer that currently serializes content work;
- `OPERATIONS_ADAPTER_UI_SAFETY.md`.

Product Ranker owns ordered candidate evidence. Growth Strategist owns the
selected winner and proposes or references a strategy version. Strategy
activation remains a separately audited, policy-approved action and cannot be
inferred by Office. Contract tests fail if both roles claim selection or if
neither owns it.

### W3.2 Operations Snapshot V2 and roster binding

Version the operations snapshot and add activity-routing and roster-binding
contracts. Carry role ID and agent-instance ID separately, plus workflow run,
task/job, stage, durable event, ordering cursor, structured reason, failed-from
stage, freshness, session health, feature availability, diagnostic owner,
recoverability, and source revision.

Add an additive durable migration and read-model producer for a transactional
monotonic sequence per workspace/stream epoch. Current state and
`throughSequence` are captured in one consistent transaction. Persist content
group, branch, attempt, artifact, and join-event identities. Timestamps and
SQLite `rowid` never determine ordering.

Operations Snapshot V2 contains operations truth only: agent instance, role,
task, event, feature, session, freshness, and diagnostics. Character, home
facility, and allowed visual interaction data are forbidden there and live in a
separate versioned roster-binding/world contract. A minimal geometric character
definition/reference shell is accepted before T3; Wave 4 later adds its visual
asset mapping.

Split static station availability from live actors:

```text
RoleFacilityBinding:
role -> home facility capability -> allowed interactions -> required features

AgentRosterBinding:
agent instance -> role -> optional character definition
```

Only `AgentRosterBinding` creates an actor. A disabled or absent role can retain
an empty static station without inventing an agent instance.

Reject missing, duplicate, disabled, unknown, incompatible, or visually bound
roles. TeamBrain binds to a command-console facility and cannot appear in the
agent roster.

Event-window semantics require `streamEpoch`, `windowStartSequence`,
`throughSequence`, a contiguous ordered event list, durable event ID, canonical
payload digest, and snapshot/source revision. A sequence gap requests
resynchronization; an epoch change forces reconciliation. The same event ID with
a different digest fails rather than deduplicating silently. If the consumer
cursor predates the retained event window, the adapter reconciles directly to
current truth and does not invent missed choreography.

`windowStartSequence` and `throughSequence` are inclusive. A nonempty window has
`eventCount = throughSequence - windowStartSequence + 1`; an empty window uses
`windowStartSequence = throughSequence + 1`. Persist a recent event-ID/payload-
digest ledger plus the high-water cursor and apply W2.5's accepted checkpoint
and retention policy.

Feature availability is produced from three separate facts: configured role
enablement, connector feature flag, and session health. All remain visible. An
enabled role with a disabled connector cannot appear working.

### W3.3 Fan-out, join, deduplication, and failure choreography

Define copy and visual production as separate child jobs joined by an explicit
`content_ready` condition. The contract carries content-group ID, required
branch set, stable branch IDs, attempt IDs, artifact versions, and one join event
ID. It covers duplicate completion, retry replacement, branch failure/recovery,
and mismatched-group rejection.

Produce two pure outputs: current semantic presentation state from Snapshot V2,
and transient idempotent choreography intents from durable transitions. Current
working, waiting, review, blocked, unavailable, and idle states do not require a
new transition animation. An operational task/run failure maps deterministically
to `blocked` with a structured failure reason unless the six-state product
contract is deliberately versioned. Late, duplicate, stale,
out-of-order, and reconnect-delivered events must not repeat or advance work.

Required traces:

- an all-ten synthetic schema-valid AutoPost path from discovery through
  reconciliation;
- a current-configuration fixture with six enabled roles and four disabled or
  empty stations;
- copy/visual fan-out and join;
- one disabled role and one unavailable connector;
- unknown role, stale one-actor update, duplicate event, late event,
  out-of-order event, reconnect, retry, review wait, block, failure, recovery,
  and correct diagnostic ownership.

Fifteen-actor fixtures are labeled synthetic geometric capacity evidence, never
live adapter-backed employees. Session Keeper is a cross-stage health concern,
not a serial workflow stage. Analytics may emit a recommendation but cannot
silently transition the workflow back to selection.

The current-configuration fixture pins the exact agent-config revision and
feature-flag snapshot. The all-ten fixture declares simulation-only feature
availability and cannot imply that a disabled connector executed.

### W3.4 Operations reconciliation and two-clock integration

After W3.2–W3.3, map Operations V2 event windows onto the generic external-input
cursor. Reload, reconnect, gap, epoch reset, background resume, and bfcache
restore fetch and reconcile current durable truth, then coalesce obsolete
decorative or handoff intents. Resubscription is idempotent and no hidden-time
catch-up burst is permitted.

If the retained event window is intact, reload reproduces the same unconsumed
intent suffix without duplicates. If the cursor is outside the window, it
reproduces the same current semantic state plus a bounded reconciliation intent
set—not historical handoffs.

Exit and T3: the applicable intact-window or expired-window rule above passes,
and 1/10/15-actor headless runs satisfy reachability, contention, queue,
cancellation, fairness, and replay gates. No animation can write or advance
operational truth.

T3 restore checkpoints include a shared-facility queue, narrow-door contention,
target removal, and operations reconnect. Restored 10/15-actor runs preserve
queue order, event sequence, applicable intent suffix, and final reducer hash.

## Wave 4 — Numeric visual contract and asset factory

Phase 1 completes the contracts, fixtures, tool interfaces, and bounded board
generators in this wave. Production export/catalog tooling and real runtime
assets execute after T4 in Phase 5.

The owner visual sign-off is recorded separately in STYLE_PROFILE_APPROVAL.md,
and visual-proof risks are tracked in VISUAL_PROOF_RISK_REGISTER.md. Neither
record admits production pixels or runtime assets before its later gate passes.

The focused visual-production research slice is recorded in `RESEARCH.md`
under `VIS-01 — Original visual production before Phase 5/T5`. It supplies the
craft study, original-material reference boundary, and authoring-method
experiment for W4.1–W4.5. VIS-01 does not change the Phase 2 world-kernel
scope; its production evidence executes after T4 and is consumed by the T5
connected-workstation proof.

### W4.1 Lock the measurable style profile

Extend `ART_DIRECTION_PIXEL_SPEC.md` and add `style-profile.schema.json`. Record
native pixel density, character standing/seated envelopes, desk/chair/door/
wall/window/floor scale, wall and cutaway height, canvas classes, padding,
palette roles and variance, outline, light vector, shadow policy, material
edges, detail bands, signage and font rules, contact/socket tolerance, native
scale, supported zoom stops, and filtering.

Generate scale, palette, light/shadow, character/furniture/door lineup, and
light/dark alpha boards from machine-readable profile data. This is the first
required product-owner visual sign-off. A reference image alone cannot pass.

Add one valid profile and rejected scale, palette, padding, light, font, and zoom
fixtures with exact diagnostics. A named deterministic board generator records
its input profile and output hashes. The profile defines compatibility and
migration rules; visual approval supplements rather than replaces E4 evidence.

### W4.2 Asset geometry, frames, and render parts

Create `ASSET_GEOMETRY_REGISTRATION_RENDER_PARTS.md` and contracts for sprite
frames and arbitrary render parts. They reference W1 world geometry and own
canvas/frame bounds, sprite origin, pixel ground/depth contacts, presentation
sockets, trimming policy, and composite dependencies for chairs, desks, walls,
glass, cutaways, and tall objects. They may not restate world footprint,
clearance, use-slot geometry, or orientation transforms.

Every render part names its coordinate space, depth-contact mode, parent
attachment, stable sibling tie-break, semantic pick owner, and hit-shape/alpha
policy. The dependency graph must be acyclic. Ordinary furniture cannot use the
global structural `upper` policy to jump actors; only declared structure or
effect rules may use that band.

Fixtures cover actor crossings in front of and behind tall objects, seated
workstation composites, wall/door/window/glass/cutaway state, effects, trimming,
misaligned contacts, attachment cycles, and asymmetric-facing rejection. In V1,
trimming is a rejected case; invariance evidence belongs to a later version that
first permits it.

### W4.3 Specify the authoring experiment and export contract

Phase 1 freezes an experiment using only original test material to compare
native Aseprite, fixed-camera 3D-assisted export, and hybrid authoring for
revision cost, facing consistency, geometry registration, cleanup, determinism,
and tool availability. Execute it in Phase 5 after T4, then record the winning
default for the proof workstation in a decision. Do not choose by visual
intuition or force the same method onto character and environment families. The
recipe contract remains source-neutral and the selected source profile receives
the appropriate dependency inspector.

The export contract pins executable and version, structured arguments,
dependencies, locale, color profile, source-profile dependency declarations,
clean output directory, file set, naming, hashes, and failure behavior.
Aseprite profiles specialize dependencies as layers/tags/slices; 3D or hybrid
profiles declare scenes, cameras, collections, render settings, and cleanup
stages. Two clean exports of the same source must be byte-identical.

AI-assisted concept normalization records immutable concept provenance,
tool/model/version, prompt or brief, selection, redraw/reconstruction, pixel
cleanup, palette normalization, facing review, transparent extraction,
geometry registration, similarity review, commercial approval, and family
version. Whole-room generated images remain mood references and cannot become
runtime sheets or maps. Font, signage, tool, and plugin rights are reviewed in
dependency/provenance evidence before T6.

### W4.4 Atlas, catalog, bundle, review, and migration contracts

Create `ATLAS_CATALOG_BUNDLE_LIFECYCLE.md`. Add or consolidate semantic
contracts for source set, export recipe, atlas, asset catalog, scene bundle,
asset review, and asset migration. Define explicit versions with no `latest`
alias, complete reference closure, orphan detection, lifecycle grouping,
preload/upload/unload, floor switch, context recovery, and fail-closed missing
asset behavior.

Atlas V1 uses stable family/version/variant/frame ordering, fixed padding and
extrusion, and explicitly rejects trimming and rotation. Fixtures that prove
trimming invariance belong only to the first later schema version that permits
trimming.

Tooling must include:

- asset-family scaffolder and pinned export runner;
- dependency inspector for the selected source profile, such as Aseprite
  layer/tag/slice inspection only when that profile wins;
- real PNG RGBA decoder and alpha, palette, frame, contact, socket, and seam
  validators;
- deterministic atlas, catalog, and scene-bundle compiler;
- orphan source/recipe/runtime/atlas/catalog/review detector;
- neutral board, contact sheet, composite, and locked review generator;
- asset migration tool and two-clean-build CI job.

The current PNG-header and dimensions probe remains labeled basic admission
until these checks exist.

### W4.5 Character, furniture, environment, and interaction semantics

Extend the character and furniture bibles plus the interaction contract. Add
character-definition, semantic-variant, and interaction-catalog evidence for:

- reusable identity layers independent of role and state;
- four facings and explicit mirror safety;
- separate locomotion, pose, activity, feedback, and facility-visual-state axes
  with precedence and an explicit fallback for each supported composite key;
- held-prop ownership and interruption;
- workstation connection masks and rotations;
- occupied chairs, monitors, doors, windows, glass, corners, ends, cutaways,
  facility state, and prop slots;
- unsupported state failure rather than nearest-looking fallback.

Closure B remains authoritative for interaction capacity, duration, queue,
cancellation, results, and held-prop transfer. This package maps those semantics
to visual poses, variants, and referenced sockets; it cannot redefine lifecycle
truth.

Exit: every semantic state resolves through data to one compatible versioned
variant or an explicit approved static fallback.

## Wave 5 — Renderer and user-experience decision

### W5.1 Shared renderer port and depth policy

Define one port for mount, render immutable snapshot, camera, semantic pick,
resize, load, unload, bundle swap, missing-asset screen, deterministic capture,
context loss, teardown, and remount. Neither implementation may own world,
simulation, operations, or asset admission state.

Bundle loading is abortable. Load/unload handles are idempotent and reference
counted. The port reports capabilities and structured diagnostics, and teardown
must settle pending loads. The missing-asset screen and semantic inspector do
not depend on the bundle that failed.

Add a versioned renderer-neutral presentation snapshot containing only derived
world identities, transforms, semantic states, render-part references, labels,
selection state, and freshness data. It excludes reducer mutation methods,
textures, DOM nodes, browser clocks, and renderer objects.

Replace global render-band assumptions with fixture-proved dependencies for
structures, multipart furniture, tall objects, glass, cutaways, effects, and
actors. Keyboard order remains semantic and independent of visual depth.

### W5.2 Canvas/Pixi benchmark and numeric decision

Run identical geometric scenes and asset bundles through Canvas 2D and the
pinned PixiJS candidate at 1, 10, 15, 25, and 50 actors and small/target rooms.
Before measuring, freeze warm-up, sample count, repetitions, cold/warm runs,
variance handling, scene/catalog/bundle hashes, and the winner rule. Correctness,
lifecycle, and shared semantic-UI parity are hard gates; thresholds are
calibrated from valid runs, not selected afterward to change the winner.

The benchmark bundle is deterministic test-only material under a fixture/lab
root, with a schema, generator, fixed synthetic textures, and hashes. It is
forbidden from `assets/office-v2/manifests`, production catalogs, and runtime
admission, so T4 does not bypass T5.

Record on the pinned pilot environment:

- headless simulation tick p50/p95 as a separately recorded unchanged-hash
  regression baseline, plus projection/presentation frame p50/p95 from identical
  immutable snapshots;
- draw calls, visible sprites, decoded texture and GPU memory estimates;
- JavaScript bundle contribution, initial load, and first interactive time;
- picking and inspector latency;
- resize, hidden/resume, repeated remount, and cleanup behavior;
- context loss/recovery for WebGL;
- 1440x900, 1024x768, and 390x844 behavior.

Both candidates pass a common mount/load/render/resize/hide/resume/unload/
teardown smoke protocol plus the shared DOM semantic parity gate. Supersede
decision 0002 with the numeric result and remove the loser from production code
and dependencies while retaining the protocol, report, fixture hashes, and
tested source revision.

### W5.3 Winner lifecycle, accessibility, and visual evidence

Provide a semantic DOM entity list or tree, synchronized focus, keyboard
traversal, inspector parity, non-color state cues, reduced motion, and forced
colors behavior. Focus must survive snapshot refresh when its entity remains
and move predictably when the target is removed.

The winner must pass visible/hidden, `pagehide`/`pageshow`, bfcache restore,
unmount during load, repeated remount, and applicable WebGL context-loss cases
with zero remaining animation frames, timers, listeners, pollers,
subscriptions, pending loads, or resource handles. Context recovery recreates
resources without changing the simulation hash.

Accessibility fixtures cover 1/10/15 actors, all six operational states,
stale/disabled/removed actors, long labels, pointer-keyboard parity, forced
colors, reduced motion, and deterministic focus fallback. Automated scans are
supplemented by recorded Narrator, browser zoom, motion, and non-color review.

Pin golden browser, fonts, viewport, camera, tick, seed, animation time, world
hash, snapshot hash, projection/style profile, test-family, test-atlas,
test-catalog, test-bundle and renderer revisions, OS image, locale, DPR, font hashes, forced-color
and reduced-motion preferences, threshold, reviewer, and update process. Normal
checks never rewrite goldens, and geometric assertions stay separate from
screenshot comparison.

The property/model profile pins library/version/license, PRNG type, CI seed,
run count, shrink path, counterexample promotion, and independent models for
depth, picking, and lifecycle. Exploration seeds are retained as CI artifacts.

If the selected candidate fails full accessibility or lifecycle acceptance,
the renderer decision reopens and the other candidate is evaluated; the gate
cannot be waived after selection.

Passing the benchmark, lifecycle, accessibility, and viewport evidence is T4.

## Wave 6 — Reproducible asset-factory proof

Wave 4's source-neutral export, PNG, atlas, catalog, and bundle contracts are
implemented independently of the selected renderer. A separate integration
proof loads the immutable result through the renderer port. The selected PNG
decoder/encoder/packer records exact version, integrity, license, color-profile
behavior, alternatives, and deterministic-output evidence in
`DEPENDENCY_LEDGER.md`. The enhanced validators must run through
`npm run office:v2:assets:check` and therefore `npm run check`.

The Phase 1 property/model profile is extended with independent atlas-overlap,
packing, catalog/reference-closure, and orphan models. Those executable checks
are T5 evidence, not a T4 dependency.

### W6.1 Connected-workstation proof family

Build exactly one original workstation family before any asset batch. It must
include real immutable source, brief, provenance, deterministic recipe and PNG
outputs, geometry, isolated/east-end/west-end/middle variants, interaction
socket, geometric-actor seated alignment composite, catalog entry, scene bundle,
runtime registry, review boards, and hashes. A fake-hash documentation fixture
is not proof. The alignment composite uses the approved geometric actor
silhouette; it does not admit a second runtime character family before T6.

Acceptance includes:

- two byte-identical clean builds;
- one accepted orientation using local east-west masks `0`, `2`, `8`, and `10`;
- rejected north-south and corner arrangements until a later family version
  explicitly admits them;
- connect, disconnect, remove, and restore seam matrices;
- source-profile layer/tag/slice or equivalent dependency rename failures;
- missing, altered, malformed, unapproved, incompatible, misaligned, duplicate,
  and orphan failures with exact diagnostics;
- unsupported-version rejection and migration-registry behavior; an actual
  asset migration waits for a real later family version;
- the T2 actor referencing the admitted family without changing its headless
  trace;
- both the neutral-board tooling and selected renderer consuming the same
  immutable catalog/bundle;
- no CSS offset, renderer-specific geometry, manual registry edit, or unrelated
  fallback.

Passing this package is T5. Any pre-T6 second-family trial is disposable,
non-runtime, unadmitted, and forbidden from production catalogs or manifests;
bulk environment, furniture, and character batches remain blocked until T6.

## Wave 7 — Integrated safe-to-produce review

Run the twelve conditions in the audit's minimum safe-to-produce gate as one
versioned acceptance review. The review links, rather than copies, evidence from
T1–T5 and records every schema, fixture, tool version, hash, benchmark, visual
approval, diagnostic, and migration path.

T6 fails if any ordinary asset still needs a scene-specific offset, if active
actor count is inferred from room capacity, if a fixture carries a fake replay
hash, if asset admission has an orphan, or if an animation can imply a durable
transition that did not occur.

Passing T6 unlocks the empty first-floor environment kit, followed by reusable
furniture and character batches. The populated composition is still accepted
through later roadmap phases.

## Recommended implementation/commit sequence

Each numbered unit remains independently green and reviewable. A unit may use
several commits when generated evidence is large, but unrelated units are not
combined merely to reduce commit count.

Units 1–4 are complete through W0.3. Units 5–9 (W1.1 through W1.5) and units
10–14 (W1.6 cross-track Phase 1 specification closure and Phase 2
authorization) are complete on 2026-08-02, including the bounded T1 and
integrated W1.6 records.

1. Register this remediation plan and repair knowledge inventory wording.
2. Correct existing gate semantics and diagnostic assertions.
3. Record package ownership, dependency admissions, and narrow clean-room roots.
4. Ratify coordinate, facing, geometry, floor, serialization, queue, render,
   winner-selection, and content-join ownership decisions; correct workflow and
   catalog sources.
5. Add branded identities, coordinate contracts, generated types, and fixtures.
6. Add geometry/definition-bundle contracts, the reference linter, cardinal
   transforms, and geometry-agreement evidence.
7. Add building/floor/exterior/entrance/portal contracts and migration fixtures.
8. Add room-template/circulation contracts and validator; approve the geometric
   envelope, entrance, core, adjacency, and focal hierarchy.
9. Add scene-plan compiler and the geometric target-floor fixture; pass T1.
10. Complete Phase 1 command/simulation/intent/facility/crowd/snapshot/replay
    documents, schemas, fixtures, diagnostics, and harness interfaces.
11. Complete Phase 1 Operations Snapshot V2, durable cursor design, roster,
    routing, fan-out/join, lifecycle, and reconciliation specifications.
12. Lock the Phase 1 numeric style profile with owner approval and complete
    asset geometry, render-part, export, atlas/catalog/bundle, character,
    furniture, and interaction specifications.
13. Complete the Phase 1 renderer-port, benchmark, test-only bundle,
    accessibility, golden, and property/model specifications.
14. Pass the complete Phase 1 record and authorize Phase 2.
15. Implement and accept the pure Phase 2 world kernel.
16. Implement command ordering, reducer, simulation normalization, real hashes,
    and PRNG against the accepted contracts.
17. Implement intents, facilities, action queues, and the one-actor interaction.
18. Implement one-actor snapshot, replay, restore, divergence, and generic
    lifecycle evidence; pass T2.
19. Implement crowds, queues, deadlock handling, and 10/15-actor profiles.
20. Add the durable sequence migration/producer and implement Operations V2,
    roster, fan-out/join, deduplication, reconciliation, crowd restore, and full
    AutoPost traces; pass T3.
21. Implement the shared renderer port, test-only geometric bundle, depth
    cases, and identical candidates.
22. Run the numeric benchmark and candidate lifecycle/semantic smoke, select
    the renderer, and remove the loser from production.
23. Pass winner lifecycle, accessibility, responsive, property/model, and
    golden evidence; pass T4.
24. Execute the workstation authoring experiment and implement source-neutral
    export plus atlas/catalog/bundle/review/migration validators.
25. Produce and admit the connected-workstation proof; pass T5.
26. Run and sign the integrated minimum safe-to-produce review; pass T6.

Every unit runs its focused tests followed by `npm run check`, then is committed
and pushed. A failed unit is fixed in its owning contract or implementation; no
gate is weakened and no historical evidence is silently edited.

## Parallel work without dependency leaks

Safe parallelism:

- building/floor and room-template design can proceed after identity and
  geometry ownership are locked;
- command envelopes and canonical serialization can proceed alongside the room
  compiler because both depend only on accepted shared types;
- operations schema work can begin after workflow ownership is resolved, while
  its simulation integration waits for intents and facility contracts;
- numeric style boards can begin after projection, facing, scale units, and
  geometry ownership pass;
- renderer-port interface design can begin after immutable presentation
  snapshots and render parts exist, while benchmark implementation waits for
  T3 and a versioned geometric benchmark bundle.

Unsafe parallelism:

- drawing final assets before style, geometry, and export contracts;
- implementing queues before facility ownership and cleanup phases;
- adding role-specific characters before roster and feature availability;
- building a target visual map before the deterministic scene compiler;
- selecting PixiJS or an authoring path before the shared measured experiment;
- creating a registry by hand before catalog and orphan checks.

## Product-owner review points

Engineering continues without repeated point-by-point approval except at these
bounded decisions:

1. approve the geometric first-floor program and focal hierarchy after its
   capacity/circulation gate passes;
2. approve the numeric style, scale, palette, light, and density boards;
3. accept the renderer result and viewport behavior from the numeric benchmark;
4. choose the proof-workstation authoring path only from the measured
   original-material report;
5. approve the connected-workstation composite at native scale;
6. sign the T6 safe-to-produce review before bulk asset production.

Technical failures return to the owning work package. They are not converted
into a series of manual sprite offsets or room-specific exceptions for the
product owner to discover.

## Stop conditions

Stop and repair the owning contract when any of the following appears:

- two files can author the same geometry or operational fact;
- a new generic coordinate, unversioned reference, `latest` alias, or array-
  position-derived ID crosses a boundary;
- deterministic output changes after input reorder or clean rebuild;
- a command, intent, event, or asset failure lacks an exact diagnostic owner;
- a canceled action leaks a claim, reservation, queue entry, slot, or held prop;
- a reconnect repeats presentation intent or animation advances durable truth;
- an asset path, geometry value, or registry entry is corrected manually in a
  scene or renderer;
- a golden update is needed to make a geometric failure disappear;
- an implementation package imports React, a renderer, or an application into
  world/simulation truth;
- a disabled connector or missing adapter record appears to be working.

## Phase 1 completion record

Phase 1 may change from `in progress` to `complete` only when its record names:

- accepted versions and owners for every required decision and contract;
- generated contract/type drift result;
- every valid and rejected fixture with exact diagnostic evidence;
- target scene-plan, compilation report, and canonical world hashes;
- T1 reference-closure, input-reorder, clean-build, and migration evidence;
- bounded later-phase harness specifications without claiming their executable
  gates have passed;
- full repository check commit.
- the immutable Phase 1 exit handoff in PHASE_1_EXIT_HANDOFF.md, including the
  closure commit, passed gates, and Phase 2 receiving contract versions.

Phase 1 completion authorizes the Phase 2 world kernel. It does not authorize
target crowds, production assets, renderer integration, or bulk content.

## Remediation program and T6 completion record

The final acceptance review must state:

- accepted versions of every canonical contract and decision;
- generated contract/type drift result;
- target scene-plan and canonical world hashes;
- 1/10/15 actor trace and restored-run hashes;
- complete operations trace and consumed-event evidence;
- style-profile version and owner approval;
- proof-family source, recipe, output, catalog, bundle, and review hashes;
- renderer decision, environment, budgets, lifecycle, viewport, and
  accessibility evidence;
- all exact negative diagnostics and migration paths;
- full repository check commit.

Only this final record changes the remediation program to complete and unlocks
bulk production under the later roadmap phases.

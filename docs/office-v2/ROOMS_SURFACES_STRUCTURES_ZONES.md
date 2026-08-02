# Rooms, Surfaces, Structures, and Zones

## Spatial ownership

A room is a bounded collection inside one explicitly identified floor-local
world. Supporting surface cells permit placement. Walls, doors, and windows live
on cell edges rather than pretending to occupy an arbitrary sprite-sized
rectangle. A building floor is not a surface or structure kind, and elevation
inside a surface does not change floor identity.

World axes and edge names come from `decisions/0001-projection-grid.md`.
Structural edges use the owner cell plus `north` or `west` so one physical edge
has one canonical identity. South and east edges normalize to the adjacent
cell's north or west edge.

## Surface contract

Each floor cell declares a surface kind, elevation, placement categories, and
traversal cost. A missing supporting surface cell is not walkable and cannot
support furniture. Decorative floor graphics cannot alter these values.

The `floor` kind in `surface-structure.schema.json` is frozen V1 evidence and is
not a building-floor contract. W1.3 introduces versioned V2 floor/world/surface
references rather than widening this schema. Migration requires complete
building and floor context or rejects the V1 input.

## Structure contract

- Walls block traversal and may block placement clearance.
- Doors declare open, closed, locked, and unavailable semantic states.
- Windows never create an approach cell unless an interaction explicitly does.
- Structural sprites may have lower and upper render parts, but retain one
  structural identity.
- Cutaway state is derived from camera-facing edges and selection policy. It
  never deletes the wall from world state.

## Zones

Zones add meaning such as work, review, service, circulation, or quiet. They may
constrain placement or interaction policy, but they do not change coordinates,
projection, occupancy, or sprite depth.

## Required evidence

- Every structural edge normalizes to one identifier.
- A closed door blocks a path and an open door permits the same path.
- Removing a visual upper wall does not change navigation or placement.
- Overlapping zones resolve through an explicit priority rule or are rejected.
- Room fixtures cover edges, corners, door transitions, missing floors, and
  camera-facing cutaways.

## W1.4 room-template contract

`schemas/room-template.schema.json` owns the versioned composition contract for
one room inside one explicit floor reference. The room template is an
authoring and validation record only; it does not create a persistent world,
simulation actor, queue, reservation, facility capability, renderer, or asset.

The template contains:

- room bounds, legal entrances, and floor-local cell coordinates;
- required or optional facility groups with minimum and maximum counts;
- declared minimum and maximum actor capacity, ten assigned workstation slots,
  and five reserved actor slots in the ground-floor target;
- facility, actor, and prop placement slots with anchor, orientation, occupied
  cells, clearance cells, approach cells, and an explicit navigation impact;
- circulation aisles and minimum width;
- adjacency constraints between facility groups;
- primary and secondary focal points;
- density bands and deterministic decoration slots.

Placement-slot envelopes describe room composition reservations. They do not
replace the W1.2 versioned geometry authority for an entity definition. A
future scene compiler must reconcile a slot with the referenced definition
geometry before creating a world instance.

The pure room validator derives blocking occupancy from circulation and slots
whose navigation impact is `blocking`. `non-blocking` props are not navigation
or occupancy truth. Decoration slots must have `none` navigation impact and
empty occupied, clearance, and approach sets; moving or reordering them cannot
change the derived navigation fingerprint.

An entrance is valid only when its cell and at least one approach cell are
inside the room and unblocked. Every facility in a required group must expose
an approach cell reachable from a legal entrance. Aisles must meet the
declared minimum width. Prop envelopes may not overlap. Adjacency constraints
are checked over facility anchors, and density-band limits are checked over
decoration slots.

The stable semantic diagnostics are:

| Code | Meaning |
| --- | --- |
| `room.entrance-blocked` | A legal entrance has no usable entry cell |
| `room.required-facility-unreachable` | A required facility has no reachable approach |
| `room.capacity-insufficient` | Declared capacity or required group count is not supplied |
| `room.capacity-overflow` | Actor, workstation, facility, or exclusive ownership limits are exceeded |
| `room.circulation-too-narrow` | An aisle is below the room minimum or blocked |
| `room.adjacency-illegal` | A facility-group adjacency relation is not satisfied |
| `room.prop-slot-overlap` | Two prop placement envelopes share a cell |
| `room.decoration-navigation-conflict` | Decoration declares navigation/occupancy impact or invalid density placement |

The W1.4 valid fixtures `fixtures/room-template-valid.json` and
`fixtures/room-template-target-floor-envelope.json` prove ten assigned
workstations, five reserved actor slots, work/review/reliability/pantry/lounge
groups, legal entrance reachability, deterministic reorder behavior, and
decoration invariance. The rejected fixtures are split by contract failure:
blocked entrance, unreachable required facility, insufficient capacity,
over-capacity, narrow circulation, illegal adjacency, overlapping prop slots,
and decoration/navigation conflict. The contract version is
`office-room-template-v1`; changing capacity, slot semantics, coordinate
ownership, or diagnostic meaning requires a new version and an explicit
migration rule.
Site-envelope context cannot become a room surface, route, or placement cell.

## RC-01 research closure — room prerequisites, capacity, and approach boundary

Status: bounded research-closure evidence only. The observations below inform
the existing room-template and geometry boundary; they do not promote the
Phase 3/T2 facility implementation or add room runtime state here.

### Engineering question and source rights record

The bounded question was which room-level prerequisites and capacity facts must
be true before an actor can use a facility, how approach/waiting positions are
represented, and what target removal means for the receiving contracts. Only
the following source pages were used:

| Source page | Observed revision/date | License and rights boundary |
| --- | --- | --- |
| [room.lua](https://github.com/CorsixTH/CorsixTH/blob/master/CorsixTH/Lua/room.lua) | `master`, observed 2026-08-02 (Asia/Bangkok) | The page header states the MIT license. It is an external architecture study; no code, map, game data, names, timings, or behavior table is copied. |
| [object.lua](https://github.com/CorsixTH/CorsixTH/blob/master/CorsixTH/Lua/entities/object.lua) | `master`, observed 2026-08-02 (Asia/Bangkok) | MIT notice observed in the page header; no source implementation or content enters the Office runtime. |
| [queue.lua](https://github.com/CorsixTH/CorsixTH/blob/master/CorsixTH/Lua/queue.lua) | `master`, observed 2026-08-02 (Asia/Bangkok) | MIT notice observed in the page header; retained observations are bounded and neutral. |
| [use_object.lua](https://github.com/CorsixTH/CorsixTH/blob/master/CorsixTH/Lua/humanoid_actions/use_object.lua) | `master`, observed 2026-08-02 (Asia/Bangkok) | MIT notice observed in the page header; the page is not a runtime dependency or asset source. |

The moving branch is recorded as an observed `master` revision with the
observation date, not as a pinned Office dependency. The rights boundary is
source-study attribution and clean-room separation, not code or content
adoption.

### Source observations

- `room.lua` stores room bounds, a readiness/active state, a maximum patient
  count, required-staff criteria, and a door entrance relation. Its entry check
  rejects inactive rooms, insufficient required staff, repair state, or a full
  patient count; queue advancement is attempted when the front entry can enter.
- `object.lua` associates an object with an orientation-specific footprint and
  named use-position offsets. Occupancy and passability are derived from that
  footprint and room membership. The page does not provide Office-style
  versioned geometry references, so no source footprint value is transferable.
- `queue.lua` places the waiting list at a door or usable object, has expected
  and present entries, and removes or reroutes entries when a participant or
  target disappears. The displayed queue count is not the complete queue state.
- `use_object.lua` approaches a target use position before attaching the user,
  then disconnects the user during normal completion or interruption cleanup.
  The action can observe target destruction, but its animation-driven details are
  not spatial authority.

### Office disposition and canonical ownership

| Observation | Disposition | Canonical owner |
| --- | --- | --- |
| A room must be ready, have required support, and stay within capacity before a user enters. | Adapt: authored prerequisites, room bounds, required groups, and capacity remain in `office-room-template-v1`; runtime facility availability and capacity are checked by the facility slot. Reject source patient/staff classes, repair behavior, and source capacity values. | This document for authored room composition; `JOBS_INTENTS_ASSIGNMENT.md` and `facility-slot.schema.json` for mutable facility state. |
| An approach/use position is part of target geometry rather than an actor sprite. | Adapt: preserve existing geometry authority, versioned use-slot reference, legal approach candidates, waiting cells, actor socket, and optional held-prop socket. Reject source tile offsets and render/animation offsets as world facts. | `ACTORS_NAVIGATION_INTERACTIONS.md`, existing geometry authority, and `interaction.schema.json`. |
| A removed or deactivated target must not leave entrants waiting forever. | Adapt: target generation/availability changes invalidate the dependent action and enter the shared cleanup path; a waiting cell is a declared legal cell, not a presentation offset. Reject source reroute destinations and callbacks as Office policy. | `JOBS_INTENTS_ASSIGNMENT.md` cleanup matrix and `CROWD_QUEUES_AND_DEADLOCKS.md`; existing facility-slot, queue-ticket, reservation, and action-queue contracts. |

Migration consequence: `office-room-template-v1` and the existing geometry
authority remain unchanged. A V1 room or in-progress action without complete
building/floor context, versioned geometry/use-slot identity, approach/waiting
facts, target generation, and resource ownership follows the existing explicit
migration path or rejects; it is never reconstructed from a source-game tile,
actor position, or display state. No new dependency or schema is admitted.

Focused acceptance command: `node --test scripts/office-v2-rc-01-evidence.test.mjs`.
The fixture is a bounded research probe only and does not claim reducer,
navigation, crowd, replay, or T3 evidence.

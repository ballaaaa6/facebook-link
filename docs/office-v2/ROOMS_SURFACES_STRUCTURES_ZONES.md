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

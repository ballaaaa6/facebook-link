# Office Layout Rework Plan

## Objective

Rebuild the Office C scene on enforceable spatial and facility rules so
characters render crisply, furniture cannot overlap, supported props cannot
float, shared facilities cannot be used by multiple agents accidentally, and
routes remain short and unobstructed.

The generated composition reference is
`assets/art/layout-references/office-c-layout-reference-v1.png`. It guides
composition only. The map grid, registry metadata, validators, and tests remain
the implementation authority.

## Current Gaps

- Responsive percentage sizing and nested fractional transforms blur seated
  character states.
- Map objects have render positions but no general occupancy footprint.
- Asset definitions expose render width but not physical footprint, clearance,
  contact anchors, rotations, or supported parent surfaces.
- Generic attachment offsets do not describe the actual usable surface of each
  parent asset.
- POIs declare capacity, but motion is evaluated per agent and does not enforce
  shared occupancy.
- The pantry, creative storage, printer, and NOC equipment contain unsupported
  or overlapping placements.

## Spatial Model

### Grid occupancy

Every floor asset reserves one or more world-grid cells. A small asset may
render inside part of a cell while still reserving the full cell.

Asset geometry must define:

- render size and sprite bounds;
- floor footprint or occupancy mask for every supported rotation;
- floor contact anchor and depth-sort anchor;
- interaction clearance;
- allowed supports;
- parent surface slots;
- allowed rotations.

Non-rectangular furniture may use an occupancy mask. Clearance is validated
separately from hard occupancy so characters can approach and use an object
without allowing another object to block the interaction.

### Support hierarchy

The supported placement hierarchy is:

```text
room floor or wall
└── furniture
    └── desk, table, counter, credenza, or rack slot
        └── equipment or decor
```

Children reserve a named parent slot instead of floor cells. A child follows
its parent when the parent moves. Removing a parent with occupied slots is
rejected until the children are removed or reassigned.

Examples:

- monitors, keyboards, phones, tablets, and desk lamps use workstation slots;
- the printer uses a printer-credenza slot;
- the microwave and coffee machine use pantry-counter slots;
- papers use desk or meeting-table slots;
- network equipment and the UPS use rack or service-row slots.

### Validation

Map validation must reject:

- overlapping occupancy masks;
- an object that intersects a protected route or doorway;
- unsupported parent and child combinations;
- duplicate use of a named surface slot;
- missing footprint or rotation metadata;
- interaction points inside another object's occupancy;
- unreachable workstations, facilities, or queue points.

The validator must run through `npm run check`.

## Facility Reservations

Physical placement and facility use are separate reservations.

Each interactive facility defines:

- capacity and named interaction slots;
- queue points and maximum queue length;
- service duration and optional cooldown;
- allowed activities;
- fallback facilities or activities;
- availability state.

Reservation states are:

```text
available -> reserved -> in_use -> cooldown -> available
                                   \-> out_of_service
```

An agent must receive a lease before walking to a facility. A lease records the
facility, slot, agent, workflow or simulation run, reservation time, and expiry.
Expired or cancelled leases release their slots idempotently.

Busy behavior:

- optional activities such as coffee, water, and lounge use an available
  alternative or return to the workstation;
- required activities such as printer collection and server inspection wait at
  a dedicated queue point when one is available;
- an agent remains at its workstation when the queue is full;
- a meeting is one group reservation with one unique seat slot per participant;
- agents never share a single interaction point or wait in the same queue cell.

Facility allocation must be evaluated globally for the scene. Per-agent motion
may render an allocated plan but may not independently claim a POI.

Initial capacities:

| Facility | Capacity |
| --- | ---: |
| Coffee machine | 1 |
| Water dispenser | 1 |
| Microwave | 1 |
| Sink | 1 |
| Printer | 1 |
| Server inspection position | 1 |
| Lounge chair | 1 per chair |
| Sofa | 1 per declared cushion slot |
| Mission table | 4 coordinated seat slots |
| Assigned workstation | 1 owner |

## Character Rendering

- Preserve the source frame aspect ratio of 192:208.
- Render at integer CSS-pixel dimensions for the selected zoom tier.
- Snap translated positions to the device-pixel grid.
- Remove the nested seated-state scale adjustment.
- Store state-specific visible bounds and seat anchors in character metadata.
- Use pixel-aligned background offsets or integer `drawImage` source and
  destination rectangles.
- Verify every state at supported zoom levels and common device-pixel ratios.

## Target Layout

### Upper-left: research and growth

- Four workstations in two rows.
- Equipment remains attached to workstation slots.
- Remove horizontal bookshelves from gaps that cannot contain their footprint.
- Put storage against a validated zone edge only when a compatible orientation
  exists.

### Upper-middle: creative studio

- Two creative workstations.
- One separate shooting bay with camera and light interaction clearances.
- Move the filing cabinet and tall plant to different validated edge cells.

### Upper-right: release and QA

- Three workstations.
- One dedicated printer credenza outside the workstation footprints.
- Keep printer queue access out of the central corridor.

### Central circulation

- Preserve one continuous corridor from the right-side entrance across the
  room.
- Connect every zone with a short branch rather than routing through another
  activity area.
- Treat the entrance, main corridor, bottom service route, and workstation
  approaches as protected clearance.

### Lower-left: lounge and pantry

- One sectional sofa, one coffee table, two oriented lounge chairs, and one pet
  bed.
- Declare individual sofa and chair seat slots.
- Build one linear pantry run: refrigerator, sink base, counter modules, and
  water dispenser.
- Attach the microwave and coffee machine to counter slots.
- Keep lockers and the coat rack on the lounge or entrance edge.

### Lower-center: mission review

- One meeting table with four chairs facing the table.
- Declare four unique seat slots and table-surface slots.
- Preserve approach clearance on every occupied side.

### Lower-right: systems and NOC

- One operator workstation.
- Two server racks in a separate service row.
- Mount network equipment and the UPS in rack or service slots.
- Keep rack inspection clearance separate from the entrance route.

## Required Asset Work

Create these environment assets before the final map pass:

1. printer credenza or copy-station table;
2. modular pantry base counter;
3. pantry sink module and counter end module;
4. meeting chairs facing up, down, left, and right;
5. lounge chairs facing the required directions;
6. side-facing low bookshelf and filing-cabinet variants where edge placement
   requires them;
7. rack-mounted or service-row variants for network equipment and the UPS.

Reuse and reclassify these existing assets:

- microwave as counter-surface equipment at a smaller scale;
- printer as credenza-surface equipment;
- coffee machine as counter-surface equipment;
- papers as desk- or table-surface decor;
- sofa as a multi-slot facility;
- existing wall and safety props without changing their geometry.

Any generated runtime asset must follow `docs/art/ASSET_SHEET_PLAN.md`, retain
provenance, use a versioned derivative, and pass asset validation.

## Delivery Order

1. Add character render metadata and pixel-aligned rendering tests.
2. Extend asset and map contracts for footprint, clearance, supports, slots,
   and rotations.
3. Implement occupancy, support, route, and reachability validation.
4. Implement global facility allocation, leases, queues, alternatives, and
   deterministic simulation tests.
5. Produce and validate the required furniture variants.
6. Translate the approved composition reference onto the map grid.
7. Rebuild navigation nodes and facility approaches from the validated layout.
8. Render and inspect desktop, mobile, and supported zoom levels.
9. Run `npm run check` and review the final scene before activation.

## Acceptance Criteria

- No floor occupancy or protected-clearance overlap exists.
- Every surface prop has a compatible parent and unique slot.
- Every interactive facility is reachable and globally capacity-limited.
- No two agents occupy the same facility, seat, queue cell, or interaction
  point unless participating in an explicit multi-seat group reservation.
- Busy agents wait at a declared point, choose an available alternative, or
  remain at their workstation.
- All character states remain crisp and correctly proportioned.
- Common routes are direct and do not require walking around unrelated zones.
- The final rendered layout follows the approved reference without treating the
  reference image as collision geometry.

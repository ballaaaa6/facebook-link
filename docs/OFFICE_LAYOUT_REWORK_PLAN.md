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

## Implemented Baseline (2026-07-24)

- `office-assets.json` is the canonical geometry and support manifest for all
  64 Office assets. It defines render scale, floor footprint, physical support,
  and named parent-surface slots.
- `office-c-v1.json` now uses the rebuilt room layout, protected routes,
  reachable navigation graph, unique facility slots, and parent attachments.
- The runtime resolver rejects floor overlap, route obstruction, missing
  geometry, floating surface props, support mismatch, duplicate parent slots,
  invalid facility capacity, out-of-bounds interaction points, and unreachable
  workstations or POIs. The same checks run in `npm run check`.
- Facility allocation is global and deterministic. It reserves both the
  facility slot and conflicting route space before an agent leaves its desk.
  An unsuccessful request remains at the workstation in a waiting state.
- A five-minute deterministic scene test checks every facility capacity,
  interaction slot, and moving-agent separation.
- Agent sprites use illustrated-art runtime v2 sheets: sharpened 96 x 104
  frames at 1x and optimized 192 x 208 frames at 2x. CSS `image-set` chooses
  density while actor translation remains aligned to physical pixels; seated
  scaling and per-agent frame timers have been removed.
- One persistent scene clock and animation-frame scheduler drive every actor.
  Reduced-motion mode freezes routes and sprite loops at the workstation.
- Object depth uses the bottom of its physical footprint. Desks render in front
  of seated actors and chairs render behind them.
- Zoom uses discrete tiers, the visible grid follows the 40 x 22 map, and the
  room has fit and selected-agent focus controls.
- The Office feed preserves the last live snapshot during temporary failure and
  distinguishes loading, live, reconnecting, stale, fallback, and offline.
- Agent previews render outside the scroll clip, follow moving actors, score
  left/right placement against visible bounds and other actors, and support
  `auto`, `left`, or `right` workstation preferences.

## Remaining Production Work

- Add optional cooldowns, durable cross-client facility leases, and audited
  reservation records when facility use becomes backend-owned rather than a
  deterministic browser simulation.
- Produce dedicated directional chair/storage art and split foreground masks
  when the approved visual style requires more than the current top-down
  utility assets and desk z-order.
- Add a development occupancy/debug overlay and screenshot regression matrix.
- Add heartbeat-based retry backoff and a formal Office transfer/decode/frame
  performance budget.
- Resolve the prototype-only Petdex licenses before public or paid deployment.

## Original Gaps Addressed

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

## Additional System Work

### One scene clock

Position motion already uses a shared animation-frame scheduler, but each agent
currently starts its own elapsed-time origin and each sprite owns a separate
interval timer. A status update may therefore restart one route while the rest
of the scene continues.

Replace these independent clocks with:

- one scene time origin tied to the current snapshot sequence;
- one low-frequency sprite-frame phase derived from scene time;
- stable route-plan identifiers that survive unrelated snapshot updates;
- explicit transition plans when an activity or destination changes;
- pause and resume behavior that does not teleport an agent.

Reduced-motion mode must stop both route motion and repeated sprite animation,
while keeping current status and facility information available.

### Navigation and local avoidance

The navigation graph must be regenerated after the occupancy pass. Route
validation and runtime movement must:

- expand blocked cells by the actor footprint before pathfinding;
- prevent diagonal corner cutting through furniture;
- preserve protected corridor direction and width;
- reserve single-cell bottlenecks and queue cells;
- allow passing in sufficiently wide corridors;
- prevent two agents from occupying the same destination, doorway, or narrow
  route cell;
- replan or return to the workstation when a route becomes unavailable.

The route planner should prefer the shortest valid path, then apply stable
tie-breaking so simulation replays remain deterministic.

### Depth, occlusion, and furniture masks

Depth ordering must use an object's floor contact or footprint-bottom anchor,
not its visual center. Workstations require separate back and foreground masks
so seated characters render behind monitors and desktops but in front of
chairs where appropriate.

Add:

- explicit depth anchors to all assets;
- foreground masks for desks, counters, tables, sofas, and tall storage where
  needed;
- consistent shadows that do not affect footprint geometry;
- tests for character-to-furniture occlusion at every supported facing.

### Camera, zoom, and visible grid

The visible floor grid currently uses a fixed CSS pixel size that is unrelated
to the 40-by-22 world grid. Replace it with map-relative tile dimensions.

Camera behavior must:

- use discrete pixel-safe zoom tiers instead of arbitrary fractional scaling;
- preserve the selected or focused agent while zooming;
- maintain a minimum useful character size;
- keep the world scrollable without changing map geometry;
- provide a fit-to-room action;
- restore a valid camera position after responsive layout changes.

### Asset normalization and style consistency

Normalize every runtime asset before final placement:

- trim visible bounds and restore canonical padding;
- validate perspective, floor contact, outline weight, palette, and shadow;
- keep raster and deterministic SVG utility assets visually compatible;
- generate orientation variants when runtime mirroring would break lighting or
  perspective;
- store geometry independently from image dimensions.

The decorative CSS grid must never be used as collision or scale authority.

### Loading and performance

The character source sheets total roughly 25 MB before bundling. Build
pixel-aligned runtime derivatives at the largest supported display tier rather
than shipping full source sheets to the browser.

Add performance controls for:

- optimized lossless or visually lossless runtime character sheets;
- source images retained outside the browser bundle;
- deterministic preload of the visible roster;
- graceful placeholders while a character sheet loads;
- a single animation loop without per-character React frame updates;
- performance budgets for initial Office transfer size, decode time, and steady
  animation frame time.

### Live-feed reliability

Polling failures must not become unhandled promises or briefly show
`reconnecting` during every successful refresh.

The Office feed must:

- distinguish loading, live, stale, reconnecting, fallback, and offline states;
- keep the last valid snapshot during a temporary failure;
- use snapshot generation and heartbeat timestamps to determine staleness;
- apply bounded retry backoff with jitter;
- reject out-of-order snapshots;
- show the real connection state without inventing agent activity;
- recover without resetting the scene clock or active selection.

### Interaction and accessibility

- Keep keyboard and pointer selection equivalent.
- Reposition previews against the Office viewport and inspector boundaries.
- Prevent activity badges, previews, and nameplates from covering facility
  queues or important map controls.
- Keep selected-agent details persistent when transient previews close.
- Give every zoom and focus control a stable accessible label and state.
- Announce connection and facility-wait changes without announcing every
  animation frame.
- Provide a non-animated semantic list of agents and facilities for reduced
  motion and assistive technology.

### Licensing and provenance

The current Petdex character roster is prototype-only and marked
`pending-commercial-review`. No public or paid release may depend on those
characters without explicit clearance.

Before production:

- record a verified license for every character and generated environment
  source;
- replace uncleared characters while preserving the same runtime manifest;
- keep source provenance and generated-derivative metadata;
- prevent production builds from including prototype-only assets.

### Authoring and diagnostics

Provide a development-only Office debug overlay that can display:

- world cells and coordinates;
- hard occupancy and interaction clearance;
- parent slots and occupied surface slots;
- facility state, leases, queues, and expiry;
- navigation nodes, planned routes, and blocked edges;
- depth anchors and current z-order;
- asset identifiers and validation errors.

Add a deterministic map-validation report so layout problems are actionable
without inspecting the rendered scene manually.

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

## Asset Work

The pilot layout uses the existing versioned `office-utility-c-v1` batch for
meeting chairs, lounge chairs, pantry appliances, storage, safety equipment,
and NOC hardware. The printer uses a validated credenza surface; the microwave
and coffee machine use distinct counter slots; network equipment and the UPS
use rack slots. No additional raster generation is required for this validated
layout.

Create these directional variants only if the final art review requires them:

1. meeting chairs facing up, down, left, and right;
2. lounge chairs facing the required directions;
3. side-facing low bookshelf and filing-cabinet variants;
4. foreground mask variants for desks, counters, tables, and the sofa.

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

1. Tighten the asset and map schemas and establish canonical geometry
   manifests.
2. Add character render metadata, optimized runtime sheets, and pixel-aligned
   rendering tests.
3. Introduce one persistent scene clock and remove per-character frame timers.
4. Implement occupancy, clearance, support, slot, rotation, and depth-anchor
   validation.
5. Implement global facility allocation, leases, queues, alternatives, and
   deterministic simulation tests.
6. Implement collision-aware pathfinding, bottleneck reservations, local
   avoidance, and stable replanning.
7. Correct workstation occlusion and add foreground masks.
8. Produce and validate the required furniture and orientation variants.
9. Translate the approved composition reference onto the validated map grid.
10. Rebuild navigation nodes, queue points, facility approaches, and route
    clearances from the new layout.
11. Replace arbitrary zoom with pixel-safe camera tiers and a map-relative
    visible grid.
12. Harden the Office feed, stale-state handling, retry behavior, and
    selection continuity.
13. Add the debug overlay, validation report, visual regression coverage,
    accessibility checks, and performance budgets.
14. Resolve character licensing before any public or commercial release.
15. Render and inspect desktop, mobile, reduced-motion, and every supported
    zoom tier.
16. Run `npm run check` and review the final scene before activation.

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
- Snapshot refreshes do not teleport agents, reset reservations, or lose the
  current selection.
- Agents do not cut through corners, share bottlenecks, or collide while
  approaching facilities.
- Furniture and characters occlude each other according to floor contact and
  foreground masks.
- The visible grid remains aligned with map cells at every supported zoom tier.
- Reduced-motion mode stops route and sprite animation.
- Office loading and steady animation remain inside the documented performance
  budgets.
- Production builds contain no uncleared prototype assets.
- The final rendered layout follows the approved reference without treating the
  reference image as collision geometry.

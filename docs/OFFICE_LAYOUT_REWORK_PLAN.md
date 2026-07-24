# Office Integer-Grid Layout

## Objective

Office C is a measurable operational scene built on a strict integer tile
contract. The scene keeps all ten active agents readable, reserves two future
workstation modules, separates work from support activity, and preserves
collision-safe routes on desktop and mobile.

The composition reference guides visual rhythm only. The map, geometry
manifest, validator, and tests are the implementation authority.

## Implemented Baseline (2026-07-24)

- The room is 36 x 24 logical tiles at a 32 px authoring grid.
- The left 24 x 24 tiles are the work floor. The right 12 x 24 tiles are the
  support and break floor.
- Workstations occupy a reusable three-column by four-row module grid. Nine
  agents fill the first three rows, Session Keeper occupies the center of the
  fourth row, and the two remaining modules are reserved for agents 11 and 12.
- Map positions, zone dimensions, workstation anchors, collision rectangles,
  POIs, route rectangles, navigation nodes, surface-slot offsets, render boxes,
  and footprints use integer tile values only.
- Runtime movement may interpolate between integer route nodes, but final
  placement and authored geometry never depend on fractional tile values.
- Every asset declares an integer `renderBox` with width and height. Transparent
  image content may occupy less than that box.
- Floor occupancy is declared independently from visual size. A tall appliance
  may render in a 2 x 3 box while reserving only a 2 x 1 floor footprint.
- Surface props claim named integer offsets on desks, tables, counters,
  credenzas, or racks.
- The validator rejects fractional authoring values, footprint overlap,
  protected-route obstruction, unsupported attachments, duplicate surface
  slots, invalid facility capacity, and unreachable destinations.
- Desktop fits the complete 36-tile room using an integer pixel size per tile.
- Mobile fits the 24-tile work floor first, showing all ten agents, then scrolls
  horizontally to the support and break floor.
- Desktop preserves the existing application inspector as a separate right-hand
  UI column rather than stretching the scene across the full viewport.
- Work and support floors have no architectural divider line.
- Each active workstation is assembled from an independent chair, desk,
  foreground mask, seated actor, monitor, keyboard, and optional equipment.
- The support entry is communicated by a rug rather than a decorative door.
- The meeting area uses one table-only raster and four independent chairs.
- Boba is a non-agent companion with an integer patrol route and reduced-motion
  fallback at its home point.
- The ninth character animation row is exposed as the non-looping
  `celebrating` state for completed work.

## Integer Geometry Contract

Each runtime asset separates three concerns:

```text
renderBox   integer tile box used to place the image
footprint   integer floor cells reserved for collision
content     transparent pixels inside the render box; may be smaller
```

Reference sizes:

| Asset family | Render box | Floor footprint |
| --- | ---: | ---: |
| Character frame | derived from 3 tiles wide | 1 x 1 feet |
| Work desk | 4 x 3 | 4 x 2 |
| Office chair | 1 x 2 | 1 x 1 |
| Water dispenser | 1 x 3 | 1 x 1 |
| Server rack | 2 x 3 | 2 x 1 |
| Sectional sofa | 6 x 4 | 6 x 3 |
| Empty meeting table | 6 x 3 | 6 x 2 |

The renderer sizes an asset from both render-box dimensions. It never derives
world height from the source file aspect ratio. Geometry-simple tall utility
assets may opt into filling their declared box; other assets preserve their
intrinsic aspect ratio inside the box.

## Layout

```text
WORK FLOOR — 24 x 24                   SUPPORT + BREAK — 12 x 24
┌──────────┬──────────┬──────────┬─────────────────────────────┐
│ Agent 01 │ Agent 02 │ Agent 03 │ Servers and printer         │
│ Agent 04 │ Agent 05 │ Agent 06 │ Pantry and water            │
│ Agent 07 │ Agent 08 │ Agent 09 │ Lounge and mascot           │
│ Future   │ Agent 10 │ Future   │ Four-seat mission review    │
└──────────┴──────────┴──────────┴─────────────────────────────┘
```

Operational team identities remain in agent data and workstation equipment.
Heavy room boundaries are avoided so the user reads one work floor and one
support floor instead of six disconnected islands.

The fourth-row empty modules contain no production furniture. They remain
available for future workstations without moving the existing ten agents or
resizing the map.

## Character State Semantics

| State | Use |
| --- | --- |
| `seated` | Single-frame pose behind a desk or accepted seat mask |
| `working` | Active assigned-workstation pose |
| `idle` | Offline or stale workstation pose |
| `waiting` | Dependency or queue wait |
| `review` | Review or human-approval work |
| `failed` | Failed or blocked work |
| `walk-left`, `walk-right` | Movement between integer route nodes |
| `waving` | Coffee, water, or greeting interaction |
| `celebrating` | One-shot completed-work animation from source row 4 |

The current `seated` semantic state reuses one accepted source frame and hides
the lower body behind a desk foreground mask. A dedicated furniture-free lounge
sitting sheet remains future art work.

## Camera Contract

- Camera scale is an integer number of CSS pixels per logical tile.
- Desktop initially fits all 36 columns.
- Mobile initially fits the 24-column work floor.
- The support view scrolls to the right boundary through direct scrolling or
  the Break control.
- Zoom controls choose integer tile sizes.
- Agent motion is snapped to physical pixels after interpolating between route
  nodes.

## Validation and Acceptance

- No authored map or geometry value uses fractional tiles.
- All ten agents are visible in the 320–430 px mobile work view.
- The support floor is reachable by horizontal scrolling and the Break control.
- The room supports two additional workstation modules without resizing.
- Tall appliances are visually comparable to character height.
- Desk props occupy compatible, unique parent slots.
- No floor object overlaps another object or a protected route.
- Every facility is reachable and globally capacity-limited.
- Five simulated minutes do not reuse a facility slot or collide moving agents.
- Completed agents use the ninth sprite row.
- Reduced-motion mode freezes travel and animation.
- `npm run check` is the required delivery gate.

## Remaining Art Work

- Produce furniture-free lounge sitting frames before showing characters
  physically seated on the sofa.
- Produce full typing and mouse/review frames for the `seated` state.
- Resolve prototype-only Petdex licenses before public or commercial use.

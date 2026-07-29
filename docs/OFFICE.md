# Agent Office

Furniture reset directive (2026-07-29): no furniture, facility, equipment, or
decor pixel from the current Active Office, its runtime registry, rejected
candidates, existing furniture-library crops, or legacy derived outputs may
enter a new Office candidate. The R05-r02 workstation family is the only
furniture exception. `docs/art/OFFICE_FURNITURE_PRODUCTION_GATES.md` is the
current authority; older reuse or staging-acceptance language is historical
only. Original project-created masters are not approved furniture, but an exact
source marked salvageable in
`assets/game/manifests/office-furniture-master-audit-v1.json` may be extracted
again under a new version and must still pass every family gate. The readable
audit and production order are in
`docs/art/OFFICE_FURNITURE_MASTER_AUDIT_V1.md`.

The front-facing `chair.massage.modern` R01 extraction remains rejection
history because its `lounge-front` pose failed owner review. R02 re-extracts
the chair from the audited original master and uses the owner-approved
`working-front-seated` row documented in
`docs/art/OFFICE_FURNITURE_MASSAGE_CHAIR_R02.md`. R02 is owner-approved at F8.
Furniture-only room composition and Active Office integration remain blocked
at F9-F10.

The remaining seat-capable families are now built as the isolated Seating S01
owner-review batch documented in
`docs/art/OFFICE_FURNITURE_SEATING_S01.md`. Reading chair, pouf, beanbag,
stool, two-seat sofa, three-seat sofa, and the four-seat review table each
passed F0-F7 with the approved working-seated character rows. The seven
families provide 13 candidate slots and 1,404 character-frame-slot checks.
All seven Seating S01 families are independently owner-approved at F8 on
2026-07-29. F9 room composition, F10 Active Office integration, left/right
poses, and silent expansion of the R05-r02 chair beyond its approved
workstation scope remain blocked.

The isolated Office Spatial Socket I01 and Held Props H01 authority is
documented in `docs/art/OFFICE_SPATIAL_SOCKET_SYSTEM_I01.md`. It defines
integer world/local transforms, 108 per-character action-frame sockets, 16
fresh native-scale held props, and 864 fully visible front-overlay attachment
cases. The 54 source-exact hand masks remain calibration evidence and are not
drawn by this presentation. It forbids scene offsets, runtime scale fixes, and
missing-socket fallbacks. I01/H01 pass F0-F7 and remain
`owner-review-f8-pending`; Active Office does not import them.

The first upright facility is the isolated front-only Vending U01-r03 vertical
slice documented in `docs/art/OFFICE_FACILITY_VENDING_U01.md`. It re-extracts
four admitted machine components from the original mechanical-loop master,
keeps one static shell, confines four animation states to a local viewport,
and separates the empty pickup tray, dispense effect, and H01 held output. R03
keeps r02's socket coordinates but draws the complete prop above the actor,
without a hand mask. The six-frame timeline moves the prop from
`facility.output.primary` to each character's measured
`actor.hand.primary.grip` with delta `[0,0]`. Its `2 x 1 x 3` geometry,
stand/approach/exit cells, 108 pose cases, and 30-second failure/retry proof
pass F0-F7. U01-r03 is independently `owner-review-f8-pending`; Water/Coffee,
F9, F10, and Active Office imports remain blocked.

Workstation correction (2026-07-28): the isolated `5 x 4` staging layout,
Candidate r01, and R05 final ten-seat composition are rejected evidence. The
owner-approved workstation authority is R05-r02 P0-P3 in
`docs/art/OFFICE_COORDINATE_SYSTEM.md`. The active Office background and map
remain unchanged. The owner-labelled `C12` placement is now represented by
the isolated `office-c12-ten-seat-v1` review candidate documented in
`docs/OFFICE_C12_TEN_SEAT_V1.md`. It reuses the approved R05-r02 component
geometry on the semantic grid and does not authorize Active Office promotion.
The `office-semantic-grid-v3` pillar candidate is rejected because its left
crop included floor pixels and left the visible wood base short of row 11.
V4 corrected the geometry but its localized edits were later rejected for
visual inconsistency. The completed `office-semantic-grid-v5` scene uses a
clean native architectural rerender, keeps all 1,032 semantic cell assignments,
adds a blank work-status whiteboard on the right wall, and is now the Active
Office background `office-c-background-modern-v7-current.png`.
The isolated `office-semantic-grid-v6` owner-review candidate replaces the
three left wall panels with a blank whiteboard at `D4:L9`, rerenders all three
wood-slat pillars inside their existing semantic boxes, and changes only the
Office floor to light warm-oak herringbone SPC. It remains non-active as
`office-c-background-modern-v8-owner-review.png`; V5/V7 stays authoritative
until explicit owner approval.

The active spatial, facility-reservation, asset-addition, and layout delivery
plan is documented in `docs/OFFICE_LAYOUT_REWORK_PLAN.md`.

## Purpose

The Office is an operational read surface for workflow, agent-run, approval, connector, and runner state. It is not a second orchestration engine. The backend owns durable state; the web application maps that state onto the approved office layout.

## Data boundary

`OfficeSnapshot` in `packages/contracts/src/office.ts` is the versioned client contract. The web application reads it through `shared/services/office.ts`; Office components never import provider data directly.

The current API returns a deterministic simulation snapshot. Local Vite development uses the same contract through a safe fallback when the Worker route is unavailable. Live connectors remain disabled.

## Motion model

Business state and visual motion are intentionally separate:

- Agent status changes at event speed.
- The presentation layer selects a workstation or point of interest.
- A single browser animation loop interpolates position against timestamps.
- CSS transforms move actors without React state updates on every frame.
- Sprite frames retain their low-frame-rate illustrated animation.
- Reduced-motion mode keeps agents at their workstations while preserving all operational information.

Random routines are simulation-only. Live mode never invents operational movement.

Before a simulation agent leaves its workstation, the scene allocator reserves
one named facility slot and checks the time-overlapping route plans of every
other actor. A losing request remains at its workstation with a waiting
presentation. This prevents two actors from sharing a coffee machine, printer,
seat, doorway, or narrow route cell.

## Spatial model

The authoritative distinction between floor footprints, parent support grids,
ground pivots, render bounds, and render offsets is documented in
`docs/art/OFFICE_2D_GEOMETRY_PRINCIPLES.md`.

The isolated semantic attachment authority is documented in
`docs/art/OFFICE_SPATIAL_SOCKET_SYSTEM_I01.md`. It resolves entity roots,
character hands, prop grips, facility outputs, effects, supports, and
viewports through named integer local sockets. It remains F8-pending and does
not replace the current Active Office placement adapter.

`assets/game/manifests/office-assets.json` owns integer render boxes, physical
footprints, support types, and integer parent-slot offsets. `office-c-v2.json`
owns the 36 x 24 integer grid, its 24-column work floor, its 12-column support
floor, protected routes, navigation, facilities, and workstation collision
rectangles. Surface props such as monitors, keyboards, the printer, papers, and
network equipment attach to named parent slots and do not reserve unrelated
floor cells. Workstation chairs are independent floor objects, while desk
foreground masks provide the visual occlusion that makes seated actors read
correctly.

The active room keeps the 24-column work floor on the left and the 12-column
support floor on the right without an architectural divider. The application
inspector remains a separate UI column on desktop; the scene never expands over
it. On mobile, the camera initially exposes the complete work floor and scrolls
horizontally to the support floor.

The support floor uses a rug as the entry cue and contains no decorative door.
The meeting table and its four chairs are independent furniture objects. The
Boba mascot is a non-agent companion with its own integer route and animation
state, so its movement cannot be confused with operational status.

Runtime movement may interpolate between authored nodes, but map placement,
asset boxes, footprints, anchors, and route nodes never use fractional tiles.

The Office layout validator runs as part of `npm run check`. It rejects overlap,
route obstruction, unsupported or duplicate attachments, unreachable
destinations, invalid facility capacity, and missing geometry.

### Historical structural staging room

Office Map v2 is rejected and retained only in the development staging route
`?lab=office-ten-v1`. It models `floor-region`, `wall-segment`,
`window-opening`, and `door-opening` structures separately from the Active
Office background. Its ten `5 x 4` workstations and `desk.modular.v1`
coordinates cannot feed current work. The rejected layout and isolation record
are maintained in `docs/OFFICE_TEN_WORKSTATION_ACCEPTANCE.md`.

The Active Office continues to read `office-c-v2.json` through the legacy
surface adapter and continues rendering `OfficeBackdrop`. Map v2 does not
authorize an Active Office or commercial-character promotion.

## Pixel rendering

The 192 x 208 source frames remain provenance assets. Runtime v2 provides
sharpened 96 x 104 frames for standard displays and optimized 192 x 208 frames
for high-density displays. CSS `image-set` selects the density tier and normal
image interpolation preserves the illustrated shading. Character size derives
from the current integer tile size. Actor translations remain aligned to
physical pixels, and sprite phase comes from the shared scene clock.

## Interaction model

- Pointer or keyboard focus opens a stable preview.
- Preview placement measures the live actor and tooltip rectangles, scores the
  left and right sides for overflow and actor overlap, and clamps the result to
  the visible Office frame.
- A workstation may prefer `auto`, `left`, or `right`; an unsafe preference
  still flips before leaving the frame.
- The tooltip renders through a fixed portal so the scroll container cannot
  clip it, and follows a moving actor without React frame rerenders.
- Preview placement is independent from the moving actor.
- Clicking an actor pins its details in the inspector.
- Escape dismisses transient previews.
- Mobile interaction uses tap and scroll rather than hover-only content.

The inspector shows workflow, stage, agent run, progress mode, attempt, human-review state, and recent events. External actions must enter the action-proposal boundary before execution.

## State projection

`@affiliate-ops/office-read-model` maps durable records to `OfficeSnapshot`. The observable pilot simulation persists jobs, agent runs, audit events, and outbox messages idempotently. Future live producers replace the simulation input without changing Office components.

## Acceptance checks

- Motion is sampled continuously from elapsed time rather than an 80 ms React timer.
- Ten actors can animate without re-rendering the Office tree every frame.
- A preview remains readable when its actor moves.
- Selected details persist until another agent is selected.
- Simulation, reconnecting, stale, and live modes are visibly distinct.
- Five simulated minutes do not exceed a facility capacity, reuse a facility
  slot, or place two moving actors in the same route cell.
- No browser credential, token, local path, or provider secret enters an Office response.

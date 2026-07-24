# Agent Office

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

`assets/game/manifests/office-assets.json` owns physical footprints, support
types, parent slot sets, and render widths. `office-c-v1.json` owns placement,
protected routes, navigation, facilities, and workstation collision
rectangles. Surface props such as monitors, the printer, microwave, papers,
network stack, and UPS attach to named parent slots and do not reserve unrelated
floor cells.

The Office layout validator runs as part of `npm run check`. It rejects overlap,
route obstruction, unsupported or duplicate attachments, unreachable
destinations, invalid facility capacity, and missing geometry.

## Pixel rendering

The 192 x 208 source frames remain provenance assets. Runtime v2 provides
sharpened 96 x 104 frames for standard displays and optimized 192 x 208 frames
for high-density displays. CSS `image-set` selects the density tier and normal
image interpolation preserves the illustrated shading. Actor translations
remain aligned to physical pixels, and sprite phase comes from the shared scene
clock.

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

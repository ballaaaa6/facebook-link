# Agent Office

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
- Sprite frames retain their low-frame-rate pixel-art character.
- Reduced-motion mode keeps agents at their workstations while preserving all operational information.

Random routines are simulation-only. Live mode never invents operational movement.

## Interaction model

- Pointer or keyboard focus opens a stable preview.
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
- No browser credential, token, local path, or provider secret enters an Office response.

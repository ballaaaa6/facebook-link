# Office Engine V2 Implementation Plan

Each phase must pass its exit criteria before the next phase starts.

## Phase 0 — Clean-room baseline

Status: complete.

- Retain the affiliate control panel and operations packages.
- Remove the prior game subsystem and all runtime visual material.
- Add a repository guard for the clean-room boundary.
- Provide an isolated data-free lab.
- Provide a production Office route with an explicitly empty V2 engine mount.
- Establish the canonical knowledge pack, accepted decisions, schemas, valid and
  rejected fixtures, templates, repository skill, and validation gates.

Exit: the full repository gate passes with no game renderer or runtime art, the
Office shell communicates the empty state, every knowledge schema compiles,
valid fixtures pass, and rejected fixtures fail for their declared reason.

## Phase 1 — Executable world contracts

- Define branded identifier types for entity, cell, zone, command, and tick.
- Define world bounds, integer sub-cell units, footprints, anchors, and sockets.
- Define scene serialization and validation errors.
- Implement `office-projection-v1` and inverse-projection behind one interface.
- Add unit and property tests using geometric placeholders only.

Exit: coordinate round-trips, invalid scene rejection, stable depth ordering, and
serialization determinism pass without React or a renderer library.

## Phase 2 — Headless vertical slice

- Build a small room fixture with one actor, one target, and blocked cells.
- Implement fixed ticks, command handling, A* planning, path following, and one
  interaction state machine.
- Record a state trace and prove replay produces the same result.
- Adapt one fake operational event into an actor task without writing back.

Exit: the actor reaches the target, interacts, handles an unreachable variant,
and replays identically in Node tests.

## Phase 3 — Renderer proof

- Benchmark the current PixiJS release against a minimal Canvas implementation.
- Choose the renderer in a short decision record based on batching, camera,
  pointer picking, accessibility integration, bundle size, and maintenance.
- Render only geometric placeholders from simulation snapshots.
- Add camera pan, bounded zoom, picking, depth bands, and responsive viewport QA.

Exit: no rendering component owns simulation state; desktop, tablet, and phone
captures pass; the performance budget is recorded.

## Phase 4 — First original asset family

- Write the art brief and measurable geometry before generation or drawing.
- Produce one isolated family with source provenance and a reproducible recipe.
- Register footprint, origin, sockets, and render band in data.
- Validate the family on a neutral board, then in the one-interaction slice.

Exit: every runtime pixel has recorded provenance, missing files fail the build,
and the slice works unchanged with geometric placeholders disabled.

## Phase 5 — Character and behavior slice

- Produce one original character with the minimum required facings and clips.
- Map semantic simulation states to presentation clips.
- Validate contact points, facing, held-item sockets, cancellation, and reduced
  motion behavior.
- Add one companion or second actor only after reservation rules are tested.

Exit: no animation callback controls task truth, and the recorded state trace is
identical with animation enabled or disabled.

## Phase 6 — Operations integration

- Define a versioned read adapter from workflow and agent events.
- Add stale, reconnecting, and unavailable data states.
- Add inspector UI and action proposals behind existing safety policy.
- Verify the Dashboard, Settings, API, and runner still operate independently.

Exit: event retries are idempotent, stale data is visible, and the engine cannot
execute a connector directly.

## Phase 7 — Production expansion

- Expand room zones and asset families one reviewed batch at a time.
- Add multi-actor reservations, queues, facilities, effects, and time-of-day only
  when each has a contract and test.
- Track draw calls, texture memory, tick time, frame time, and mobile usability.

Exit: production acceptance criteria are written and passed for every target
viewport and supported actor count.

## Definition of done for any feature

- Owning layer is explicit.
- Contract and failure states are documented.
- Deterministic tests cover behavior.
- Visual QA covers presentation when applicable.
- Accessibility and reduced motion are considered.
- No unrelated operational boundary imports the renderer.
- Documentation and the code map are current.

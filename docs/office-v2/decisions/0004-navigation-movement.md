# Decision 0004 — Deterministic Four-Direction Grid Navigation

- Status: accepted
- Date: 2026-07-31
- Owners: world and simulation

## Context

The first office slice needs short indoor routes, explicit approach cells, and
replayable outcomes. Diagonal movement and local crowd steering add corner,
animation, and reservation cases that the first slice does not need.

## Options considered

- Navigation mesh: flexible but mismatched with authoritative cell occupancy.
- Eight-direction A*: shorter visual paths but requires diagonal clearance and
  additional facing/animation policy.
- Four-direction A*: simplest deterministic contract for the approved slice.

## Decision

Use an internal A* planner over the derived four-direction navigation grid.
Every cardinal step costs 100 integer units. Stable tie order is lowest total
cost, lowest heuristic, then `(y, x)`. Planning and movement following are
separate. Movement advances in integer sub-cell units at a fixed logical tick.

Targets are reserved before commitment. Exclusive approach cells and sockets
have deterministic ownership and timeout rules. An unreachable target produces
a structured blocked state.

## Consequences

No pathfinding dependency is admitted for the first slice. Diagonals, local
steering, and crowds require a new decision and new fixtures; they cannot be
enabled as presentation tweaks.

## Evidence

`fixtures/navigation-reservations.json`, Phase 3 path legality tests, and replay
state hashes.

# Phase 3 Wave `P3-W2-03` Frozen Interfaces

This is a coordination reference. It does not create a new contract owner.

## Existing contract boundary

- Queue work uses the frozen `office-queue-policy-v1`,
  `office-queue-ticket-v1`, `office-reservation-v1`,
  `office-action-queue-v1`, `office-facility-slot-v1`, and
  `office-activity-intent-v1` shapes.
- Replay work uses the frozen `office-simulation-snapshot-v2`,
  `office-simulation-trace-v2`, command/result/event shapes, and the existing
  canonical JSON/hash and simulation state-hash exports.
- Operations verification uses the existing workflow constants, content-join
  reducer, ten-role catalog/configuration, Operations Snapshot V2,
  activity-routing, roster-binding, and Closure C fixtures.

## Queue semantics

1. Resource keys are stable typed strings and are validated before mutation.
2. Duplicate keys fail with the simulation-owned duplicate-resource diagnostic.
3. A complete request is normalized by the accepted UTF-16 comparator and
   acquired all-or-none.
4. Queue service order is priority class (`durable` before `decorative`),
   enqueue tick ascending, then ticket ID ascending.
5. Cleanup is idempotent and releases every claim owned by the ticket.
6. Wait-for cycles select the lowest-priority, latest-issued intent and then
   greatest actor ID; only declared legal yield cells are allowed. No-yield is
   `simulation.deadlock-no-yield-cell`.

The queue module may expose a pure, package-local API for these semantics. No
other selected task imports it in this wave, so Main owns any public-barrel
export decision after review.

## Replay semantics

1. Restore is legal only at a completed tick/hash boundary.
2. Ordered events and inputs retain order; only declared unordered collections
   may normalize.
3. Replay runs are deterministic and compare results, events, per-tick hashes,
   and final hash.
4. Unknown future versions, missing migration paths, incompatible definitions,
   incomplete in-progress resource context, and secret-bearing bug-bundle data
   fail closed.
5. Divergence reports the first differing tick and a stable subsystem/path
   context.

The replay module may use a generic injected step/hash boundary to avoid
duplicating the command reducer or activity runtime. It must not alter the
existing hash projection or promote placeholder hashes.

## Workflow ownership semantics

- Product Ranker: ordered ranking evidence only.
- Growth Strategist: sole winner-selection owner and strategy-version reference.
- Gemini Copywriter and Flow Visual Producer: independent copy/visual branch
  owners.
- `workflow-coordinator` with `actorType: system`: sole `content_ready` join
  owner; it is absent from the agent catalog/configuration.
- Session Keeper: session health and recovery only.
- TeamBrain: command-console facility, never an agent instance.
- A disabled role/connector/session cannot execute or present as working.

## Cross-task non-dependency

Session 1 and Session 2 each own independent simulation modules and tests.
Session 2 consumes only already-integrated command/activity/hash contracts and
does not depend on Session 1. Session 3 is read-only verification of existing
workflow and operations sources and does not depend on either simulation task.
Main will add exports, cross-task tests, and any shared documentation after all
worker reviews pass.

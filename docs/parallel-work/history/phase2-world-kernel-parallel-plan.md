# Parallel Phase 2 World-Kernel Plan

Status: PLANNING_COMPLETE
Created: 2026-08-02 (Asia/Bangkok)
Coordinator: lead planner / integration manager
Repository: `D:\antigravity\shopee link`

## Capability check

The Codex desktop environment provides real isolated execution sessions through
`codex_app__create_thread` with project worktrees, plus `wait_threads` for
progress monitoring. The coordinator will create three sessions from the
planning commit and start them concurrently. Each worker receives the full
task specification in its session prompt; no manual prompt relay is required.

## Repository assessment

- Current branch: `main`, aligned with `origin/main`.
- Base commit before coordination artifacts: `fb5cfc79436f3071cd77951fa9c08e489f5e73c7`.
- Base worktree was clean; no user changes were overwritten.
- Baseline `npm run check` passed before planning.
- Office V2 preflight passed: clean-room, package boundaries, contradictions,
  generated contracts, knowledge, and asset foundation gates are green.
- Phase 1 is closed by `PHASE_1_EXIT_HANDOFF.md`; Phase 2 pure world-kernel
  implementation is explicitly authorized by `READINESS_MATRIX.md` and
  `PHASE_2_WORLD_KERNEL_ACCEPTANCE.md`.
- `packages/office-v2-world` currently contains coordinate semantics, geometry
  validation, topology validation, reference closure, room validation, and a
  deterministic scene compiler. It has no executable projection/unprojection,
  immutable geometry-aware placement/occupancy snapshot, or reusable depth and
  canonical world-kernel API.
- The knowledge gate currently reports projection, placement, depth, and
  structure expectations as bounded fixture evidence only; it explicitly does
  not claim inverse picking, occupancy, or persistent world behavior.
- `PHASE_2_WORLD_KERNEL_ACCEPTANCE.md` is still `not-started`, with P2-EXIT-01
  through P2-EXIT-09 awaiting executable implementation evidence.
- The existing `docs/parallel-work` files described an older affiliate
  persistence/connector/API wave from base `84525d9`; that wave is stale and is
  superseded here because the current source-of-truth documents authorize the
  Phase 2 world kernel as the next implementation package.
- No local development server was started. No runtime assets, renderer, React,
  simulation reducer, connector, database, or new dependency is in scope.

## Selected tasks

The three tasks are the highest-priority executable slices of the authorized
Phase 2 gate. They are independent at the worker level: workers may add only
new package-local source and test files, while `src/index.ts`, shared docs,
schemas, fixtures used by other tasks, and acceptance records remain reserved
for the Final Integrator.

| Session | Task ID | Task | Primary evidence | Branch | Planned worktree label |
| --- | --- | --- | --- | --- | --- |
| 1 | P2-WORLD-01 | Deterministic projection and inverse ground picking | P2-EXIT-01, P2-EXIT-02 | `task/session-1-projection-ground-picking` | `.worktrees/session-1` |
| 2 | P2-WORLD-02 | Geometry-aware placement and occupancy snapshots | P2-EXIT-03, P2-EXIT-04, P2-EXIT-09 | `task/session-2-placement-occupancy` | `.worktrees/session-2` |
| 3 | P2-WORLD-03 | Topology normalization, depth ordering, and canonical world evidence | P2-EXIT-05, P2-EXIT-06, P2-EXIT-07, P2-EXIT-08 | `task/session-3-topology-depth-canonical` | `.worktrees/session-3` |

The three planned worktree labels are coordination names. If Codex allocates
an implementation-specific absolute worktree path, the worker must record that
actual path in its status file. The branches must retain the exact names above.

## Task 1 — P2-WORLD-01: deterministic projection and inverse ground picking

### Current problem and rationale

`coordinate-semantics.ts` only implements cell/sub-cell conversion and facing
mapping. The accepted `office-projection-v1` equation and the half-open picking
policy currently exist in documentation and a knowledge fixture, not in the
world package. Projection is the first executable dependency for every later
world and presentation consumer, and it can be implemented without touching
placement or topology code.

### Expected outcome

A pure, renderer-neutral projection module converts validated floor-local cell
and sub-cell positions to logical screen pixels and deterministically inverts a
ground screen point to a floor-local cell. Bounds, safe-number behavior, edge
ties, and the accepted version are executable and tested.

### Exact scope

- Add `packages/office-v2-world/src/projection.ts`.
- Add `packages/office-v2-world/test/projection.test.ts`.
- Reuse the existing generated coordinate types and
  `coordinate-semantics.ts`; do not duplicate the projection equation in a
  component or fixture helper.
- Pin constants for `office-projection-v1`: 64x32 logical pixels per cell,
  half tile 32x16, 16 pixels per elevation unit, and no camera rotation.
- Expose a small pure API for forward projection of cell/sub-cell coordinates,
  ground-contact projection, and inverse ground picking with explicit bounds.
- Enforce coordinate-space discriminators, integral/safe inputs, non-negative
  elevation, finite derived pixels, and translation/multiplication overflow
  checks.
- Implement the documented half-open edge policy. An exact shared edge must
  resolve by lowest `y`, then lowest `x`; outside and degenerate inputs must
  fail closed with stable `projection.*` diagnostics or a documented null
  result rather than guessing.
- Test all existing projection fixture cases, interior/boundary/outside and
  degenerate points, negative sub-cell floor semantics where applicable,
  repeated-byte determinism, and wrong-space/unsafe-range rejection.

### Explicit out of scope

Camera fitting, pan/zoom, viewport UI, pixel snapping policy, renderer ports,
React, picking of entities/overhangs, sprites/assets, simulation, navigation,
placement, topology changes, schema changes, generated files, and runtime art.

### Owned files

- `packages/office-v2-world/src/projection.ts`
- `packages/office-v2-world/test/projection.test.ts`
- `docs/parallel-work/session-1-status.md`

### Forbidden files

All files outside the owned list, especially `packages/office-v2-world/src/index.ts`,
`coordinate-semantics.ts`, existing topology/geometry/compiler files,
`packages/office-v2-contracts/**`, `docs/office-v2/**`, other session status
files, acceptance records, app code, and root configuration.

### Dependencies and interface assumptions

Only the existing `@affiliate-ops/office-v2-contracts` package and local
coordinate semantics may be imported. The forward result must expose finite
`xPx`, `yPx`, the accepted projection ID, and the projected ground contact
needed by the depth task. The inverse API must not depend on a camera object.

### Required tests and acceptance criteria

- Existing `projection-roundtrip.json` values pass through the new module.
- Interior and boundary cells round-trip; exact edge ties use `(y, x)` order.
- Outside/degenerate/wrong-space/unsafe inputs fail closed deterministically.
- Projection of the same input is byte-identical across repeated calls and
  does not mutate input.
- Focused package test and typecheck pass; the worker also runs `npm run check`.
- No visual testing is claimed; the status file says so explicitly.

### Handoff

Record the actual API, diagnostics, focused/full commands, commit hash, and a
short note for the integrator describing any type adaptation needed for the
public export. Do not edit the public barrel; the Final Integrator owns that.

## Task 2 — P2-WORLD-02: geometry-aware placement and occupancy snapshots

### Current problem and rationale

Geometry rotation and room-template validation exist, but no executable world
placement operation derives transformed footprint, blocking, clearance,
approach, waiting, or interaction use-slot positions into an immutable world
snapshot. Without this boundary, occupancy and rejection behavior cannot be
used by a later simulation slice.

### Expected outcome

A pure placement module accepts an explicit floor bounds/surface model and
versioned geometry authority, returns a new immutable snapshot on success, and
returns stable diagnostics without mutating the previous snapshot on failure.
It distinguishes blocking structural/furniture occupancy from non-blocking
decoration and resolves transformed interaction slots without copying geometry
facts into entity records.

### Exact scope

- Add `packages/office-v2-world/src/placement.ts`.
- Add `packages/office-v2-world/test/placement.test.ts`.
- Build on `transformGeometry` and existing version/reference types; do not
  rewrite geometry validation.
- Define local pure interfaces for a minimal world bounds/surface policy,
  placed entity identity, placement request, occupancy index, and immutable
  snapshot. The model must keep geometry definitions separate from instances.
- Support cardinal orientation, world anchor translation, transformed footprint,
  blocking cells, clearance cells, approach/waiting candidates, and use-slot
  facing/socket resolution.
- Validate missing geometry, unsupported orientation, floor mismatch,
  out-of-bounds cells, blocking/clearance overlap, unsupported surface,
  blocking overlap, and unreachable required approach cells using deterministic
  four-direction reachability.
- Provide deterministic ownership lookup for every occupied/blocking cell and
  stable results independent of entity insertion order where semantics are
  equivalent.
- Treat non-blocking decoration as presentation-only: it cannot add occupancy,
  clearance, navigation impact, or hidden collision.
- Prove rejection leaves the prior snapshot byte-equivalent and success does
  not mutate caller-owned inputs.

### Explicit out of scope

Mutable simulation, A* route planning as a standalone subsystem, reservations,
queues, actor movement, renderer/depth/picking, camera, asset/React imports,
database, operations, connectors, schemas, generated files, and runtime art.

### Owned files

- `packages/office-v2-world/src/placement.ts`
- `packages/office-v2-world/test/placement.test.ts`
- `docs/parallel-work/session-2-status.md`

### Forbidden files

All files outside the owned list, especially `packages/office-v2-world/src/index.ts`,
existing geometry/topology/compiler/room files, contracts and schemas, other
session files, acceptance records, apps, simulation, and configuration.

### Dependencies and interface assumptions

The module may import only the existing world package modules and
`@affiliate-ops/office-v2-contracts`. It must not import Task 1 or Task 3 by
path. The Final Integrator will connect the public barrel and any cross-task
projection/depth adapters after all commits are present.

### Required tests and acceptance criteria

- Asymmetric geometry passes all cardinal transforms, including footprint,
  clearance, approach, waiting, and socket agreement.
- Edge/corner placement, structural blocker, furniture overlap, clearance
  conflict, unsupported surface, unreachable approach, missing geometry, and
  unsupported orientation cases fail with stable diagnostics.
- Non-blocking decoration never changes navigation occupancy.
- Every accepted blocking cell reports one owning entity; duplicate ownership
  fails closed.
- Failed placement returns the exact prior snapshot; equivalent insertion order
  produces deterministic occupancy/output.
- Focused package test and typecheck pass; the worker also runs `npm run check`.
- No renderer, simulation, or visual test is claimed.

### Handoff

Record the snapshot and diagnostic API, fixture/input assumptions, tests,
commit hash, and any integration concern. Do not export through `src/index.ts`.

## Task 3 — P2-WORLD-03: topology normalization, depth ordering, and canonical world evidence

### Current problem and rationale

Topology validation and scene compilation already prove contract closure, but
the executable Phase 2 kernel still lacks a reusable normalized topology/depth
ordering boundary. The depth fixture remains a bounded evidence probe, and
canonical scene output is not exposed as a small world-kernel utility that can
reject stale/wrong-version references and prove stable ordering independently
of compiler input order.

### Expected outcome

Pure world-kernel utilities normalize floor/site/portal and structural-edge
identities, sort depth inputs by documented ground contact/elevation/band/ID
rules, validate closed world references, and produce canonical bytes plus a
domain-separated hash for an accepted world-shaped value. They fail closed on
duplicate, missing, stale, wrong-kind/version, and cyclic attachment references
without importing a renderer.

### Exact scope

- Add `packages/office-v2-world/src/topology-kernel.ts`.
- Add `packages/office-v2-world/src/depth-ordering.ts`.
- Add `packages/office-v2-world/test/topology-kernel.test.ts`.
- Add `packages/office-v2-world/test/depth-ordering.test.ts`.
- Reuse existing `validateBuildingTopology`, `validateDefinitionBundle`,
  `validateRenderPartDependencies`, `canonicalJson`, and `canonicalHashHex`
  rather than forking their logic.
- Normalize equivalent topology collections and structural edge identities
  using the owner-cell plus north/west edge rule; preserve explicitly ordered
  arrays.
- Provide a stable depth key/order for projected ground contacts, elevation,
  render band, and entity/part ID. Equal inputs must be insertion-order
  independent. Multipart dependencies must be acyclic and retain one semantic
  owner.
- Validate a versioned world-kernel envelope against explicit building/floor/
  world references, bounds, entities, portals, and reserved cores. Missing,
  stale, wrong-kind/version, and duplicate references must fail before canonical
  output is returned; site context must remain outside floor occupancy.
- Return canonical bytes and a domain/version-separated hash. Reordered
  unordered inputs yield identical bytes/hash; semantic mutation changes hash;
  ordered sequences remain order-sensitive.
- Test the existing topology fixtures and `depth-occlusion.json`, plus stable
  tie, adjacent, rotated/overlapping, site-leak, version, duplicate, missing,
  and dependency-cycle cases.

### Explicit out of scope

Projection math implementation, camera or entity picking, placement mutation,
occupancy route planning, simulation/replay, renderer adapters, React, assets,
database, operations, connectors, schema/generated updates, and visual golden
captures.

### Owned files

- `packages/office-v2-world/src/topology-kernel.ts`
- `packages/office-v2-world/src/depth-ordering.ts`
- `packages/office-v2-world/test/topology-kernel.test.ts`
- `packages/office-v2-world/test/depth-ordering.test.ts`
- `docs/parallel-work/session-3-status.md`

### Forbidden files

All files outside the owned list, especially `packages/office-v2-world/src/index.ts`,
existing topology/compiler/reference files, contracts/schemas/generated output,
other session files, acceptance records, apps, simulation, renderer, assets,
and configuration.

### Dependencies and interface assumptions

The depth API consumes a renderer-neutral structural record containing projected
ground contact pixels, non-negative elevation, a declared band, and stable ID;
it must not import Task 1. The topology API consumes explicit versioned
references and may delegate to existing validators. The Final Integrator owns
the public barrel and any adapter between Task 1 projection results and this
depth input.

### Required tests and acceptance criteria

- Topology and structural edge normalization is deterministic and floor/site
  identity never comes from elevation.
- Depth order matches the documented fixture and is stable under every input
  permutation, including equal ground-contact ties.
- Missing/stale/wrong-version/duplicate references and render dependency cycles
  fail closed with stable diagnostics and no partial canonical result.
- Reordered equivalent world inputs have identical canonical bytes and hash;
  semantic changes alter the hash; ordered arrays stay ordered.
- Focused package tests and typecheck pass; the worker also runs `npm run check`.
- No renderer, asset, or visual proof is claimed.

### Handoff

Record API names, canonical/hash domain versions, diagnostics, focused/full
commands, commit hash, and any public-export or cross-task adaptation needed.

## Shared contracts and boundary rules

The workers must not create a new schema or modify generated contracts in this
wave. Shared assumptions are:

1. Projection version is `office-projection-v1`, with 64x32 cells, 16 pixels
   per elevation unit, four sub-cell units, and no camera rotation.
2. World identity is explicit and versioned. Elevation is height within a
   floor, never a floor identity.
3. World package code remains pure/headless and imports only the approved
   Office V2 contracts package or same-package modules.
4. Geometry authority remains `office-geometry-authority-v1`; instances do not
   copy footprint, clearance, sockets, or use-slot facts.
5. Canonical bytes use `office-canonical-json-v1`; hashes use the existing
   `office-sha256-envelope-v1` utility with an explicit domain/version.
6. Stable diagnostics are owned by the world package and must preserve exact
   `world.*`/`projection.*` meaning; no Ajv wording or ad-hoc numeric error is
   exposed as a new contract.
7. No worker edits the public barrel, shared contract files, docs outside its
   status file, generated reports, or another session’s status.

### File ownership matrix

| File area | Session 1 | Session 2 | Session 3 | Final Integrator |
| --- | --- | --- | --- | --- |
| `packages/office-v2-world/src/projection.ts` | owns | forbidden | forbidden | review/export |
| `packages/office-v2-world/src/placement.ts` | forbidden | owns | forbidden | review/export |
| `packages/office-v2-world/src/topology-kernel.ts` | forbidden | forbidden | owns | review/export |
| `packages/office-v2-world/src/depth-ordering.ts` | forbidden | forbidden | owns | review/export |
| new task tests | owns assigned test | owns assigned test | owns assigned tests | review/augment |
| existing `packages/office-v2-world/src/**` | read-only | read-only | read-only | owns integration edits |
| `packages/office-v2-world/src/index.ts` | forbidden | forbidden | forbidden | owns |
| `packages/office-v2-contracts/**` and `docs/office-v2/schemas/**` | forbidden | forbidden | forbidden | forbidden unless an accepted contract defect is proven |
| `docs/office-v2/PHASE_2_WORLD_KERNEL_ACCEPTANCE.md` | forbidden | forbidden | forbidden | owns |
| `docs/office-v2/READINESS_MATRIX.md`, roadmap, changelog, architecture | forbidden | forbidden | forbidden | owns |
| `docs/parallel-work/parallel-plan.md` | read-only | read-only | read-only | owns after launch |
| own status file | owns | owns | owns | marks integrated |
| other status/lock/report files | forbidden | forbidden | forbidden until elected | owns |

## Dependencies and integration order

Worker code may run concurrently because no worker requires an unpublished
sibling commit. Logical integration is:

1. Verify all three status files and task commits against base
   `fb5cfc79436f3071cd77951fa9c08e489f5e73c7` and the planning commit.
2. The elected Final Integrator creates or checks out
   `codex/integration/phase2-world-kernel` from the planning commit.
3. Cherry-pick/merge all three task commits without resetting or discarding
   valid work; review ownership before resolving any conflict.
4. Wire the new APIs through `packages/office-v2-world/src/index.ts`; add
   cross-task tests that connect projection to depth and geometry to topology
   without moving ownership between layers.
5. Run the relevant Phase 2 evidence and full `npm run check` gates.
6. Update the Phase 2 acceptance record, readiness matrix, Office V2 README,
   roadmap/status, and any generated code map only through repository scripts.
   Do not claim P2 is passed unless every required row has committed evidence;
   this wave may close only the rows actually proven.
7. Mark statuses `INTEGRATED`, write the final report, commit the integrated
   branch, remove the temporary lock after the report is committed, verify a
   clean tree, and push the integration branch to `origin`.

## Worker protocol

Each worker must:

1. Confirm its actual worktree and branch; record both in its status file.
2. Verify `HEAD` is the planning commit before changing code.
3. Read this plan and its status file; set `Status: IN_PROGRESS`.
4. Work only in its owned files and update its own status at meaningful
   milestones. Status edits must be committed with the implementation.
5. Run focused tests, package typecheck, full `npm run check`, and clean-tree
   checks. Record exact commands and results; never overstate visual evidence.
6. Commit the implementation and status as one or more normal commits, record
   the final hash, and leave the task worktree clean.
7. Set its status to `COMPLETED`, refresh the other branch heads/status files,
   and determine whether all three workers are complete. A worker that is not
   the last eligible finisher stops with a handoff.

## Final Integrator election protocol

The last worker to observe all three committed statuses as `COMPLETED` or
`INTEGRATED` attempts to claim `docs/parallel-work/final-integration.lock` on
the integration branch. It must use the exact lock contents below, commit it
immediately, refresh all branch heads, and verify ownership before merging:

```md
# Final Integration Lock

Owner session:
Worker or session ID:
Branch:
Task commit:
Claimed at:
Base commit:
```

If the lock already exists, the worker must not integrate. It records a clean
handoff and stops. The lock owner switches to/creates the integration branch,
reviews all task commits and statuses, integrates, validates, updates docs,
marks statuses integrated, writes the final report, commits, and pushes. The
temporary lock is removed only after the final report is committed and the
branch remains auditable through the commit history.

## Validation requirements

Required worker and integrator commands, as applicable:

```text
npm run office:v2:contradictions:check
npm run office:v2:contradictions:test
npm run office:v2:knowledge:check
npm run office:v2:boundaries:check
npm run office:v2:boundaries:test
npm run office:v2:assets:check
npm run office:v2:clean-room:check
npm run check
```

The final report must also record focused world tests, package typecheck,
`git diff --check`, merge/conflict results, and final `git status --short
--branch`. No dev server is needed for this headless wave.

## Known risks and mitigations

- The public barrel and Phase 2 acceptance docs are shared; they are reserved
  for integration to prevent three workers from editing them concurrently.
- Projection and depth must agree on ground-contact fields; the integrator adds
  an adapter test rather than allowing a direct cross-branch import.
- Placement and existing room/compiler geometry use different authoring layers;
  the integrator must prove geometry authority is not duplicated.
- Existing knowledge fixtures are bounded probes, not proof of the new runtime;
  acceptance records must separate new unit evidence from historical claims.
- No renderer, asset, simulation, or property/model readiness is unlocked by
  this wave. Any worker proposing those changes is blocked and must hand off.
- If a worker fails, preserve its branch/status and use a replacement session
  against the same branch/worktree only for the remaining owned scope.

## Final report requirements

The Final Integrator creates `docs/parallel-work/final-integration-report.md`
with date/time, original base, planning commit, integration branch, session and
worker IDs, task branches/commits, lock owner, integrated commits, task results,
files, conflicts/resolutions, cross-task adjustments, exact validation commands
and results, acceptance rows proven/not proven, documentation changes,
limitations/risks/follow-up, final commit hash, push result, and final Git
status. The coordinator returns one consolidated report after this artifact
and the integrated commit are complete.

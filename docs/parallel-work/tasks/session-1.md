# Worker Session 1 Task Specification

- Session: 1
- Task ID: `P3-W3.2`
- Task name: Operations Snapshot V2 cursor and roster adapter
- Parent Phase: Phase 3 — Headless operational vertical slice
- Wave ID: `P3-W3-02`
- Worker branch: `task/session-1-p3-w3-02-operations-adapter`
- Worker worktree: `C:\Users\WINDOW XI\.codex\worktrees\phase3-p3-w3-02-operations-adapter`
- Original base commit: `d5e04992839dc4f09bc0e66de2dd7cbf02282ad2`
- Planning artifacts / worker starting commit:
  `175d0d384e64610225e93f21272fdb71bdcaf4ba`.
- Status file: `docs/parallel-work/session-1-status.md`

## Objective

Harden the operations-owned Snapshot V2 adapter as one deterministic,
renderer-free boundary for durable cursor reconciliation, role/agent-instance
binding, feature availability, and safe interaction proposals. The existing
Closure C contract implementation is the starting point; preserve its public
shape while closing untested runtime invariants and failure paths.

You are implementing one leaf task inside the current active Phase. You are not
responsible for completing the entire Phase or starting the next Phase.

## Repository evidence and dependencies

The Phase 3 `P3-W2-03` wave is integrated at the original base. The operations
package contains the Closure C functions `inspectOperationsSnapshot`,
`reconcileEventWindow`, `bindRoster`, and `canProposeInteraction`, plus the
contract fixture and schema probes. The backlog marks this leaf READY because
the contract/fixture foundation is integrated while runtime hardening and
focused adapter coverage remain incomplete.

Dependencies are **SATISFIED**: Phase 2 acceptance, `P3-W2.3`, `P3-W2.5`, and
`P3-W3.1` are integrated. No selected-wave dependency exists.

Read-only references:

- `docs/office-v2/OPERATIONS_ADAPTER_UI_SAFETY.md`
- `docs/office-v2/FAILURE_DIAGNOSTICS.md`
- `docs/office-v2/schemas/operations-snapshot-v2.schema.json`
- `docs/office-v2/schemas/activity-routing.schema.json`
- `docs/office-v2/schemas/roster-binding.schema.json`
- `docs/office-v2/fixtures/operations-closure-c.json`
- `docs/office-v2/fixtures/invalid/operations-adapter-rejections.json`
- `docs/office-v2/fixtures/invalid/operations-snapshot-v2.json`
- `docs/office-v2/fixtures/invalid/roster-binding.json`
- `docs/office-v2/fixtures/invalid/activity-routing.json`
- `packages/office-v2-contracts/src/generated/operations-snapshot-v2.ts`
- `packages/office-v2-contracts/src/generated/activity-routing.ts`
- `packages/office-v2-contracts/src/generated/roster-binding.ts`
- `packages/office-v2-operations/test/operations.test.ts`
- `docs/parallel-work/interfaces.md`

## Current behavior

The adapter already recognizes freshness and structured status diagnostics,
applies contiguous event windows, deduplicates durable IDs, checks payload
conflicts, binds known roles to compatible facility capabilities, checks
required features, and rejects forbidden proposals. Its current focused test
coverage is centered on the valid Closure C fixture and a small subset of the
negative cases. The task is to make the behavior deterministic and explicit for
the full cursor/roster acceptance surface without creating a second contract
owner.

## Required final behavior

- Snapshot inspection reports live/stale/reconnecting/unavailable and unknown
  operational state under the exact adapter diagnostic family; stale or
  unavailable state is never treated as idle or working.
- Event windows validate the empty-window rule and non-empty contiguity before
  applying events. Same-ID/same-digest delivery is a no-op; same-ID/different-
  digest is a conflict; late events, sequence gaps, stream mismatch, epoch
  changes, and retained-window expiry return their stable diagnostics and do
  not silently claim current truth.
- Roster binding validates unique agent instances, unique routing roles,
  known-role resolution, compatible available home capability, snapshot role
  agreement, disabled-active safety, required feature state, missing active
  bindings, and TeamBrain's command-console-only identity.
- Interaction proposals are allowed only for a known enabled roster binding,
  a route-declared interaction, and required features that are enabled and
  session-available. Disabled, unavailable, unknown, TeamBrain, and external
  action cases fail with adapter-owned diagnostics and no side effects.
- Results and diagnostics are deterministic, inputs remain immutable, and no
  visual/renderer/connector/database data is introduced.

## In scope

- `packages/office-v2-operations/src/index.ts`
- `packages/office-v2-operations/test/operations.test.ts`
- `packages/office-v2-operations/test/fixtures/p3-w3-2-operations-adapter.json`
- `docs/parallel-work/session-1-status.md`

Add only the smallest helper types/functions needed to make the four adapter
entry points correct and testable. Reuse the generated contract types and the
existing diagnostic codes. Add focused fixture cases for duplicate/conflict,
gap/epoch/retention, disabled/unavailable feature, role/facility mismatch,
TeamBrain, and forbidden proposal behavior.

## Out of scope

- Any schema, generated type, migration, workflow/agent-catalog source,
  package manifest, lockfile, database/storage code, connector action, runner
  side effect, renderer, asset, Web, or simulation/world change.
- Any new adapter diagnostic code, visual binding, character placement, home
  facility field in the snapshot, or operations write path.
- Any claim that T2/T3, crowd replay, complete AutoPost choreography, or a
  renderer/asset gate is complete.
- Shared backlog, plan, ownership, interfaces, task specifications, or final
  integration report edits.

## Owned files and forbidden files

Owned files are exactly those listed in `docs/parallel-work/ownership.md` for
Session 1. Do not edit any other implementation or shared documentation file.
Generated files under `packages/office-v2-contracts/src/generated/` are
read-only.

## Ordered implementation requirements

1. Read the repository instructions and all task references before editing.
2. Inspect the existing adapter and identify only the untested/incomplete
   cursor, roster, feature, role, and proposal invariants.
3. Implement immutable deterministic checks using the frozen `adapter.*`
   diagnostics; do not mutate snapshots, cursors, routing, or rosters.
4. Ensure resync-required conditions cannot be reported as a successful applied
   current window, while preserving idempotent duplicate delivery.
5. Ensure roster validation keeps operational identity separate from optional
   character data and treats TeamBrain as a non-agent console.
6. Add fixture-driven focused tests for successful and rejected paths,
   including input reorder/idempotence where applicable.
7. Run all required focused validation and record exact results in the status
   file.
8. Commit the implementation and status update on the assigned worker branch,
   then hand off to Main and stop immediately.

## Required tests and validation

The focused suite is `packages/office-v2-operations/test/operations.test.ts`.
It must cover:

- valid Snapshot V2 inspection and role/feature routing;
- empty and contiguous event windows;
- duplicate durable events and changed-digest conflicts;
- sequence gap, late event, stream mismatch, epoch change, and cursor-too-old;
- duplicate agent instance, duplicate routing role, unknown role, role/facility
  incompatibility, active disabled role, and missing active binding;
- disabled feature, unavailable session, stale/reconnecting/unavailable
  freshness, TeamBrain rejection, and forbidden interaction proposals;
- deterministic results and no input mutation.

Run:

```text
node .agents/skills/build-office-v2-engine/scripts/preflight.mjs
npm run --workspace @affiliate-ops/office-v2-operations typecheck
npm run --workspace @affiliate-ops/office-v2-operations test
git diff --check
```

## Acceptance criteria

- Focused operations tests pass and demonstrate every required cursor/roster
  policy rule.
- Existing valid Closure C behavior remains green and its schemas/diagnostics
  remain unchanged.
- Resync/conflict/rejection paths are stable and never execute external work or
  mutate inputs.
- No forbidden file changes occur and no generated contract is edited.
- The worker status file records `COMPLETED`, commit hash, changed files,
  validation output, acceptance checklist, and known limitations.

## Expected deliverables and handoff

- One focused implementation commit on the assigned branch.
- Updated `docs/parallel-work/session-1-status.md` with branch/worktree,
  commit, files, tests, acceptance checklist, and limitations.
- Final handoff message to Main naming the task commit and stopping immediately.

The worker must not integrate or cherry-pick other branches, modify the primary
branch, push the integration branch, create a pull request, or start another
task/wave/Phase.

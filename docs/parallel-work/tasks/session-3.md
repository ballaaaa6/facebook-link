# Worker Session 3 Task Specification

- Session: 3
- Task ID: `P3-W3.1`
- Task name: Workflow ownership and operations adapter verification
- Parent Phase: Phase 3 — Headless operational vertical slice
- Wave ID: `P3-W2-03`
- Worker branch: `task/session-3-p3-w3-ownership`
- Worker worktree: `C:\Users\WINDOW XI\.codex\worktrees\phase3-p3-w2-03-ownership`
- Original base commit: `65499e200c672440d92b3405723056064fa0a88c`
- Planning commit: recorded by Main before launch; the worker starts from the
  planning-lock commit named in `parallel-plan.md`.
- Status file: `docs/parallel-work/session-3-status.md`

## Objective

Add one evidence-only test that re-verifies the accepted workflow/role
ownership and content fan-out/join boundary against the current workflow,
agent-catalog, runtime configuration, Operations Snapshot V2, and pilot
producer. Do not add an Office-specific workflow or alter any producer.

## Repository evidence and dependencies

W0.3 and Closure C already corrected winner ownership, branch ownership, system
join ownership, feature-flag behavior, and TeamBrain identity. Existing tests
cover parts of this boundary, but the Phase 3 W3.1 leaf is not yet recorded as
an integrated focused evidence suite.

Dependency status: **SATISFIED**. No selected-wave dependency.

Read-only references:

- `packages/workflows/src/index.ts`
- `packages/workflows/test/workflow.test.ts`
- `packages/workflows/test/content-join.test.ts`
- `packages/agent-catalog/src/index.ts`
- `packages/agent-catalog/test/agent-catalog.test.ts`
- `config/agents.json`
- `docs/WORKFLOWS.md`
- `docs/office-v2/OPERATIONS_ADAPTER_UI_SAFETY.md`
- `docs/office-v2/fixtures/operations-closure-c.json`
- `docs/office-v2/fixtures/operations-states.json`
- `services/automation-runner/src/simulation/pilot.ts`
- `services/automation-runner/src/simulation/persistence.ts`
- `services/automation-runner/test/simulation.test.ts`

## Required final behavior

- Proves Product Ranker owns ranking evidence and Growth Strategist alone owns
  winner selection and strategy-version reference.
- Proves copy and visual branches have their declared agent owners and the
  system coordinator alone owns `content_ready`.
- Proves the coordinator is absent from the agent catalog and runtime config,
  and TeamBrain is not a roster agent.
- Proves the ten catalog roles and runtime configuration are unique and aligned,
  including the enabled/disabled configuration state.
- Proves the pilot producer/persistence path preserves branch correlation,
  idempotent joins, and system-owned audit behavior.
- Proves disabled external features cannot be represented as a successful
  external action by the evidence boundary.

## In scope

- `scripts/office-v2-w3-01-evidence.test.mjs` only.
- Read-only fixture/source loading and focused assertions.

## Out of scope

- Any change to workflows, diagnostics, agent catalog, `config/agents.json`,
  runner production/persistence code, operations adapter, schemas, fixtures,
  package manifests, lockfiles, or shared documentation.
- Any connector execution, browser action, database mutation, or external
  publication.
- Any simulation, renderer, asset, or next-Phase work.

## Ordered implementation requirements

1. Load current source constants and runtime configuration without duplicating
   ownership tables as production code.
2. Assert the winner, branch, system-join, Session Keeper, TeamBrain, and
   feature-disabled rules with stable test messages.
3. Exercise both copy-first and visual-first join order and verify identical
   join event/state.
4. Exercise the pilot simulation/persistence verification or equivalent
   read-only producer evidence without writing to a real database or invoking
   connectors.
5. Keep the test deterministic, secret-free, and outside the knowledge fixture
   registry unless Main explicitly adds a registry entry later.

## Required tests and validation

Run:

```text
node .agents/skills/build-office-v2-engine/scripts/preflight.mjs
node --test scripts/office-v2-w3-01-evidence.test.mjs
git diff --check
```

Also run the focused workflow, agent-catalog, and automation-runner test
commands when the worktree is dependency-ready, but do not modify them.

## Acceptance criteria

- The new focused evidence test passes against the current sources and fixture.
- It fails if winner ownership, system join ownership, branch ownership,
  catalog/config alignment, or disabled-feature behavior regresses.
- It does not edit or reimplement any producer, consumer, schema, or workflow.
- It contains no credentials, connector payloads, or external side effects.
- The worker status file records the commit, files, tests, and limitations.

## Expected deliverables and handoff

- One focused test commit on the assigned branch.
- Updated Session 3 status file with `COMPLETED`, commit hash, changed files,
  validation output, acceptance checklist, and known limitations.
- Final handoff message to Main naming the commit and stopping immediately.

You are implementing one leaf task inside the current active Phase. You are
not responsible for completing the entire Phase or starting the next Phase.
Do not integrate, cherry-pick, merge, push the integration branch, modify the
primary branch, or create a pull request.

# Phase 3 Wave `P3-W2-03` Ownership

## Worker Session 1 — `P3-W2.4`

Owned implementation files:

- `packages/office-v2-simulation/src/queues.ts`
- `packages/office-v2-simulation/test/queues.test.ts`
- `packages/office-v2-simulation/test/fixtures/p3-w2-4-queues.json`
- `docs/parallel-work/session-1-status.md`

Forbidden files:

- all schemas and generated contracts;
- `packages/office-v2-simulation/src/index.ts`, existing command/activity/hash/
  lifecycle modules, and other workers' tests;
- world, operations, workflow, runner, Web, renderer, asset, migration, and
  package-manifest files;
- shared backlog, plan, ownership, interfaces, or final-report files.

## Worker Session 2 — `P3-W2.5`

Owned implementation files:

- `packages/office-v2-simulation/src/replay.ts`
- `packages/office-v2-simulation/test/replay.test.ts`
- `packages/office-v2-simulation/test/fixtures/p3-w2-5-replay.json`
- `docs/parallel-work/session-2-status.md`

Forbidden files:

- all schemas and generated contracts;
- `packages/office-v2-simulation/src/index.ts`, existing command/activity/hash/
  lifecycle modules, and other workers' tests;
- queue implementation, world, operations, workflow, runner, Web, renderer,
  asset, migration-history, and package-manifest files;
- shared backlog, plan, ownership, interfaces, or final-report files.

## Worker Session 3 — `P3-W3.1`

Owned implementation files:

- `scripts/office-v2-w3-01-evidence.test.mjs`
- `docs/parallel-work/session-3-status.md`

Forbidden files:

- `packages/workflows/**`, `packages/agent-catalog/**`, `config/agents.json`,
  `docs/WORKFLOWS.md`, runner production code, and operations production code;
- schemas, generated contracts, migrations, package manifests, lockfiles,
  Office simulation/world source, Web/renderer/asset code;
- shared backlog, plan, ownership, interfaces, or final-report files.

## Main Orchestration Session integration-only

- `packages/office-v2-simulation/src/index.ts` and any package export/barrel
  changes;
- cross-task integration tests and package metadata;
- `docs/office-v2/EXECUTION_BACKLOG.md`;
- `docs/parallel-work/**` shared planning, status reconciliation, and report;
- relevant public status/readiness documentation;
- branch reconciliation, conflict resolution, validation, commits, push, and
  pull-request handling.

## Read-only shared references

Workers may read, but not edit, the Office V2 knowledge pack, accepted
decisions, schemas, fixtures, existing package sources/tests, workflow and
agent sources, runner pilot sources, AGENTS.md, and the repository package
configuration. The exact references for each task are listed in its task
specification.

## Generated files

Files under `packages/office-v2-contracts/src/generated/`, generated reports,
lockfiles, and any asset reports are generated or historical evidence. Do not
edit them manually. A worker must stop and hand off if its task appears to
require a generated or shared-file change.

No implementation file is owned by more than one worker.

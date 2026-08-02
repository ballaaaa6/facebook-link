# Phase 3 Wave `P3-W3-03` Ownership

## Worker Session 1 — `P3-W3.3`

Owned implementation files:

- `packages/office-v2-operations/src/choreography.ts`
- `packages/office-v2-operations/test/choreography.test.ts`
- `packages/office-v2-operations/test/fixtures/p3-w3-3-choreography.json`
- `docs/parallel-work/session-1-status.md`

The worker may add only the smallest local type/helper definitions needed by
the owned choreography module and its focused tests. The existing public barrel
`packages/office-v2-operations/src/index.ts` is Main integration-owned; Main
will add a public export if the accepted module requires one.

Forbidden files:

- all schemas and generated contracts;
- `packages/office-v2-contracts/**`, except read-only imports from generated
  types;
- `packages/office-v2-operations/src/index.ts` and existing adapter behavior;
- `packages/workflows/**`, workflow producers, agent catalog, and
  `config/agents.json`;
- all simulation, world, database, storage, connector, runner, API, Web,
  renderer, and asset code;
- package manifests, lockfiles, migrations, generated reports, and asset
  reports;
- `docs/office-v2/EXECUTION_BACKLOG.md`, current-wave plan/ownership/interfaces,
  task specifications, and final integration report.

## Main Orchestration Session integration-only

- public barrel/export decisions and any cross-package integration tests;
- shared contracts, schemas, workflow sources, and generated files;
- backlog transitions, phase/readiness documentation, and final report;
- branch creation/reconciliation, conflict resolution, complete validation,
  integration commit, push, and pull-request handling.

## Read-only shared references

The worker may read, but must not edit, `AGENTS.md`, the Office V2 knowledge
pack, accepted decisions, operations documents/schemas/fixtures, shared
workflow contract types, workflow tests, generated Office contract types,
existing operations adapter implementation/tests, package configuration, and
the current planning interfaces.

## Generated files

Files under `packages/office-v2-contracts/src/generated/`, generated reports,
lockfiles, and asset reports are generated or historical evidence. They must
not be edited manually.

No implementation file is owned by more than one worker.

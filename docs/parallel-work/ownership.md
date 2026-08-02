# Phase 3 Wave `P3-W3-02` Ownership

## Worker Session 1 — `P3-W3.2`

Owned implementation files:

- `packages/office-v2-operations/src/index.ts`
- `packages/office-v2-operations/test/operations.test.ts`
- `packages/office-v2-operations/test/fixtures/p3-w3-2-operations-adapter.json`
- `docs/parallel-work/session-1-status.md`

Forbidden files:

- all schemas and generated contracts;
- `packages/office-v2-contracts/**`, shared canonical JSON/hash utilities, and
  all simulation/world packages;
- workflow producers, agent catalog, `config/agents.json`, database/storage,
  connector, runner, Web, renderer, and asset code;
- package manifests, lockfiles, migrations, generated reports, and asset
  reports;
- `docs/office-v2/EXECUTION_BACKLOG.md`, current-wave plan/ownership/interfaces,
  task specifications, and final integration report.

## Main Orchestration Session integration-only

- public barrel/export decisions outside the worker-owned module;
- cross-package integration tests and package metadata;
- backlog transitions, shared readiness/status documentation, and final report;
- branch creation/reconciliation, conflict resolution, complete validation,
  integration commit, push, and pull-request handling.

## Read-only shared references

The worker may read, but not edit, `AGENTS.md`, the Office V2 knowledge pack,
accepted decisions, operations schemas/fixtures, generated contract types,
workflow and agent sources, existing operations tests, package configuration,
and the current planning interfaces.

## Generated files

Files under `packages/office-v2-contracts/src/generated/`, generated reports,
lockfiles, and asset reports are generated or historical evidence. They must
not be edited manually.

No implementation file is owned by more than one worker.

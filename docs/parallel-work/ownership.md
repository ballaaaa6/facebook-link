# Phase 3 Wave `P3-W2-02` Ownership

## Worker Session 1 — `P3-W2.2`

Owned implementation files:

- `packages/office-v2-simulation/src/state-hash.ts`
- `packages/office-v2-simulation/test/state-hash.test.ts`
- `docs/parallel-work/session-1-status.md`

## Worker Session 2 — `P3-W2.3`

Owned implementation files:

- `packages/office-v2-simulation/src/activity-runtime.ts`
- `packages/office-v2-simulation/test/activity-runtime.test.ts`
- `docs/parallel-work/session-2-status.md`

## Worker Session 3 — `P3-W2.6`

Owned implementation files:

- `packages/office-v2-simulation/src/lifecycle.ts`
- `packages/office-v2-simulation/test/lifecycle.test.ts`
- `docs/parallel-work/session-3-status.md`

## Main Orchestration Session — integration only

Main owns:

- `packages/office-v2-simulation/src/index.ts`
- `packages/office-v2-simulation/package.json` and root workspace wiring, only
  when required for exports or test discovery
- `docs/office-v2/EXECUTION_BACKLOG.md`
- `docs/office-v2/README.md`, `IMPLEMENTATION_PLAN.md`, `READINESS_MATRIX.md`,
  and `READINESS_REMEDIATION_PLAN.md` status reconciliation
- all files under `docs/parallel-work/` other than the three worker status
  files while workers are running
- cross-task integration tests, final report, conflict resolution, and the
  dedicated integration branch

Main must not change a worker's implementation files before review except to
resolve an explicitly documented integration conflict after acceptance.

## Read-only shared references

All workers may read, but must not modify, `AGENTS.md`, nested `AGENTS.md`
files, the Office V2 skill, Office V2 README/foundations/readiness documents,
accepted decisions, schemas, generated contracts, fixtures, the Phase 2 world
package, `packages/office-v2-simulation/src/command-pipeline.ts`, and the
existing RC closure records.

## Generated files — do not edit manually

`packages/office-v2-contracts/src/generated/**`, package lockfiles, generated
reports, and generated code-map or build outputs are generated boundaries.
Workers must not edit them. Schema or dependency changes are not authorized
by this wave.

## Forbidden cross-boundaries

Workers must not modify another worker's source, test, status file, package
barrel, package manifest, backlog, shared readiness docs, schemas, generated
contracts, world package, operations adapter, renderer/presentation code,
assets, connectors, workflows, database, or primary branch.

# Phase 3 Wave `P3-W2-01` Ownership

No implementation file may be owned by more than one worker. Workers may read
shared references but may modify only the paths listed in their own section and
their own status file.

## Worker Session 1 — `P3-W2.1`

Owned:

- `packages/office-v2-simulation/src/command-pipeline.ts`
- `packages/office-v2-simulation/test/command-pipeline.test.ts`
- `docs/parallel-work/session-1-status.md`

Forbidden:

- `packages/office-v2-simulation/src/index.ts`
- `packages/office-v2-simulation/package.json`
- all schemas and generated contract files
- `packages/office-v2-world/**`
- `docs/office-v2/EXECUTION_BACKLOG.md`
- `docs/office-v2/README.md`
- `docs/office-v2/READINESS_MATRIX.md`
- `docs/office-v2/READINESS_REMEDIATION_PLAN.md`
- `docs/office-v2/RESEARCH.md`
- any other `docs/parallel-work` file
- operations, renderer, asset, workflow, database, connector, or primary-branch files

## Main Orchestration Session — integration only

- `packages/office-v2-simulation/src/index.ts`
- `packages/office-v2-simulation/package.json` if a package-level focused test
  script is required for repository integration
- `docs/office-v2/EXECUTION_BACKLOG.md`
- `docs/office-v2/README.md`
- `docs/office-v2/READINESS_MATRIX.md`
- `docs/office-v2/READINESS_REMEDIATION_PLAN.md`
- `docs/office-v2/RESEARCH.md`
- `docs/parallel-work/parallel-plan.md`
- `docs/parallel-work/ownership.md`
- `docs/parallel-work/interfaces.md`
- `docs/parallel-work/final-integration-report.md`
- all worker status files after handoff review
- cross-task tests, package exports, generated manifests, and conflict-resolution changes

## Read-only shared references

`AGENTS.md`, the `build-office-v2-engine` skill, the Office V2 README,
foundations, readiness and remediation records, accepted Decisions 0005 and
0011, the command/result/event schemas and generated types, the canonical JSON
and hash utilities, the Phase 2 acceptance evidence, and existing RC closure
records are read-only for the worker.

## Generated files

`packages/office-v2-contracts/src/generated/**`, lockfiles, reports, and other
generated outputs are generated-file boundaries. They must not be edited
manually.

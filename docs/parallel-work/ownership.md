# Phase 3 Wave P3-W0 Ownership

No implementation file may be owned by more than one worker. Workers may read
shared references but may modify only the paths listed in their own section and
their own status file.

## Worker Session 1 — P3-RC-01

Owned:

- `docs/office-v2/JOBS_INTENTS_ASSIGNMENT.md`
- `docs/office-v2/ROOMS_SURFACES_STRUCTURES_ZONES.md`
- `docs/office-v2/CROWD_QUEUES_AND_DEADLOCKS.md`
- `packages/office-v2-simulation/test/fixtures/rc-01-facility-queue-valid.json`
- `packages/office-v2-simulation/test/fixtures/rc-01-facility-queue-rejected.json`
- `packages/office-v2-simulation/test/fixtures/rc-01-one-actor-cleanup.json`
- `packages/office-v2-simulation/test/fixtures/rc-01-contention-cleanup.json`
- `scripts/office-v2-rc-01-evidence.mjs`
- `scripts/office-v2-rc-01-evidence.test.mjs`
- `docs/parallel-work/session-1-status.md`

Forbidden:

- `RESEARCH.md`, `READINESS_MATRIX.md`, `READINESS_REMEDIATION_PLAN.md`,
  `EXECUTION_BACKLOG.md`, any `docs/parallel-work` file other than its status
- Session 2 or Session 3 owned paths
- schemas, generated contracts, package manifests, lockfiles, public exports,
  simulation production source, operations code, renderer code, and assets

## Worker Session 2 — P3-RC-02

Owned:

- `docs/office-v2/DEFINITION_INSTANCE_RUNTIME_STATE.md`
- `docs/office-v2/REPLAY_DEBUGGING_PLAYBOOK.md`
- `packages/office-v2-simulation/test/fixtures/rc-02-interaction-disabled.json`
- `packages/office-v2-simulation/test/fixtures/rc-02-mid-action-restore.json`
- `packages/office-v2-simulation/test/fixtures/rc-02-invalid-state.json`
- `scripts/office-v2-rc-02-evidence.mjs`
- `scripts/office-v2-rc-02-evidence.test.mjs`
- `docs/parallel-work/session-2-status.md`

Forbidden:

- `RESEARCH.md`, `READINESS_MATRIX.md`, `READINESS_REMEDIATION_PLAN.md`,
  `EXECUTION_BACKLOG.md`, any `docs/parallel-work` file other than its status
- Session 1 or Session 3 owned paths
- schemas, generated contracts, package manifests, lockfiles, public exports,
  simulation production source, operations code, renderer code, and assets

## Worker Session 3 — P3-RC-03

Owned:

- `docs/office-v2/SIMULATION_PIPELINE_COMMANDS.md`
- `docs/office-v2/SAVE_SNAPSHOT_MIGRATION.md`
- `packages/office-v2-simulation/test/fixtures/rc-03-assignment-reorder.json`
- `packages/office-v2-simulation/test/fixtures/rc-03-target-revalidation.json`
- `packages/office-v2-simulation/test/fixtures/rc-03-retry-cancellation.json`
- `scripts/office-v2-rc-03-evidence.mjs`
- `scripts/office-v2-rc-03-evidence.test.mjs`
- `docs/parallel-work/session-3-status.md`

Forbidden:

- `RESEARCH.md`, `READINESS_MATRIX.md`, `READINESS_REMEDIATION_PLAN.md`,
  `EXECUTION_BACKLOG.md`, any `docs/parallel-work` file other than its status
- Session 1 or Session 2 owned paths
- schemas, generated contracts, package manifests, lockfiles, public exports,
  simulation production source, operations code, renderer code, and assets

## Main Orchestration Session — integration only

- `docs/office-v2/EXECUTION_BACKLOG.md`
- `docs/office-v2/RESEARCH.md`
- `docs/office-v2/READINESS_MATRIX.md`
- `docs/office-v2/READINESS_REMEDIATION_PLAN.md`
- `docs/office-v2/README.md`
- `docs/parallel-work/parallel-plan.md`
- `docs/parallel-work/ownership.md`
- `docs/parallel-work/interfaces.md`
- `docs/parallel-work/final-integration-report.md`
- all worker status files after handoff review
- knowledge manifests/adapters, package barrels, cross-task tests, and any
  conflict-resolution or public-export changes

## Read-only shared references

`AGENTS.md`, the build-office-v2-engine skill, Phase 2 acceptance evidence,
accepted decisions 0005/0011/0012, existing schemas and generated contract
outputs, existing Phase 1 canonical documents not explicitly owned by a
worker, workflow/agent sources, and repository validation scripts.

## Generated files

`packages/office-v2-contracts/src/generated/**`, lockfiles, reports, and other
generated outputs are generated-file boundaries. Workers must not edit them
manually.

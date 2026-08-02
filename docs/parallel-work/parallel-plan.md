# Phase 3 Parallel Wave Plan

## Repository assessment

- Repository: `D:\antigravity\shopee link`
- Remote: `origin` -> `https://github.com/ballaaaa6/facebook-link.git`
- Verified primary branch: `main`
- Original base commit: `d5e04992839dc4f09bc0e66de2dd7cbf02282ad2`
- Original base status: clean; `main`, `origin/main`, and the remote symbolic
  `HEAD` were aligned at inspection time.
- Existing completed-wave worktrees and branches are preserved. The previous
  `P3-W2-03` coordination files are archived under `docs/parallel-work/history/`.
- Office V2 preflight passed before planning. No local development server was
  started.

## Active Phase

- Phase ID: **Phase 3**
- Phase name: **Headless operational vertical slice**
- Objective: produce a deterministic headless actor slice with fixed ticks,
  commands, facilities, interaction cleanup, restore/replay, queues, and the
  later AutoPost operations choreography without renderer or asset leakage.
- Entry evidence: Phase 2 world-kernel acceptance, RC-01/02/03 research
  closure, and the `P3-W2.1` through `P3-W2-03` bounded slices are integrated.
- Exit criteria: T2 one-actor reach/use/cancel/restore/replay evidence, T3
  crowd/queue/deadlock evidence, and complete operations choreography evidence
  pass with deterministic hashes, cleanup, and no renderer or asset leakage.
- Phase status before wave: **ACTIVE**. `P3-W2-03` is integrated, but the
  operations cursor/roster runtime slice and the T2/T3 exit evidence remain
  incomplete.
- Phase status after wave: **ACTIVE**. `P3-W3.2` is integrated with bounded
  Snapshot V2 adapter evidence; T2/T3 exit criteria remain incomplete.

## Wave selection

- Wave ID: `P3-W3-02`
- Wave name: **Operations Snapshot V2 cursor and roster adapter**
- Selected Task IDs: `P3-W3.2`
- Actual worker count: **1**
- Capacity rationale: exactly one compatible READY leaf exists in the active
  Phase. `P3-W3.3` and `P3-W3.4` are blocked behind this adapter and later
  integration work; no later-Phase work was used to fill capacity.
- Coherence rationale: the selected leaf is one adapter-owned boundary covering
  durable cursor reconciliation, role/agent-instance binding, feature safety,
  and proposal rejection. It has one implementation module, one focused test
  boundary, and no dependency on another selected task.

The selected assignments are READY leaf tasks from the current active Phase.
No later-Phase work was selected to fill unused worker capacity.

The Main Orchestration Session is the sole Final Integrator and Publisher.
Workers stop after committing and handing off their individual tasks.

## Readiness and granularity proof

`P3-W3.2` passes the gate because:

- Phase 3, `P3-W2.3`, `P3-W2.5`, and `P3-W3.1` are integrated;
- Operations Snapshot V2, activity-routing, and roster-binding schemas and
  diagnostics are frozen;
- the task has one primary objective with an exclusive operations-package
  boundary;
- cursor, roster, feature, and proposal outcomes are observable and testable;
- focused tests are defined for success, duplicate/conflict, gap/epoch/
  retention, disabled/unavailable, TeamBrain, and forbidden-proposal paths;
- no selected task depends on an unintegrated worker result; and
- the task does not own schemas, generated types, workflow producers, database
  migrations, connectors, renderer state, or shared integration documents.

## Frozen interfaces

- `office-operations-v2` snapshot documents own operational truth, freshness,
  durable event windows, feature availability, and adapter diagnostics.
- `office-activity-routing-v1` owns role-to-capability, interaction,
  required-feature, and command-console routing.
- `office-roster-binding-v1` owns agent-instance-to-role and optional character
  profile binding. It does not own a facility, sprite, or operational event.
- Cursor reconciliation is immutable and uses `streamId`, positive
  `streamEpoch`, retained-window bounds, ordered sequence numbers, durable event
  IDs, and payload digests. Duplicates are no-ops; changed payloads conflict;
  gaps, epoch changes, old cursors, and stream mismatches require resync.
- Adapter diagnostics remain under the exact `adapter.*` family and use stable
  owner/version/context fields. No presentation diagnostic is introduced.
- TeamBrain is a `command-console` facility with `agentEligible: false`; it is
  never a roster agent or an allowed external-action actor.

## Ownership and worker starting state

| Session | Task | Branch | Worktree | Status |
| --- | --- | --- | --- | --- |
| 1 | `P3-W3.2` | `task/session-1-p3-w3-02-operations-adapter` | `C:\Users\WINDOW XI\.codex\worktrees\phase3-p3-w3-02-operations-adapter` | planned |

- Planning artifacts / worker starting commit:
  `175d0d384e64610225e93f21272fdb71bdcaf4ba`.
- The worker branch will begin from this exact planning commit. The Main
  session may add coordinator-only dispatch metadata afterward; that does not
  change the worker's planning base.
- Worker sessions: `019fc345-3e04-7d10-806c-65011ff031b8` / Kant (stalled and
  shut down before changes), then same-scope replacement
  `019fc349-d52d-72a2-af8d-5b157a542782` / Planck (stalled and shut down before
  changes).
- Integration branch: `codex/integration/phase3-p3-w3-02`.

No worker implementation commit or handoff was produced. Main performed
coordinator recovery for the exact selected leaf on the integration branch:
`e2689e1e48c7f63478ef84c182c179d6a35411f2`, followed by the fixture-driven
test refinement `b71d4587e36b6d4a7cfecd1f56c59a9895d4b5ff`. The recovery passed
the same ownership and validation review required of a worker handoff.

## Validation strategy

The worker runs the focused operations package test, package typecheck,
preflight, and `git diff --check`. Main re-runs the focused suite and all
required repository gates:

```text
node .agents/skills/build-office-v2-engine/scripts/preflight.mjs
npm run office:v2:contradictions:check
npm run office:v2:contradictions:test
npm run office:v2:knowledge:check
npm run office:v2:boundaries:check
npm run office:v2:boundaries:test
npm run office:v2:assets:check
npm run office:v2:clean-room:check
npm run --workspace @affiliate-ops/office-v2-operations typecheck
npm run --workspace @affiliate-ops/office-v2-operations test
npm run check
```

Main also verifies ownership compliance, package exports, branch ancestry,
remote-primary alignment, accepted-commit reachability, and a clean worktree.

## Phase-closure and publication strategy

After integration, Main will update the execution backlog and evaluate Phase 3
against its T2/T3 exit criteria. The phase remains **ACTIVE** unless every
criterion is actually evidenced. No next wave or next Phase will be launched
in this invocation. The final report will record remaining READY/BLOCKED tasks
and the recommended next wave.

The integration branch will be reconciled with the verified remote `main`,
validated again if `main` advanced, pushed without force, and left ready for
review. The primary branch will not be modified or merged.

## Known risks

- Existing Closure C functions are broad contract probes; the worker must
  harden missing runtime invariants without duplicating schema validation or
  claiming full T3 operations choreography.
- Unknown operational state must fail closed as unavailable with an adapter
  diagnostic; stale/reconnecting/unavailable freshness must never become idle.
- Cursor reconciliation must not silently apply a gap, epoch change, or old
  cursor as if it were current truth.
- No connector, database, browser, renderer, visual asset, or secret may enter
  the operations package.

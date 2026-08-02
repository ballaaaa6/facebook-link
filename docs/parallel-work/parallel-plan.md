# Phase 3 Parallel Wave Plan

## Repository assessment

- Repository: `D:\antigravity\shopee link`
- Remote: `origin` → `https://github.com/ballaaaa6/facebook-link.git`
- Verified primary branch: `main`
- Original base commit: `65499e200c672440d92b3405723056064fa0a88c`
- Original base status: clean; `main` matched `origin/main` and the remote
  symbolic `HEAD` at inspection time.
- Integration branch: `codex/integration/phase3-p3-w2-03`
- Existing historical Office worktrees were preserved. The prior current-wave
  planning files were archived under `docs/parallel-work/history/` before this
  wave was prepared.
- Baseline gates: Office V2 preflight and complete `npm run check` passed at the
  original base. No local development server was started.

## Active Phase

- Phase ID: **Phase 3**
- Phase name: **Headless operational vertical slice**
- Objective: produce a deterministic headless actor slice with fixed ticks,
  commands, facilities, interaction cleanup, restore/replay, queues, and the
  later AutoPost operations choreography without renderer or asset leakage.
- Entry criteria: Phase 2 world-kernel acceptance is integrated at
  `e4829b68619696651c73ba6b5dced73cc28beaa0`; the RC-01/02/03 research
  prerequisite and the bounded `P3-W2.1` command pipeline are integrated.
- Exit criteria: T2 one-actor reach/use/cancel/restore/replay evidence, T3
  crowd/queue/deadlock evidence, and complete operations choreography evidence
  pass with deterministic hashes, cleanup, and no renderer or asset leakage.
- Status before wave: **ACTIVE**. `P3-W2-02` is integrated, but queue/crowd,
  restore/replay, reducer-produced end-to-end hashes, and complete operations
  evidence remain incomplete.

## Wave selection

- Wave ID: `P3-W2-03`
- Wave name: **T2 queues/replay and W3 workflow ownership verification**
- Selected Task IDs: `P3-W2.4`, `P3-W2.5`, `P3-W3.1`
- Actual worker count: **3**
- Capacity rationale: exactly three compatible READY leaf tasks existed in the
  current Phase. `P3-W2.4`, `P3-W2.5`, and `P3-W3.1` are the highest-priority
  dependency-satisfied leaves; no fourth compatible READY task existed, and no
  later-Phase work was used to fill capacity.
- Coherence rationale: the two W2 leaves implement the remaining pure T2 queue
  and replay boundaries that consume the integrated command, activity, hash,
  and lifecycle slices. The W3.1 leaf independently re-verifies the already
  accepted workflow/role ownership and fan-out/join boundary. They have
  disjoint owned files and do not require another selected worker's output.

The selected assignments are READY leaf tasks from the current active Phase.
No later-Phase work was selected to fill unused worker capacity.

The Main Orchestration Session is the sole Final Integrator and Publisher.
Workers stop after committing and handing off their individual tasks.

## Readiness and granularity proof

| Task | Ready/dependency proof | Leaf/granularity proof |
| --- | --- | --- |
| `P3-W2.4` | Phase 2, RC-01, `P3-W2.1`, and `P3-W2.3` are integrated; queue schemas and Decision 0012 are frozen. | One pure queue/resource/deadlock module with focused tests; it does not implement navigation, operations, or replay. |
| `P3-W2.5` | `P3-W2.1`, `P3-W2.2`, `P3-W2.3`, RC-02, and RC-03 are integrated; snapshot/trace and hash boundaries are frozen. | One pure replay/migration/divergence module with focused tests; it does not own queues, renderer state, or external payloads. |
| `P3-W3.1` | RC-03 and `P3-W2.3` are integrated; workflow and agent ownership fixes already exist in source and tests. | One evidence-only verification test; it does not change workflow, catalog, runner, or operations production code. |

All three tasks have one primary objective, an observable result, explicit
owned and forbidden files, frozen shared contracts, focused tests, known
validation commands, and no unresolved architecture choice. No selected task
depends on another selected task's unintegrated output.

## Frozen interfaces

- Existing generated contracts remain authoritative: `office-queue-policy-v1`,
  `office-queue-ticket-v1`, `office-reservation-v1`, `office-action-queue-v1`,
  `office-facility-slot-v1`, `office-activity-intent-v1`,
  `office-simulation-snapshot-v2`, and `office-simulation-trace-v2`.
- Simulation code consumes the existing public command pipeline, activity
  runtime, lifecycle, and state-hash exports. Workers must not change schemas,
  generated files, the canonical hash utility, or existing W2 implementations.
- Queue ordering is priority class, enqueue tick, then ticket ID under the
  accepted UTF-16 comparator. Resource acquisition is validated, normalized,
  and all-or-none. Deadlock victim policy and
  `simulation.deadlock-no-yield-cell` are fixed by Decision 0012.
- Replay restores only completed tick/hash boundaries, preserves ordered event
  arrays, normalizes only declared unordered collections, and fails closed on
  unknown/incomplete versions or secret-bearing bug-bundle fields.
- Workflow ownership is fixed: Product Ranker owns ranking evidence, Growth
  Strategist owns winner selection, copy and visual are independent branches,
  `workflow-coordinator` owns the `content_ready` join, and Session Keeper owns
  session health only. Disabled connectors never become working actors.

## Worker assignments

| Session | Task | Branch | Worktree | Status |
| --- | --- | --- | --- | --- |
| 1 | `P3-W2.4` | `task/session-1-p3-w2-queues` | `C:\Users\WINDOW XI\.codex\worktrees\phase3-p3-w2-03-queues` | planned |
| 2 | `P3-W2.5` | `task/session-2-p3-w2-replay` | `C:\Users\WINDOW XI\.codex\worktrees\phase3-p3-w2-03-replay` | planned |
| 3 | `P3-W3.1` | `task/session-3-p3-w3-ownership` | `C:\Users\WINDOW XI\.codex\worktrees\phase3-p3-w2-03-ownership` | planned |

- Planning artifacts commit: `ca6d1b5e55c75ff75194fd60505fb5158b8cc1ae`.
- Planning lock / worker starting commit: `7af908b2f01a77214f1d2660c17fbbcc956fc952`;
  all three worker branches point to that exact commit.
- Worker session IDs: `019fc301-f359-7733-979b-f04cd6953bc3` (Session 1 / Anscombe),
  `019fc301-f3d5-7c81-8ef7-2fac68995f71` (Session 2 / Pauli), and
  `019fc301-f45f-7b83-9601-d3602b12ef99` (Session 3 / Ramanujan).

## Validation strategy

Each worker runs its focused suite, package typecheck where applicable,
`git diff --check`, and the Office preflight. Main re-runs focused suites from
the integration branch, then runs the complete required gates:

```text
node .agents/skills/build-office-v2-engine/scripts/preflight.mjs
npm run office:v2:contradictions:check
npm run office:v2:contradictions:test
npm run office:v2:knowledge:check
npm run office:v2:boundaries:check
npm run office:v2:boundaries:test
npm run office:v2:assets:check
npm run office:v2:clean-room:check
npm run check
```

Main also checks branch ancestry, ownership compliance, package exports,
remote-primary alignment, integration reachability, and a clean worktree before
publication.

## Phase-closure and publication strategy

After integration, Main will update the execution backlog, review the Phase 3
exit criteria, and mark the Phase `ACTIVE` unless every T2/T3 criterion is
actually evidenced. No next wave or next Phase will be launched in this
invocation. The final report will record remaining READY/BLOCKED tasks and the
recommended next wave.

The integration branch will be reconciled with the verified remote `main`,
validated again if `main` advanced, pushed without force, and left ready for a
pull request. The primary branch will not be modified or merged.

## Known risks

- `P3-W2.4` must not overclaim ten/fifteen-actor crowd readiness from a pure
  queue module; T3 still requires integrated headless scenarios and replay.
- `P3-W2.5` must not promote historical placeholder hashes or infer runtime
  state from presentation fields.
- `P3-W3.1` must preserve the evidence-only boundary and must not edit the
  workflow, catalog, configuration, or runner producer.
- Existing historical worktrees and branches may remain present; Main will not
  delete or reset them during this wave.

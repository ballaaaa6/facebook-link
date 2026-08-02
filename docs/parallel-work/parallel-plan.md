# Phase 3 Parallel Wave Plan

## Repository assessment

- Repository: `D:\antigravity\shopee link`
- Remote: `origin` -> `https://github.com/ballaaaa6/facebook-link.git`
- Verified primary branch: `main`
- Original base commit: `799248b6a7612ca5c45ae06f94a86b4203765ed8`
- Original base status: clean; `main`, `origin/main`, and the remote symbolic
  `HEAD` were aligned at inspection time.
- Existing historical and active-looking worktrees are preserved. No existing
  worktree is reused for this wave.
- Office V2 preflight passed before planning. No local development server or
  long-running project process was started.

## Active Phase

- Phase ID: **Phase 3**
- Phase name: **Headless operational vertical slice**
- Objective: produce a deterministic headless actor slice with fixed ticks,
  commands, facilities, interaction cleanup, restore/replay, queues, and the
  later AutoPost operations choreography without renderer or asset leakage.
- Entry evidence: Phase 2 world-kernel acceptance, RC-01/02/03 research
  closure, and the P3-W2.1 through P3-W3.2 bounded slices are integrated.
- Exit criteria: T2 one-actor reach/use/cancel/restore/replay evidence, T3
  crowd/queue/deadlock evidence, and complete operations choreography evidence
  pass with deterministic hashes, cleanup, and no renderer or asset leakage.
- Phase status before wave: **ACTIVE**. P3-W3.2 is integrated, but complete
  Operations V2 choreography and the T2/T3 exit evidence remain incomplete.
- Phase status after wave: **to be evaluated after integration; expected
  ACTIVE unless every Phase 3 exit criterion is evidenced**.

## Wave selection

- Wave ID: `P3-W3-03`
- Wave name: **Fan-out/join and failure choreography**
- Selected Task IDs: `P3-W3.3`
- Actual worker count: **1**
- Capacity rationale: exactly one compatible READY leaf exists in the active
  Phase. P3-W3.4 is blocked behind this task and its other dependencies; no
  later-Phase work was used to fill capacity.
- Coherence rationale: the selected leaf is one pure operations choreography
  boundary covering branch completion, content-ready join, semantic projection,
  and idempotent failure/recovery intents. It has one module/test/fixture
  boundary and no dependency on another selected task.

The selected assignments are READY leaf tasks from the current active Phase.
No later-Phase work was selected to fill unused worker capacity.

The Main Orchestration Session is the sole Final Integrator and Publisher.
Workers stop after committing and handing off their individual tasks.

## Readiness and granularity proof

`P3-W3.3` passes the readiness gate because:

- Phase 3, P3-W2.5, and P3-W3.2 are integrated;
- Closure C Snapshot V2, durable event-window, routing, roster, workflow
  branch, and content-ready contracts are frozen;
- the task has one primary objective with an exclusive operations-package
  choreography boundary;
- semantic presentation projection and choreography intents are observable and
  testable without a browser, renderer, connector, or database;
- focused tests are defined for order-independent join, duplicate/conflict,
  retry replacement, late/stale/reconnect delivery, failure/recovery, and
  disabled/unavailable state projection;
- no selected task depends on an unintegrated worker result; and
- the task is not an entire phase, workstream, or broad subsystem.

Granularity review: one leaf task, one coherent module boundary, limited owned
files, explicit forbidden files, frozen shared contracts, checkable acceptance
criteria, and independently runnable focused validation. No ownership overlap
exists because this wave launches one worker.

## Frozen interfaces

- `office-operations-v2` Snapshot V2 remains the source of operational truth;
  semantic projection may derive a view from it but may not mutate or enrich it
  with character, facility, sprite, renderer, or CSS data.
- `OperationsSnapshotDocument` event records, freshness values, structured
  reasons, feature availability, durable event IDs, sequence numbers, payload
  digests, and source revisions remain unchanged.
- Shared `@affiliate-ops/contracts` content branch, completion, and
  `content_ready` event shapes remain the workflow-facing join vocabulary. The
  operations module may consume these shapes but does not become a second
  workflow transition owner or write workflow state.
- Copy and visual are separate stable branches. A join is valid only when the
  current accepted attempt for both branches is complete, and a
  `content_ready` condition/intent is emitted at most once per content group.
- A higher retry attempt may replace a pending branch result; stale attempts,
  same-attempt conflicts, changed durable payloads, late events, and duplicate
  delivery fail closed or become idempotent no-ops according to existing
  adapter/workflow diagnostics.
- Choreography intents are transient, deterministic, and idempotent. Their
  identity is derived from the durable event/group/branch identity and does not
  depend on wall-clock arrival or array order.
- Failure maps to a structured blocked/unavailable semantic state with its
  existing owner/recoverability facts; recovery is a fresh deterministic intent
  and never advances durable workflow truth by animation or presentation.
- Operations remains renderer-free and may depend only on shared contracts and
  Office contracts. No `@affiliate-ops/workflows` package dependency, schema
  edit, migration, connector call, or simulation/world import is permitted.

## Ownership and worker starting state

| Session | Task | Branch | Worktree | Status |
| --- | --- | --- | --- | --- |
| 1 | `P3-W3.3` | `task/session-1-p3-w3-03-choreography` | `C:\Users\WINDOW XI\.codex\worktrees\phase3-p3-w3-03-choreography` | planned |

- Initial planning artifacts / worker starting commit:
  `6072a118d5b051756c30b7b5f839d43fc1a3fa11`.
- Planning-lock metadata commit: this coordinator-only descendant of the
  worker starting commit, recorded in the final integration report.
- Worker branches begin from the same initial planning artifacts commit.
- Integration branch: `codex/integration/phase3-p3-w3-03`.

## Validation strategy

The worker runs the focused operations choreography test, package typecheck,
Office preflight, and `git diff --check`. Main re-runs the focused suite and
all required repository gates:

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

Main also verifies ownership compliance, public exports, branch ancestry,
remote-primary alignment, accepted-commit reachability, and a clean worktree.
No visual test is expected because this wave is headless operations behavior.

## Phase-closure and publication strategy

After integration, Main will update the execution backlog and evaluate Phase 3
against every T2/T3 exit criterion. The phase remains **ACTIVE** unless all
required leaf tasks are integrated or formally deferred/not required and the
required evidence passes. No next wave or next Phase will be launched in this
invocation.

The integration branch will be reconciled with the verified remote `main`,
validated again if `main` advanced, pushed without force, and left ready for
review. The primary branch will not be modified or merged. Pull-request
creation will be attempted only through an available supported mechanism; if
none exists, the pushed branch will be reported without claiming a PR.

## Known risks

- Existing workflow tests already own the workflow reducer's `content_ready`
  event. The worker must consume or project that authority without duplicating
  a conflicting workflow transition owner.
- Operations event records are intentionally compact. The choreography module
  must require explicit branch/attempt/artifact context for branch transitions
  rather than inferring it from display order or job names.
- Late, duplicate, stale, and reconnect-delivered events must not repeat
  movement, handoff, or completion intents.
- A disabled connector or unavailable session must remain visibly unavailable
  and must not produce an external action proposal.
- No connector, database, browser, renderer, visual asset, or secret may enter
  the operations package.

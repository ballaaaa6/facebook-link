# Phase 3 Exit Execution Plan

## Historical repository-grounded starting point

- Repository: `D:\antigravity\shopee link`
- Starting branch: `main`
- Starting HEAD: `351dd4866e4d65efb93e455fa50db5e557b2da82`
- Starting worktree: clean; Office V2 preflight passes.
- Historical Phase 3 status at original plan start: `ACTIVE`.
- Integrated bounded evidence: P3-W2.1 through P3-W2.6, P3-W3.1 through
  P3-W3.4; simulation-focused tests are 50/50 and operations-focused tests are
  29/29.

## Coordinator re-verification starting point

The coordinator received this plan after the original exit wave had already
published a closure at `f00e98d`. The re-verification checkout was clean, the
Office V2 preflight passed, and the task scope was narrowed to audit/recovery,
fresh evidence generation, unified-gate reruns, status synchronization, and
publication. The original gap list and worker graph below remain the historical
execution contract; the current result is recorded at the end of this plan.

## Exact remaining gaps

1. There is no reducer-owned state that composes the command pipeline,
   navigation/movement, activity lifecycle, queues/reservations, cleanup, and
   canonical state hashing in one runtime.
2. T2 has no real one-actor trace for command acceptance, movement, target use,
   cancellation, timeout, unreachable handling, queue/resource cleanup, or
   uninterrupted-versus-restore/replay equality.
3. T3 has no reducer-integrated 1-, 10-, or 15-actor scenario matrix covering
   shared facilities, narrow-door contention, fairness, target removal,
   cancellation/timeout under contention, deadlock recovery, and leak checks.
4. The replay runner is reusable but has not been driven by a production
   reducer through meaningful T2/T3 checkpoints.
5. Operations has bounded adapter/choreography/reconciliation modules, but no
   deterministic ten-role trace through the real workflow and runner
   boundaries covering retries, failures, recovery, reconnect, disabled
   connectors, late/out-of-order delivery, stale projection, and current-truth
   convergence.
6. There is no single Phase 3 gate that refuses skipped scenarios, missing
   evidence, hash divergence, leaks, boundary bypasses, or stale artifacts.
7. The authoritative Phase 3 status records and final integration report still
   describe Phase 3 as active and incomplete, correctly; they cannot change
   until the unified gate passes on the final integration branch.

## Task graph

| Task | Scope and owned files | Dependencies | Acceptance and evidence | Validation |
| --- | --- | --- | --- | --- |
| `P3-EXIT-01` — Integrated reducer and T2 one-actor evidence | New simulation integration runtime and tests under `packages/office-v2-simulation/src/integrated-runtime.ts`, `packages/office-v2-simulation/test/integrated-runtime.test.ts`, and a package-local T2 fixture/evidence writer. The task owns the simulation barrel export if required. | Existing P3-W2.1–W2.6 and Phase 2 world package. | One reducer drives commands, route/movement, activity, queue/resource ownership, cleanup, event sequencing, hashes, and snapshot/restore. Covers reach/use/complete/cancel/timeout/unreachable, mid-route/queue/interaction/held-prop checkpoints, and equal final event/hash results. Emits machine-readable and human-readable T2 evidence. | `npm run typecheck --workspace @affiliate-ops/office-v2-simulation`; focused integration test; package tests; preflight. |
| `P3-EXIT-02` — Integrated T3 crowd matrix | New crowd scenario runner/tests and evidence under `packages/office-v2-simulation/src/integrated-crowd.ts`, `packages/office-v2-simulation/test/integrated-crowd.test.ts`, and crowd evidence fixtures. No edits to the reducer core owned by `P3-EXIT-01`. | `P3-EXIT-01`. | Runs 1/10/15 actors through the same reducer. Proves shared facilities/targets, fairness, reservations, narrow doors, target removal, cancellation/timeout, deadlock resolution, recovery, cleanup invariants, no duplicate completion, no stuck actor, and restore/replay hash equivalence at meaningful contention points. | Crowd focused test; package test/typecheck; preflight. |
| `P3-EXIT-03` — Ten-role operations integrated trace | Operations/runner evidence harness and tests under `services/automation-runner/src/simulation/phase3-operations.ts`, `services/automation-runner/test/phase3-operations.test.ts`, plus a reproducible evidence command/output. It may extend the pilot boundary only where needed to exercise the existing workflow owner and persistence contracts. | P3-W3.1–W3.4 and existing workflow/runner tests. | Uses the real workflow transition/ownership and runner job/result/persistence boundaries for all ten roles. Covers fan-out/join, partial completion, review, block/failure/retry/recovery, reconnect, duplicate/late/out-of-order delivery, disabled connector behavior, stale projection, reconciliation, and final truth equality. Emits a choreography/reconciliation trace. | Focused runner/operations tests; workflow and runner tests; package typecheck/build; preflight. |
| `P3-EXIT-04` — Unified Phase 3 acceptance gate | Gate script, package scripts, evidence freshness checks, and gate test under `scripts/office-v2-phase3-exit.mjs`, `scripts/office-v2-phase3-exit.test.mjs`, and root `package.json`. The task does not edit simulation or operations implementation. | `P3-EXIT-01`, `P3-EXIT-02`, `P3-EXIT-03`. | One command runs T2, T3, operations, relevant module tests, typecheck, architecture/boundary checks, build, deterministic evidence generation, and artifact freshness checks. It fails on skipped cases, missing meaningful assertions, hash divergence, leaks, operations truth divergence, bypassed production pipeline, or stale/missing evidence. | `npm run office:v2:phase3:acceptance`; direct failure-mode tests; full `npm run check`. |
| `P3-EXIT-05` — Final status, integration report, and publication | Main-owned `docs/office-v2/EXECUTION_BACKLOG.md`, `docs/office-v2/READINESS_REMEDIATION_PLAN.md`, required status/evidence indexes, `docs/parallel-work/phase3-final-integration-report.md`, and this plan’s result section. | `P3-EXIT-04` passing on final branch. | Status changes to `COMPLETE` only with exact gate output, evidence references, worker handoffs/commits, recovery disclosure, final branch/HEAD, clean worktrees, and explicit non-Phase-3 deferrals. | Full gate, `npm run check`, clean-worktree/remote checks, final report review. |

## Execution waves

### Wave 0 — Plan and isolated worktrees

Main records this plan, freezes the write sets, creates isolated worktrees, and
dispatches `P3-EXIT-01` and `P3-EXIT-03`. Main does not modify implementation
files while those workers are active.

### Wave 1 — Independent implementation

`P3-EXIT-01` and `P3-EXIT-03` run concurrently. They have disjoint package
ownership. Each worker must commit, produce evidence, report exact commands and
results, list assumptions/risks, and hand off a clean worktree.

### Wave 2 — Dependent crowd integration

After Main independently reviews and integrates `P3-EXIT-01`, dispatch
`P3-EXIT-02` against the integrated reducer API. Main reviews the crowd diff and
reruns all simulation tests before proceeding.

### Wave 3 — Unified gate

Main dispatches `P3-EXIT-04` only after both simulation evidence streams and the
operations trace are accepted. The gate must generate evidence from the final
branch and verify that every required scenario is executed.

### Wave 4 — Closure and publication

Main independently runs the unified gate, full repository checks, and clean
worktree checks. Only then does Main update authoritative status documents,
write the final integration report, commit the closure, and push the final
integration branch.

## Subagent operating rules

Every worker prompt names its task ID/title, repository and isolated worktree,
branch, exact write set, forbidden scopes, required behavior, tests, evidence,
commands, acceptance criteria, commit requirement, and structured handoff. A
worker that stalls, violates scope, or fails validation is inspected and
replaced or recovered by Main; the task remains open until accepted.

## Final integration sequence

1. Review each worker’s complete diff and evidence, independently rerun focused
   checks, and reject unrelated or boundary-bypassing changes.
2. Integrate accepted commits onto `codex/phase3-exit-integration` in dependency
   order: T2 reducer, operations trace, T3 crowd, unified gate.
3. Run the unified gate twice from the same checkout and compare evidence hashes.
4. Run `npm run check`, the required Office V2 gates, and relevant package
   builds/typechecks.
5. Verify no duplicate project processes or unclean task worktrees remain.
6. Update status documents and the final integration report only after all
   mandatory criteria pass.
7. Commit and push the final branch; report the exact branch and HEAD.

## Evidence artifact contract

Evidence is committed under `artifacts/office-v2/phase3/` with deterministic
machine-readable JSON and human-readable Markdown for T2, T3, operations, and
the unified gate. Each artifact records scenario IDs, command/event sequences,
restore point, cleanup/leak assertions, uninterrupted and restored/replayed
hashes, equality, and generation metadata. The gate rejects missing artifacts,
unknown scenario IDs, skipped cases, and content that is not reproducible from
the current checkout.

## Execution result

The original exit wave completed on 2026-08-03 and is preserved in the prior
integration history. The coordinator's final re-verification started from
clean checkout `f00e98d` (which already published the earlier closure), then
ran a fresh three-track audit/recovery wave. The first audit workers for T2/T3,
operations, and the gate stalled before handoff; Main closed those attempts,
inspected their isolated diffs, and recovered only two scoped drafts.

Main accepted the reducer ordering correction as `0c2e5ef`, accepted the
authoritative operations workflow/runner/persistence trace as `f2dd897`, and
then repaired the operations test's package-boundary import as `8acd2af`.
Replacement auditors independently confirmed the T2/T3 invariants, exact ten
role assertions, and fail-closed validator; the gate auditor found no further
defect. The gate was run twice from `8acd2af` with 15/15 commands passing each
time, validator tests passing 4/4, byte-identical reports, and full
`npm run check` passing. Status publication follows this gate evaluation.

P3-EXIT-05 status publication and the final integration report are Main-owned
and occur only after the unified gate. Renderer selection, production assets,
and Phase 4 remain explicitly deferred.

# Phase 3 Parallel Wave Plan

## Repository assessment

- Repository: `D:\antigravity\shopee link`
- Current branch before planning: `main`
- Verified primary branch: `main` (`origin/HEAD -> origin/main`)
- Configured remote: `origin` → `https://github.com/ballaaaa6/facebook-link.git`
- Original base commit: `3358c318c18eebfd586cd413cee6e026f41dc48d`
- Working tree before planning: clean; no unrelated user changes.
- Existing Phase 2 and completed Phase 3 research worktrees were preserved.
- Required Office V2 preflight: passed.

## Active phase

- Active Phase: **Phase 3 — Headless operational vertical slice**
- Objective: implement and prove a deterministic, renderer-free one-actor
  operational slice, beginning with fixed ticks, commands, facilities,
  interaction cleanup, restore/replay, and later Operations V2 choreography.
- Entry evidence: Phase 2 executable world-kernel acceptance passed at
  `e4829b68619696651c73ba6b5dced73cc28beaa0`; the world package is pure and
  renderer-neutral.
- Phase status before wave: **ACTIVE**. The prior `P3-W0` research-closure
  wave is integrated and accepted, but no T2/T3 runtime gate has passed.
- Exit criteria: T2 one-actor reach/use/cancel/restore/replay evidence, T3
  crowd/queue/deadlock evidence, and complete Operations V2 choreography pass
  without renderer or asset leakage.

## Wave selection

- Wave ID: `P3-W2-01`
- Wave name: `T2 fixed-tick command pipeline`
- Selected Task ID: `P3-W2.1`
- Actual worker count: **1**.
- Capacity rationale: the current Phase contains exactly one compatible READY
  leaf task. `P3-W2.2` is blocked on this task; `P3-W2.3` and all later W2/W3
  tasks are not READY. No later-Phase work was selected to fill unused worker
  capacity.
- Coherence rationale: the selected task is the first dependency-ordered T2
  runtime unit and owns one simulation module plus its focused tests. No other
  current-Phase READY task can run independently in this wave.

The selected assignments are READY leaf tasks from the current active Phase. No
later-Phase work was selected to fill unused worker capacity.

## Readiness, dependency, and granularity proof

| Gate | Evidence for `P3-W2.1` |
| --- | --- |
| One primary objective | Implement fixed-tick command ingest, validation, ordering, deduplication, apply, results, and events. |
| Active Phase | Phase 3 / T2 headless operational vertical slice. |
| Dependencies | Phase 2 world kernel, RC-02, and RC-03 are integrated; the frozen V2 command/result/event contracts exist. |
| No same-wave dependency | The wave contains one task. |
| Exclusive ownership | `command-pipeline.ts` and its focused test belong only to Session 1; exports and shared metadata remain Main-owned. |
| Observable acceptance | Ordering, past-tick rejection, duplicate idempotency, payload conflict, stale revision, no partial mutation, and emitted facts are directly asserted. |
| Focused validation | Node focused test, package typecheck, preflight, and repository gates. |
| Worker-sized scope | One pure module and one focused test suite; no facility runtime, queue engine, replay runner, renderer, or operations adapter. |

No selected task depends on another selected task's unintegrated output. Frozen
schemas, generated contracts, diagnostic ownership, package boundaries, and the
Phase 2 world exports are preserved.

## Frozen interfaces and ownership

See `interfaces.md` and `ownership.md`. The worker consumes, but does not
modify, the accepted command/result/event schemas, Decision 0005, the canonical
hash utilities, the four-layer boundary, or the world package. Main owns the
package barrel, package test-script integration if needed, backlog/status
reconciliation, cross-task checks, and all shared final records.

## Planning and launch records

- Planning artifacts commit: `7233ebf40f63190ac166069aedf9c7b30a04707b`.
- Planning commit for worker bases: **this coordination record will be pinned
  in the next commit before worker launch**.
- Integration branch: `codex/integration/phase3-w2-command-pipeline`
- Worker branch: `task/session-1-p3-w2-command-pipeline`
- Worker worktree: `C:\Users\WINDOW XI\.codex\worktrees\phase3-w2-command-pipeline`
- Worker session ID: **to be recorded after the real worker session launches**.

The Main Orchestration Session is the sole Final Integrator and Publisher.
Workers stop after committing and handing off their individual tasks.

## Validation and Phase-closure strategy

The worker runs its focused command-pipeline test, package typecheck, project
preflight, `git diff --check`, and the repository gate when the isolated
worktree is dependency-ready. Main reviews the exact commit and owned-file
diff, adds only required shared exports/integration tests, runs every required
Office V2 and repository gate on this integration branch, updates the backlog,
and evaluates Phase 3. This wave cannot close Phase 3 by itself; T2/T3 exit
criteria remain outstanding.

## Publication strategy and known risks

After review and complete validation, Main commits the integrated result,
reconciles against `origin/main`, pushes only
`codex/integration/phase3-w2-command-pipeline`, verifies remote alignment, and
creates a pull request if a supported connector is available. The primary
branch remains unchanged.

Risks are limited to keeping the first reducer unit renderer-free, preserving
UTF-16 command ordering, distinguishing idempotent duplicates from payload
conflicts, and not claiming real replay hashes before `P3-W2.2`.

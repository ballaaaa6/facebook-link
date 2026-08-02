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
- Planning commit for worker bases: `7233ebf40f63190ac166069aedf9c7b30a04707b`.
- Integration branch: `codex/integration/phase3-w2-command-pipeline`
- Worker branch: `task/session-1-p3-w2-command-pipeline`
- Worker worktree: `C:\Users\WINDOW XI\.codex\worktrees\phase3-w2-command-pipeline`
- Initial worker session: `019fc0dc-cde8-77d3-9763-8e357dd521f5` / Darwin;
  shutdown after remaining non-terminal with no implementation commit.
- Replacement worker session for the same unfinished leaf scope:
  `019fc0e3-ef2e-78f2-ab7a-2869368556ef` / Carver; it was also shut down
  without an implementation commit.
- Final same-scope recovery session: `019fc0e6-b8a5-7030-ae1e-773184540d66` /
  Sagan; it was shut down without a handoff after the same non-terminal
  worker-runtime behavior.

The Main Orchestration Session is the sole Final Integrator and Publisher.
Workers stop after committing and handing off their individual tasks.

## Worker outcome and Main review

All three real delegated sessions were launched against the pinned planning
base and the isolated worker worktree. Each recorded or attempted the same
`P3-W2.1` leaf scope; none produced a usable worker handoff. Main therefore
recovered the exact selected leaf in the preserved worker worktree, without
adding a task or expanding the ownership boundary.

- Coordinator recovery implementation commit:
  `758a33492f6532ee35430ed57e46917358fa6fb6`.
- Main reviewed the recovery diff and accepted only the owned source, focused
  test, and status handoff paths. The review found no schema, world, renderer,
  asset, operations, or unrelated task changes.
- Cherry-picking the recovery status record conflicted with the Main-side
  in-progress status line; Main resolved that conflict by preserving the
  recovery record and all three session IDs. The follow-up status commit was
  empty after that resolution and was skipped.
- Main-owned integration wiring exports `command-pipeline.ts` from the package
  barrel and adds the package-level Node test script. Integrated implementation
  commit: `15045a4554a53efdadf3b7ecc15fe39a627fb65c`.
- Backlog and readiness records now mark `P3-W2.1` integrated, keep Phase 3
  ACTIVE, and promote only `P3-W2.2`, `P3-W2.3`, and `P3-W2.6` to the next-wave
  READY set. No next wave was launched by this invocation.

## Validation and Phase-closure strategy

The delegated worker contract required the focused command-pipeline test,
package typecheck, project preflight, `git diff --check`, and the repository
gate. Because the delegated sessions stalled before implementation, Main ran
those validations against the coordinator recovery and the integrated branch.
Main reviewed the exact owned-file diff, added only the required shared export
and package test wiring, updated the backlog/readiness records, and evaluated
Phase 3. This wave cannot close Phase 3 by itself; T2/T3 exit criteria remain
outstanding.

Required validation evidence for the integrated branch:

- `node --test packages/office-v2-simulation/test/command-pipeline.test.ts` —
  8/8 passed.
- `npm run typecheck --workspace @affiliate-ops/office-v2-simulation` — passed.
- `node .agents/skills/build-office-v2-engine/scripts/preflight.mjs` — passed.
- `git diff --check` — passed.
- `npm run check` — passed, including the Office V2 clean-room, boundary,
  contradiction, knowledge, asset, architecture, health, duplication,
  typecheck, test, and build gates.

## Publication strategy and known risks

After review and complete validation, Main commits the integrated result,
reconciles against `origin/main`, pushes only
`codex/integration/phase3-w2-command-pipeline`, verifies remote alignment, and
creates a pull request if a supported connector is available. The primary
branch remains unchanged.

Risks are limited to keeping the first reducer unit renderer-free, preserving
UTF-16 command ordering, distinguishing idempotent duplicates from payload
conflicts, and not claiming real replay hashes before `P3-W2.2`.

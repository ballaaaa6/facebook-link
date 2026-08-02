# Phase 3 Parallel Wave Plan

## Repository assessment

- Repository: `D:\antigravity\shopee link`
- Current branch before planning: `main`
- Verified primary branch: `main` (`origin/HEAD -> origin/main`)
- Configured remote: `origin` → `https://github.com/ballaaaa6/facebook-link.git`
- Original base commit: `e4829b68619696651c73ba6b5dced73cc28beaa0`
- Working tree before planning: clean; no unrelated user changes.
- Existing Phase 2 worktrees/branches were preserved as historical audit
  surfaces; their coordination records are under
  `docs/parallel-work/history/`.
- Preflight before planning: passed.

## Active phase

- Active Phase: **Phase 3 — Headless operational vertical slice**
- Objective: implement and prove the deterministic one-actor headless slice,
  then crowd and AutoPost operations evidence.
- Entry evidence: Phase 2 world-kernel acceptance passed; projection,
  placement/occupancy, topology/depth, reference closure, and canonical world
  behavior are integrated and renderer-neutral.
- Phase status before wave: **ACTIVE**. RC-01/02/03 research closure was the
  bounded prerequisite selected for this wave; the integrated records clear
  that research prerequisite without promoting T2 runtime evidence.
- Phase exit criteria: T2 and T3 gates in `READINESS_REMEDIATION_PLAN.md` pass;
  the phase is not closed by this prerequisite wave.

## Wave selection

- Wave ID: `P3-W0`
- Wave name: `T2 research-closure prerequisites`
- Selected Task IDs: `P3-RC-01`, `P3-RC-02`, `P3-RC-03`
- Actual worker count: **3**.
- Worker session IDs: Session 1 / `019fc0b0-acda-7142-8eb7-5af2597a2e86`
  (Dewey), Session 2 / `019fc0b0-ad54-75e3-b734-2d322006a632`
  (Ampere), Session 3 / `019fc0b0-addd-77d1-a888-f8cb359143f9` (Zeno).
- Capacity rationale: exactly three compatible READY leaf tasks exist in the
  current active Phase. Each is independently executable, has a disjoint
  ownership set, and is required before the next implementation wave. No
  later-Phase work was selected to fill unused worker capacity.
- Coherence rationale: all three tasks close the named RC-01/02/03 prerequisite
  slices for the same Phase 3/T2 entry gate; they produce documentation,
  fixture, and focused evidence only, not unrelated Phase 4/5 work.

The selected assignments are READY leaf tasks from the current active Phase. No
later-Phase work was selected to fill unused worker capacity.

## Readiness, dependency, and granularity proof

| Task | One objective | Dependencies integrated | Exclusive ownership | Observable acceptance | Independent |
| --- | --- | --- | --- | --- | --- |
| P3-RC-01 | CorsixTH-informed facility/queue/cleanup closure | Phase 2 + frozen contracts | jobs/rooms/crowd docs, RC-01 tests/fixtures | source record, valid/rejected cases, cleanup traces | yes |
| P3-RC-02 | FreeSO-informed runtime/presentation/restore closure | Phase 2 + frozen contracts | runtime/replay docs, RC-02 tests/fixtures | source record, disabled/restore/rejection cases | yes |
| P3-RC-03 | Widelands/Unknown Horizons-informed assignment/retry closure | Phase 2 + frozen contracts | pipeline/save docs, RC-03 tests/fixtures | source record, reorder/target/retry cases | yes |

No selected task depends on another selected task's unintegrated output. No
selected task owns a package barrel, generated contract, manifest, or shared
status/readiness document. Existing V2 contract versions and diagnostics are
frozen; any proposed future runtime diagnostic remains test-local and is not
promoted by this wave.

## Frozen interfaces

See `docs/parallel-work/interfaces.md`. In summary, workers consume but do not
modify the accepted V2 schemas, `office-queue-policy-v1`, the Phase 2 world
exports, the canonical JSON/hash utilities, and the four-layer ownership
boundary.

## Ownership

See `docs/parallel-work/ownership.md`. No implementation path is owned by more
than one worker. Shared readiness, backlog, manifest, and final-report changes
are Main Orchestration Session integration work only.

## Planning and integration commits

- Planning artifact commit: `fb78bc31e27b30b6a1ba57259517c63f7c684724`.
- Worker branches all start from the metadata-pinned planning-base commit
  `de8c6e707113f89986145565a801fbe96063eb73`.
- Integration branch: `codex/integration/phase3-t2-research-closure`
- The Main Orchestration Session is the sole Final Integrator and Publisher.
  Workers stop after committing and handing off their individual tasks.

## Handoff review and integration result

All three workers completed their selected leaf task, returned a committed
handoff, and passed Main review. The ownership review found no overlap, no
forbidden-path changes, no schema or package-version changes, and no external
code, map, asset, behavior-table, reducer, replay, or runtime-diagnostic
admission.

| Session | Task | Worker implementation | Worker handoff | Main decision | Focused evidence |
| --- | --- | --- | --- | --- | --- |
| 1 / Dewey | P3-RC-01 | `fc3b18d248ffcb1f1a15ffbf2c66a2410802012a` | `3c7472d31aa0e53ebcd47edc15f9de5a01cfda03` | ACCEPTED | RC-01 5/5 |
| 2 / Ampere | P3-RC-02 | `b1252a0fe5b89f1514d8bc9411e37d87bdd4ac3f` | `427ea87b96a9432979aa728536cc2b280b7ebd94` | ACCEPTED | RC-02 4/4 |
| 3 / Zeno | P3-RC-03 | `21dc3fc363d2cbb1c3cf9bb459eaaf7619bdcd7a` | `7ff19c44f8ddd669b5797016f46a0b6931f988a4` | ACCEPTED | RC-03 1/1 |

The worker commits were cherry-picked onto the dedicated integration branch.
Shared readiness, backlog, research, and final-report updates remain Main-only.
The selected tasks transition `READY → IN_PROGRESS → COMPLETED → ACCEPTED →
INTEGRATED`; the Phase 3 status remains ACTIVE and no next wave is launched.

## Worker branches/worktrees

| Session | Task | Branch | Worktree |
| --- | --- | --- | --- |
| 1 | P3-RC-01 | `task/session-1-p3-rc-01-facility-queue` | `C:\Users\WINDOW XI\.codex\worktrees\phase3-rc-01-facility-queue` |
| 2 | P3-RC-02 | `task/session-2-p3-rc-02-runtime-replay` | `C:\Users\WINDOW XI\.codex\worktrees\phase3-rc-02-runtime-replay` |
| 3 | P3-RC-03 | `task/session-3-p3-rc-03-assignment` | `C:\Users\WINDOW XI\.codex\worktrees\phase3-rc-03-assignment` |

Worker launch time: 2026-08-02T11:10+07:00. All three worktrees were clean at
launch and resolved to the same pinned base.

Worktrees will be created only for these three selected tasks. No placeholder
worker or unused worktree is allowed.

## Validation and phase-closure strategy

Workers run their focused evidence tests, preflight, and task-specific checks.
The Main Orchestration Session reviews ownership and diffs, then runs the
complete repository gate and documentation/status reconciliation on the
integration branch. This wave can only close the RC prerequisite gate; Phase 3
remains ACTIVE until T2/T3 implementation evidence passes. The next wave is
not launched automatically.

## Risks

- Research observations must remain neutral and clean-room; no external game
  code, behavior tables, values, maps, or assets may be copied.
- Existing knowledge inventory is intentionally not expanded by ad hoc
  `docs/office-v2/fixtures` files in this wave. RC evidence fixtures live in
  the simulation test fixture boundary and are referenced by canonical docs;
  the Main Orchestration Session owns any future knowledge-manifest promotion.
- The current simulation package is an empty scaffold. This wave must not
  implement reducer behavior or claim T2 replay evidence.

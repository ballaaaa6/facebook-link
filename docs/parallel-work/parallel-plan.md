# Phase 3 Parallel Wave Plan

## Repository assessment

- Repository: `D:\antigravity\shopee link`
- Branch before planning: `codex/integration/phase3-p3-w2-normalization-interaction-lifecycle`
- Configured remote: `origin` → `https://github.com/ballaaaa6/facebook-link.git`
- Verified primary branch: `main` (`origin/HEAD` → `origin/main`)
- Original base commit: `925439a5f6f29580d82767e2177433a35195bc71`
- Remote primary after fetch: `925439a5f6f29580d82767e2177433a35195bc71`
- Working tree was clean before planning; no unrelated user changes were found.
- Existing completed worktrees and branches were preserved. The prior active
  wave artifacts were archived under `docs/parallel-work/history/`.
- Office V2 preflight and dependency readiness passed before planning.

## Active Phase

- Active Phase: **Phase 3 — Headless operational vertical slice**
- Objective: implement and prove a deterministic, renderer-free one-actor
  operational slice with fixed ticks, commands, facilities, interaction
  cleanup, restore/replay, and later Operations V2 choreography.
- Entry evidence: Phase 2 executable world-kernel acceptance passed at
  `e4829b68619696651c73ba6b5dced73cc28beaa0`; the world package is pure and
  renderer-neutral. The bounded RC-01/02/03 prerequisite and `P3-W2.1` are
  integrated on the verified primary base.
- Phase status before wave: **ACTIVE**. `P3-W2-01` is integrated, but T2/T3
  exit criteria remain incomplete.
- Entry criteria satisfied: Phase 2 acceptance, frozen command/result/event,
  snapshot/trace, activity/facility, lifecycle, and canonical hash contracts;
  RC-01/02/03 research closure; and the W2.1 command pipeline.
- Exit criteria: one-actor reach/use/cancel/restore/replay evidence, T3
  crowd/queue/deadlock evidence, and complete Operations V2 choreography
  evidence without renderer or asset leakage.

## Wave selection

- Wave ID: `P3-W2-02`
- Wave name: **T2 normalization, one-actor interaction, and lifecycle**
- Selected Task IDs: `P3-W2.2`, `P3-W2.3`, `P3-W2.6`
- Actual worker count: **3**
- Capacity rationale: the active Phase has exactly three compatible READY leaf
  tasks. All three are independently executable after `P3-W2.1`; no fourth
  task exists and no later-Phase work was used to fill capacity.
- Coherence rationale: the selected tasks are the next dependency-ordered T2
  simulation slices. They own disjoint modules in
  `packages/office-v2-simulation`, consume frozen contracts, and collectively
  advance deterministic state hashing, one-actor activity, and injected
  lifecycle behavior without requiring one another's unintegrated output.

The selected assignments are READY leaf tasks from the current active Phase.
No later-Phase work was selected to fill unused worker capacity.

The Main Orchestration Session is the sole Final Integrator and Publisher.
Workers stop after committing and handing off their individual tasks.

## Readiness, dependency, and granularity proof

| Task | Readiness and dependency proof | Granularity review |
| --- | --- | --- |
| `P3-W2.2` | `P3-W2.1`, RC-02, RC-03, Phase 2, and canonical JSON/hash utilities are integrated. | One normalization/PRNG/hash module plus focused tests; no replay runner or shared utility edits. |
| `P3-W2.3` | `P3-W2.1`, RC-01, RC-03, world geometry, and activity/facility contracts are integrated. | One one-actor activity runtime module plus focused tests; queues/deadlocks and operations remain out of scope. |
| `P3-W2.6` | `P3-W2.1`, RC-02, and the fixed-tick/lifecycle policy are integrated. | One injected lifecycle port plus focused tests; no renderer or browser adapter. |

For every selected task: there is one primary objective, an explicit owned
file set, a forbidden boundary, observable acceptance criteria, focused tests,
known validation commands, no same-wave dependency, and no unresolved
architecture decision. No implementation file is owned by more than one
worker.

## Frozen interfaces and ownership

See `interfaces.md` and `ownership.md`. Workers consume, but do not modify,
the accepted Office V2 schemas, generated contract types, Decision 0005,
Decision 0011, canonical JSON/hash utilities, the Phase 2 world package, and
the existing W2.1 command-pipeline module. Public exports, package manifests,
backlog transitions, readiness records, cross-task tests, and all final
documentation remain Main-owned.

## Planning and launch records

- Planning artifacts commit: `2635abb87d014240fe4992b8120f99fde0431e7e`.
- Planning commit for worker bases: `2635abb87d014240fe4992b8120f99fde0431e7e`;
  all three worker branches begin from this exact commit.
- Integration branch: `codex/integration/phase3-p3-w2-normalization-interaction-lifecycle`
- Worker branches and worktrees are listed in the three task specifications.
- Initial sessions (closed after repeated non-terminal execution with no
  implementation changes): `019fc106-e20b-7f32-a744-616f7f1ab84c` / Beauvoir
  for `P3-W2.2`, `019fc106-e28f-7c73-988c-e12bd78f65b2` / Kepler for
  `P3-W2.3`, and `019fc106-e309-7450-abdd-f09df600df38` / Meitner for
  `P3-W2.6`.
- Replacement Session 1: `019fc10c-a493-7660-90cb-2776d2f7d9e2` / Copernicus
  — `P3-W2.2`.
- Replacement Session 2: `019fc10c-a514-7083-beae-acc7bb6a3267` / Socrates
  — `P3-W2.3`.
- Replacement Session 3: `019fc10c-a58d-7b13-bc49-49a2545beea4` / Huygens
  — `P3-W2.6`.
- All three worker worktrees passed `npm ci --ignore-scripts`, Office V2
  preflight, and `git diff --check` at the planning base.
- The initial and replacement sessions for all three leaves stalled without
  implementation changes and were closed. Main completed coordinator recovery
  in the preserved worktrees; no delegated implementation was falsely claimed.

## Review and integration result

- `P3-W2.2`: accepted after review. Recovery implementation commits were
  `782cb40` and handoff `1cbb27d`; focused suite passed 8/8, package typecheck,
  preflight, `git diff --check`, and `npm run check` passed.
- `P3-W2.3`: accepted after review. Recovery implementation commits were
  `bfb06fe` and the held-prop cleanup fix `c54d64c`, with handoff commits
  `2006fc9` and `9511921`; focused suite passed 7/7, package typecheck,
  preflight, `git diff --check`, and `npm run check` passed.
- `P3-W2.6`: accepted after review. Recovery implementation commit was
  `dfe6a6b` with handoff `c68e00e`; focused suite passed 7/7, package
  typecheck, preflight, `git diff --check`, and `npm run check` passed.
- Main cherry-picked the accepted worker commits onto the dedicated branch,
  resolved only the expected worker-status conflicts, and added the public
  barrel exports in `packages/office-v2-simulation/src/index.ts`.
- Integrated cherry-pick commits currently include `02315b0`, `2ea8816`,
  `0ba26e6`, `3bf35c3`, `55ee62c`, `8921068`, `2f8b98f`, and `c5fe220`.

## Validation strategy

Each worker ran its focused Node test, package typecheck, Office V2 preflight,
and `git diff --check`; each recovery worktree passed `npm run check` after its
implementation. Main re-ran all three focused suites after review and will run
the complete Office V2 gate and `npm run check` after public export,
integration, and documentation updates. No local development server is needed
for this wave.

## Phase-closure strategy

This wave cannot close Phase 3 by itself. Main will evaluate all Phase 3 exit
criteria after integration. `P3-W2.4`, `P3-W2.5`, and the W3 operations tasks
remain incomplete or dependency-blocked until their named prerequisites and
evidence pass. If the phase remains active, Main records the next READY and
BLOCKED tasks without launching another wave in this invocation.

## Publication strategy and known risks

Main will integrate accepted worker commits only on the dedicated integration
branch, reconcile against the verified `origin/main`, run complete validation,
commit the final report, push the integration branch, and create a pull request
only if a supported mechanism is available. The primary branch remains
unchanged. Main will watch for package barrel/export conflicts, generated-file
drift, accidental renderer imports, hash projection overreach, and lifecycle
semantics leaking into presentation code.

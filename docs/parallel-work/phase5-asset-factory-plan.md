# Phase 5 Asset Factory — Parallel Work Plan

Recorded: `2026-08-03` (Asia/Bangkok)

## Repository assessment

- Repository: `D:\antigravity\shopee link`
- Remote: `origin` -> `https://github.com/ballaaaa6/facebook-link.git`
- Verified primary branch: `main`
- Primary HEAD at planning: `871546e3637c8e35b5823241c4c595fa42c1ecd0`
- Remote `HEAD`, `origin/main`, and local `main` were aligned at inspection.
- Integration branch: `codex/integration/phase5-asset-factory`
- Integration worktree: `C:\Users\WINDOW XI\.codex\worktrees\phase5-asset-factory`
- Initial Git status: clean; no project server or long-running process was
  started by this phase.
- Planning artifacts commit: `600f9e3` (`docs(office-v2): plan Phase 5 asset
  factory wave`). Wave 1 lock: `861ddef`; Wave 2 selection lock is the
  coordinator commit immediately before dispatch.
- Office V2 preflight: PASS.
- Baseline `npm run check`: PASS at the planning base.
- Existing Phase 4 and historical worktrees are preserved and are not reused.

## Frozen active Phase

- Phase ID: **Phase 5**
- Phase name: **Reproducible asset factory**
- Parent milestone: M2 — Office Engine V2 foundation and first-floor path.
- Objective: implement deterministic source/export, provenance, PNG and review
  evidence, atlas/catalog/scene-bundle closure, runtime registry generation,
  and one original connected-workstation family from source to runtime.
- Status before execution: **NOT STARTED / INCOMPLETE**; Wave 1 is now
  integrated and Wave 2 is the active selected frontier.
- Entry criteria: Phase 4/T4 is complete at `871546e`; Canvas 2D is selected;
  Closure D asset contracts and generated types are integrated; clean-room,
  boundaries, contradictions, knowledge, assets, and full repository checks
  pass.
- Exit criteria:
  1. unchanged source and recipe produce byte-identical clean outputs;
  2. provenance, source-set, recipe, PNG/RGBA, alpha, palette, frame,
     contact, socket, seam, connectivity, and orphan checks are executable;
  3. neutral geometry, alpha, palette/light, connectivity/contact, and
     native-scale review boards are generated from the same immutable inputs;
  4. exact atlas/catalog/scene-bundle references and a deterministic runtime
     registry pass closure, lifecycle, missing-asset, and migration checks;
  5. one original connected-workstation family contains masks `0`, `2`, `8`,
     and `10`, a seated socket/composite, source/provenance/recipe, runtime
     outputs, catalog/bundle records, reports, and reproducible hashes;
  6. geometry, visual, and commercial review outcomes are explicit and the
     family is admitted only when all required approvals are present;
  7. no reference/legacy pixels, scene-specific offsets, renderer-owned
     geometry, hidden fallback, or disabled connector action enters runtime;
  8. all required Office gates and `npm run check` pass on the final branch.

## Initial gaps from executable evidence

- `assets/office-v2` contains only its README; no source, recipe, runtime PNG,
  manifest, or report family exists.
- `scripts/office-v2-asset-check.mjs` is intentionally basic-only: it checks
  manifest schema, source/recipe/runtime hashes, PNG signature/dimensions, and
  duplicate family/file/pixel hashes, but not decoded RGBA pixels, CRCs,
  alpha/palette/contact/seam promises, full orphan closure, or reproducible
  export outputs.
- The Phase 1 schemas and fixtures exist, but no source-neutral factory runner,
  deterministic PNG writer, board generator, catalog/bundle compiler, or
  generated runtime registry exists.
- The first connected-workstation family is a spec-only fixture, not an
  admitted family; owner review and a real reproducible source/output slice do
  not exist.
- The three Phase 5 project workflow skills do not exist.

## Complete Phase 5 dependency graph

```text
P5-W6.1 admission-gate core ───────────────┐
                                            ├─> P5-W6.4 catalog/bundle compiler ─┐
P5-W6.2 deterministic export foundation ─> P5-W6.3 review-board generator ─────┼─> P5-W6.5 workstation proof family ─> P5-EXIT-01
                                            └─> P5-W6.4 catalog/bundle compiler ─┘
                                                                  └─> P5-W6.6 project workflow skills ────────────────┘
```

| Task | Predecessors | Downstream | Owner boundary | State before wave |
| --- | --- | --- | --- | --- |
| `P5-W6.1` | none | W6.4, W6.5 | admission module/check/tests | READY |
| `P5-W6.2` | none | W6.3, W6.4, W6.5 | source/export factory/tests | READY |
| `P5-W6.3` | W6.1, W6.2 | W6.5, W6.6 | board generator/tests/reports | BLOCKED_BY_TASK |
| `P5-W6.4` | W6.1, W6.2 | W6.5, W6.6 | atlas/catalog/bundle compiler/tests | BLOCKED_BY_TASK |
| `P5-W6.5` | W6.1–W6.4 | T5 exit | source/recipe/runtime/family reports | BLOCKED_BY_TASK |
| `P5-W6.6` | W6.1–W6.4 | T5 exit | three project skills | BLOCKED_BY_TASK |
| `P5-EXIT-01` | W6.5, W6.6, approvals | none | Main-only closure/publication | BLOCKED_BY_TASK |

Graph validation: the graph is acyclic; every dependency is a required
integrated output; no task in the same wave consumes another selected task;
there are no duplicate task IDs or broad workstream assignments. The critical
path is `W6.2 → W6.3 → W6.5 → P5-EXIT-01`; W6.1 is the highest-risk admission
unblocker and joins the catalog/family critical path.

## Forecast waves and READY-frontier policy

### Wave `P5-W6-01` — technical foundations

- READY frontier before selection: `P5-W6.1`, `P5-W6.2`.
- Selected tasks: `P5-W6.1`, `P5-W6.2`.
- Worker count: **2**.
- Capacity rationale: exactly two mutually compatible READY leaves exist; both
  have one objective, stable existing contracts, disjoint write sets, focused
  tests, and useful standalone commits. No third Phase 5 leaf has stable
  interfaces before these outputs integrate.
- Ownership proof: W6.1 owns the admission module/check/tests; W6.2 owns the
  factory module/tests. Neither edits the other module, schemas, manifests,
  assets, status, or final report.
- Expected unlocks: W6.1/W6.2 integration makes W6.3 and W6.4 READY.

### Wave `P5-W6-01` outcome — accepted and integrated

- Main review accepted both exact-scope recoveries after their replacement
  workers were shut down following repeated bounded waits. The retained diffs
  passed focused tests, Office preflight, `office:v2:assets:check`, diff
  hygiene, and full `npm run check` in isolated worktrees.
- P5-W6.1 implementation `a401647` integrated as `9aa8cf0`; its handoff record
  integrated as `33d1e80`.
- P5-W6.2 implementation `0441495` integrated as `edb2ef0`; its handoff record
  integrated as `812c3c7`.
- The integration worktree was repaired with `npm install --ignore-scripts`
  because its isolated dependency tree did not yet contain `ajv`; this changed
  no tracked files. Integrated focused suites pass 9/9 and 11/11, and the
  zero-manifest asset gate remains green.
- The accepted interfaces are the pure admission helpers in
  `scripts/office-v2-asset-admission*.mjs` and the deterministic source/export
  helpers in `scripts/office-v2-asset-factory*.mjs`.

### Wave `P5-W6-02` — evidence and closure compilers

- READY frontier after Wave 1 integration: `P5-W6.3`, `P5-W6.4`.
- Selected worker count: **2** after fresh ownership/interface review.
- W6.3 consumes the factory's deterministic PNG/output interface; W6.4
  consumes the admission and output metadata interface. They own disjoint
  modules and tests.
- Selection lock: `ade9348` (`chore(office-v2): lock Phase 5 wave 2`).
- W6.3 owns `scripts/office-v2-asset-boards.mjs`, its focused test, and its
  status record. W6.4 owns `scripts/office-v2-asset-registry.mjs`, its focused
  test, and its status record. Neither worker may edit assets, schemas,
  manifests, package metadata, the backlog, or the final report.

### Wave `P5-W6-03` — proof family and repeatable skills

- Forecast READY frontier: `P5-W6.5`, `P5-W6.6` after Wave 2 integration.
- Forecast worker count: **2**, subject to a fresh frontier calculation.
- W6.5 owns only the connected-workstation asset family and evidence; W6.6
  owns only the three skill directories and their metadata. Skills may call
  integrated tools but do not edit their implementation.

### Main-only T5 closure

`P5-EXIT-01` is never delegated. Main reviews all accepted worker diffs,
independently runs every exit gate, records exact evidence, reconciles remote
`main`, updates authoritative status, pushes the integration branch, and
leaves `main` unchanged. Visual/commercial approval is an external acceptance
condition; it will be recorded explicitly and never inferred from a generated
image or a passing technical check.

## Frozen interfaces for Wave 1

- `asset.schema.json` and the existing V1 fixtures remain frozen; W6.1 may
  improve the gate without widening the old contract or rewriting historical
  evidence.
- The source/recipe roots are exactly `assets/office-v2/sources/` and
  `assets/office-v2/recipes/`; runtime outputs remain under
  `assets/office-v2/runtime/`; manifests remain under
  `assets/office-v2/manifests/`.
- `office-projection-v1`, nearest-neighbor filtering, exact positive versions,
  no `latest`, and fail-closed missing material remain fixed.
- W6.2 exposes a small deterministic factory API/CLI for JSON source pixels,
  RGBA PNG output, metadata, hashes, and safe clean builds. W6.1 does not
  import it in Wave 1.
- No phase task may import `legacy/`, `assets/references/`, renderer pixels,
  cookies, tokens, browser profiles, or external connector payloads.

## Validation strategy

Worker-focused commands:

```text
node --test <owned focused test>
node .agents/skills/build-office-v2-engine/scripts/preflight.mjs
npm run office:v2:assets:check
git diff --check
```

Main re-runs after each integration:

```text
npm run office:v2:contradictions:check
npm run office:v2:contradictions:test
npm run office:v2:knowledge:check
npm run office:v2:boundaries:check
npm run office:v2:boundaries:test
npm run office:v2:assets:check
npm run office:v2:clean-room:check
npm run check
```

The final Phase 5 sequence additionally runs the factory twice from clean
output directories, board/catalog/bundle/registry checks, the proof-family
admission check, all relevant package/build tests, and a repository-wide clean
worktree check. No browser server is needed for this phase's technical gates.

## Publication strategy

Use `codex/integration/phase5-asset-factory` as the only publication target.
Fetch `origin`, verify remote `main`, reconcile if upstream advances, rerun
full validation, push without force, and verify local/remote integration HEAD
equality. Do not push or merge `main`. If the Phase remains blocked on review,
preserve the exact blocked evidence and report the pushed branch as not ready
for Phase closure; do not claim a T5 pass.

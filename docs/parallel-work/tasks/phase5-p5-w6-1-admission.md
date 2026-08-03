# Worker Specification — P5-W6.1

- Worker number: 1
- Task ID: `P5-W6.1`
- Title: Runtime asset admission gate hardening
- Active Phase: Phase 5 — Reproducible asset factory
- Wave ID: `P5-W6-01`
- Repository root: `D:\antigravity\shopee link`
- Assigned branch: `task/phase5-p5-w6-1-admission`
- Assigned worktree: worker-owned isolated worktree; report its absolute path
  in the handoff and status file
- Integrated base commit: `871546e3637c8e35b5823241c4c595fa42c1ecd0`
- Planning commit: recorded by Main immediately before dispatch
- Status file: `docs/parallel-work/phase5-p5-w6-01-session-1-status.md`

## Objective

Replace the current basic-only runtime asset check with a reusable, pure,
fail-closed admission boundary that can validate real PNG bytes and the frozen
V1 manifest without admitting any runtime family in this task.

## Repository evidence

- `scripts/office-v2-asset-check.mjs` currently validates JSON schema, source
  and recipe hashes, PNG signature/dimensions, duplicate family/file/pixel
  hashes, and approval status only.
- `docs/office-v2/ASSET_PIPELINE_PROVENANCE_VALIDATION.md` requires missing,
  altered, malformed, unapproved, misaligned, and orphan material to fail.
- `docs/office-v2/schemas/asset.schema.json` and its historical fixtures are
  frozen V1 contracts; do not widen or rewrite them in this task.
- `docs/office-v2/READINESS_REMEDIATION_PLAN.md` requires real PNG RGBA,
  alpha, palette, frame, contact, socket, seam, orphan, and exact-diagnostic
  checks before T5 admission.

## Dependency status

READY. Phase 4/T4, generated contracts, boundaries, knowledge, and baseline
`npm run check` are integrated and green. P5-W6.2 is a same-wave peer and is
not a dependency; do not consume its branch or files.

## Current and required behavior

Current behavior accepts only a basic PNG header and dimensions. Required
behavior is a reusable admission module that:

1. parses PNG signature, chunk lengths/types, CRCs, IHDR, IDAT, IEND, and
   deterministic non-interlaced 8-bit RGBA scanlines;
2. applies the PNG filter methods needed by the accepted decoder and rejects
   unsupported color type, bit depth, interlace, malformed/truncated chunks,
   bad CRC, and decompression failures with stable asset diagnostics;
3. exposes decoded width, height, RGBA bytes, alpha statistics, and a stable
   content digest for tests and the existing manifest checker;
4. keeps stage-path, source/recipe/runtime hash, duplicate family/file/pixel,
   schema, commercial approval, and missing-file checks fail-closed;
5. validates the existing manifest's declared dimensions and hashes against
   decoded output and rejects any runtime material that is not explicitly
   approved; and
6. leaves the no-manifest foundation message unchanged and does not invent a
   placeholder or fallback.

If a promised contact/palette/seam rule cannot be represented by the frozen V1
manifest, expose a small context-based validator for future V2 metadata and
cover it with focused tests; do not add undeclared fields to V1 JSON.

## In scope

- Add `scripts/office-v2-asset-admission.mjs` with named exports for PNG decode,
  pixel inspection, and manifest/resource validation.
- Update `scripts/office-v2-asset-check.mjs` to use the new module while
  preserving its CLI output and no-manifest behavior.
- Add `scripts/office-v2-asset-admission.test.mjs` with valid and rejected
  synthetic PNG/manifest cases, including CRC, filter, alpha, path, hash,
  approval, duplicate, and orphan failures.
- Use only Node built-ins and repository-approved dependencies already present.
- Record exact diagnostics in tests and keep all input objects immutable.

## Out of scope

- Do not create source, recipe, runtime PNG, manifest, atlas, catalog, bundle,
  review, or family files under `assets/office-v2`.
- Do not implement the source/export factory, board generator, catalog/bundle
  compiler, project skills, renderer changes, schemas, generated files,
  world/simulation/operations code, backlog, final report, or Phase closure.
- Do not import `legacy/`, `assets/references/`, V1 Office code, or external
  art/pixels.

## Owned files

- `scripts/office-v2-asset-admission.mjs`
- `scripts/office-v2-asset-check.mjs`
- `scripts/office-v2-asset-admission.test.mjs`
- `docs/parallel-work/tasks/phase5-p5-w6-1-admission.md` (read-only after
  dispatch)
- `docs/parallel-work/phase5-p5-w6-01-session-1-status.md`

## Forbidden files

All other repository files, especially schemas/generated files, `package.json`,
`package-lock.json`, assets, reports, backlog, phase plan, final report, and
other worker branches/worktrees.

## Focused validation

```text
node --test scripts/office-v2-asset-admission.test.mjs
node .agents/skills/build-office-v2-engine/scripts/preflight.mjs
npm run office:v2:assets:check
git diff --check
```

## Acceptance criteria and evidence

- All focused tests pass with exact stable diagnostics for every rejected case.
- `npm run office:v2:assets:check` passes on the zero-manifest base.
- Existing `asset-admission.json` and knowledge fixtures remain unchanged and
  the full `npm run check` is not weakened.
- The diff contains no secrets, external pixels, fallback, or unrelated files.
- Status file records branch, worktree, base, changed files, commands/results,
  commit hash, and a clean-worktree handoff.

## Deliverables and handoff

Commit one focused change on the assigned branch. Return:

```text
Task: P5-W6.1
Status: COMPLETED | BLOCKED
Branch/worktree:
Base commit:
Commit(s):
Files changed:
Focused tests and results:
Preflight/assets/check results:
Acceptance criteria:
Blockers or risks:
Clean worktree: yes | no
```

Stop after handoff. Do not integrate, cherry-pick, publish, update Main-owned
status, or begin another Phase 5 task.

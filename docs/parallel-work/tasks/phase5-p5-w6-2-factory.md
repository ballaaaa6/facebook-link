# Worker Specification — P5-W6.2

- Worker number: 2
- Task ID: `P5-W6.2`
- Title: Deterministic source/export and PNG foundation
- Active Phase: Phase 5 — Reproducible asset factory
- Wave ID: `P5-W6-01`
- Repository root: `D:\antigravity\shopee link`
- Assigned branch: `task/phase5-p5-w6-2-factory`
- Assigned worktree: worker-owned isolated worktree; report its absolute path
  in the handoff and status file
- Integrated base commit: `871546e3637c8e35b5823241c4c595fa42c1ecd0`
- Planning commit: `600f9e3` (planning artifacts; lock commit follows)
- Status file: `docs/parallel-work/phase5-p5-w6-01-session-2-status.md`

## Objective

Implement the source-neutral deterministic export foundation used by later
boards, catalogs, and the proof family. It must produce original RGBA PNG and
metadata bytes from a versioned JSON input without relying on a proprietary
editor, external pixels, or filesystem ordering.

## Repository evidence

- `docs/office-v2/schemas/source-set.schema.json` and
  `export-recipe.schema.json` require immutable source references, pinned tools,
  clean output, declared outputs, stable input order, and two-clean-build byte
  equality.
- `docs/office-v2/ASSET_PIPELINE_PROVENANCE_VALIDATION.md` requires source,
  recipe, runtime, and report stages with no overwrite or fallback.
- The repository has no factory runner or deterministic PNG writer; existing
  asset admission only checks a PNG signature and dimensions.
- `docs/office-v2/READINESS_REMEDIATION_PLAN.md` requires one source-neutral
  export boundary before the connected-workstation family.

## Dependency status

READY. The existing contracts and Node runtime are sufficient. P5-W6.1 is a
same-wave peer; do not import its branch or modify its files.

## Frozen interface

Provide a small documented module/CLI boundary in
`scripts/office-v2-asset-factory.mjs`:

- `encodeRgbaPng({ widthPx, heightPx, rgba }) -> Uint8Array`;
- `hashBytes(bytes) -> lower-case SHA-256`;
- `buildAssetExport({ source, recipe, outputRoot }) -> report`;
- CLI accepts one JSON input path and one clean output directory and emits a
  deterministic JSON report to stdout or a declared report path.

The input is source-neutral JSON with an explicit schema version, family and
recipe IDs, ordered RGBA frame records, output relative paths, metadata, and
the `overwritePolicy: "fail"`/two-clean-build requirements. Keep the input
shape local to the module until Main chooses whether a new schema is justified;
do not edit the canonical schemas in this task.

## In scope

- Add `scripts/office-v2-asset-factory.mjs` using Node built-ins (`crypto`,
  `fs`, `path`, and `zlib`) only.
- Implement deterministic non-interlaced 8-bit RGBA PNG encoding with stable
  IHDR/IDAT/IEND order and correct CRCs; no nondeterministic metadata chunks.
- Validate source/recipe IDs, safe relative stage paths, output uniqueness,
  ordered frame inputs, dimensions, RGBA length, and fail-on-overwrite.
- Write output PNG/JSON bytes only under the caller's clean output root, return
  all output hashes, and never mutate source input.
- Add `scripts/office-v2-asset-factory.test.mjs` covering repeated clean builds,
  changed pixel/hash, path escape, duplicate output, malformed input,
  overwrite, and PNG signature/chunk/dimension evidence.
- Update only the task status file with the handoff evidence.

## Out of scope

- Do not import or generate files under `assets/office-v2` in the committed
  change; use temporary directories in tests.
- Do not modify the admission checker, schemas, generated files, package
  manifests, board/catalog/bundle tools, renderer/UI, world/simulation/
  operations, project skills, backlog, or final report.
- Do not use reference images, legacy code, copied art, random timestamps, or
  environment-dependent filesystem enumeration.

## Owned files

- `scripts/office-v2-asset-factory.mjs`
- `scripts/office-v2-asset-factory.test.mjs`
- `docs/parallel-work/tasks/phase5-p5-w6-2-factory.md` (read-only after
  dispatch)
- `docs/parallel-work/phase5-p5-w6-01-session-2-status.md`

## Focused validation

```text
node --test scripts/office-v2-asset-factory.test.mjs
node .agents/skills/build-office-v2-engine/scripts/preflight.mjs
git diff --check
```

## Acceptance criteria and evidence

- Two clean runs from the same accepted input produce byte-identical PNG,
  metadata, and report hashes.
- Any changed pixel, source digest, recipe digest, output path, or output order
  changes the declared result or fails with an exact diagnostic.
- Path traversal, absolute path, duplicate output, malformed RGBA, and
  overwrite attempts fail before any partial output remains.
- PNG output is readable by the worker's own structural checks and has stable
  CRCs, dimensions, and raw pixel bytes.
- No external dependency or proprietary/reference material enters the diff.
- Status file records branch, worktree, commands/results, commit, and clean
  handoff.

## Deliverables and handoff

Commit one focused change on the assigned branch. Return:

```text
Task: P5-W6.2
Status: COMPLETED | BLOCKED
Branch/worktree:
Base commit:
Commit(s):
Files changed:
Focused tests and results:
Preflight result:
Acceptance criteria:
Blockers or risks:
Clean worktree: yes | no
```

Stop after handoff. Do not integrate, cherry-pick, publish, update Main-owned
status, or begin another Phase 5 task.

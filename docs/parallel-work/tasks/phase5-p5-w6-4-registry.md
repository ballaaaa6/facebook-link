# P5-W6.4 — Atlas/catalog/scene-bundle compiler and runtime registry

## Assignment

- Phase: **Phase 5 — Reproducible asset factory**
- Wave: `P5-W6-02`
- Base commit: `ade9348`
- Worker: Session 4; Main records the generated branch/worktree at dispatch.
- Objective: compile exact atlas, catalog, scene-bundle, and runtime-registry
  closure from immutable family/frame metadata, with deterministic ordering and
  fail-closed missing/orphan/version behavior.

## Dependencies and interfaces

- Integrated predecessors: P5-W6.1 admission helpers and P5-W6.2 factory
  helpers. Do not use unintegrated worker worktrees.
- Read the canonical schemas before implementation:
  `docs/office-v2/schemas/atlas.schema.json`, `asset-catalog.schema.json`,
  `scene-bundle.schema.json`, `asset-family-v2.schema.json`, and their common
  reference definitions.
- The public module must expose a deterministic compiler that accepts family,
  frame, atlas, catalog, scene-bundle, and runtime-file records and returns
  canonical documents plus a registry digest. It may also write one clean
  output root, but must not overwrite existing material.
- Preserve `missingAssetPolicy=fail-closed`, explicit positive versions, exact
  `office-v2/runtime/...png` paths, and no `latest` references.

## Owned files

- `scripts/office-v2-asset-registry.mjs`
- `scripts/office-v2-asset-registry.test.mjs`
- `docs/parallel-work/phase5-p5-w6-02-session-4-status.md`

## Forbidden files and behavior

- Do not edit the admission checker, factory, board generator, schemas/generated
  contracts, package manifests, assets/runtime files, backlog, or final report.
- Do not encode PNGs, copy/reference pixels, import legacy/renderer code, or
  mutate approval status. This task validates and compiles records; it does not
  admit an owner-unapproved runtime family.

## Acceptance

- Stable ordering and hashes for equivalent input order; changed family/frame,
  atlas, catalog, bundle, or runtime hash changes registry output.
- Exact positive version closure across family → frame → atlas → catalog →
  scene bundle; reject `latest`, duplicate IDs/files, missing references,
  incompatible versions, malformed runtime paths, orphan runtime files, and
  missing/altered runtime bytes with stable `asset.registry.*` diagnostics.
- Generated atlas/catalog/scene-bundle/registry documents conform to the
  frozen field names and fail-closed lifecycle/floor-switch/context-recovery
  policy. Both `spec-only` and `runtime-approved` are explicit; approval is
  never inferred.
- Focused tests cover valid closure, reorder determinism, every negative
  closure case, registry hash changes, clean-output overwrite rejection, and
  immutable input preservation. Run the focused test, Office preflight,
  `npm run office:v2:assets:check`, `git diff --check`, and `npm run check`.

## Handoff

Commit only the owned files. Report the exact commit, tests, preflight, asset
gate, full check, clean worktree, and any blocker. Stop after handoff.

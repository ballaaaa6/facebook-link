# P5-W6.3 — Neutral review-board generator

## Assignment

- Phase: **Phase 5 — Reproducible asset factory**
- Wave: `P5-W6-02`
- Base commit: `c763844`
- Worker: Session 3; Main records the generated branch/worktree at dispatch.
- Objective: generate deterministic review-board PNG/metadata outputs from
  immutable source pixels and declared family metadata, without changing
  approval state or inventing geometry.

## Dependencies and interfaces

- Integrated predecessors: P5-W6.1 admission helpers and P5-W6.2 factory
  helpers. Do not use unintegrated worker worktrees.
- Use `encodeRgbaPng` and `hashBytes` from
  `scripts/office-v2-asset-factory.mjs`; do not duplicate PNG encoding.
- The public module must expose one deterministic builder and one clean-output
  writer/CLI-compatible function. A supported input contains family/version,
  source and recipe hashes, style/profile facts, geometry/frame facts, palette
  facts, connectivity/contact facts, and explicit review state.
- Emit exactly the declared board classes: `geometry`, `alpha`, `palette`,
  `connectivity`, and `native-scale`; every output has a stable relative path,
  byte hash, input digest, and review-state metadata. JSON metadata must be
  canonical and output ordering must be stable.

## Owned files

- `scripts/office-v2-asset-boards.mjs`
- `scripts/office-v2-asset-boards.test.mjs`
- `docs/parallel-work/phase5-p5-w6-02-session-3-status.md`

## Forbidden files and behavior

- Do not edit the admission checker, factory, schemas/generated contracts,
  package manifests, assets/runtime manifests, catalog/registry, backlog, or
  final Phase 5 report.
- Do not import legacy/reference pixels, browser state, renderer code, or
  external connectors.
- Do not turn `pending-owner-review` into `approved`; review evidence is
  descriptive and fail-closed.

## Acceptance

- Same immutable input produces byte-identical PNG and JSON board outputs across
  two clean output roots; changed source/recipe/geometry/palette/connectivity
  facts change the report digest.
- Missing style, geometry, frame, palette, contact, mask, or review-state facts
  fail with stable `asset.boards.*` diagnostics before writing any output.
- Board metadata exposes source/recipe hashes, geometry, alpha policy,
  palette/light policy, contacts/masks, native-scale policy, and review state;
  no board has scene-specific offsets or renderer-owned geometry.
- Focused tests cover deterministic ordering, all board classes, byte/hash
  changes, missing/inconsistent metadata, path/overwrite failures, and
  immutable input preservation. Run the focused test, Office preflight,
  `npm run office:v2:assets:check`, `git diff --check`, and `npm run check`.

## Handoff

Commit only the owned files. Report the exact commit, tests, preflight, asset
gate, full check, clean worktree, and any blocker. Stop after handoff.

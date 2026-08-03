# P5-W6.5 — Connected-workstation proof family

## Assignment

- Phase: **Phase 5 — Reproducible asset factory**
- Wave: `P5-W6-03`
- Base commit: `1a020ac`
- Worker: Session 5; Main records the generated branch/worktree at dispatch.
- Objective: produce one original procedural workstation family from source
  pixels through deterministic candidate outputs, boards, registry closure, and
  explicit review evidence, without admitting unapproved runtime material.

## Dependencies and interfaces

- Consume only the integrated factory, admission, board, and registry modules.
- Use the required stage layout under `assets/office-v2`: immutable source at
  `sources/workstation-basic/v1/`, recipe at `recipes/workstation-basic/v1/`,
  and family evidence/candidate outputs at
  `reports/workstation-basic/v1/`. Do not create an admitted manifest until
  explicit geometry, visual, and commercial approval exists.
- The source must be original deterministic procedural RGBA data, not copied
  from references, legacy, another branch, or Git history. Record project-owned
  provenance, license status, source/recipe hashes, and `pending-owner-review`.
- The four semantic connectivity masks are exactly `0`, `2`, `8`, and `10`.
  Record seated interaction socket/contact facts and the authoritative neutral
  geometry reference; pixels must not author occupancy or use-slot geometry.

## Owned files

- `scripts/office-v2-asset-family-proof.mjs`
- `scripts/office-v2-asset-family-proof.test.mjs`
- `assets/office-v2/sources/workstation-basic/v1/**`
- `assets/office-v2/recipes/workstation-basic/v1/**`
- `assets/office-v2/reports/workstation-basic/v1/**`
- `docs/parallel-work/phase5-p5-w6-03-session-5-status.md`

## Forbidden files and behavior

- Do not edit manifests under `assets/office-v2/manifests/`, schemas/generated
  contracts, factory/admission/boards/registry implementations, project
  skills, backlog, README/readiness docs, or final Phase 5 report.
- Do not claim owner approval. A candidate manifest may be stored only under
  the family report directory and must remain explicitly `spec-only` or
  `pending-owner-review`; the runtime admission gate must fail closed for it.
- Do not use image-generation/reference/legacy pixels, scene offsets, renderer
  geometry, fallback assets, or external actions.

## Acceptance

- The family contains four deterministic procedural frames for masks 0/2/8/10,
  a seated socket/contact record, source/provenance/recipe hashes, exact
  geometry/style/connectivity metadata, review boards, registry documents, and
  candidate runtime PNGs generated from the same immutable inputs.
- Two clean factory builds produce byte-identical candidate outputs and the
  report records every output hash; changing one source pixel changes the
  relevant source/output/report hashes.
- Board and registry builders pass; unsupported masks and missing/altered/
  orphan/unapproved material fail with stable diagnostics. No runtime manifest
  is admitted while review state is pending.
- Focused tests, Office preflight, assets check, diff hygiene, and full
  `npm run check` pass. Report the exact commit, clean worktree, and the
  explicit external-review blocker if approval is unavailable.

## Handoff

Commit only the owned family/script/status files. Stop after the structured
handoff; Main owns approval, final status, exit validation, and publication.

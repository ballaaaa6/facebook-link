# Phase 5 Final Integration Report

Recorded: `2026-08-03` (Asia/Bangkok)

## Decision

- Active phase: **Phase 5 — Reproducible asset factory**.
- Result: **EXTERNAL_BLOCKER**. The original `workstation-basic/v1` candidate
  is explicitly rejected for the required 2:1 dimetric/isometric direction
  (`geometry: rework-required`, `visual: rejected`, `commercial: pending`).
  Bounded rework `P5-W6.5-R1` now provides a new `workstation-basic/v2`
  spec-only proof candidate, but `P5-EXIT-01` cannot claim T5 without
  independent v2 geometry, visual, and commercial owner outcomes.
- Integration target at report time: `codex/integration/phase5-asset-factory`.
- Primary branch at report time: `main` remained unchanged at the Phase 4
  closure point `871546e3637c8e35b5823241c4c595fa42c1ecd0`.
- Phase 6 was not started.

## Consolidation onto main — 2026-08-08

The committed Phase 5 technical line was fast-forwarded onto `main` so the
repository has one active source-of-truth line. The consolidation includes
P5-W6.1 through P5-W6.4, P5-W6.6, and the committed v4 concept3
decomposition record. The result remains **EXTERNAL_BLOCKER**: v2/v3 remain
spec-only, no runtime manifest is admitted, and P5-EXIT-01/T5 plus Phase 6
remain blocked pending explicit geometry, visual, and commercial owner review.

## Wave closure

The Main Orchestration Session selected only the earliest eligible Phase 5
frontier and dispatched at most two compatible workers per wave. Worker
sessions that stalled at their frozen bases were shut down after bounded waits;
Main recovered only their locked scopes, reviewed the resulting diffs, and
ran the same focused and repository gates before integration.

- Wave `P5-W6-01`: admission hardening and deterministic factory integrated as
  `9aa8cf0` and `edb2ef0`, with handoffs `33d1e80` and `812c3c7`.
- Wave `P5-W6-02`: review boards and atlas/catalog/scene-bundle registry
  integrated as `3a93d10` and `8149c0f`, with handoffs `ed232f7` and `1a020ac`.
- Wave `P5-W6-03`: the three workflow skills integrated as `677af66`; Main
  recovered the connected-workstation proof family as `c217d93` and refreshed
  its generated evidence after closing the seated-contact alpha gap. That v1
  family is preserved as rejected historical evidence; it is not promoted.
- Rework `P5-W6.5-R1`: the visual contract, v1 owner-review record, v2 source,
  recipe, deterministic runner, tests, and report evidence are added on the
  integration branch. No accepted factory, validator, board, registry, or
  workflow skill was modified.

## Delivered evidence

- Admission now decodes and validates RGBA PNG integrity, CRCs, alpha policy,
  provenance, hashes, duplicates, orphans, and fail-closed admission state.
- The source-neutral factory emits canonical metadata and deterministic RGBA
  PNGs from versioned source/recipe inputs, with clean-output and path-safety
  failures.
- Review boards cover `geometry`, `alpha`, `palette`, `connectivity`, and
  `native-scale`: 20 boards for masks `0`, `2`, `8`, and `10`.
- Registry closure emits atlas, catalog, scene-bundle, and registry reports
  with exact versioned references and spec-only/runtime-approved admission.
- The original procedural family is recorded under
  `assets/office-v2/sources/workstation-basic/v1/` and
  `assets/office-v2/recipes/workstation-basic/v1/`. Its generated builds,
  boards, registry, candidate manifest, and review record are under
  `assets/office-v2/reports/workstation-basic/v1/`.
- The candidate has an opaque seated socket/contact at `(7, 12)`, masks
  `0/2/8/10`, deterministic build A/B evidence, and no reference or legacy
  pixels. It is intentionally not under `assets/office-v2/runtime/` or
  `assets/office-v2/manifests/`.
- The three project skills are
  `author-office-v2-asset-family`, `compose-office-v2-room`, and
  `review-office-v2-visuals`; the clean-room allowance admits only those exact
  roots.

### Rework evidence

- The frozen v2 contract is
  `docs/office-v2/WORKSTATION_BASIC_V2_VISUAL_CONTRACT.md` with machine form
  at `assets/office-v2/contracts/workstation-basic/v2/visual-contract.json`.
- The v2 source/recipe are under the versioned `v2` roots and the generated
  report is `assets/office-v2/reports/workstation-basic/v2/family.json`.
- V2 produces true 2:1 dimetric raster planes, fixed southeast camera
  visibility, common socket/contact `(56,56)`, masks `0/2/8/10`, enlarged
  native/connectivity boards, `[2,10,8]` seam composition, seated overlay,
  light/dark previews, and two byte-identical builds.
- V2 registry and candidate manifest remain `spec-only`; no runtime PNG or
  manifest was written.

## Validation

- Focused admission tests: 9/9.
- Focused factory tests: 11/11.
- Focused review-board tests: 6/6.
- Focused registry tests: 5/5.
- Focused proof-family tests: v1 2/2 and v2 2/2, including source-change hash
  divergence.
- Two clean proof-family builds: byte-identical output and reports.
- Office preflight, boundaries, clean-room, contradictions, knowledge,
  contracts, assets, architecture, code health, duplicate, typecheck, tests,
  build, and full `npm run check`: pass.
- `office:v2:assets:check`: pass with zero admitted runtime manifests.
- Technical visual inspection confirmed the generated v1 candidate is
  renderable; this is not owner geometry/visual/commercial approval. The
  separate owner-review record rejects v1 for the project direction.

## Blocker and handoff

The v1 review is explicitly recorded as geometry `rework-required`, visual
`rejected`, and commercial `pending`; its source, recipe, reports, hashes, and
evidence remain immutable historical material. The v2 review remains
`pending-owner-review` for geometry, visual, and commercial decisions, and its
registry remains `spec-only`. No approval is inferred from procedural
generation, image inspection, hashes, or automated gates. Main must rerun the
complete Phase 5 exit sequence after explicit v2 outcomes before any runtime
manifest is admitted or Phase 6 is selected.

At report time, the integration branch was the only publication target and was
pushed without force after final validation. The committed technical line has
since been consolidated onto `main`; no runtime manifest or Phase 6 claim was
added by that consolidation.

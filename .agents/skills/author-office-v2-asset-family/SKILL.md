---
name: author-office-v2-asset-family
description: Author an original Office V2 asset family from immutable source through provenance, deterministic export, review boards, catalog or registry evidence, and fail-closed admission. Use for new furniture, environment, character, or interaction asset-family work.
---

# Author Office V2 Asset Family

Read `AGENTS.md`, `docs/office-v2/README.md`, and the relevant sections of
`docs/office-v2/ASSET_PIPELINE_PROVENANCE_VALIDATION.md`,
`docs/office-v2/ASSET_GEOMETRY_REGISTRATION_RENDER_PARTS.md`, and
`docs/office-v2/ATLAS_CATALOG_BUNDLE_LIFECYCLE.md`. Run
`node .agents/skills/build-office-v2-engine/scripts/preflight.mjs` and stop on
failure.

1. Start from `docs/office-v2/templates/asset-family-brief.md` and
   `docs/office-v2/templates/asset-family-manifest.json`. Keep source sets,
   recipes, runtime outputs, reports, and manifests under their declared
   `assets/office-v2/` roots. Record immutable source hashes, provenance,
   license/commercial status, geometry, sockets, connectivity, and a pinned
   export recipe; do not use `legacy/`, `assets/references/`, copied pixels,
   scene offsets, or renderer-owned geometry.
2. Build from a clean output directory with
   `node scripts/office-v2-asset-factory.mjs <input.json> <clean-output-dir> --report <report.json>`.
   For library use, call `buildAssetExport` or `encodeRgbaPng` from
   `scripts/office-v2-asset-factory.mjs`; preserve the returned report and
   hashes. Repeat the clean build and require byte-identical outputs before
   continuing.
3. Generate review evidence with `buildReviewBoards` from
   `scripts/office-v2-asset-boards.mjs`. Compile catalog, atlas, scene-bundle,
   and registry records with `buildAssetRegistry` from
   `scripts/office-v2-asset-registry.mjs`; validate source, recipe, PNG, pixel,
   and orphan closure with `validateAssetManifest` and
   `validateAssetResources` from `scripts/office-v2-asset-admission.mjs`.
4. Use positive versioned references from `docs/office-v2/schemas/asset.schema.json`,
   `source-set.schema.json`, `export-recipe.schema.json`, `atlas.schema.json`,
   `asset-catalog.schema.json`, `scene-bundle.schema.json`,
   `asset-review.schema.json`, `geometry.schema.json`, and
   `connectivity.schema.json`. Run the focused tests for the factory, boards,
   registry, and admission modules, then run `npm run office:v2:assets:check`
   and `npm run check`.
5. Keep candidates `spec-only` or `pending-owner-review` until the source
   commercial status, reviewer decision, and geometry, visual, and commercial
   approvals are explicitly recorded. Never infer approval from a clean build,
   generated board, registry output, or passing test. Reject missing, altered,
   malformed, incompatible, duplicate, orphan, or unsupported material; never
   fall back to an earlier asset or create a runtime manifest to bypass review.

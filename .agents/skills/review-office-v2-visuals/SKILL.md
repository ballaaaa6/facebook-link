---
name: review-office-v2-visuals
description: Review Office V2 generated geometry, alpha, palette, connectivity, contact, and native-scale boards and record explicit geometry, visual, and commercial outcomes. Use for asset-family or room visual acceptance before runtime admission.
---

# Review Office V2 Visuals

Read `AGENTS.md`, `docs/office-v2/STYLE_PROFILE_APPROVAL.md`,
`docs/office-v2/VISUAL_PROOF_RISK_REGISTER.md`,
`docs/office-v2/ASSET_PIPELINE_PROVENANCE_VALIDATION.md`, and
`docs/office-v2/templates/acceptance-review.md`. Use
`docs/office-v2/schemas/asset-review.schema.json` as the review contract.

1. Verify that every board was generated from the immutable source, recipe,
   family version, and exact hashes. Inspect the outputs of
   `buildReviewBoards` in `scripts/office-v2-asset-boards.mjs` for geometry,
   alpha, palette, connectivity, and native-scale evidence; inspect contact
   and seated-socket composites at native scale. Rebuild or reject when the
   input hash, board hash, frame, mask, contact, seam, or geometry reference
   is missing or inconsistent.
2. Check the canonical owners before judging pixels:
   `docs/office-v2/schemas/geometry.schema.json`,
   `connectivity.schema.json`, `asset-review.schema.json`,
   `asset-catalog.schema.json`, and `scene-bundle.schema.json`. Run
   `node --test scripts/office-v2-asset-boards.test.mjs scripts/office-v2-asset-admission.test.mjs scripts/office-v2-asset-registry.test.mjs`,
   `npm run office:v2:assets:check`, and `npm run check`; treat any failure as
   a blocked review.
3. Record one `office-asset-review-v1` document with board paths and hashes,
   reviewer, date, blocking diagnostics, and separate `geometry`, `visual`,
   and `commercial` decisions. Keep the outcome `pending-owner-review` when
   any decision is pending and use `rejected` for any failed criterion.
4. Require explicit owner evidence for approval. Never infer geometry,
   visual, commercial, or style-profile approval from technical checks,
   screenshots, generated appearance, a catalog, or a registry. Do not edit
   `STYLE_PROFILE_APPROVAL.md` to manufacture approval, do not mark a risk
   closed without committed evidence and an owner decision, and do not admit a
   runtime manifest unless the source commercial status, reviewer decision,
   and all three approvals are `approved`.
5. Reject alpha halos, palette or lighting drift, contact/socket mismatch,
   seam gaps, unsupported masks, duplicated pixels, wrong scale, occlusion or
   geometry disagreement, missing references, and unapproved or orphan
   material. Preserve fail-closed missing-asset behavior and route each
   failure to the owning contract or a new versioned review.

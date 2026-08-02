# Decision 0015 — Versioned Visual Style and Asset Lifecycle Contracts

- Status: accepted for Phase 1 specification closure
- Date: 2026-08-02
- Owners: art direction, asset pipeline, world, and presentation

## Context

The project needs measurable visual language and reusable asset references
before final pixels or an art batch. Existing V1 asset/provenance schemas are
historical contracts and cannot be reinterpreted to carry the V2 geometry and
render-part ownership split.

## Decision

Adopt these Phase 1 contract versions:

- `office-style-profile-v1` for numeric scale, palette, lighting, density,
  contact tolerance, native scale, zoom stops, and filtering;
- `office-asset-family-v2` for exact geometry/style/source/export/review and
  presentation references without occupancy fields;
- `office-sprite-frame-v1` and `office-render-part-v1` for pixel registration
  and acyclic composition;
- `office-source-set-v1`, `office-export-recipe-v1`,
  `office-asset-review-v1`, and `office-asset-migration-v1` for provenance,
  deterministic export, review, and migration;
- `office-atlas-v1`, `office-asset-catalog-v1`, and
  `office-scene-bundle-v1` for exact lifecycle closure;
- `office-character-definition-v1` and `office-semantic-variant-v1` for
  identity, role, operational state, animation, held-prop, facility, mask,
  and interaction-socket separation.

All references are positive ID/version pairs. `latest` aliases, array-position
identity, source or recipe mutation, missing closure, unsupported masks, and
missing semantic variants fail closed with an asset, connectivity, world, or
contract diagnostic owned by the relevant layer.

The profile fixture is a measurable engineering specification. Numeric visual
approval remains a separate product-owner review; this decision does not claim
that a board, PNG, runtime manifest, renderer, or production family has been
approved.

Native 2D, fixed-camera 3D-assisted, and hybrid authoring remain experiment
profiles until the original-material comparison required by Decision 0006.
This decision does not select an authoring application or renderer.

## Consequences

V1 `asset.schema.json`, `provenance.schema.json`, and their fixtures remain
unchanged. V2 asset records reference world geometry and own only presentation
facts. A catalog or scene bundle can be validated in a fixture/lab without
admitting any file under `assets/office-v2/manifests/` or
`assets/office-v2/runtime/`.

## Evidence

The canonical documents, generated V2 types, valid/rejected contract fixtures,
asset-pipeline semantic probe, and focused closure-D evidence test are the
Phase 1 evidence. Full PNG, atlas packing, clean-build, and runtime lifecycle
proof remain T4/T5 gates.

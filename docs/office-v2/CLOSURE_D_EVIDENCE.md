# W1.6 Closure D Evidence

Status: Phase 1 specification evidence complete on 2026-08-02. This record
covers numeric visual style, asset geometry/render-part separation,
provenance/export contracts, atlas/catalog/scene-bundle lifecycle, and
character/furniture semantic variants. It does not admit production art or a
runtime asset.

## Contract ownership

- `style-profile.schema.json` owns `office-style-profile-v1`.
- `asset-family-v2.schema.json`, `sprite-frame.schema.json`, and
  `render-part.schema.json` own presentation references and pixel composition;
  `geometry.schema.json` remains the sole world-geometry authority.
- `source-set.schema.json`, `export-recipe.schema.json`,
  `asset-review.schema.json`, and `asset-migration.schema.json` own immutable
  provenance, deterministic export, review, and migration effects.
- `atlas.schema.json`, `asset-catalog.schema.json`, and
  `scene-bundle.schema.json` own exact reference closure and lifecycle policy.
- `character-definition.schema.json` and `semantic-variant.schema.json` keep
  identity, role, operational state, animation state, held prop, facility
  state, connectivity mask, and interaction socket separate.

## Executed evidence

The integrated repository knowledge gate and focused Closure D test report:

| Measure | Result |
| --- | ---: |
| Inventoried knowledge files | 186 |
| Loaded schemas | 58 |
| Fixture files evidenced | 66 / 66 |
| Declared semantic cases executed | 184 / 184 |
| Exact diagnostics matched | 101 |
| Reducer/replay evidence | 0 |
| Property/model evidence | 0 |
| Runtime manifests admitted | 0 |

The valid fixture is
`fixtures/asset-pipeline-contracts-v2.json`. Rejected evidence is in
`fixtures/invalid/asset-pipeline-contracts-v2.json` and covers invalid scale,
palette, padding, light/shadow, zoom, missing provenance/recipe, source-hash
and commercial-review failures, orphan records, render-part cycles, geometry
version mismatch, occupancy leakage, missing/unsupported connectivity masks,
missing bundle references, unsupported semantic variants, and failed
migration.

## Boundary statement

`npm run office:v2:assets:check` continues to report:

```text
no runtime manifests admitted
asset admission basic-only
```

No production PNG, runtime manifest, renderer, atlas pack, clean-build export,
or live lifecycle execution is claimed. Native 2D, fixed-camera 3D-assisted,
and hybrid authoring remain measured experiment profiles; no authoring tool or
renderer was selected from intuition.

# Atlas, Catalog, and Scene-Bundle Lifecycle

## Scope

This document owns the lifecycle contracts after a versioned asset family has
passed source, export, geometry, and review specification. It defines exact
family/version/variant/frame references, deterministic closure, lifecycle
operations, and fail-closed behavior. It does not admit a runtime manifest or
PNG during W1.6.

The contracts are:

- `atlas.schema.json` — deterministic packed rectangles and frame membership;
- `asset-catalog.schema.json` — family-level admission and reference closure;
- `scene-bundle.schema.json` — floor/context load units and recovery policy;
- `asset-review.schema.json` — geometry, visual, and commercial review result;
- `asset-migration.schema.json` — explicit old-to-new version transition.

## Exact references and closure

Every reference includes an ID and positive version. Family, geometry, style,
source, recipe, atlas, catalog, bundle, variant, and frame versions are exact;
there is no `latest` alias. A catalog entry must resolve to one catalog family,
one atlas entry, one frame, one geometry reference, and one deterministic source
recipe. An atlas, catalog, or bundle with an orphan source, recipe, runtime
output, review, or catalog entry fails before import.

Stable ordering is declared by contract, never inferred from filesystem order or
array position. Duplicate family/version, variant/frame, atlas-entry, catalog
entry, or bundle-asset keys fail with an `asset.*` diagnostic.

## Atlas V1

`office-atlas-v1` pins padding, extrusion, stable entry order, and the output
hash. Rotation and trimming are forbidden in V1. An entry records its exact
family/version, variant, frame, orientation, and packed rectangle. The rectangle
is atlas-local pixel metadata; it cannot change world geometry or pixel contact.

## Catalog admission

`office-asset-catalog-v1` records the catalog version, exact atlas references,
entries, lifecycle group, and `fail-closed` missing-asset policy. Admission is
separate from visual approval and from runtime import. The W1.6 fixture uses
`spec-only` admission so it can prove closure without creating a production
manifest.

## Scene-bundle lifecycle

`office-scene-bundle-v1` groups exact catalog entries by a floor or presentation
context and declares:

- preload order and upload/unload ownership;
- reference-counted release and idempotent unload;
- floor switch behavior and context-loss recovery;
- missing-asset screen independence from the failed bundle;
- bundle migration and fail-closed incompatibility behavior.

Bundle load is abortable. Teardown settles pending work. Recovery may rebuild
presentation resources, but it cannot change the world or simulation hash.
Bundles never infer actors, facilities, occupancy, or operational truth from
asset availability.

## Source, review, and migration

Source sets and export recipes are immutable inputs. Two clean exports of the
same source, recipe, tool version, dependency set, locale, and color profile
must be byte-identical. Reviews record geometry, visual, and commercial status
separately; an unapproved commercial result cannot enter a catalog.

Migrations are explicit records with source/target versions, mapping, required
context, compatibility effect, and rejection policy. An unsupported version,
missing mapping, changed geometry reference, orphan, or failed review is a
deterministic rejection, not a fallback to V1 or an unrelated family.

## Required evidence

The Phase 1 contract fixture covers exact reference closure, no-`latest`
rejection, orphan source/recipe/runtime/atlas/catalog/bundle detection,
duplicate entries, missing bundle references, fail-closed missing assets,
floor switch, context recovery, and failed migration. Production PNGs,
runtime manifests, atlas packing, and actual unload/recovery execution remain
later T4/T5 implementation evidence.


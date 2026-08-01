# Definition, Instance, Runtime State, and Derived View

## Authority and purpose

This document owns the identity and lifecycle vocabulary shared by Office V2
contracts. It separates authored spatial truth, placed world records, mutable
simulation state, and derived presentation data before any persistent engine
implementation begins.

The machine-readable coordinate and identity shapes live in
`schemas/common-v2.schema.json`. This document owns their meaning, ownership,
versioning, migration, and rejection rules. A generated TypeScript type is a
consumer of that schema and is never a second contract.

## Four independent layers

| Layer | Meaning | Owns | Does not own |
| --- | --- | --- | --- |
| Definition | Immutable authored capability and spatial template | stable definition ID, definition version, semantic kind, geometry reference, interaction and presentation references | floor placement, mutable progress, screen coordinates |
| Instance | A placed occurrence in one versioned floor | instance ID, definition reference, floor reference, anchor, supported orientation, semantic tags | copied footprint, copied sockets, simulation progress, sprite offsets |
| Runtime state | Mutable state at one logical simulation boundary | instance identity reference, tick, task/intent, occupancy claims, reservations, action progress, operational correlation | authored geometry, DOM nodes, textures, animation frame time |
| Derived view | Recomputed presentation projection of current state | view revision, derived transforms, facing key, render-part references, labels, freshness | world mutation, operational truth, durable simulation progress |

Each layer has an independent schema/version owner. A derived view may be
discarded and rebuilt from a snapshot; it is never a migration source for a
definition, instance, or runtime state.

## Identity namespaces

Durable IDs use a discriminated envelope so a schema validator can reject a
value supplied in the wrong namespace instead of relying on a TypeScript cast:

```json
{ "kind": "floor", "value": "ground-floor" }
```

The accepted `kind` values are `building`, `floor`, `room`,
`entity-definition`, `entity-instance`, `facility`, `socket`, `command`,
`event`, `intent`, and `tick`. String values use the lowercase Office slug
grammar. A tick value is a non-negative safe integer; all other values are
lowercase stable slugs.

The canonical namespace key is `${kind}:${value}`. Duplicate keys in one
contract are rejected. The same slug in two different namespaces is not a
collision because the discriminator is part of the identity; a floor-shaped
value supplied where a building ID is required is
`contract.identifier-namespace-mismatch`.

References that can become ambiguous after mutation contain both the typed ID
and a positive integer version:

```json
{
  "id": { "kind": "entity-definition", "value": "workstation" },
  "version": 1
}
```

The literal string `latest`, omitted versions, zero versions, and non-integer
versions are rejected. Command, event, intent, and tick identities remain
opaque inputs to later simulation contracts; W1.1 does not define their
lifecycle or reducer behavior.

## Coordinate spaces

Every serialized coordinate has a `space` discriminator. Coordinates with
different spaces are not interchangeable, even when their numeric members
look identical.

| Shape | Serialized space | Units and authority |
| --- | --- | --- |
| `CellPosition` | `cell` | Integral floor-local occupancy/placement cells; `x`, `y`, and non-negative elevation are safe integers |
| `SubCellPosition` | `sub-cell` | Integral floor-local movement units; exactly four units per cell under `office-projection-v1` |
| `FloorLocalCellPosition` | `floor-local-cell` | A versioned floor reference plus a `CellPosition` |
| `FloorLocalSubCellPosition` | `floor-local-sub-cell` | A versioned floor reference plus a `SubCellPosition` |
| `DefinitionLocalGeometryPosition` | `definition-local-geometry` | Definition-owned world/sub-cell geometry relative to its anchor basis |
| `DefinitionLocalPixelPosition` | `definition-local-pixel` | Integer pixels in an authored source before export or atlas packing |
| `SpritePixelPosition` | `sprite-pixel` | Integer pixels inside a sprite canvas or frame |
| `ScreenPixelPosition` | `screen-pixel` | Finite derived logical pixels after projection and camera transformation |

The safe integer range is `[-9007199254740991, 9007199254740991]`. Conversion
functions must reject multiplication or translation that leaves that range.
Screen pixels are derived values; pixel snapping is a presentation operation
after projection and never changes a floor-local coordinate.

`elevation` is a height within one floor and is never a building or floor ID.
Floor identity travels through the explicit floor reference in a floor-local
envelope. No schema may introduce a boundary field named only `position`.

## Facing semantics

Simulation and interaction truth use `WorldFacing` values `north`, `east`,
`south`, and `west`. Under `office-projection-v1`, the presentation transform
is a bijection:

| World facing | Screen facing |
| --- | --- |
| `north` | `north-east` |
| `east` | `south-east` |
| `south` | `south-west` |
| `west` | `north-west` |

Mirroring is presentation metadata. It may select a frame but never changes a
world-facing value or the mapping above.

## Named pure operations

W1.1 proves only small, renderer-neutral operations:

- `cellOriginToSubCell` multiplies a cell origin by four after safe-range validation;
- `splitSubCellPosition` uses mathematical floor division and returns a cell plus
  an offset in `[0, 3]`, including for negative coordinates;
- `worldFacingToScreenFacing` and `screenFacingToWorldFacing` implement the
  four-value bijection above.

Full projection, inverse ground picking, camera fitting, occupancy, and world
placement remain Phase 2 behavior. A consumer must not replace these named
operations with a cast, generic arithmetic helper, or component-specific
offset.

## Migration and diagnostics

The V1 `position` shape remains frozen. A V1 value is rejected unless a future
migration supplies form version, building/floor identity, coordinate-space kind,
and projection context. It is never migrated by guessing from `worldId`,
elevation, array position, or a field named `floor`.

W1.1 stable contract diagnostics are:

| Code | Meaning |
| --- | --- |
| `contract.coordinate-space-mismatch` | A value has the wrong serialized coordinate space |
| `contract.coordinate-integrality` | A cell, sub-cell, elevation, or version is not an allowed integer |
| `contract.coordinate-range` | A numeric value is outside the safe contract range |
| `contract.generic-position-forbidden` | A V2 boundary introduces an unqualified `position` field |
| `contract.identifier-duplicate` | A typed namespace key is repeated |
| `contract.identifier-namespace-mismatch` | A typed ID is used in the wrong reference namespace |
| `contract.reference-version-missing` | A mutation-sensitive reference has no positive version |
| `contract.reference-latest-forbidden` | A reference attempts to use a `latest` alias |
| `contract.generated-drift` | Generated TypeScript differs from the accepted schema output |

Schema adapters may preserve JSON pointers and validator context, but they must
map failures to these stable codes rather than exposing Ajv keyword wording as
the contract.

## Acceptance

The W1.1 acceptance record must show a valid and rejected example for every
space and identity family used by the package, exact diagnostics for every
rejected case, compile-time rejection for cross-space and cross-namespace
assignments, a deterministic generator output, and unchanged historical V1
hashes. This record does not claim a world kernel, reducer/replay evidence,
renderer readiness, or runtime asset admission.

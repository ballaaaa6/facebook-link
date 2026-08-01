# Definition, Instance, Runtime State, and Derived View

## Authority and purpose

This document owns the identity and lifecycle vocabulary shared by Office V2
contracts. It separates authored spatial truth, placed world records, mutable
simulation state, and derived presentation data before any persistent engine
implementation begins.

The machine-readable coordinate and identity shapes live in
`schemas/common-v2.schema.json`. W1.2 adds the geometry, definition, instance,
and bundle shapes described below. This document owns their meaning,
ownership, versioning, migration, and rejection rules. A generated TypeScript
type is a consumer of those schemas and is never a second contract.

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

The accepted W1.1 `kind` values are `building`, `floor`, `room`,
`entity-definition`, `entity-instance`, `facility`, `socket`, `command`,
`event`, `intent`, and `tick`. W1.2 extends the vocabulary with `geometry`,
`definition-bundle`, `use-slot`, `interaction`, `asset-family`, `render-part`,
`character-profile`, `animation-set`, `animation-clip`,
`connectivity-family`, and `connectivity-variant`. String values use the
lowercase Office slug grammar. A tick value is a non-negative safe integer;
all other values are lowercase stable slugs.

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
| `DefinitionLocalCellOffset` | `definition-local-cell` | Integral cell offset relative to a definition anchor; used by footprint, blocking, clearance, approaches, and waiting cells |
| `DefinitionLocalSubCellOffset` | `definition-local-sub-cell` | Integral four-units-per-cell offset relative to a definition anchor; used by sockets and held-prop/actor attachment points |
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

## W1.2 geometry and reference contract

`geometry.schema.json` is the sole author of definition-local spatial truth. Its
versioned record owns the anchor basis, cell footprint, blocking and clearance
sets, supported world orientations, cardinal orientation transforms, named
sub-cell sockets, and use-slot approach/waiting/facing/socket relations.
Footprint, blocking, and clearance entries are `DefinitionLocalCellOffset`
values. Socket positions are `DefinitionLocalSubCellOffset` values. A use slot
uses cell offsets for actor approach and waiting candidates and typed socket
IDs for actor or held-prop attachment. No geometry field is a pixel or a screen
coordinate.

W1.2 supports only the four cardinal transforms. `north`, `east`, `south`, and
`west` mean respectively zero, one, two, and three clockwise quarter-turns
from the definition's north basis. A geometry record must declare each
supported orientation and its transform; an omitted orientation is not inferred
and an arbitrary matrix is not accepted by this wave. The transform is applied
around the anchor basis to every cell and sub-cell offset before world
placement or agreement comparison.

The versioned reference shape is `{ id: { kind, value }, version }` with a
positive integer version. The stable graph key is
`${kind}:${value}@${version}`. A bundle may contain a given key once only.
Definitions, interactions, assets, animation sets/clips, connectivity
families/variants, render parts, character profiles, and instances reference
the exact version they consume. `latest`, omitted versions, kind substitutions,
and silent version upgrades are rejected.

`entity-definition-v2` owns semantic capabilities and references one geometry
version. `entity-instance-v2` owns only identity, that definition reference,
floor-local anchor, supported orientation, and semantic tags. Neither record
may repeat footprint, clearance, socket, use-slot, render-pixel, or sprite
facts. `definition-bundle-v1` is an immutable, explicitly enumerated set of
these version-pinned records. W1.2 validates reference closure and ownership;
floor/building topology, room capacity, canonical world bytes, and runtime
simulation remain later waves.

There is no hand-authored geometry duplicate. A permitted derived projection
must carry its source geometry reference and a deterministic geometry digest;
the agreement check compares it after the declared cardinal transform. A
derived projection cannot add occupancy, clearance, sockets, or use slots.

The V1 `position` shape and V1 repeated geometry fields remain frozen. A V1
value is rejected unless a migration supplies the form version, a complete
version-pinned geometry reference, coordinate-space/unit context,
building/floor identity where required, and an agreement proof for every
repeated field. Missing context uses `contract.migration-context-missing`;
conflicting repeated values use `contract.migration-reference-conflict`.
Migration never guesses from `worldId`, elevation, array position, or a field
named `floor`, and it never silently promotes a V1 record to a V2 runtime
record.

The W1.2 world/reference graph owns these stable diagnostics:

| Code | Meaning |
| --- | --- |
| `world.reference-duplicate` | A versioned graph key occurs more than once |
| `world.reference-missing` | A declared reference has no matching bundle record |
| `world.reference-kind-mismatch` | A reference ID kind does not match the declared family |
| `world.reference-version-mismatch` | A consumer asks for a different version than the authoritative record |
| `world.geometry-conflict` | A permitted derived geometry projection disagrees with authority |
| `world.geometry-authority-violation` | A non-geometry record authors an owned spatial fact |
| `world.orientation-unsupported` | An instance or projection requests an undeclared orientation |
| `world.geometry-rotation-invalid` | A cardinal transform is not a valid integral rotation |
| `world.socket-duplicate` | A geometry record repeats a socket ID |
| `world.use-slot-duplicate` | A geometry record repeats a use-slot ID |
| `world.render-attachment-cycle` | Render-part parent/dependency references contain a cycle |
| `world.asset-occupancy-forbidden` | An asset or presentation record attempts to change simulation occupancy |

Schema-shape and missing-version failures remain `contract.*`; the world
package owns semantic graph, geometry, and presentation-ownership failures.
Consumers preserve these codes and JSON pointers without recoding them.

## W1.2 acceptance boundary

The W1.2 acceptance record now shows one valid immutable bundle, exact rejected
evidence for the graph and ownership diagnostics above, reorder-invariant graph
resolution, four cardinal transform round trips over asymmetric geometry, and
fail-closed migration/ownership mutations. It does not claim a building/floor
compiler, occupancy kernel, simulation reducer, renderer, pixel asset, or
runtime manifest. W1.3 owns the next topology contracts.

## Migration and diagnostics

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
| `contract.facing-invalid` | A world or screen facing is outside the accepted vocabulary |
| `contract.schema-invalid` | A common V2 value fails for an unclassified schema reason |
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

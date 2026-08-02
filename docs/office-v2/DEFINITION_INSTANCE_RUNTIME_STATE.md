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

## RC-02 closure — runtime and presentation separation

Status: bounded research closure complete. This section records the source
study and test-only evidence needed before the Phase 3/T2 interaction and
replay implementation. It does not promote T2, add a reducer, or change a
schema.

### Engineering question and bounded source record

RC-02 asks which facts belong to immutable definitions, placed instances,
mutable runtime state, and derived presentation, and how interaction commands,
progress, results, save, and restore can remain explicit when presentation is
disabled.

The only external source used for this slice is
[FreeSO Project structure](https://github.com/riperiperi/FreeSO/wiki/Project-structure),
read for the named project-structure page only. The observed page header says
it was edited on 2020-06-12; its visible history lists latest revision `3a1510a`
(committed 2020-06-12; prior revision `6591ab6`). The page was observed by this
closure on 2026-08-02.

The page does not display a license notice for the wiki text. Its rights
boundary is therefore treated as unresolved for code, game data, maps, assets,
and other content; the page itself notes that copyrighted content is not
redistributed through its patching approach. Office uses only the neutral
architecture observations below. No FreeSO code, names as runtime identifiers,
maps, values, behavior tables, assets, or content are copied, and FreeSO is not
added as a dependency.

### Neutral observations, separated from Office decisions

The page describes a simulation group in which a virtual machine drives object
and avatar behavior. It separately names entity representations, primitive
instructions, a serializable network command path, complete VM state supplied to
clients, and tick-by-tick synchronization. It also describes marshalled VM
structures used for disk save and for sending current state during join or
resynchronization. Its model grouping includes room-map, routing, and terrain
data.

The page separately describes a lot-rendering world state divided into
architectural, dynamic-entity, and static presentation groupings. It describes
entity-facing render components that receive graphic, position, rotation, and
container updates, with static content allowed to update less frequently.
These are observations about the named project structure, not an Office design
or an implementation recipe.

| Bounded observation | Office disposition and reason | Canonical owner | Migration consequence |
| --- | --- | --- | --- |
| Simulation execution, entity data, and serializable commands are described as distinct project groupings. | **Adapt** the separation: Office commands are versioned inputs and runtime state is reducer-owned; **reject** the VM, instruction set, and network protocol as dependencies or behavior sources. | `decisions/0005-simulation-state-machine.md`, `SIMULATION_TIME_RANDOMNESS_REPLAY.md`, and the versioned command/result/event contracts | A saved command or action must carry its version and correlation explicitly. A migration never infers progress from a UI callback or command arrival time. |
| Marshalled VM state is described as the representation used for save and join/resynchronization. | **Adapt** the idea of a complete explicit snapshot and trace; **reject** a marshalled-type format or implicit network state as an Office contract. | `SAVE_SNAPSHOT_MIGRATION.md` and `REPLAY_DEBUGGING_PLAYBOOK.md`; `office-simulation-snapshot-v2` and `office-simulation-trace-v2` remain frozen | Readers validate the declared version or traverse every tested migration. Missing in-progress resource, progress, world-revision, or correlation facts fail closed. |
| Room-map, routing, and terrain data are listed with simulation model data. | **Adapt** the ownership boundary: versioned world definitions and instances provide immutable spatial inputs, while route and action progress are runtime facts. **Reject** any inference from screen coordinates or presentation offsets. | This document, `ACTORS_NAVIGATION_INTERACTIONS.md`, and the `office-v2:world-kernel` world-owner boundary | V1 state without explicit floor/world and action context is rejected; no migration guesses from position, elevation, array order, or a rendered location. |
| The lot renderer is described as separate architectural, dynamic-entity, and static groupings, with entity-facing components receiving visual updates. | **Adapt** only the disposable derived-view boundary; **reject** renderer component state as simulation truth and reject a static-buffer or component update protocol as a runtime contract. | This four-layer document and `REPLAY_DEBUGGING_PLAYBOOK.md`; presentation contracts remain downstream consumers | Derived view data may be discarded and rebuilt from a valid snapshot. Renderer state, frame time, screen pixels, and acknowledgements are never migration inputs. |

### RC-02 executable evidence and acceptance

The test-only fixtures under
`packages/office-v2-simulation/test/fixtures/` are deliberately outside the
knowledge-manifest fixture root. They describe, without executing, the
following facts:

- `rc-02-interaction-disabled.json` keeps an interaction in explicit runtime
  state while presentation is disabled; no animation frame or view
  acknowledgement can commit progress.
- `rc-02-mid-action-restore.json` carries tick, world revision, action phase and
  progress, resources/reservations, held-prop state, pending command, event
  sequence, random-stream state, cleanup generation, and workflow/task/event
  correlation at a completed-tick restore boundary.
- `rc-02-invalid-state.json` is rejected because an in-progress interaction is
  missing explicit resource and correlation facts. Its position and
  presentation data are present only to prove that reconstruction from either
  source is forbidden.

`node --test scripts/office-v2-rc-02-evidence.test.mjs` performs the focused
acceptance. Its `rc-02.invalid-state` assertion label is local to this test and
is not a runtime diagnostic catalog. The test compares normalized event/state
descriptions, preserving ordered event arrays and sorting only the fixture's
declared unordered resource-key collection. Any `placeholderHash` field is
asserted to be explicitly non-evidence: no reducer-produced state hash or
replay trace is claimed by RC-02.

The migration and clean-room consequence is unchanged: preserve
`office-interaction-v1`, `office-simulation-snapshot-v2`,
`office-simulation-trace-v2`, the four-layer ownership model, and the
`office-v2:world-kernel` hash-domain conventions. Reducer-produced replay
hashes, a migration registry, and uninterrupted-versus-restored execution
remain later T2 implementation evidence.

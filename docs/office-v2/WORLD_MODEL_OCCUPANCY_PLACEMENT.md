# World Model, Occupancy, and Placement

## World definition

A world definition is owned by one explicit building/floor reference and
contains a version, floor-local bounds, zones, static surfaces, and entities.
It never uses elevation as floor identity and never absorbs presentation-only
site context. A versioned world geometry definition is the single owner of
anchor basis, footprint, blocking occupancy, clearance, supported orientations,
world/sub-cell sockets, and use-slot geometry. Entity definitions reference
that geometry and own semantic kind, capabilities, and versioned interaction
and presentation references.

W1.2 fixes the geometry units and reference boundary. Footprint, blocking,
clearance, approach candidates, and waiting cells are definition-local cell
offsets. Socket and attachment positions are definition-local sub-cell offsets
under the four-units-per-cell projection contract. The geometry record declares
the supported cardinal orientations and their quarter-turn transform from the
north basis. No entity, interaction, asset, connectivity, animation, or render
part may author a second copy of those values.

The bundle closure key is `${kind}:${value}@${version}`. Every consumer points
to one exact key, and a bundle contains that key once. Closure is resolved after
stable sorting by key, so input array order cannot affect the result. A missing
key, wrong kind, mismatched version, duplicate key, unsupported orientation, or
duplicate geometry member fails before a world can be imported. Floor/building
topology is validated by W1.3; W1.2 validates the floor-local reference shape
but does not invent a floor.

World instances reference versioned definitions and own identity, floor-local
placement, orientation, and semantic tags. They do not copy or override
footprints, sockets, clearance, or use slots. Mutable simulation state and
derived presentation state are separate from both definitions and instances.

Zones describe meaning such as work, review, circulation, service, or quiet.
They do not alter coordinate mathematics.

## Footprints

Footprints are non-empty sets of relative ground cells. Rectangles are a compact
authoring option, not the only runtime form. Rotation is applied through a
tested transform before occupancy is calculated.

Placement validation checks:

1. every occupied cell is inside world bounds;
2. the supporting surface allows the entity category;
3. blocking footprints do not overlap;
4. required approach cells remain reachable;
5. zone and clearance rules pass;
6. the definition bundle closes every versioned geometry, interaction, and
   asset reference, and the asset declares compatibility with that geometry.

W1.2 adds the pre-placement checks that make those rules executable:

7. every entity definition has exactly one version-pinned geometry reference;
8. every interaction use-slot and socket reference resolves through that
   geometry record;
9. every animation, connectivity, render-part, character, and asset reference
   resolves to the declared family and version;
10. any permitted derived geometry projection agrees with authority after the
    declared cardinal transform and cannot add occupancy facts.

Decorative overhang may extend beyond a footprint, but it never silently adds
collision. Conversely, invisible clearance is declared explicitly.

## Placement result

Placement is a command that returns either a new immutable world snapshot or a
structured rejection. Required rejection codes include `out-of-bounds`,
`occupied`, `unsupported-surface`, `clearance`, `unreachable`, and
`missing-geometry`.

## Furniture composition

Connected furniture remains separate world entities unless the product rule
requires one compound interaction. Visual merging is resolved by neighbor data;
it does not erase footprint, identity, audit, or interaction ownership.

The V1 schemas repeat some spatial fields and remain frozen historical
evidence. W1.2 replaces those cross-contract copies with version-pinned
geometry references and rejects a V1 migration when the repeated values do not
agree or complete migration context is unavailable. Migration does not infer an
anchor, orientation, floor, or geometry version from array order, `worldId`,
elevation, or a generic `position` field.

The V1 world schema also lacks building and floor identity. W1.3 defines the
versioned envelope and V2 references. A V1 world without complete building,
floor, site, and portal migration context fails closed.

## Required evidence

- Rotation preserves cell count and expected anchor relation.
- Adding entities in a different order produces the same occupancy result.
- A rejected placement leaves the prior snapshot unchanged.
- Every occupied cell can report its owning entity.
- Interactions and assets cannot redefine authoritative geometry.
- Fixtures include edges, corners, overhang, clearance, and blocked approaches.
- Reordering every bundle collection preserves the resolved reference graph.
- A render-part dependency cycle and an asset occupancy mutation fail with
  stable `world.*` diagnostics before runtime admission.

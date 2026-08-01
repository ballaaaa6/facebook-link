# World Model, Occupancy, and Placement

## World definition

A world definition contains a version, bounds, zones, static surfaces, and
entities. A versioned world geometry definition is the single owner of anchor
basis, footprint, blocking occupancy, clearance, supported orientations,
world/sub-cell sockets, and use-slot geometry. Entity definitions reference
that geometry and own semantic kind, capabilities, and versioned interaction
and presentation references.

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
agree or complete migration context is unavailable.

## Required evidence

- Rotation preserves cell count and expected anchor relation.
- Adding entities in a different order produces the same occupancy result.
- A rejected placement leaves the prior snapshot unchanged.
- Every occupied cell can report its owning entity.
- Interactions and assets cannot redefine authoritative geometry.
- Fixtures include edges, corners, overhang, clearance, and blocked approaches.

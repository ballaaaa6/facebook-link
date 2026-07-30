# World Model, Occupancy, and Placement

## World definition

A world definition contains a version, bounds, zones, static surfaces, and
entities. Versioned entity definitions own footprint, clearance, supported
orientations, sockets, interaction IDs, and render metadata. World instances
reference those definitions and own identity, anchor, orientation, elevation,
and semantic tags.

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
6. the asset version and geometry metadata exist.

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

## Required evidence

- Rotation preserves cell count and expected anchor relation.
- Adding entities in a different order produces the same occupancy result.
- A rejected placement leaves the prior snapshot unchanged.
- Every occupied cell can report its owning entity.
- Fixtures include edges, corners, overhang, clearance, and blocked approaches.

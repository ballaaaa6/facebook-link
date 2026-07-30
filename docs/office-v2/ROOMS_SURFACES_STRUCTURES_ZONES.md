# Rooms, Surfaces, Structures, and Zones

## Spatial ownership

A room is a bounded collection of supporting floor cells, structural edges,
zones, and placed entities. Floors support placement. Walls, doors, and windows
live on cell edges rather than pretending to occupy an arbitrary sprite-sized
rectangle.

World axes and edge names come from `decisions/0001-projection-grid.md`.
Structural edges use the owner cell plus `north` or `west` so one physical edge
has one canonical identity. South and east edges normalize to the adjacent
cell's north or west edge.

## Surface contract

Each floor cell declares a surface kind, elevation, placement categories, and
traversal cost. A missing floor is not walkable and cannot support furniture.
Decorative floor graphics cannot alter these values.

## Structure contract

- Walls block traversal and may block placement clearance.
- Doors declare open, closed, locked, and unavailable semantic states.
- Windows never create an approach cell unless an interaction explicitly does.
- Structural sprites may have lower and upper render parts, but retain one
  structural identity.
- Cutaway state is derived from camera-facing edges and selection policy. It
  never deletes the wall from world state.

## Zones

Zones add meaning such as work, review, service, circulation, or quiet. They may
constrain placement or interaction policy, but they do not change coordinates,
projection, occupancy, or sprite depth.

## Required evidence

- Every structural edge normalizes to one identifier.
- A closed door blocks a path and an open door permits the same path.
- Removing a visual upper wall does not change navigation or placement.
- Overlapping zones resolve through an explicit priority rule or are rejected.
- Room fixtures cover edges, corners, door transitions, missing floors, and
  camera-facing cutaways.

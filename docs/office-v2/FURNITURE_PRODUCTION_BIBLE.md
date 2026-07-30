# Furniture Production Bible

## Family before sprite

A furniture family is a versioned contract containing semantic role, footprint,
anchor, clearance, interactions, render parts, orientations, connectivity,
asset provenance, and review evidence. A PNG without this definition is not a
runtime asset.

## Required production board

Every family board shows the world grid, footprint, anchor, ground contact,
sprite bounds, visual height, approach cells, actor sockets, held-item sockets,
lower and upper render parts, every required orientation, and every legal
connectivity mask.

## Connected furniture

- Neighbor compatibility uses family and version, never pixel similarity.
- Joined tops, hidden legs, end caps, corners, tees, and crosses are authored
  variants with identical contact geometry.
- A family may declare only a reviewed subset of arrangements; placement rejects
  unsupported arrangements instead of selecting the nearest-looking sprite.
- Rotation transforms footprint, sockets, and neighbor mask through the same
  canonical function.

## Scale and readability

Silhouette, world scale, material edges, top-surface thickness, and shadow
direction remain consistent across a family. Decorative overhang is allowed but
does not expand occupancy unless clearance explicitly declares it.

## First approved family

The first family is one workstation with isolated, left-end, middle, and
right-end east-west states, one seated interaction, and geometric placeholders
for every other state. Corners and four-way masks are added only when the product
slice requires them and the entire mask table is validated.

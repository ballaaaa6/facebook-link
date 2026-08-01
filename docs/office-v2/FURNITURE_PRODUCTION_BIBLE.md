# Furniture Production Bible

## Family before sprite

A furniture family is a versioned bundle that references one authoritative
world geometry definition and separately declares semantic role, interactions,
presentation parts, connectivity, asset provenance, and review evidence. The
geometry definition alone owns footprint, anchor basis, clearance,
orientations, sockets, and use slots. A PNG without the complete reference
bundle is not a runtime asset.

## Required production board

Every family board shows the referenced world grid, footprint, anchor basis,
approach cells, and sockets alongside the asset-owned sprite bounds, pixel
contacts, visual height, render parts, every required orientation, and every
legal connectivity mask. The board compares the two owners; it does not become
a third geometry source.

## Connected furniture

- Neighbor compatibility uses family and version, never pixel similarity.
- Joined tops, hidden legs, end caps, corners, tees, and crosses are authored
  variants with identical contact geometry.
- A family may declare only a reviewed subset of arrangements; placement rejects
  unsupported arrangements instead of selecting the nearest-looking sprite.
- Rotation uses the authoritative geometry transform for footprint and sockets;
  connectivity maps the neighbor mask without redefining that transform.

## Scale and readability

Silhouette, world scale, material edges, top-surface thickness, and shadow
direction remain consistent across a family. Decorative overhang is allowed but
does not expand occupancy unless clearance explicitly declares it.

## First approved family

The first family is one workstation with isolated, left-end, middle, and
right-end east-west states and one seated interaction. Geometric placeholders
for unsupported arrangements may appear only on labeled review boards; they are
not runtime variants. Corners and four-way masks are added only when the product
slice requires them and the entire mask table is validated.

Its local supported masks are exactly `0` (isolated), `2` (east neighbor), `8`
(west neighbor), and `10` (east-west middle). North, south, vertical-middle,
corner, tee, or cross arrangements fail as `connectivity.unsupported-mask`.
They cannot select a nearest-looking sprite or silently rotate an east-west
variant. A later family version and full evidence are required to add a mask.

Multipart workstation visuals use an acyclic render-part dependency graph.
Ordinary upper parts cannot jump every actor through the global `upper` band,
and no presentation part can change the workstation's authoritative geometry.

# Building, Floors, Exterior, and Portals

## Owner and version

This document owns the topology envelope for `office-building-topology-v1`.
Decision 0010 is the accepted ownership decision. The building is a topology
owner; it is not a persistent world kernel, a renderer scene, or a simulation
reducer.

The envelope contains a versioned building reference, independently versioned
floor-local world references, one presentation-only site envelope, and stable
portal relations. A floor can be addressed and serialized without loading a
different floor. A future floor is additive: it supplies its own world and
portal endpoint and does not renumber or rewrite an existing floor.

## Canonical topology shape

`schemas/building.schema.json` owns the data shape. The semantic validator in
`@affiliate-ops/office-v2-world` owns cross-record rules and stable diagnostics.
The schema deliberately does not widen the frozen V1 `world.schema.json` or
`surface-structure.schema.json`.

### Building

The `building` field is a version-pinned common V2 building reference. Its
version identifies the topology envelope, not a renderer revision. The
`floors` collection is an unordered set by floor identity; input order cannot
change validation output.

### Floor

Each floor entry contains:

- a positive-version common V2 `floor` reference;
- a separate positive-version floor-local `world` identity;
- `coordinateSpace: "floor-local"`;
- integer `bounds` with width, depth, and maximum in-floor elevation;
- a site-local `siteFootprint` used only to keep exterior context outside the
  interior composition envelope; and
- `identitySource: "declared"`.

`siteFootprint` is a composition relation, not an occupancy grid. Indoor
surfaces, blocking cells, pathfinding, facilities, and entities remain owned by
the floor-local world contract introduced by later world work. The validator
uses the footprint only to reject an exterior context cell that is authored in
the interior envelope.

Floor identity is the complete `{ id, version }` floor reference. The numeric
`elevation` inside a floor coordinate is height within that floor and cannot
select, name, or infer a floor.

### Site envelope

The building owns one versioned site envelope. `presentationOnly` is always
`true`. Its context cells may describe sidewalk, curb, road, planting,
street-furniture, or backdrop context. They are not floor surfaces, occupancy,
pathfinding cells, facilities, interaction targets, or simulation state.

The site envelope and floor `siteFootprint` use the explicit `site-cell`
coordinate space. A context cell that overlaps an interior footprint is
rejected with `world.exterior-interior-overlap`; no consumer may fix the issue
with a sprite offset or a second occupancy grid.

### Portal and endpoint

Portal and endpoint IDs are stable slugs with positive versions local to this
topology contract. They are not screen coordinates, array indexes, elevation
bands, or generated IDs. Every portal has:

- `ownerFloor`, which is the floor that owns the indoor endpoint;
- `direction`, one of `inbound`, `outbound`, or `bidirectional`;
- an owner-side `endpoint`; and
- an opposite-side `landing`.

An entrance endpoint is a floor endpoint and its landing is a site endpoint.
Its direction means travel relative to the floor: `inbound` is site to floor,
`outbound` is floor to site, and `bidirectional` permits both. A vertical
portal has two floor endpoints, the endpoint on `ownerFloor` and a landing on a
different declared floor. Its direction is always `bidirectional` in this
version; cross-floor routing and loading remain future behavior.

Floor endpoints carry a versioned floor-local cell coordinate whose embedded
floor reference must equal the endpoint owner. The coordinate must be inside
that floor's declared bounds and its elevation must not exceed
`maxElevation`. Site endpoints carry a site-cell coordinate whose site
reference must equal the building's site envelope.

The endpoint and landing are both required even when a future link is reserved.
An unresolved vertical core is represented by room/scene data later; it is not
represented by a half-formed portal.

## Semantic invariants

The validator enforces these topology rules before a world can be imported:

1. The building reference is present and every floor reference is exact,
   positive-version, and unique by floor identity.
2. Every floor has an independent world identity and floor-local coordinate
   declaration. The same local cell coordinates may occur on different floors.
3. The site envelope is presentation-only and its context cells do not overlap
   any floor site footprint.
4. Every portal has an owner floor, endpoint, landing, stable IDs, and positive
   versions. Endpoint IDs are unique across the envelope.
5. Entrance and vertical endpoint kinds match their portal topology. A vertical
   landing must resolve to a different declared floor.
6. Portal direction agrees with the portal kind. Vertical links are
   bidirectional; entrance directions are interpreted relative to the owner
   floor.
7. Floor endpoint references, embedded coordinate references, and bounds agree.
8. Floor identity is never inferred from elevation, `worldId`, array position,
   or the frozen V1 structure kind `floor`.
9. A V1 migration is accepted only with building, floor, site, bounds, and
   complete portal context. Missing context fails closed.

Diagnostics are stable and include a JSON pointer plus typed context:

| Code | Meaning |
| --- | --- |
| `world.floor-duplicate` | A building declares one floor identity more than once. |
| `world.portal-duplicate` | A topology envelope repeats a portal identity. |
| `world.portal-endpoint-duplicate` | Endpoint identity is repeated. |
| `world.portal-endpoint-missing` | A portal has no owner-side endpoint. |
| `world.portal-landing-missing` | A portal has no opposite-side landing. |
| `world.portal-direction-mismatch` | Direction, endpoint ownership, or portal kind disagrees. |
| `world.portal-floor-missing` | A floor endpoint or vertical landing does not resolve. |
| `world.portal-endpoint-out-of-bounds` | A floor endpoint is outside its floor-local bounds. |
| `world.exterior-interior-overlap` | Presentation-only site context overlaps a floor footprint. |
| `world.elevation-floor-inference` | Floor identity is marked or derived from elevation. |
| `contract.migration-context-missing` | A V1 migration lacks required topology context. |
| `contract.migration-reference-conflict` | Migration context disagrees with the current envelope. |

## Valid and rejected evidence

`fixtures/building-topology-one-floor.json` proves an independently addressable
ground floor and an entrance to presentation-only site context.

`fixtures/building-topology-two-floors.json` adds a second independently
versioned floor and a bidirectional stair portal. Its ground-floor reference,
world identity, bounds, site footprint, entrance endpoint, and local entity
coordinates remain byte-for-byte the same as the one-floor envelope.

The invalid topology fixtures each exercise one stable rejection: duplicate
floor, missing endpoint, missing landing, vertical direction mismatch,
exterior/interior overlap, elevation-as-floor inference, and incomplete V1
migration context. Schema validation proves the shape; the pure topology
validator proves the cross-record rule.

## Migration and later work

The current V1 world and surface/structure files remain historical evidence.
They are not widened or rewritten. A migration may enter this topology only
when it supplies explicit building and floor references, site relation, bounds,
and complete portal context, followed by reference closure. It never derives a
floor from `worldId`, elevation, a V1 `floor` structure, or an array position.

This contract does not implement persistence, cross-floor routing, camera
rendering, occupancy, or second-floor gameplay. Later world and scene work
consumes the accepted envelope through versioned references.

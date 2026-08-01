# Decision 0010 — Building, Floor, Site, and Portal Ownership

- Status: accepted
- Date: 2026-08-01
- Owners: contracts, world, projection, presentation, and asset pipeline

## Context

The product target includes one independently addressable ground floor, bounded
street context, an entrance, and a future vertical core. V1 world data has no
building or floor identity, while the V1 surface/structure schema permits a
`floor` structure kind. Without one topology owner, elevation, surfaces, site
art, and portal placement could each become a competing floor model.

## Options considered

- Treat elevation bands in one world as floors: compact initially, but breaks
  floor identity, loading, saves, bounds, and future portal routing.
- Put the interior and street in one occupancy grid: easy to compose visually,
  but admits presentation context into indoor navigation and placement truth.
- Reference independent floor-local worlds from a building and keep the site
  envelope presentation-only: explicit versioning with stable expansion paths.

## Decision

Adopt topology ownership version `office-building-topology-v1`.

- A versioned building definition owns building identity, version-pinned floor
  references, the site-envelope reference, and links between declared portal
  endpoints.
- Each floor is an independently versioned floor-local world with its own
  identity, bounds, geometry, structures, zones, entities, and load/save unit.
  Coordinates may repeat on different floors because the floor reference is
  part of identity. Elevation is height inside a floor and never identifies it.
- The site envelope owns sidewalk, curb, road, planting, exterior dressing, and
  backdrop references. These are presentation-only in V1 of this topology and
  cannot become floor surfaces, occupancy, pathfinding, facility capacity,
  interaction targets, or simulation state.
- Floor 1 owns the interior entrance geometry, the entrance portal, and its
  stable indoor endpoint. The building/site relation references that portal for
  composition without authoring a second indoor endpoint.
- Every entrance or vertical link uses stable portal and endpoint identifiers,
  explicit owner floor references, directionality, and version compatibility.
  Screen coordinates, array indexes, and elevation cannot identify endpoints.
- A future floor supplies its own endpoint. The building link relates the two
  versioned endpoints without changing either floor's local coordinates or
  existing entity identities.

W1.3 will introduce the building/floor/site envelope and portal contracts and
will reserve explicit V2 world and surface/structure references. The W1.5 scene
compiler remains responsible for emitting accepted `office-world-v2` output.

`world.schema.json` and `surface-structure.schema.json` remain frozen V1
evidence. In particular, the V1 `floor` structure kind is not a building-floor
model and is not copied into V2. A V1 migration must receive building ID and
version, floor ID and version, bounds, site relation, and complete portal
context. Missing or contradictory context rejects migration; elevation,
`worldId`, or a `floor` structure is never guessed into a floor identity.

## Consequences

The ground floor can be loaded, saved, rendered, and later linked without
renumbering its local world. Presentation can show a street around it without
making that street walkable or authoritative. Cross-floor routing, floor
switching, and second-floor gameplay remain future work and cannot be inferred
from this topology envelope.

This decision ratifies ownership only. It does not create schemas, compile a
floor, implement portals, admit exterior assets, or start persistent runtime
behavior.

## Evidence

`FIRST_FLOOR_BRIEF.md`, `WORLD_MODEL_OCCUPANCY_PLACEMENT.md`,
`ROOMS_SURFACES_STRUCTURES_ZONES.md`, and `SAVE_SNAPSHOT_MIGRATION.md` own the
canonical rules. W1.3 will add one-floor and future two-floor envelope fixtures
plus duplicate-floor, missing-endpoint, direction-mismatch,
exterior-interior-overlap, elevation-as-floor, and incomplete-migration
rejections.

# Decision 0009 — World Geometry Is the Single Spatial Authority

- Status: accepted
- Date: 2026-08-01
- Owners: contracts, world, simulation, presentation, and asset pipeline

## Context

The V1 entity, interaction, asset, and connectivity contracts can each carry
footprints, anchors, sockets, approaches, orientations, or render facts. They
validate independently, so two individually valid records can disagree about
the cells an entity occupies or the point an actor uses. Persistent placement,
interaction, art production, and rendering require one versioned spatial owner.

## Options considered

- Let every consumer author the geometry it needs: locally convenient, but
  disagreement is detectable only after placement or visual integration.
- Let asset manifests own all geometry: aligns pixels easily, but makes
  occupancy and interaction truth depend on presentation material.
- Use one world geometry definition with versioned references and validate
  presentation projections against it: separates truth from pixels and fails
  conflicts before runtime.

## Decision

Adopt geometry ownership version `office-geometry-authority-v1`.

A versioned world geometry definition is the sole author of:

- anchor basis and orientation transforms;
- footprint, blocking occupancy, and clearance cells;
- supported world orientations;
- world-cell and sub-cell sockets;
- use-slot geometry, including approach candidates, waiting cells, required
  world facing, and actor or held-prop socket references.

Interactions reference geometry-owned use-slot and socket identifiers. They own
behavioral semantics such as preconditions, duration, capacity policy,
cancellation, and result events, but they do not copy approach cells, facings,
or socket coordinates.

Asset and presentation contracts reference the authoritative geometry version.
They own only pixel and composition facts: canvas and frame bounds, sprite
origin, pixel ground/depth contacts, pixel attachment contacts, trimming,
semantic visual variants, and render-part dependencies. A pixel contact may be
a validated projection of a geometry socket; it is never a second world socket.
Render parts and connectivity variants cannot change occupancy, clearance,
navigation, reservations, or use-slot geometry.

A placed entity instance owns a stable identity and version-pinned definition
reference. Spatially it supplies only floor-local placement and a supported
orientation. Mutable simulation state and derived presentation state remain
separate records.

W1.2 will introduce `geometry.schema.json`,
`definition-bundle.schema.json`, and `entity-instance.schema.json`, plus one
reference-closure and geometry-agreement linter. Geometry changes create a new
geometry and definition version; consumers cannot follow an unversioned
`latest` alias.

The V1 entity, interaction, asset, connectivity, and common schemas and their
fixtures remain frozen. A future V1 migration must have complete versioned
context and prove that every repeated spatial fact agrees with the selected
authority. Any conflict or missing context rejects migration; no field wins by
file order and no value is inferred.

## Consequences

World placement and interaction remain usable without PNG files, and art can be
re-exported without altering simulation truth. Producers must resolve geometry
references before runtime admission. Some V1 records intentionally retain
duplicated fields as historical evidence and are not accepted as V2 authority.

This decision ratifies ownership only. It does not add the W1.2 schemas,
generated types, linter, definition bundles, runtime assets, or engine behavior.

## Evidence

`WORLD_MODEL_OCCUPANCY_PLACEMENT.md`,
`ACTORS_NAVIGATION_INTERACTIONS.md`,
`ASSET_PIPELINE_PROVENANCE_VALIDATION.md`, and the production bibles own the
canonical split. W1.2 will supply valid definition bundles plus dangling
reference, geometry-conflict, missing-socket, invalid-orientation, and
render-part-occupancy rejection evidence.

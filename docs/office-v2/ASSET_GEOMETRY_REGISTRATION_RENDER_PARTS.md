# Asset Geometry Registration and Render Parts

## Purpose and ownership

This document owns the presentation-side contract between a versioned asset
family and the authoritative V2 world geometry. It does not create a second
owner for footprint, clearance, use slots, navigation occupancy, or world
orientation transforms.

The contracts are versioned independently:

| Contract | Owner | Owns | Must not own |
| --- | --- | --- | --- |
| `geometry.schema.json` | world | footprint, clearance, anchor basis, world sockets, use slots, orientation transforms | pixels, atlas rectangles, visual variants |
| `asset-family-v2.schema.json` | asset pipeline | family identity, exact geometry/style/source references, frame and part references | occupancy or interaction geometry |
| `sprite-frame.schema.json` | asset pipeline | canvas/frame bounds, sprite origin, pixel contacts, visual height, trimming policy | world footprint, clearance, world sockets |
| `render-part.schema.json` | presentation composition | parent attachment, pixel depth contact, sibling order, pick owner, hit/alpha policy | simulation state or world placement |

Every presentation record carries exact positive versions for the records it
consumes. `latest` is never a valid reference. A changed viewpoint, native
scale, contact convention, or geometry relationship creates a new family or
contract version.

## Sprite frame registration

A sprite frame records:

- the family, geometry, style profile, and declared world-facing references;
- canvas dimensions and frame bounds in `sprite-pixel` space;
- the sprite origin, pixel ground contact, and optional pixel depth contact;
- visual height and the declared alpha/trimming policy;
- exact render-part references and a semantic pick owner.

Frame contacts are measured presentation facts. A neutral geometry board compares
them with the referenced world geometry after the declared orientation transform;
it never promotes a pixel measurement into world truth. V1 trimming is
`forbidden`; a later schema version must explicitly define trimming invariance
before any trimmed frame is accepted.

## Render-part graph

Multipart entities use `office-render-parts-v1`. A part declares its coordinate
space, parent attachment, optional geometry socket reference, depth-contact
mode, stable sibling order, semantic pick owner, and hit/alpha policy. Parent
and dependency edges form one presentation-only directed acyclic graph.

The graph is evaluated before composition. A cycle fails with
`world.render-attachment-cycle`; a duplicate sibling order in one parent fails
with `asset.render-part-sibling-order`; and a part that declares footprint,
clearance, use-slot, blocking, or navigation fields fails with
`world.asset-occupancy-forbidden`. Splitting a sprite never creates another
world entity or interaction owner.

The default `world` render band remains the interleaving space for actors and
ordinary furniture. Tall objects, structures, glass, cutaways, and effects use
explicit policies and dependencies. An ordinary upper part cannot jump every
actor merely by naming the global `upper` band.

## Character and furniture composition

Characters, furniture, held props, and facility visuals remain separate
versioned references. A seated workstation composite joins a character frame,
workstation frame, interaction socket, and render-part graph; it does not copy
the workstation footprint or move the actor with a scene-specific pixel offset.

Connectivity variants select only an approved family/version/mask combination.
The proof workstation supports masks `0`, `2`, `8`, and `10`; north/south and
corner requests fail with `connectivity.unsupported-mask`.

## Evidence and migration

The Phase 1 specification fixture proves:

- valid frame/part registration and geometry-reference closure;
- an actor crossing in front of and behind a tall object through depth metadata;
- seated workstation ownership and pixel contact tolerance;
- wall, door, window, glass, cutaway, and effect policy references;
- trimming rejection, asymmetric-facing rejection, forbidden occupancy fields,
  and render-part cycle rejection.

An asset-family migration must name the source and target versions, preserve the
geometry reference or explicitly require a new geometry review, map every
variant/frame, and state its rejection effect. Missing context, incompatible
geometry, or an unsupported semantic variant fails closed; no old family,
fallback pixel, or scene-specific correction is selected.


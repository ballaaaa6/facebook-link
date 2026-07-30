# Connectivity and Automatic Variants

## Purpose

Connectivity changes presentation when compatible furniture or structure pieces
touch. It does not modify occupancy after placement and it does not infer game
meaning from similar-looking pixels.

## Compatibility

An entity declares a connectivity family, supported directions, orientation,
and optional endpoint role. Only compatible family and version combinations can
connect. A desk does not connect to every desk-shaped object.

For four orthogonal directions, a deterministic bit mask is assigned:

```text
north = 1, east = 2, south = 4, west = 8
```

The resolved mask selects an approved variant such as isolated, end, middle,
corner, tee, or cross. Diagonal and multi-height families require a separately
versioned resolver.

## Variant requirements

- Geometry and sockets remain aligned across variants.
- Hidden legs, joined tops, seams, and corners are authored states, not crops
  performed in UI components.
- Missing required masks fail validation.
- A family may intentionally reject arrangements it cannot depict correctly.
- Neighbor changes invalidate only affected entities and direct neighbors.

## Authoring gate

Every connected family includes a contact sheet with all legal masks, one world
fixture that exercises transitions, and metadata proving equal anchor, scale,
and contact geometry. The first family supports only the masks required by the
approved product slice.

## Required evidence

- Resolution is independent of entity insertion order.
- Adding and removing one neighbor restores the original variant.
- Rotation maps masks and sockets consistently.
- The connected-desk fixture rejects an incomplete variant table.
- Presentation changes never erase world entity identity.

# Decision 0008 — Coordinate and Facing Semantics

- Status: accepted
- Date: 2026-08-01
- Owners: contracts, world, projection, presentation, and asset pipeline

## Context

The V1 foundation contracts use a generic integer `position`, while the
canonical documents distinguish whole-cell placement, four-unit sub-cell
movement, local geometry, sprite-canvas pixels, and projected screen pixels.
The simulation also stores world-cardinal facings while the character
production target names the four diagonal-looking screen facings. Persistent
contracts cannot begin while either distinction is implicit.

## Options considered

- Keep one structural position type and infer its meaning from the consumer:
  compact, but it permits cross-space values and makes migrations guess intent.
- Store screen-facing names in simulation: convenient for current art, but it
  couples world truth to one projection and mirror policy.
- Use distinct coordinate spaces and a versioned facing transform: more
  explicit, but preserves world, projection, and presentation ownership.

## Decision

Adopt coordinate semantics version `office-coordinate-semantics-v1`.

- `CellPosition` is an integral floor-local occupancy and placement value.
- `SubCellPosition` is an integral floor-local movement value using exactly
  four sub-cell units per cell under `office-projection-v1`.
- Definition-local geometry, sprite-canvas pixels, and projected screen pixels
  are separate coordinate spaces. A field from one space is not accepted in
  another without a named transform.
- Building and floor identity travel in versioned owning references or
  envelopes; elevation is not a floor identifier.
- Simulation and interaction truth use `WorldFacing` values `north`, `east`,
  `south`, and `west`.
- Under `office-projection-v1`, the presentation transform is fixed:

  | World facing | Screen facing |
  | --- | --- |
  | `north` | `north-east` |
  | `east` | `south-east` |
  | `south` | `south-west` |
  | `west` | `north-west` |

- Mirroring is explicit presentation metadata. It may select or reflect an art
  frame, but it never changes the world-facing value or this mapping.

`schemas/common.schema.json` and every V1 contract that references its generic
`position` remain frozen historical contracts. W1.1 will introduce
`common-v2.schema.json` and generated branded TypeScript rather than widening
or reinterpreting V1. No V1 position is migrated by inference. A future
migration must receive complete form version, floor identity, coordinate-space
kind, and projection context or reject the input.

## Consequences

World and simulation contracts remain projection-independent, while art can
name the diagonal-looking facings it actually presents. Producers must perform
named conversions at layer boundaries. Existing V1 fixtures retain their
original meaning only inside their V1 contracts and do not prove the new type
separation or facing transform.

This decision ratifies ownership but does not implement V2 schemas, generated
types, transforms, or persistent world behavior. Those remain W1.1 work.

## Evidence

`WORLD_COORDINATES_PROJECTION_CAMERA.md`, `GLOSSARY_AND_INVARIANTS.md`,
`CHARACTERS_ANIMATION_HELD_PROPS.md`, and `CHARACTER_PRODUCTION_BIBLE.md` own the
canonical vocabulary. Decision 0001 owns the projection axes. W1.1 will add
`common-v2.schema.json`, four-direction transform fixtures, schema rejection,
and compile-time cross-space rejection evidence.

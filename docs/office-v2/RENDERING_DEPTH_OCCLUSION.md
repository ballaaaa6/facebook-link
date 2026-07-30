# Rendering, Depth, and Occlusion

## Render bands

The initial coarse order is:

1. floor surfaces;
2. ground markings and flat shadows;
3. world bodies, including actors, ordinary furniture, and lower object parts;
4. upper object parts and structural occluders;
5. world effects;
6. screen-space labels and controls.

A production asset declares one allowed band per render part. Actors and
ordinary furniture share the `world` band so their projected ground contacts can
interleave. Objects are split into lower and upper parts only when one depth key
cannot represent the required visibility.

## Deterministic depth

Depth is derived from projected ground contact, elevation layer, band, and a
stable entity identifier. Array insertion order, React mount order, network
arrival order, and filename order are not valid tie-breakers.

Visual height changes sprite bounds but not ground contact. Elevation changes
projection and depth inputs but not footprint dimensions.

## Occlusion policy

- Opaque sprites occlude only through their rendered alpha and depth order.
- Structural cutaways are explicit presentation states with deterministic rules.
- Actor readability may use an outline or fade policy, never a false world move.
- Labels are screen-space UI and cannot determine scene depth.
- Transparency does not grant collision or interaction behavior.

## Review fixtures

The canonical review board covers two actors crossing, an actor in front of and
behind a tall object, overhanging furniture, equal ground-contact ties, multiple
elevations, and viewport cropping.

## Required evidence

- Sorting the same entities from every input permutation gives one result.
- Golden fixtures document intentional visibility at ambiguous contacts.
- Split sprites preserve one semantic entity and one interaction owner.
- Reduced-motion mode produces the same depth result.
- No component fixes an occlusion defect with an unregistered CSS offset.

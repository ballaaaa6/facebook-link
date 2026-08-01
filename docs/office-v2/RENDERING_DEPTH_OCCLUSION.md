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

Decision 0013 removes `upper` as a universal multipart solution. Ordinary tall
or overhanging furniture uses explicit render parts with registered depth
contacts and dependencies so an actor in front is not covered merely because a
part is named upper. The dependency graph must be acyclic, and every part keeps
one semantic entity and pick owner.

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

Structures, glass, cutaway parts, effects, and tall furniture use separate
declared policies. Structure cutaway never changes collision. Glass declares
transparency, structural state, picking, and dependencies. Effects attach
without becoming world truth. Render parts and their bands cannot modify
occupancy, sockets, use slots, navigation, reservations, or simulation state.

The V1 `depth-occlusion.json` upper-part example is frozen bounded evidence. It
does not prove general multipart occlusion. W4.2 adds dependency-cycle,
actor-crossing, structure, glass, cutaway, effect, and tall-object fixtures.

## Review fixtures

The canonical review board covers two actors crossing, an actor in front of and
behind a tall object, overhanging furniture, equal ground-contact ties, multiple
elevations, and viewport cropping.

## Required evidence

- Sorting the same entities from every input permutation gives one result.
- Golden fixtures document intentional visibility at ambiguous contacts.
- Split sprites preserve one semantic entity and one interaction owner.
- Render-part dependency graphs reject cycles and retain a stable sibling order.
- Reduced-motion mode produces the same depth result.
- No component fixes an occlusion defect with an unregistered CSS offset.

# Input, Picking, and Debug Overlays

## Input boundary

Pointer, keyboard, and touch input become semantic intents such as inspect,
focus, pan, zoom, or propose action. DOM or canvas events never mutate world
state directly.

## Picking order

1. Convert the pointer through the inverse camera transform.
2. Use `unprojectGround` and its documented half-open edge policy.
3. Query spatial candidates for the resulting cell and neighboring overhangs.
4. Resolve candidates by registered hit shape, render band, depth key, then
   stable entity identifier.
5. Return an inspect intent. A mutation still requires a simulation command or
   an audited operations proposal.

Transparent pixels may refine visual picking only when a validated alpha mask is
available. They do not replace the world-space candidate query.

## Camera controls

Pan and zoom are bounded. Keyboard controls and fit-to-world are available
without a pointer. Gesture interpolation may be smooth, but the settled camera
uses tested zoom stops and the shared pixel-snapping policy.

## Debug overlays

Development builds can display cells, footprints, clearance, structural edges,
anchors, ground contacts, sockets, reservations, routes, render bands, depth
keys, hit shapes, and stale adapter state. Overlays read published snapshots and
cannot repair or mutate them.

## Required evidence

- Edge and tie picking cases are deterministic.
- Keyboard selection exposes the same semantic inspector data as pointer input.
- Debug overlays can be disabled without changing a state trace.
- A picked but unavailable action remains disabled by operations policy.

# Office Engine V2 Foundations

## 1. Separate the four systems

The engine has four one-way layers:

1. **World model** — stable identities, coordinates, footprints, anchors,
   occupancy, zones, and static definitions.
2. **Simulation** — time, actor intent, path following, tasks, interactions,
   queues, and deterministic state transitions.
3. **Projection** — the mathematical conversion from world position and
   elevation to screen position and depth keys.
4. **Presentation** — sprites, animation clips, lighting, camera, input feedback,
   labels, sound cues, and accessibility overlays.

If a visual offset is needed to repair navigation or interaction logic, the
layers are already mixed. A sprite may have a visual origin offset, but its
world footprint and interaction sockets stay independent.

## 2. Coordinate and projection knowledge

The implementation must define these values once and test them:

- World axes, origin, unit, tile size, elevation unit, and legal precision
- Projection and inverse projection for pointer picking
- Camera position, zoom limits, viewport fitting, and pixel snapping policy
- Footprint origin, sprite origin, ground-contact point, and interaction sockets
- Screen-space depth key with a deterministic stable tie-breaker

Start with integer world cells and fixed sub-cell units. Floating-point screen
coordinates are allowed only after projection. Never store screen pixels as
authoritative positions.

For an isometric candidate, the initial mathematical prototype may use:

```text
screenX = originX + (worldX - worldY) * halfTileWidth
screenY = originY + (worldX + worldY) * halfTileHeight - elevation * elevationHeight
```

This equation is a hypothesis to test with a no-art fixture, not permission to
hard-code placement offsets throughout components.

## 3. Deterministic simulation knowledge

- Advance state with a fixed logical tick independent from display frame rate.
- Treat wall-clock time, random values, and external event arrival as injected
  inputs that can be recorded and replayed.
- Represent actor behavior as explicit states and commands, not chained UI
  timers or animation callbacks.
- Give every command an identifier and make duplicate application harmless.
- Serialize a complete small-scene snapshot for test fixtures and bug reports.

The first actor state machine needs only `idle`, `planning`, `moving`,
`interacting`, and `blocked`. More states are added only when a visible behavior
requires them.

## 4. Navigation and occupancy knowledge

- Use a navigation grid or graph derived from world footprints.
- A path planner chooses a route; a movement system follows it. Keep those jobs
  separate.
- Reserve destination and interaction cells explicitly when concurrent actors
  are introduced.
- Define whether diagonal travel is allowed and prevent corner cutting.
- Re-plan only on relevant world changes, not every rendered frame.
- Surface unreachable targets as a state the UI can explain.

The first slice uses A* over a small deterministic grid. Crowd avoidance and
local steering are later concerns.

## 5. Depth and composition knowledge

- Sort by the projected ground-contact point, then elevation layer, then stable
  entity identity.
- Split tall or overhanging objects only when one depth key cannot represent the
  required occlusion.
- Keep floors, ground objects, actors, upper object parts, effects, and UI in
  explicit render bands.
- Derive responsive camera behavior from the world bounds. Do not resize the
  world to fit a phone screen.
- Validate the scene at target viewport sizes with screenshots and geometric
  assertions.

## 6. Interaction knowledge

Every interactable object declares:

- Footprint and blocking cells
- One or more approach cells
- Facing direction at each approach
- Actor socket and optional held-item socket
- Preconditions, duration, cancellation rule, and resulting event
- Visual state name independent from the simulation state name

Actors interact through these sockets. They are never positioned by an
object-specific CSS transform.

## 7. Animation knowledge

- Animation clips are data: frames, timing, loop mode, events, and facing.
- Simulation chooses semantic state; presentation chooses the matching clip.
- Rendering frame rate must not change movement speed or task completion time.
- Frame events may request sound or effects but may not commit operational state.
- Idle variation uses seeded randomness so tests can replay it.

## 8. Asset-production knowledge

Each original asset family requires:

- Source identifier, author/tool, creation date, license status, and source hash
- Canvas, pixel density, palette, viewpoint, and transparency rules
- World footprint, sprite origin, contact point, sockets, and render band
- Extraction recipe with no destructive overwrite of the source
- Dimension, alpha, edge, naming, duplicate, and provenance checks
- A neutral geometry board before any populated scene review

Create one family at a time. Prove a single workstation or facility end to end
before producing a large sheet. Character identity, furniture, held items, and
effects remain separate layers.

## 9. Product and operations knowledge

The visual engine consumes a small adapter snapshot containing stable agent ID,
display status, current task, progress, last update, and optional command
availability. It does not depend on storage tables or connector payloads.

Operational state changes only through existing audited commands. Clicking an
agent or object may inspect state or propose an action; it cannot bypass review,
feature flags, idempotency, or connector policy.

## 10. Verification knowledge

Required test categories:

- Unit: projection round-trips, depth keys, footprints, sockets, state machines
- Property: coordinate bounds, path legality, stable sorting, replay determinism
- Fixture: serialized scene input produces the same state trace
- Visual: approved screenshots at desktop, tablet, and phone widths
- Interaction: pointer picking, camera controls, reachable and blocked targets
- Performance: actor count, draw calls, texture memory, tick time, and frame time
- Accessibility: keyboard access to non-spatial controls, reduced motion, labels,
  contrast, and usable zoom

A screenshot that looks good is evidence for presentation only. It does not
replace world, simulation, or interaction tests.

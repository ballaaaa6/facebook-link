# Office Facility Refrigerator R01 Production

Status: F8 owner-approved

Revision: `r01-production-r01`

Authority:
`assets/game/manifests/office-facility-refrigerator-r01-production.json`

Builder:
`scripts/build-office-facility-refrigerator-r01-production.py`

Checker:
`scripts/office-facility-refrigerator-r01-production-check.mjs`

## Authority and stop

The owner approved the exact Refrigerator R01 visual and motion preflight
hashes on 2026-07-30. Production consumes only those approved pixels. It does
not generate, repair, redraw, rotate, or recrop the refrigerator.

The owner approved this exact production revision and its fifteen review
hashes on 2026-07-30:

- F8 is `passed`;
- the reservation slot contribution is one;
- Facility v1 is `18/20`; and
- F9-F10 remain blocked.

The preflight manifest, its ten approved review hashes, the source part hashes,
and every copied production part are checked before any output is accepted.
A changed preflight byte fails the build.

## F4 modular production

Production owns eleven processed PNG files:

- four authoring parts;
- four runtime parts; and
- three runtime composites.

The exact formula remains:

```text
immutableShell + lowerDoor[state]
```

The child states are `door-closed`, `door-half`, and `door-open`. The finite
transition is:

```text
closed -> half -> open -> half -> closed
```

This is an invoked action, not an ambient seam loop. Every adjacent transition
changes visible pixels, all changed pixels stay inside
`[14,38,89,124]`, and the final closed endpoint is the exact starting
composite. Shell, pivot, footprint, collision, and sort geometry do not move.

## F5 geometry, route, and sockets

| Contract | Value |
| --- | --- |
| Physical scale | `2 x 2 x 4` tiles |
| Floor footprint | `2 x 2` tiles |
| Render box | `3 x 4` tiles |
| Runtime canvas | `96 x 128` pixels |
| Base and sort pivot | `[48,124]` |
| Interaction root | `[48,124]` |
| Output socket | `[49,76]` |
| Stand | `[1,2]` |
| Front approach | `[1,3]` |
| Exit | `[2,3]` |
| Capacity | one actor |

Placement uses the existing I01 formula:

```text
worldRoot - actorFrameRootSocket
```

The route has zero footprint collisions. It uses integer coordinates, no
per-character facility offset, no magic offset, and no missing-socket
fallback.

## Existing I01/H01 handoff

Production reuses:

- I01 `interact-front`;
- H01 `held.water-bottle`; and
- H01 `held.yogurt-box`.

It does not create a new hand, mask, grip, socket, coordinate system, or
facility-specific held prop. The attachment-parent sequence is:

```text
facility.output.primary
-> actor.hand.primary.grip
-> none
```

Every held overlay uses:

```text
propOrigin = actor.hand.primary.grip - prop.visualCenterSocket
attachmentDelta = [0,0]
```

All props are complete `front-overlay` children. Production uses zero
foreground hand masks.

Selection uses:

```text
(stable-hash(actorId|slotId) + visitIndex) % pool.length
```

The prop is selected once at visit start, stays stable through every frame,
and alternates across consecutive visits for the two-item pool.

## F6 roster validation

The base matrix contains:

- 18 characters;
- six `interact-front` frames per character;
- 108 base pose cases;
- zero root-alignment failures;
- zero pivot failures;
- zero route failures; and
- zero per-character facility offsets.

The held-prop matrix contains:

- 18 characters;
- three visible held frames;
- two H01 props;
- 108 prop-overlay cases;
- zero attachment failures;
- zero clipped-prop cases;
- zero foreground-mask uses;
- zero magic offsets; and
- zero fallback sockets.

Together the production batch validates 216 cases. Character pixels retain
their `pendingCommercialReview` status.

## Thirty-second capacity-one proof

One logical instance, `refrigerator-01`, owns one reservation. The deterministic
30-second two-user scenario proves:

- actor A reserves successfully;
- actor B receives one blocked attempt;
- actor A fails before pickup;
- the facility output is removed and the door reverses to closed;
- the reservation releases after failure;
- actor B retries successfully;
- the selected prop stays stable through output and handoff;
- the door closes before the prop is removed;
- actor B releases normally;
- actor A begins a second visit and receives the alternating prop;
- an interruption after pickup closes the door before release;
- the held prop is removed before departure;
- maximum concurrent reservations never exceed one;
- all routes have zero collisions; and
- second 30 has no reservation or attached prop.

The proof records one blocked attempt, one interaction failure, three releases,
one successful retry, one before-pickup interruption, and one after-pickup
interruption.

## F8 review package

1. `01-approved-preflight-hash-lock.png`
2. `02-clean-closed-half-open.png`
3. `03-production-parts-alpha.png`
4. `04-geometry-footprint-pivot-swing.png`
5. `05-finite-transition-proof.png`
6. `06-routes-sockets-handoff.png`
7. `07-roster-108-cases.png`
8. `08-prop-overlay-108-cases.png`
9. `09-water-yogurt-closeups.png`
10. `10-selection-stability-alternation.png`
11. `11-interruption-before-after-pickup.png`
12. `12-two-user-reservation-30s.png`
13. `refrigerator-r01-production-water.gif`
14. `refrigerator-r01-production-yogurt.gif`
15. `refrigerator-r01-production-two-user.gif`

The files live under:

`assets/art/layout-references/office-facility-family-v1/refrigerator-r01-production/`

The manifest records every review hash, image size, GIF frame count, and frame
duration. Its owner decision locks all fifteen paths and hashes.

## Reproduction and validation

```bash
npm run art:facility:refrigerator:r01:production
npm run art:facility:refrigerator:r01:production:rebuild:check
npm run art:facility:refrigerator:r01:production:check
```

The builder owns the production processed directory and F8 review directory.
Rebuild validation compares the complete deterministic byte set without
rewriting it.

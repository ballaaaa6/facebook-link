# Office Facility Server Rack N02 Production

Status: F4-F7 passed; awaiting owner review at F8

Server Rack N02 production revision `n02-production-r01` consumes only the
exact owner-approved N02 preflight pixels. It adds deterministic part, socket,
route, roster, and two-instance reservation evidence without creating new
images, reusing N01, or importing the family into a room.

## Authority and stop

The preflight visual shape and its eleven exact review hashes were approved on
2026-07-30. Production checks those hashes before producing any output. A
missing or changed hash fails the build.

This revision passes F4-F7 and stops at F8 owner review:

- Facility v1 remains `15/20`;
- both planned server slots remain inactive;
- F9 remains blocked;
- F10 and Active Office promotion remain blocked.

If the owner approves the exact production evidence at F8, the two independent
capacity-one instances will contribute two slots and the Facility v1 readiness
target becomes `17/20`.

## F4 modular parts

The production output owns exactly twenty processed PNGs:

- four authoring and four runtime orientation shells;
- four authoring and four runtime status frames;
- four runtime front composites.

The front animation formula is:

`immutableShell[front] + statusViewport[n]`

The A-B-C-D-A loop runs at `220 ms` per frame. Shell changes,
outside-viewport changes, pivot drift, and closure mismatch are all zero. Left,
right, and back stay static.

## F5 geometry, sockets, and routes

| Contract | Value |
| --- | --- |
| Physical scale | `2 x 2 x 4` tiles |
| Footprint | `2 x 2` tiles |
| Render box | `3 x 4` tiles |
| Runtime canvas | `96 x 128` |
| Base and sort pivot | `[48,124]` |
| Semantic action | `inspect-front` |
| Visual pose | I01 `interact-front` |

Front, left, right, and back each declare their footprint, stand, approach,
exit, interaction root, inspect target, and route. Placement uses:

`worldRoot - actorFrameRootSocket`

There are no fractional coordinates, per-character offsets, magic offsets, or
missing-socket fallbacks. All four routes have zero footprint collisions.

## Empty-hand interaction

The rack never creates or attaches a tablet, controller, or other held prop.
There is no H01 dependency and no handoff timeline. Every roster and
orientation case records `heldProp: false` and `handoff: false`.

The I01 matrix contains:

- `18 x 6 = 108` base pose cases;
- `108 x 4 = 432` orientation cases;
- zero root-alignment failures;
- zero pivot-drift failures;
- zero route failures;
- zero held-prop and handoff cases.

Character pixels remain `pendingCommercialReview`.

## F6 two-instance reservation proof

The reusable family creates two logical instances:

- `server-rack-01`;
- `server-rack-02`.

Each instance has capacity one and a separate reservation state. The
thirty-second, two-user simulation proves:

- one blocked attempt on an occupied rack;
- simultaneous success on the other rack;
- one interaction failure;
- release after failure;
- one successful retry;
- three total releases;
- maximum two reservations globally but never more than one per rack;
- zero collisions and no reservation held at second 30.

## F8 review outputs

1. `01-clean-four-orientations.png`
2. `02-parts-shell-status.png`
3. `03-status-seam-loop.png`
4. `04-geometry-footprint-pivots.png`
5. `05-inspect-sockets-four-orientations.png`
6. `06-routes-four-orientations.png`
7. `07-roster-108-cases.png`
8. `08-orientation-matrix-432-cases.png`
9. `09-empty-hand-interaction-closeups.png`
10. `10-two-instance-reservation-30s.png`
11. `server-rack-n02-production-inspect.gif`
12. `server-rack-n02-production-two-user.gif`

The files live under
`assets/art/layout-references/office-facility-family-v1/server-rack-n02-production/`.
The manifest records every review hash, image size, GIF frame count, and GIF
duration. Owner approval must refer to this exact revision and evidence set.

## Reproduction and validation

```bash
npm run art:facility:server:n02:production
npm run art:facility:server:n02:production:rebuild:check
npm run art:facility:server:n02:production:check
```

The builder owns all production processed assets and review outputs. Rebuild
validation compares the complete deterministic byte set without rewriting it.

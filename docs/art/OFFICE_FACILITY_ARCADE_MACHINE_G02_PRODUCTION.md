# Office Facility Arcade Machine G02 Production

Status: owner review pending at F8

Updated: 2026-07-29

## Decision boundary

This is the isolated F4-F8 production pass for the owner-approved Arcade G02
visual preflight. F0-F7 pass in production revision `g02-production-r01`. F8
remains open for the owner to review the exact evidence hashes.

This pass does not place the cabinet in a room, add its planned Facility v1
reservation slot, change another facility family, or modify Active Office.
F9 remains blocked. F10 remains blocked.

## Locked production contract

| Property | Value |
| --- | --- |
| Family | `machine.game.arcade.generated-modern` |
| Production revision | `g02-production-r01` |
| Approved pixel authority | `g02-preflight-r02` |
| Physical scale | `2 x 2 x 4` tiles |
| Floor footprint | `2 x 2` tiles |
| Render box | `3 x 4` tiles |
| Runtime canvas | `96 x 128` pixels |
| Orientations | Front, right, back, left |
| Capacity | One |
| Action | `play-arcade-machine` |
| Visual pose | I01 `interact-front` |
| Held controller or prop | None |
| Planned slot after F8 | One |
| Current slot contribution | Zero |

The production manifest is:

`assets/game/manifests/office-facility-arcade-machine-g02-production.json`

It hash-locks the approved preflight manifest, all 52 processed PNG assets, and
all ten F8 review boards.

## Modular motion implementation

The cabinet follows the approved modular motion standard:

`shell + viewport[n] + machineLocalControls`

The producer creates four immutable shells, four orientation-specific
machine-local control layers, and twelve viewport frames. Each part uses a
shared full-canvas origin. The front composite is pixel-identical to the
approved visual preflight.

Three games each own four real phases:

| Game | Sequence | Frame time | Cycle |
| --- | --- | --- | --- |
| Cosmic Drift | A, B, C, D, A | `200 ms` | `800 ms` |
| Neon Rally | A, B, C, D, A | `200 ms` | `800 ms` |
| Dungeon Pulse | A, B, C, D, A | `200 ms` | `800 ms` |

Only the declared `[30,27,66,63]` runtime viewport changes. Shell changes,
control changes, outside-viewport changes, pivot drift, and closure mismatch
are all zero. The logical phase after D equals A and is not stored as a fifth
asset.

## Spatial and interaction proof

Each orientation declares its own four-cell footprint, stand cell, approach
cell, exit cell, route, facing, interaction root, and machine-local sockets.
All coordinates are integers. All routes have zero collisions.

Actors are placed with:

`worldRoot - actorFrameRootSocket`

There are no per-character offsets, per-scene offsets, magic offsets, missing
socket fallbacks, or fractional coordinates. The joystick and buttons remain
part of the machine. No controller is placed in a hand.

The I01 authority supplies 18 characters and six active `interact-front`
frames:

- pose cases: `18 x 6 = 108`;
- orientation cases: `108 x 4 = 432`;
- root-alignment failures: `0`;
- pivot-drift failures: `0`;
- route failures: `0`; and
- held-controller cases: `0`.

The I01 character sheets remain marked `pendingCommercialReview`; this
production proof does not change that licensing state.

## Two-user reservation proof

The deterministic simulation runs for 30 seconds with two actors and capacity
one. Actor A reserves, starts, fails, and releases. Actor B is blocked while
Actor A owns the reservation, retries after release, completes, and releases.

| Metric | Result |
| --- | ---: |
| Maximum simultaneous reservations | 1 |
| Collisions | 0 |
| Blocked attempts | 1 |
| Failures | 1 |
| Successful retries | 1 |
| Releases | 2 |
| Reservation owner at 30 seconds | None |

This proves the behavior but does not yet contribute the planned Arcade slot
to the Facility v1 count. That contribution requires explicit F8 approval.

## F8 review outputs

1. `01-clean-four-orientations.png`
2. `02-parts-shell-viewport-controls.png`
3. `03-screen-loops-three-games.png`
4. `04-geometry-footprint-pivots.png`
5. `05-control-sockets-four-orientations.png`
6. `06-routes-four-orientations.png`
7. `07-roster-108-cases.png`
8. `08-orientation-matrix-432-cases.png`
9. `09-interaction-closeups.png`
10. `10-reservation-timeline-30s.png`

The review directory is:

`assets/art/layout-references/office-facility-family-v1/arcade-machine-g02-production/`

## Reproduction

```bash
npm run art:facility:arcade:g02:production
npm run art:facility:arcade:g02:production:rebuild:check
npm run art:facility:arcade:g02:production:check
```

The builder refuses to change the approved preflight and fails when any
approved authority hash, generated asset, review board, route, roster case,
reservation invariant, or gate boundary drifts.

## Owner review required

The owner should review the ten exact boards, with particular attention to:

- four-orientation scale and silhouette;
- separation of shell, viewport, and local controls;
- approach direction and interaction occlusion;
- all 108 I01 poses and the 432-case orientation matrix; and
- the occupied, blocked, failure, release, retry, and final-release timeline.

Approval may advance this family through F8 and make its one planned
reservation slot eligible for the later Facility v1 count. It does not
authorize F9 room composition or F10 Active Office promotion.

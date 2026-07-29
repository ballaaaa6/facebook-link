# Office Facility Upsize 2x2x4 Production V1

Status: `production-owner-review`

Date: 2026-07-30

This isolated F4-F8 production batch consumes only the exact F3-approved
Coffee Machine C02, Water Dispenser W02, Vending Machine U02, and Massage
Chair R03 pixels. F4-F7 validation is complete. F8 remains pending so none of
the five replacement reservation slots is active, F9 v1 is unchanged, and
Active Office imports no candidate asset.

## Batch result

| Family | Instances after F8 | Seam loop | Finite use sequence | Pose / orientation cases |
| --- | ---: | --- | --- | ---: |
| Coffee Machine C02 | 1 | display, controls, steam | wake, preheat, pour, finish, idle | 108 / 432 |
| Water Dispenser W02 | 2 | display, controls, drip | ready, dispense, drip-stop, idle | 108 / 432 |
| Vending Machine U02 | 1 | merchandise viewport A-D | select, payment, dispense, pickup, idle | 108 / 432 |
| Massage Chair R03 | 1 | status and roller pulse | upright, half, reclined, hold, half, upright | 108 / 432 |

The batch review board is
[`00-production-batch-f8-review.png`](../../assets/art/layout-references/office-facility-upsize-production-v1/00-production-batch-f8-review.png).

Every family retains:

- physical scale `2 x 2 x 4`;
- floor footprint `2 x 2`;
- render box `3 x 4`;
- authoring canvas `384 x 512`;
- runtime canvas `96 x 128`;
- base and sort pivot `[48, 124]`; and
- front, right, back, and left visual elevations.

## Modular motion contract

The production composition formula is:

`immutableShell[orientation] + machineLocalChild[state]`

The approved front pixels are split into a fixed shell and one exact local
base child. Recomposition is pixel-exact before motion. All changed pixels
remain inside the F3-declared local regions. The shell, collision footprint,
base pivot, and sort pivot never move.

Recurring motion uses deterministic `A → B → C → D → A` seam loops. Invoked
use motion is a separate six-state finite sequence that returns to idle.
Output choice is never random per frame.

### Coffee C02

The display, machine-local controls, steam, and coffee stream are local
children. H01 `held.coffee-mug` is attached only to the actor's primary grip.
The Counter is not a support parent.

### Water W02

The display, controls, dispense stream, and drip effect are local children.
The existing H01 water bottle and clear water cup are selected once per visit.
Two planned instances have independent capacity-one reservations.

### Vending U02

The empty merchandise viewport owns four continuous product-layout phases.
Controls and the pickup-ready state remain local. A soda can, juice box, or
snack bag is chosen deterministically once per visit and remains stable until
release. No product is embedded in the immutable shell.

### Massage R03

The pod enclosure and base remain fixed. Status light and roller/pad pulses
are local. Recline is an invoked finite child state and returns to upright.
The actor uses the existing owner-approved `working-front-seated` row with a
fixed seat anchor and a real front occlusion layer. Side and rear elevations
are valid static placement views, but interaction remains front-only because
no approved side-seated character row exists. No held prop is invented.

## Coordinate and actor proof

Coffee, Water, and Vending reuse I01 `interact-front` and H01 primary-grip
assets. The formula remains `worldRoot - actorFrameRootSocket`. Massage reuses
the approved working-front seat authority.

Per family:

- 18 characters × 6 frames = 108 pose cases;
- 108 pose cases × four elevations = 432 orientation-placement cases;
- route collisions: zero;
- fractional sockets: zero;
- per-character facility offsets: zero;
- magic offsets: zero;
- fallback sockets: zero; and
- attachment or foreground failures: zero.

The complete batch proves 432 pose cases and 1,728 orientation-placement
cases. Coffee owns 54 exact mug-grip cases, Water owns 108 bottle/cup cases,
Vending owns 162 three-prop cases, and Massage owns 108 seated foreground
cases.

## Reservation proof and slot transfer

Each family has a deterministic 30-second proof containing a blocked attempt,
failure release, retry success, completion release, and zero route
collisions. Coffee, Vending, and Massage reach maximum concurrency one. The
two Water instances reach maximum concurrency two without sharing a
reservation.

Facility v1 remains `20/20` through the accepted predecessor families:

- candidate active contribution before F8: `0`;
- planned predecessor-to-successor transfer after all F8 approvals: `5`;
- target after transfer: `20/20`, never `25/20`; and
- transfer must be atomic per family.

Counter A01-r02 remains retained but is planned as `retained-not-placed`.
Coffee C02 stands on the floor.

## F9 and interior constraints

The current F9 v1 manifest remains hash-pinned and unchanged. After exact F8
approval, F9 v2 must still preserve:

- ten workstations in two rows beginning at `C12`;
- 14 Facility objects and exactly 20 reservation slots;
- 200 workstation-to-facility route queries;
- people hidden;
- separate footprint, approach, route, reservation, and decor layers;
- side elevations along the right edge only when the operational face points
  into the aisle; and
- no Active Office promotion.

## Review evidence

Each family owns ten PNG boards and two GIFs:

1. approved F3 hash lock;
2. modular parts and recomposition;
3. seam loop A-D-A;
4. finite use sequence;
5. geometry and four orientation routes;
6. I01/H01 or seat sockets;
7. 108-case roster;
8. 432-case orientation matrix;
9. interaction close-ups;
10. 30-second reservation timeline;
11. machine seam-loop GIF; and
12. actor interaction GIF.

Review folders:

- `assets/art/layout-references/office-facility-upsize-production-v1/coffee-machine-c02`
- `assets/art/layout-references/office-facility-upsize-production-v1/water-dispenser-w02`
- `assets/art/layout-references/office-facility-upsize-production-v1/vending-machine-u02`
- `assets/art/layout-references/office-facility-upsize-production-v1/massage-chair-r03`

## Gates and commands

F0-F7 pass. F8 is `pending-owner-review`. F9, F10, reservation-slot
activation, F9 replacement, and Active Office promotion remain blocked.

```powershell
npm run art:facility:upsize:production
npm run art:facility:upsize:production:rebuild:check
npm run art:facility:upsize:production:check
```

Exact approval of the production review hashes is required before slot
transfer or construction of F9 v2.

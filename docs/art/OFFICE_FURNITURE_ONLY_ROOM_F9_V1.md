# Office Furniture-only Room F9 v1

Status: F9 owner review

Date: 2026-07-30

This candidate is the first complete Facility v1 room composition. It uses a
new `43 x 24` map, consumes only owner-approved furniture and facility
families, and deliberately contains no people. It does not modify or promote
the Active Office.

## Owner brief lock

The workstation island follows the existing C12 placement authority exactly:

- protected envelope: `C12:S19`;
- furniture content: `D13:R18`;
- 10 workstations in two depth-paired rows;
- five far desks at `D14:R15`;
- five near desks at `D16:R17`;
- the top, bottom, left, and right one-tile perimeter aisles remain clear.

The candidate does not use the rejected 15-workstation arrangement. Workstation
pixels are composed from the owner-approved R05-r02 parts without actor pixels.

## Interior layout

The room is divided by use, noise, and circulation:

| Zone | Grid range | Design intent |
| --- | --- | --- |
| Work | `C12:S19` | Compact paired workstation island with a clear perimeter |
| Transition | `T12:AD24` | Unobstructed bridge between focused work and shared facilities |
| Operations | `AE11:AM13` | Printers and refrigerator against the upper service wall |
| Pantry | `AE15:AN17` | Coffee on Counter A01-r02 with vending and water grouped nearby |
| Lounge | `AE19:AQ21` | Sofas, massage chair, and arcade separated from printer/server traffic |
| Review | `AG22:AJ24` | Four independent review-table reservation approaches |
| Right-edge side bank | `AP12:AQ21` | Two server racks and one arcade use approved left views and face inward |

Front-only families face the open southern aisle. The two Server N02
instances and Arcade G02 use their approved left-side shells at the right
edge, so their functional front is the inward-facing west side rather than
the wall. Every approach cell is placed in front of the object's effective
orientation. No approach cell is inside a footprint or against the wall.

The right-edge equipment is vertically spaced by its `3 x 4` render box, not
only by its `2 x 2` collision footprint. This avoids the visually merged stack
that would result from treating bitmap height as floor depth.

## Inventory and capacity

| Item | Objects | Reservation slots |
| --- | ---: | ---: |
| Workstations | 10 | Not part of Facility v1 shared capacity |
| Server racks | 2 | 2 |
| Printers | 2 | 2 |
| Refrigerator | 1 | 1 |
| Coffee machine | 1 | 1 |
| Vending machine | 1 | 1 |
| Water dispensers | 2 | 2 |
| Three-seat sofa | 1 | 3 |
| Two-seat sofa | 1 | 2 |
| Massage chair | 1 | 1 |
| Arcade machine | 1 | 1 |
| Review table | 1 | 4 |
| **Facility total** | **14** | **20** |

Counter A01-r02 is one support-furniture placement and does not add a
reservation slot. Coffee C01-r02 remains parented to its support surface.
Decor is a separate, intentionally empty layer because no decor set has been
approved for this candidate.

## Spatial proofs

The builder rejects footprint overlap, out-of-floor placement, blocked
approaches, a workstation origin that differs from the C12 two-row contract,
or a right-edge machine that loses its approved left orientation.

Navigation tests every workstation perimeter start against every Facility v1
slot:

```text
10 workstation starts x 20 reservation slots = 200 routes
reachable                                      = 200/200
unreachable                                    = 0
```

The reservation proof runs for 300 simulated seconds with 21 synthetic users.
It fills all 20 slots, records one capacity-blocked attempt, releases every
initial user, retries the blocked user successfully, and ends with zero
reservations. Double bookings and leaked reservations are both zero.

## Independent review layers

The generated map keeps these layers independent:

1. architecture;
2. workstations;
3. support furniture;
4. facilities;
5. footprints;
6. approaches;
7. routes;
8. reservations;
9. decor;
10. grid.

The clean composite displays only architecture, workstations, support
furniture, and facilities. Fifteen review boards cover zoning, hash authority,
clean composition, inventory, collisions, approaches, 200 routes, 20
reservations, support parenting, the empty decor layer, the complete debug
view, the 300-second stress proof, isolation, and viewport framing.

## Authority and isolation

The manifest pins 13 owner-approved source manifests plus every consumed
runtime part by SHA-256. The unfurnished architecture and owner layout markup
are also hash-pinned. Missing or changed inputs fail the build; there is no
fallback asset and no magic offset.

The map and manifest both declare:

- `developmentOnly: true`;
- `activeOfficePromotion: false`;
- people visible: `false`;
- character placements: `0`;
- character sprite references: `0`.

F9 remains `pending-owner-review`. F10 remains blocked until the owner approves
this exact furniture-only candidate. No character population, reversible
runtime switch, or Active Office change is authorized by this build.

## Files and commands

Primary files:

- `assets/game/manifests/office-furniture-only-f9-v1.json`;
- `assets/game/maps/office-furniture-only-f9-v1.json`;
- `scripts/build-office-furniture-only-f9-v1.py`;
- `scripts/office-furniture-only-f9-v1-check.mjs`;
- `packages/contracts/src/officeFurnitureOnlyRoomF9.ts`.

Commands:

```bash
npm run art:office:furniture-only:f9
npm run art:office:furniture-only:f9:rebuild:check
npm run art:office:furniture-only:f9:check
```

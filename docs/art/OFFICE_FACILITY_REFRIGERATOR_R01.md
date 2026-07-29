# Office Facility Refrigerator R01

Status: visual and motion preflight owner-approved

Revision: `r01-generated-motion-preflight-r01`

Authority:
`assets/game/manifests/office-facility-refrigerator-r01.json`

Builder: `scripts/build-office-facility-refrigerator-r01.py`

Checker: `scripts/office-facility-refrigerator-r01-check.mjs`

## Owner direction

The owner changed the planned refrigerator from the audited static
`2 x 1 x 3` shell to a fresh:

- `2 x 2 x 4` physical scale;
- `2 x 2` floor footprint;
- `3 x 4` front render box;
- animated lower-door open/close action;
- random visit-stable water-bottle or yogurt-box output; and
- direct reuse of the existing I01/H01 coordinate and held-prop system.

This revision records that direction without claiming production or room
authority.

## Fresh source policy

R01 uses two new built-in ImageGen sources:

1. one closed front identity with no food or character; and
2. one modular parts source containing the empty shell, closed lower door,
   half-open lower door, and fully open lower door.

The exact prompt record is:

`assets/art/layout-references/office-facility-family-v1/refrigerator-r01/source/IMAGEGEN_PROMPTS.md`

R01 uses zero pixels from:

- the audited `facility-lounge` refrigerator master;
- the historical processed refrigerator crop;
- rejected left/right refrigerator orientations;
- Active Office;
- another facility family;
- legacy runtime assets; or
- a missing-asset fallback.

The front source has no image input. The parts source uses only the new front
anchor as the identity reference for the same R01 family.

## Geometry

| Contract | Value |
| --- | --- |
| Physical scale | `2 x 2 x 4` tiles |
| Floor footprint | `2 x 2` tiles |
| Render box | `3 x 4` tiles |
| Runtime canvas | `96 x 128` pixels |
| Authoring canvas | `384 x 512` pixels |
| Orientation | front only |
| Base and sort pivot | `[48,124]` |
| Interaction target | `[48,124]` |
| Output socket | `[49,76]` |
| Door swing region | `[14,38,89,124]` |
| Front approach | one cell |
| Capacity | one actor |

Door motion changes neither the footprint nor collision geometry. The door
swing is visual overflow within the declared local motion region.

## Modular finite animation

The composition formula is:

```text
immutableShell + lowerDoor[state]
```

The immutable shell contains the upper freezer door and item-neutral empty
interior. The lower door is one moving child with three authored states:

```text
closed -> half -> open
open -> half -> closed
```

The review transition is:

```text
closed -> half -> open -> half -> closed
```

This is a reversible finite action, not an ambient seam loop. The review GIF
repeats only to make inspection convenient. Runtime authority must invoke one
forward or reverse path as part of a visit.

The preflight proves:

- all four transitions change visible pixels;
- zero changed pixels escape the door swing region;
- immutable-shell changed pixels remain zero;
- pivot delta is `[0,0]`;
- footprint delta is `[0,0]`; and
- the final closed endpoint reuses the exact initial closed composite.

Interruption before pickup reverses the door, removes any facility output,
and releases the reservation. Interruption after pickup finishes the close,
removes the held prop before departure, and then releases the reservation.

## I01/H01 reuse

R01 does not introduce a new hand, grip, coordinate, mask, or attachment
system. It references the owner-approved:

- `office-character-action-sockets-i01.json`;
- `office-spatial-authority-i01.json`; and
- `office-held-props-h01.json`.

The exact output pool is:

- `held.water-bottle`; and
- `held.yogurt-box`.

Selection uses:

```text
(stable-hash(actorId|slotId) + visitIndex) % pool.length
```

The selection occurs once when a visit begins, remains stable through every
animation frame, and alternates across consecutive visits for the two-item
pool. It never flickers frame by frame.

The parent switch is explicit:

```text
facility.output.primary -> actor.hand.primary.grip -> none
```

The existing H01 `prop.visualCenterSocket` resolves against the existing I01
per-character hand coordinate with:

```text
attachmentDelta == [0,0]
```

Magic offsets, character-specific facility offsets, hand masks, and missing
socket fallbacks remain forbidden.

## Interaction preview

The Anna development-only preview runs:

1. approach;
2. ready at the closed refrigerator;
3. unlatch to half;
4. open and present the selected prop at `output.primary`;
5. move the same prop to the existing hand anchor;
6. hold while the lower door begins closing;
7. close fully and remove the prop before departure; and
8. depart.

The preview is evidence for visual scale, state order, parent switching, and
coordinate reuse. It is not the 18-character production validation.

## Current gates

| Gate | Status |
| --- | --- |
| F0 source/provenance | passed |
| F1 geometry | passed |
| F2 art decomposition | passed |
| F3 visual/motion preflight | passed |
| F4 modular production | blocked |
| F5 sockets/routes | blocked |
| F6 roster/reservation simulation | blocked |
| F7 production evidence | blocked |
| F8 owner family approval | blocked |
| F9 furniture-only room | blocked |
| F10 Active Office | blocked |

The owner approved the exact R01 visual and motion preflight hashes on
2026-07-30. F4-F8 isolated production is authorized; the preflight itself
continues to contribute zero reservation slots. F9-F10 remain blocked.

## Authorized production revision

The isolated `r01-production-r01` batch now builds:

- 18 actors x 6 `interact-front` frames = 108 pose cases;
- 18 actors x 3 visible-prop frames x 2 props = 108 prop-overlay cases;
- one 30-second two-user capacity-one blocked/failure/release/retry proof;
- route, socket, state, handoff, close-up, and timeline evidence; and
- an F8 review package.

The preflight contributes zero Facility slots. The exact family contributes
one slot only after F8 approval:

```text
17/20 -> 18/20
```

The production review remains pending at F8 and contributes zero slots until
the owner approves its exact hashes. See
`docs/art/OFFICE_FACILITY_REFRIGERATOR_R01_PRODUCTION.md`.

F9 and Active Office remain outside this revision.

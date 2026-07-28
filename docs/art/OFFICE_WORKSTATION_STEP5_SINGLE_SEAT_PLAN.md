# Office Workstation Step 5 R05 Calibration Gate

Status: R05-0 through R05-5 complete; isolated final candidate awaiting owner review
Updated: 2026-07-28

Current authorities:

- `assets/game/manifests/office-camera-scale-bible-v3.json`
- `assets/game/manifests/office-workstation-assembly-bible-v3.json`
- `assets/game/manifests/office-workstation-components-v3.json`
- `assets/game/manifests/office-workstation-step5-single-seat-v4.json`
- `assets/game/manifests/office-workstation-step5-r05-measurements.json`
- `assets/game/manifests/office-workstation-step5-r05-calibration.json`

R03 remains the P0-P3 measurement history. R04 P4-P6 is now rejected physical
composition evidence. Only its full rectangular desk pixels are retained.
R05-0 freezes that decision, R05-1 replaces declaration-based geometry with
reservation/pivot/support contracts, and R05-2 records the measured failures
and exactly three owner-review boards. R05 creates no new furniture, character,
or pose and does not run a single-seat renderer.

## Why R02 was rejected

R02 is frozen at
`assets/game/manifests/office-workstation-step5-single-seat-v2.json` with
status `rejected-calibration`. Its five images and isolated lab remain
historical regression evidence only.

The root cause was not a single rendering offset. The R02 validator trusted
manifest declarations that did not describe the visible pixels:

| R02 declaration | Measured or required reality | Failure |
| --- | --- | --- |
| Desk footprint `3 x 2` | Visible support band is 30 px deep; a two-tile top must be 64 px deep | The art could not carry two real equipment rows |
| Keyboard reservation `3 x 1` | Keyboard must reserve the center `1 x 1` actor-near cell | The keyboard contract occupied the whole row |
| Chair front/back `44/47 x 64` px | Existing calibration composites normalize to a preliminary combined width near `60/61` px | Chair pixels were compressed before contact was measured |
| Hip anchor `(48,72)` | Cushion/pelvis contact was not derived and approved from the calibration source | A declared anchor was treated as proof |
| Desk height `2.4` | R03 uses integer levels: floor 0, seat 1, desk support 2, person top 3 | The old vertical ruler could not provide one consistent stacking model |

The former tests therefore proved internal agreement between incorrect
numbers. R03 tests measured pixels and explicitly leave unknown pixel anchors
unlocked.

## Historical P0 - freeze and permissions

R02 retains its files for audit but all implementation permissions are
revoked. R03 authorizes only deterministic measurement and the three
calibration boards.

The following remain false until a later owner decision:

- new artwork generation;
- renderer implementation;
- single-seat and ten-seat assembly;
- roster-wide calibration;
- Step 6;
- Active Office promotion.

The Active Office map must remain byte-identical at SHA-256
`c40db448eb8e6d0f3fea67a41f716c0108aca63a4136cfad15293534273c618d`.

## Historical P1 - spatial authority

R03 uses a single 32-pixel world ruler:

```text
screenX = worldX * 32
screenY = worldY * 32 - worldZ * 32
```

| Object or level | Contract |
| --- | --- |
| Floor | `z = 0` |
| Chair cushion and seated pelvis | `z = 1` |
| Desk support and chair logical top | `z = 2` |
| Person logical top | `z = 3` |
| Person | footprint `1 x 1`, volume `1 x 1 x 3`, current Office frame `96 x 104` px |
| Chair | footprint `1 x 1`, volume `1 x 1 x 2`, same floor cell as the person |
| Desk | footprint `3 x 2`, volume `3 x 2 x 2`, full support plane `96 x 64` px |
| Monitor | actor-far reservation `3 x 1`, current visual retained |
| Keyboard | center actor-near reservation `1 x 1`, maximum visual `1.5 x 1`, proposed `48 x 24` px |

Visible character, chair, and equipment pixels may overflow a logical cell
only where declared. Visual overflow never enlarges collision space. The full
keyboard visual must remain inside the desk support plane and cannot overlap
the monitor.

## Historical P2 - measured evidence

The deterministic measurement file records SHA-256, image dimensions, alpha
bounds, and calibration bounds for:

- six frames in each Einstein seated runtime row;
- the front and back character-only calibration rows;
- the front and back character-plus-chair calibration rows;
- the current front and back chair sources;
- both rejected desk sides;
- current front and back monitor sources;
- the tight keyboard source.

The preliminary normalized person-plus-chair envelope is about 60 px in the
back view and 61 px in the front view. These values are evidence, not approved
chair render dimensions. Exact cushion, pelvis, rear, and foreground pixel
anchors remain unlocked.

## Historical P3 - calibration boards

Exactly three calibration images are stored under
`assets/art/layout-references/office-workstation-v3/step5-r03/`:

1. `01-world-projection-and-z-levels.png`
2. `02-desk-equipment-footprints.png`
3. `03-character-chair-contact.png`

The boards distinguish three kinds of information:

- locked logical rules;
- measured historical pixels;
- pixel decisions deliberately deferred to P4.

They are diagrams and source-pixel evidence. They are not new furniture art.

## Historical P3 owner gate

Before P4, the owner must approve or revise:

1. the `1 x 1 x 3` person, `1 x 1 x 2` chair, and `3 x 2 x 2` desk ruler;
2. the full `96 x 64` desk support plane;
3. the monitor `3 x 1` far row and keyboard `1 x 1` near-center reservation;
4. the cushion/pelvis contact at `z = 1`;
5. the requirement for chair rear, person, chair seat, and chair foreground
   layers.

That approval authorized the completed R04 P4-P6 work below. It did not
authorize ten seats, the other eighteen characters, Step 6, or Active Office.

## Rejected historical P4 - normalized component pixels

R04 uses separate render assets and logical reservations:

| Component | Logical rule | R04 pixels |
| --- | --- | --- |
| Existing Office person | footprint `1 x 1`, volume `1 x 1 x 3` | existing `96 x 104` seated frame |
| Rejected chair | footprint `1 x 1`, volume `1 x 1 x 2` | `64 x 80`; claimed cushion contact was not measured |
| New desk | footprint `3 x 2`, volume `3 x 2 x 2` | `96 x 128`, support rows `0..63` |
| Rejected monitor placement | reservation `3 x 1` | `52 x 40`; base contact is 16 px off row center |
| Rejected keyboard placement | reservation `1 x 1`, visual maximum `1.5 x 1` | `48 x 24`; far/near centers differ by 4 px |

The desk has public and seat sides and remains accepted. The R04 chair split
is rejected because the layer named `seat` begins at local row 48 and contains
the wheel/base region. The measured lower upholstery bands end at row 44, so
the layer name and declared contact line do not describe the visible cushion.

The generated source prompts are recorded in
`assets/art/layout-references/office-workstation-v3/source/office-workstation-v3-imagegen-prompts.md`.

## Rejected historical P5 - one static station in two directions

Both views read one manifest and use the same component pixels, scale, and
anchors. `far` means the actor sits beyond the public side: the public modesty
panel and monitor back face the viewer. `near` means the actor sits on the
seat side: the chair/actor draw in front of the desk and the monitor front is
visible.

R04 set the chair cushion and person hip coordinates to the same value before
validation. Equality therefore proved only that two declarations matched, not
that the visible pelvis sat on the visible cushion. Its images remain under
`assets/art/layout-references/office-workstation-v3/step5-r04/` as rejected
regression evidence.

## Rejected historical P6 - isolated browser validation

The development-only route is
`/?lab=office-workstation-v3-step5`. It renders one station, two directions,
clean/overlay/current-background panels, and never imports R04 into the Active
Office registry.

The browser results proved stable drawing coordinates and a clean development
route, but did not prove physical composition:

- 30 seconds of live animation with zero actor or chair coordinate drift;
- zero contract issues, console errors, warnings, or broken images;
- desktop runtime review at `1280 x 720`;
- current-background context review at `1280 x 1100`;
- `390 x 844` narrow review with zero horizontal overflow;
- Active Office map SHA-256 remains
  `c40db448eb8e6d0f3fea67a41f716c0108aca63a4136cfad15293534273c618d`.

## R05-0 - freeze the rejected implementation

`office-workstation-step5-single-seat-v4.json` is now
`rejected-physical-composition`. The component manifest is
`partially-rejected-physical-composition`: desk pixels are accepted while
chair, monitor placement, and keyboard placement are rejected. Every R04
implementation permission is false.

## R05-1 - Geometry v6 authority

Reservation, visual pixels, and support height are independent:

```text
worldAnchor = center(topDownReservation)
drawOrigin = worldAnchor - measuredLocalVisualPivot
```

- A person reserves `1 x 1`, has logical height 3, and may visually overflow.
- A chair reserves `1 x 1 x 2`. Its base-and-seat occupies `z0..z1`; its
  backrest occupies `z1..z2`.
- The seat plane and pelvis contact must be measured from actual pixels.
- A monitor reserves `3 x 1`; its visual target is 72..80 px wide and uses a
  measured base-contact-center pivot.
- A keyboard reserves `1 x 1`; its target is 44..48 by 18..20 px, leaves at
  least 6 px front/back clearance, and may overhang at most 8 px per side.
- Front/back art may differ, but orientation-specific placement offsets are
  forbidden.

## R05-2 - measured evidence and review boards

The measurements record:

- chair lower upholstery rows `35..44` front and `40..44` back;
- rejected chair split start row 48 and `seatLayerContainsCushion = false`;
- monitor base-to-reservation-center error `(0,16)` px in both orientations;
- keyboard center error `(0,-4)` px far and `(0,0)` px near;
- the existing six-frame seated rows and alpha bounds;
- `pelvisContactPivot = null` because R04 never measured it.

Exactly three boards are stored under
`assets/art/layout-references/office-workstation-v3/step5-r05/`.

## R05-3A - owner-feedback anchor proof

The keyboard is owner-accepted and frozen at `48 x 24` pixels with a centered
`[24,12]` local visual pivot. The monitor remains a `3 x 1` reservation but
uses a centered `1 x 1` support footprint and the desk-local support socket
`[1.5,0.5,2]`. Reattaching the existing temporary monitor visual to that
socket reduces the measured base error from 16 px to 0 px in both views.

The chair proof uses two physical volumes:

- `base-seat` is `1 x 1 x 1` from `z0..z1`;
- `backrest-arms` is `1 x 1 x 1` from `z1..z2`.

These two physical parts derive multiple rear and foreground draw masks; a
draw mask never creates another logical volume. The current seated character
and pose pixels remain unchanged. The front pose begins its sustained
pants/thigh region at local y80, so the owner-review seat socket is `[48,80]`.
The seated logical floor socket is `[48,112]`, one 32 px z level below. The
back view inherits the same skeleton socket because the coat visually occludes
its pelvis. The placeholder proof records 0 px contact error and 0 px anchor
drift across all six frames; it is not polished chair artwork.

Three additional before/after boards are stored in the same R05 directory:

1. `04-monitor-base-socket-before-after.png`;
2. `05-chair-two-volume-before-after.png`;
3. `06-person-seat-contact-six-frames.png`.

## R05-3A owner decision

The owner approved the keyboard, centered monitor base, and front/back seated
contact proof. That approval authorized R05-3B through R05-5 in the isolated
review environment. It did not authorize new characters, new poses, other
furniture, or Active Office promotion.

## R05-3B - real chair derivatives

R05-3B does not generate a replacement chair. It reuses the existing front and
back `64 x 80` chair sources, places them at local `[16,32]` on a `96 x 112`
canvas without scaling, and derives:

- physical `base-seat` and `backrest-arms` masks;
- render `rear` and `foreground` masks;
- exact source-pixel reconstruction checks.

The chair seat socket is `[48,80]`, the floor socket is `[48,112]`, and the
measured contact error is 0 px in both orientations across six frames.

## R05-4 - isolated single station

The development-only `?lab=office-workstation-r05` route renders one accepted
workstation from both directions. It uses the accepted `3 x 2` desk, `52 x 40`
monitor, `48 x 24` keyboard, existing Einstein pose, and the real chair masks.
Clean and geometry-overlay captures are retained for review.

## R05-5 - isolated ten-seat candidate

The candidate uses two rows of five edge-touching `3 x 2` desks on the
byte-identical current Office background. It contains five far and five near
stations, ten existing characters and poses, zero legacy furniture references,
and no other furniture. All stations remain inside the left 24-tile work zone.

The browser gate ran for 60 seconds with 0 px anchor drift, zero broken images,
zero console warnings, and zero console errors. Seven consolidated boards and
four runtime captures are listed by
`assets/game/manifests/office-workstation-step5-r05-final.json`.

## Current owner gate

The owner should review the R05 final before/after, single-station, ten-seat,
and debug evidence. Approval may authorize the next named furniture batch or a
separate promotion plan. Step 6, other furniture, and Active Office promotion
remain blocked until that explicit decision.

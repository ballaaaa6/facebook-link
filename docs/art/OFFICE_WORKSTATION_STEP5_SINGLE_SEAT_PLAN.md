# Office Workstation Step 5 R03 Calibration Gate

Status: P0-P3 complete; owner calibration review required
Updated: 2026-07-28

Current authorities:

- `assets/game/manifests/office-camera-scale-bible-v3.json`
- `assets/game/manifests/office-workstation-assembly-bible-v3.json`
- `assets/game/manifests/office-workstation-step5-single-seat-v3.json`
- `assets/game/manifests/office-workstation-step5-r03-measurements.json`

R03 is a measurement and rule-correction pass. It does not create desk, chair,
monitor, keyboard, character, pose, renderer, ten-seat, Step 6, or Active
Office output.

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

## P0 - freeze and permissions

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

## P1 - spatial authority

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

## P2 - measured evidence

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

## P3 - owner review boards

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

## Owner gate

Before P4, the owner must approve or revise:

1. the `1 x 1 x 3` person, `1 x 1 x 2` chair, and `3 x 2 x 2` desk ruler;
2. the full `96 x 64` desk support plane;
3. the monitor `3 x 1` far row and keyboard `1 x 1` near-center reservation;
4. the cushion/pelvis contact at `z = 1`;
5. the requirement for chair rear, person, chair seat, and chair foreground
   layers.

Approval authorizes P4 only: normalize the four workstation components for
one isolated station and return new evidence. It does not authorize a
renderer, ten seats, Step 6, or Active Office.

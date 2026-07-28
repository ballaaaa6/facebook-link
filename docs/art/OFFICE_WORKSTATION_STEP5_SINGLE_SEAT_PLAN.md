# Office Workstation Step 5 Single-Seat Plan

Status: Owner review required; implementation is not authorized
Updated: 2026-07-28
Depends on: `assets/game/manifests/office-workstation-assembly-bible-v2.json`

## Objective

Step 5 proves one complete workstation before any ten-seat composition is
attempted. It assembles the accepted Step 4 desk with one existing chair, one
existing monitor, one existing keyboard, and one seated pose from the existing
19-character roster. The proof runs only in a new isolated lab. It does not
modify the Active Office map, its background, the runtime office route, or any
existing office furniture registry.

The lab must show both orientations of the same one-seat module:

- `far/front`: the actor sits above the desk and faces down toward the viewer;
- `near/back`: the actor sits below the desk and faces up away from the viewer.

These are two review views of one station contract, not authorization to build
two runtime seats. No new character, pose, desk, chair, monitor, keyboard,
background, or decorative art may be generated in Step 5.

## Locked inputs

Implementation may read only the following visual inputs. Their hashes are
captured here so a similarly named historical asset cannot be substituted.

| Role | Path | SHA-256 |
| --- | --- | --- |
| Accepted desk, front | `assets/game/processed/office-workstation-v2/desk.workstation.modern.v2.front.png` | `b00fbe29b1fa207bae60cdbcfd24c95044a535864a5077e31faf2a5ca6bf30d1` |
| Accepted desk, back | `assets/game/processed/office-workstation-v2/desk.workstation.modern.v2.back.png` | `cae9981d8bc3c01fccd9214f146708c76aa590668cd25814ccafbe49392b7e15` |
| Existing chair, front | `assets/game/processed/office-library-modern-bright-v1/chair-office-modern-v1/chair.office.modern.front.png` | `b438553d2c578ac2b20a7a3c52c46096427fc9ca9214cc5b4fa3101da05c6dc7` |
| Existing chair, back | `assets/game/processed/office-library-modern-bright-v1/chair-office-modern-v1/chair.office.modern.back.png` | `86ca5fac6f7736f64f0749b1e8fd24fd9609482c32b17f72fe5b459788821511` |
| Existing chair foreground mask | `assets/game/processed/office-interactions-v1/foreground-masks/chair-office-modern-foreground.png` | `bdfd8d277adcaa58c8ec12903d884ebec6a36e62623dde97f2b03a97379ee512` |
| Existing monitor, front | `assets/game/processed/office-library-modern-bright-v1/env-01-workstation-static/monitor.front.png` | `47aa00e068ac2a5e0efe5316f0c9084cdb6f0a6b833a47bd1dcf44ada97478a8` |
| Existing monitor, back | `assets/game/processed/office-library-modern-bright-v1/env-01-workstation-static/monitor.back.png` | `f6bd888cf6a7a551cec21a66dcbee131b18cdd23daf3afa54eaff815da1743cf` |
| Existing keyboard | `assets/game/processed/office-facility-v1-lab/derived/keyboard.only.png` | `92277422c2a6879817adfe15d014eb69e81ef815006d79b2d3bbf1fa78d707db` |
| Existing Einstein pose sheet, 1x | `assets/game/characters/einstein/runtime-spritesheet-v3.webp` | `5c559c215966641a5a92e55bb2b3cf159b8e4a22b19633c1813c39da58956213` |
| Existing Einstein pose sheet, 2x | `assets/game/characters/einstein/runtime-spritesheet-v3@2x.webp` | `61400db1cc2a240059d34e08003e32adbf298235e3ef0bdd75464383835db069` |

Einstein is the calibration subject because both `working-front-seated` and
`working-back-seated` already exist in the v3 sheet. This choice does not change
the frozen 19-character roster and does not authorize any roster-wide work.

All semantic desk parts must come from
`assets/game/processed/office-workstation-v2/` and reconstruct the locked front
or back desk exactly. Historical `desk.workstation.viewer-*.v5`,
`desk.modular.v1`, `desk.standard.up`, `desk.creative.up`, and `desk.noc.up`
assets are denied even as hidden inputs. Current Active Office furniture is
also denied. Historical files may be displayed only as labelled rejection
evidence outside the runtime assembly.

## Geometry contract

The desk local origin is the top-left of its top-down footprint. X increases to
the right and Y increases toward the viewer. One desk reserves exactly `3 x 2`
tiles. Its accepted generation box is `96 x 128` pixels at 32 pixels per tile;
the extra render height is not collision space. Both the base and sort pivot are
`(1.5, 2)` tiles.

The following placements are equations relative to a desk origin `(dx, dy)`:

| View | Desk | Chair footprint | Monitor reservation | Keyboard reservation | Actor state |
| --- | --- | --- | --- | --- | --- |
| `far/front` | `(dx, dy, 3, 2)` | `(dx + 1, dy - 1, 1, 1)` | `(dx, dy + 1, 3, 1)` | `(dx, dy, 3, 1)` | `working-front-seated`, facing down |
| `near/back` | `(dx, dy, 3, 2)` | `(dx + 1, dy + 2, 1, 1)` | `(dx, dy, 3, 1)` | `(dx, dy + 1, 3, 1)` | `working-back-seated`, facing up |

The monitor and keyboard each reserve a `3 x 1` desk row for placement logic,
but their visible pixels may be narrower. Both use the desk centerline
`x = dx + 1.5`. The monitor belongs at the edge farthest from the actor; the
keyboard belongs in the row nearest the actor. Their feet and keys must touch
the visible tabletop support plane, never the desk's vertical front face or the
floor. The chair and actor remain outside the `3 x 2` desk footprint and are
centered on the middle desk tile.

## Required layer order

The isolated renderer must use semantic parts, not one guessed monolithic
sprite. Back-to-front order is locked as follows and must be made visible in a
debug overlay:

`far/front`

1. `desk-rear`
2. `chair-base`
3. `desk-surface`
4. `keyboard`
5. `actor`
6. `chair-foreground`
7. `monitor-back`
8. `desk-base`
9. `desk-foreground`

`near/back`

1. `desk-rear`
2. `desk-surface`
3. `monitor-front`
4. `keyboard`
5. `desk-base`
6. `desk-foreground`
7. `chair-base`
8. `actor`
9. `chair-foreground`

If this source-of-truth order produces a visual contradiction, Step 5 stops and
the assembly manifest is corrected and reviewed. The renderer must not hide a
wrong geometry rule with per-scene offsets.

## Execution sequence after approval

### 5.1 Asset and contract preflight

1. Create a Step 5 lab manifest that records every allowed path, hash, footprint,
   anchor, orientation, pose state, and layer order above.
2. Add a deny-list assertion for old desk families and all Active Office
   furniture inputs.
3. Record the Active Office baseline hash
   `c40db448eb8e6d0f3fea67a41f716c0108aca63a4136cfad15293534273c618d`.
4. Produce an asset-provenance board showing the exact desk, chair, monitor,
   keyboard, and Einstein frames at nearest-neighbour scale.
5. Stop if any file hash or dimension differs. Do not regenerate a substitute.

### 5.2 Static one-seat assembly

1. Build one local station component from manifest data only.
2. Render `far/front` and `near/back` side by side on a neutral checker/grid lab
   background; do not copy or replace the Office background.
3. Draw optional debug overlays for the `3 x 2` desk footprint, `3 x 1`
   equipment rows, `1 x 1` chair footprint, centerline, pivots, sprite bounds,
   and named semantic layers.
4. Verify that the actor pelvis/seat anchor and chair center share the same
   world point while the actor's head remains unobstructed.
5. Save static evidence before adding animation.

### 5.3 Isolated interactive lab

1. Add a dedicated query route such as
   `/?lab=office-workstation-v2-step5`; it must be unreachable from the normal
   Active Office route unless the explicit lab query is present.
2. Provide controls only for orientation, debug overlay, zoom `1x/2x`, and
   animation pause. Do not add furniture selection or placement editing.
3. Drive the existing seated animation from the character sheet without
   changing the pose art or adding character-specific correction offsets.
4. Capture frames at `t = 0, 10, 20, 30` animation ticks. Chair, desk,
   equipment, actor anchor, and sort pivot must not drift between frames.

### 5.4 Tests and review evidence

The approved implementation must produce these five images under
`assets/art/layout-references/office-workstation-v2/step5/`:

1. `01-asset-provenance-and-scale.png`
2. `02-front-seat-layer-stack.png`
3. `03-back-seat-layer-stack.png`
4. `04-anchor-occlusion-overlay.png`
5. `05-step5-owner-contact-sheet.png`

The contact sheet must include clean and overlay views at `1x` and `2x`, the
Active Office before/after hash, and a visible `STEP 5 LAB ONLY` label. Automated
tests must prove:

- only allowed locked inputs are loaded;
- desk footprint is `3 x 2` and chair footprint is outside it;
- monitor and keyboard are centered and entirely assigned to their correct
  support rows;
- front/back pose and sprite side match each orientation;
- layer names and order exactly match the manifest;
- the four sampled animation ticks have identical station anchors;
- nearest-neighbour rendering is used and no sprite is stretched;
- the Active Office map, background, runtime registry, and default route are
  byte-for-byte unchanged;
- all repository checks pass without requiring Pillow in CI.

### 5.5 Owner gate

Step 5 ends with the five review images and the isolated lab URL. It is accepted
only after the owner confirms both orientation views. Until then:

- do not duplicate the station into 10 seats;
- do not calibrate the other 18 roster members;
- do not add other furniture or props;
- do not change the Office background or map;
- do not promote any Step 5 code or asset into Active Office.

## Rejection conditions

Reject Step 5 immediately if any of the following appears:

- the person or chair is placed in the middle of the desk footprint;
- the chair is not centered on the middle desk tile;
- the monitor is not at the far edge from the actor;
- the keyboard is not between the actor and monitor;
- equipment appears attached to a vertical desk face or floating off the top;
- the monitor, keyboard, actor, or chair is stretched to fit the desk;
- the rectangular top is narrowed, tilted, clipped, separated, or replaced;
- a historical/current Office furniture asset or a newly generated asset is
  used;
- the Office background changes;
- clean and debug views require different placement offsets;
- any per-character offset is introduced before the one-seat contract is
  accepted.

## Planned file boundary

After explicit approval, Step 5 may add or modify only:

- a new manifest under `assets/game/manifests/` for the single-seat lab;
- a new isolated feature folder under
  `apps/web/src/features/office/lab/workstation-v2-step5/`;
- the smallest query-route registration needed to open that lab;
- focused contracts and tests for this one-seat assembly;
- the five review images listed above;
- generated-art/geometry locks needed to verify those new outputs;
- this document and the assembly bible to record the review result.

It must not edit `assets/game/maps/office-c-v2.json`, Active Office placement
data, the 19-character source art, or current production furniture mappings.

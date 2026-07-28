# Office Workstation Step 5 Single-Seat Plan R02

Status: Implemented in an isolated lab; owner visual review required
Updated: 2026-07-28
Depends on: `assets/game/manifests/office-workstation-assembly-bible-v2.json`

Current machine-readable authority:
`assets/game/manifests/office-workstation-step5-single-seat-v2.json`

Character-scale authority:
`assets/game/manifests/office-character-scale-standard-v1.json`

The original Step 5 R01 result is rejected visual evidence. Its manifest remains
at `assets/game/manifests/office-workstation-step5-single-seat-v1.json` only so
tests can prevent the reversed desk sides, undersized actor, compressed chair,
and incomplete keyboard from returning. It is not an implementation input.

## Objective and boundary

Step 5 proves one existing character seated at one accepted `3 x 2` desk in two
directions before any ten-seat assembly is attempted. The lab reuses the
accepted Step 4 desk, existing chair, monitor, keyboard, and Einstein seated
frames. It creates no new character, pose, furniture identity, background, or
decorative art.

The two review views are:

- `far/front`: actor north of the desk, facing the viewer;
- `near/back`: actor south of the desk, facing away from the viewer.

This work is reachable only through the development query
`/?lab=office-workstation-v2-step5`. It must not change the Active Office map,
background, registry, route, or current 19-character roster.

## World ruler: current Office character

The visible scale already used by Active Office is the scale authority. At the
standard 32-pixel tile, a character frame renders at `96 x 104` pixels.

These four concepts must remain independent:

| Object | Floor footprint | Logical volume | Visible render envelope | Rule |
| --- | --- | --- | --- | --- |
| Character | `1 x 1` | `1 x 1 x 3` | `96 x 104` px at 32 px/tile | Hair, head, clothing, and limbs may overflow; never enlarge collision or clip the sprite |
| Chair | `1 x 1` | `1 x 1 x 2` | front `44 x 64` px; back `47 x 64` px | Seat/base and backrest are separate occlusion parts |
| Desk | `3 x 2` | `3 x 2 x 2.4` | `96 x 128` px | Render height below the top is not another floor row |
| Monitor | desk child | surface child | existing sprite | Centered on the far `3 x 1` reservation |
| Keyboard | desk child | surface child | full tight sprite `72 x 37` px | Centered on the actor-near `3 x 1` reservation |

The actor and chair reserve the same centered `1 x 1` floor cell outside the
desk. The actor pelvis/hip anchor and chair seat anchor must be the same world
point. The chair's first vertical unit covers its base through its seat; its
second covers the backrest. The actor's seated legs occupy the first logical
unit, torso the second, and head the third. These logical units guide scale and
occlusion; they are not clipping rectangles.

No per-character scale correction or wider collision box is allowed in Step 5.

## Desk-side semantics

Filename-facing labels from the source art are not used as spatial authority.
R02 assigns explicit semantic sides:

| Semantic side | Existing accepted pixels | Used when | Visible meaning |
| --- | --- | --- | --- |
| `public-side` | `desk.workstation.modern.v2.back.png` | `far/front` | modesty panel faces the viewer |
| `seat-side` | `desk.workstation.modern.v2.front.png` | `near/back` | drawers and knee opening face the seated actor/viewer |

This mapping corrects R01, where the front and back meanings were reversed.
Renderer code must request semantic sides and must not infer meaning from the
historical filename.

## Geometry and equipment placement

The desk local origin is its top-left floor cell. X increases right and Y
increases toward the viewer. With desk origin `(dx, dy)`:

| View | Desk footprint | Shared actor/chair footprint | Monitor row | Keyboard row |
| --- | --- | --- | --- | --- |
| `far/front` | `(dx, dy, 3, 2)` | `(dx + 1, dy - 1, 1, 1)` | local Y `1` | local Y `0` |
| `near/back` | `(dx, dy, 3, 2)` | `(dx + 1, dy + 2, 1, 1)` | local Y `0` | local Y `1` |

Monitor and keyboard reservations are each `3 x 1`, but their artwork is not
stretched to fill three tiles. The monitor is at the tabletop edge farthest
from the actor. The full keyboard is between actor and monitor. Both touch the
tabletop support plane, never the vertical desk face or floor.

## Chair derivation and occlusion

R02 does not generate a new chair. The existing front and back chair images
are deterministically split into:

- `chair-backrest`: the part that can sit behind the actor torso;
- `chair-seat-base`: seat, support, and wheels that remain under/in front of
  the seated body where the view requires it.

The derived pixels and their source hashes are locked in the R02 manifest.
Changing the split requires a new version and new owner evidence.

Required back-to-front layer order:

`far/front`

1. `chair-backrest`
2. `actor`
3. `chair-seat-base`
4. `desk-rear`
5. `desk-surface`
6. `keyboard`
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
7. `actor`
8. `chair-backrest`
9. `chair-seat-base`

Clean and debug views must use identical coordinates and layers. A wrong
result must be fixed in the shared contract, never hidden with a view-specific
or character-specific offset.

## R02 implementation sequence

1. Lock the current Active Office character scale as `1 x 1 x 3`, while
   retaining its current `96 x 104` render at a 32-pixel tile.
2. Reject R01 explicitly and introduce the R02 manifest with semantic desk
   sides, distinct logical/render geometry, and locked hashes.
3. Derive the two chair occlusion parts for each direction and a tight crop of
   the complete existing keyboard. Do not redraw pixels.
4. Rebuild the isolated station renderer from manifest data and the shared
   character-scale formula.
5. Prove the shared chair/person footprint, hip/seat anchor, logical volumes,
   desk footprint, equipment rows, semantic desk side, and animation stability
   in automated tests.
6. Capture the five owner-review images and stop at the owner gate.

## Review evidence

R02 evidence is stored under
`assets/art/layout-references/office-workstation-v2/step5-r02/`:

1. `01-character-scale-and-parts.png`
2. `02-far-front-corrected.png`
3. `03-near-back-corrected.png`
4. `04-volume-anchor-overlay.png`
5. `05-step5-r02-owner-contact-sheet.png`

The evidence must show the current Office character scale, public/seat desk
sides, full keyboard, chair parts, clean views, and logical-volume overlay.
The Active Office map hash remains
`c40db448eb8e6d0f3fea67a41f716c0108aca63a4136cfad15293534273c618d`.

## Owner gate and rejection conditions

R02 remains `owner-review` until the owner approves both clean views. Until
that approval:

- do not compose ten seats or start Step 6;
- do not calibrate the other 18 characters;
- do not add other furniture or props;
- do not promote anything into Active Office.

Reject R02 if the desk side is reversed, actor or chair enters the desk
footprint, actor and chair do not share one centered floor cell, the pelvis and
seat anchors differ, the actor is scaled down from current Office, visible
overflow is clipped, the chair is flattened into one render tile, the keyboard
is partial, equipment leaves the tabletop, any sprite is stretched, the full
rectangular desk top changes, or Active Office changes.

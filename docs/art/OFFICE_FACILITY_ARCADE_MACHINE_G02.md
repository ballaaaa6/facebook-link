# Office Facility Arcade Machine G02

Status: visual preflight pending owner review

Updated: 2026-07-29

## Decision boundary

Arcade Machine G02 replaces the rejected G01 shape direction with a completely
fresh generated cabinet identity. G01 remains immutable source-audit history;
G02 uses none of its pixels.

This stage proves the new cabinet shape, four visual elevations, `2 x 2 x 4`
scale, alpha ownership, screen viewport, three four-frame seam loops, and
shell/pivot invariance. It does not authorize production sockets, character
roster validation, reservation simulation, F8 review, furniture-only room
composition, or Active Office promotion. F4-F10 remain blocked.

## Locked visual-preflight contract

| Property | Value |
| --- | --- |
| Family | `machine.game.arcade.generated-modern` |
| Revision | `g02-preflight-r01` |
| Physical scale | `2 x 2 x 4` tiles |
| Floor footprint | `2 x 2` tiles |
| Render box | `3 x 4` tiles |
| Authoring canvas | `384 x 512` pixels |
| Runtime canvas | `96 x 128` pixels |
| Runtime derivation | Uniform `4:1`, nearest-neighbor |
| Orientations | Front, left, right, back |
| Anchor | Bottom-center |
| Base and sort pivot | `(1,2)` tiles |
| Runtime render pivot | `(48,124)` pixels |
| Capacity target | One |
| Visual pose target | I01 `interact-front` |
| Interaction model | Machine-local controls |
| Held prop | None |

No held controller is created, referenced, or implied. The joystick and buttons
remain attached to the cabinet. H01 has no Arcade controller authority.

## Fresh generated source authority

Five source images were generated with built-in ImageGen:

1. one straight-on front identity anchor;
2. one four-view turnaround derived from the anchor;
3. one Cosmic Drift art kit;
4. one Neon Rally art kit; and
5. one Dungeon Pulse art kit.

The exact prompts are recorded at:

`assets/art/layout-references/office-facility-family-v1/arcade-machine-g02/source/IMAGEGEN_PROMPTS.md`

Every source uses a flat magenta authoring background. The deterministic builder
samples the border, removes chroma, records alpha statistics, isolates each
declared ownership cell, and fails when selected alpha touches a cell edge.

G02 uses zero pixels from:

- Arcade G01;
- the facility-lounge or mechanical-loop original masters;
- processed modern-bright crops;
- rejected side orientations;
- Active Office furniture, facility, equipment, or decor;
- runtime registries or maps;
- legacy or rejected candidates; and
- fallback assets.

## Cabinet orientation authority

The turnaround contains four non-overlapping elevations in this order:

`front`, `left`, `right`, `back`

All four use the same baseline, height, warm off-white rails, charcoal shell,
cyan/amber accents, and feet. The front owns the identity. Side controls are
visible only where physically plausible. The back owns vents, a service panel,
and cable recess but no screen or controls.

These are visual elevations, not production route transforms. The full
four-orientation route and pivot matrix remains blocked.

## Screen-only animation

The runtime viewport is `[30,27,66,63]`, exactly `36 x 36` pixels. Its authoring
equivalent is `[120,108,264,252]`.

Only this viewport may change. Across all three games:

- shell changed pixels outside the viewport: `0`;
- control-region changed pixels: `0`;
- pivot delta: `(0,0)`; and
- phase-4 to phase-0 closure mismatch: `0`.

The shell, marquee, bezel, joystick, buttons, lower service panel, feet, base
pivot, and sort pivot are invariant.

## Three seam loops

| Game | Frames | Timing | Cycle |
| --- | --- | --- | --- |
| Cosmic Drift | A, B, C, D | `200 ms` each | `800 ms` |
| Neon Rally | A, B, C, D | `200 ms` each | `800 ms` |
| Dungeon Pulse | A, B, C, D | `200 ms` each | `800 ms` |

Each game begins with a fresh generated art kit containing a background,
player, obstacle, and effect. The builder composes the temporal frames using
deterministic scroll phases:

`0, 9, 18, 27, 36`

Phase `36` wraps exactly to phase `0`. The animated GIF naturally returns from
D to A; it does not add a held frame or shell animation.

## Review outputs

1. `01-cabinet-turnaround-4-sides.png`
2. `02-alpha-and-source-ownership.png`
3. `03-scale-2x2x4-vs-actor.png`
4. `04-footprint-and-render-box-3x4.png`
5. `05-screen-viewport-and-machine-controls.png`
6. `06-cosmic-drift-a-b-c-d-a.png`
7. `07-neon-rally-a-b-c-d-a.png`
8. `08-dungeon-pulse-a-b-c-d-a.png`
9. `09-shell-diff-and-pivot-lock.png`
10. `10-four-orientation-floor-preview.png`
11. `cosmic-drift-loop.gif`
12. `neon-rally-loop.gif`
13. `dungeon-pulse-loop.gif`

The review directory is:

`assets/art/layout-references/office-facility-family-v1/arcade-machine-g02/`

The exact files, sizes, and hashes are locked by:

`assets/game/manifests/office-facility-arcade-machine-g02.json`

## Reproduction

```bash
npm run art:facility:arcade:g02
npm run art:facility:arcade:g02:rebuild:check
npm run art:facility:arcade:g02:check
```

Passing `--stage full` to the builder fails while visual approval is absent.

## Work after owner approval

Approval of the exact visual-preflight hashes unlocks an isolated production
pass:

1. decompose static shell, viewport, and machine-local controls;
2. add I01 `interact-front` sockets without magic offsets or fallbacks;
3. validate `18 actors x 6 frames = 108` interaction cases;
4. validate four route/pivot transforms for `432` placement cases;
5. run the 30-second occupied, blocked, failure, release, and retry timeline;
6. stop at F8 for another owner review.

F9 remains forbidden until Facility v1 has all 20 reservation slots. G02 does
not add its planned slot while this visual review is pending.

## Owner decision requested

Review the four-side shape, `2 x 2 x 4` scale, three A-D-A strips, and animated
GIFs. Choose one outcome:

1. approve the exact G02 visual-preflight hashes and unlock isolated F4-F8
   production; or
2. reject the shape or game direction and request a new visual-only revision.

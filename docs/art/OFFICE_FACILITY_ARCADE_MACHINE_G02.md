# Office Facility Arcade Machine G02

Status: visual preflight owner-approved

Updated: 2026-07-29

## Decision boundary

Arcade Machine G02 replaces the rejected G01 shape direction with a completely
fresh generated cabinet identity. G01 remains immutable source-audit history;
G02 uses none of its pixels.

This stage proves the new cabinet shape, four visual elevations, `2 x 2 x 4`
scale, alpha ownership, screen viewport, three four-frame seam loops, and
shell/pivot invariance. The development-only I01 interaction demo in revision
r02 shows Anna approach, play, release, and depart. The owner approved the
exact r02 review hashes on 2026-07-29. The separate production revision now
passes F4-F7 and is waiting for owner review at F8. Furniture-only room
composition and Active Office promotion remain forbidden at F9-F10.

## Locked visual-preflight contract

| Property | Value |
| --- | --- |
| Family | `machine.game.arcade.generated-modern` |
| Revision | `g02-preflight-r02` |
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
| Visual decision | Owner-approved on 2026-07-29 |
| Newly authorized scope | Isolated F4-F8 production only |

No held controller is created, referenced, or implied. The joystick and buttons
remain attached to the cabinet. H01 has no Arcade controller authority.

## Single-actor interaction demo

`anna-approach-play-release.gif` is a deterministic visual demonstration of
one person arriving at the front of the machine, reaching toward its local
controls, playing while the Cosmic Drift viewport advances, releasing, and
leaving.

The approach uses Anna's existing `walk-left` runtime row, the departure uses
`walk-right`, and the machine action uses the six I01 `interact-front` frames.
Every frame comes from the same hash-locked runtime sheet. Every pose is placed
with:

`sceneRoot - frameRootSocket`

The scene root and every approach delta are integer coordinates. There is no
magic offset, fallback socket, hand mask, held controller, or generated prop.
The cabinet and screen frames are the same hash-locked G02 assets used by the
other preflight evidence.

This preview is development-only. The I01 character source remains marked
`pendingCommercialReview`; the GIF counts as neither one of the 108 roster
cases nor reservation, route, capacity, failure, retry, or production-socket
validation.

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
14. `anna-approach-play-release.gif`

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

Passing `--stage full` to this preflight builder still fails because production
must be implemented as a separate F4-F8 stage rather than mutating the approved
visual producer.

## Production handoff

Approval of the exact visual-preflight hashes unlocked an isolated production
pass, which now provides:

1. decompose static shell, viewport, and machine-local controls;
2. add I01 `interact-front` sockets without magic offsets or fallbacks;
3. validate `18 actors x 6 frames = 108` interaction cases;
4. validate four route/pivot transforms for `432` placement cases;
5. run the 30-second occupied, blocked, failure, release, and retry timeline;
6. a deliberate stop at F8 for another owner review.

The owner approved the production evidence at F8 on 2026-07-30. Arcade now
contributes one reservation slot, bringing Facility v1 readiness to `15/20`.
The production evidence and review boundary are documented in
`docs/art/OFFICE_FACILITY_ARCADE_MACHINE_G02_PRODUCTION.md`.

F9 remains forbidden until Facility v1 has all 20 reservation slots. G02 now
contributes its approved slot, but the room gate remains blocked.

## Owner decision recorded

On 2026-07-29 the owner approved:

- the exact `2 x 2 x 4` cabinet and four-side identity;
- all three A-D-A game strips;
- the modular piece-composition and seam-loop method; and
- the Anna approach, play, release, and depart preview.

This decision unlocks isolated F4-F8 production. It is not F8 family approval,
does not count the G02 reservation slot, and does not authorize F9 or F10.

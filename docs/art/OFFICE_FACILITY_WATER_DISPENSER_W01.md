# Office Facility Water Dispenser W01

Status: F0-F8 passed; owner-approved
Updated: 2026-07-29
Scope: One tall front-only `dispenser.water` facility family

## Decision boundary

Water Dispenser W01 is an isolated development family. It is not imported by
Active Office and cannot enter a furniture-only room. The owner approved the
exact W01 hashes independently on 2026-07-29. This unlocks isolated Coffee C01
production but does not approve Coffee or any later facility automatically.

The owner rejected the short audited water-dispenser form for this production
revision and directed W01 to use a newly created tall form. The older neutral
master cells remain audit and dimensional reference only. Their pixels, the
older animated loops, side orientations, processed crops, and Active Office
assets are not W01 inputs.

## Generated clean source

Source:

`assets/art/layout-references/office-facility-water-dispenser-w01-source.png`

SHA-256:

`9abef03d73fccdd709e9b07bd7fc50cfca9136a75de48be265ac7db7abe8df99`

The source was created with the built-in image-generation workflow, followed
by one background-only edit. The production prompt was:

> Create one original tall, slim, floor-standing office water dispenser as a
> clean isolated modern-bright pixel-art game asset. Use an exact straight-on
> front orthographic view, a large blue top bottle, a light gray and white
> cabinet, a dark navy recessed empty dispensing bay, blue/red controls, a
> stable full base, and a perfectly removable magenta backdrop. Include no cup,
> water stream, bubbles, steam, glow, person, furniture, shadow, text, logo, or
> watermark.

The deterministic builder samples the source border, removes the magenta key,
despills partial-alpha edges, and selects one connected subject:

| Property | Locked result |
| --- | --- |
| Source size | `781 x 2012` pixels |
| Owned bounds | `[203,112,574,1906]` |
| Connected components | `1` |
| Selected visible pixels | `637,652` |
| Canvas contact | None |
| Source-pixel resampling | None |
| Authoring padding | L326 / T190 / R327 / B64 |

The normalized `1024 x 2048` authoring cutout retains the source pixels at
their original scale. Runtime uses one uniform `16:1` nearest-neighbor
derivation.

## Facility contract

| Property | Locked value |
| --- | --- |
| Physical size | `1 x 1 x 4` tiles |
| Floor footprint | `1 x 1` tile |
| Runtime envelope | `64 x 128` pixels |
| Authoring canvas | `1024 x 2048` pixels |
| Orientation | Front only |
| Anchor | Bottom-center |
| Base/sort socket | `[32,128]` |
| Capacity | `1` |
| Visual pose | `interact-front`, row `10`, six frames |

The narrow visible silhouette occupies runtime bounds `[20,12,44,124]`, for a
visible height-to-width ratio of `4.667`. The render box is deliberately wider
than the one-cell footprint so the tall shell can retain transparent side
padding and a stable center anchor.

## Parts and local animation

W01 contains:

1. `static-shell`;
2. local viewport states A-D;
3. `output-bay-empty`;
4. `effect-ready`;
5. `effect-water-stream`; and
6. the independent H01 `held.water-cup-clear`.

The generated source is item-neutral. Its empty bay remains a separate part.
Ready light and water-stream pixels are code-authored W01 overlays contained
inside the local authoring viewport `[320,736,704,1312]`. The corresponding
runtime viewport is `[20,46,44,82]`.

Frame states:

| Frame | State | Effect parts |
| --- | --- | --- |
| A | Idle | None |
| B | Ready | Ready glow |
| C | Dispensing | Ready glow and water stream |
| D | Released | None |

Every changed pixel remains inside the viewport. The shell, base socket, sort
socket, render bounds, and empty output part remain unchanged.

## Spatial sockets and output handoff

Runtime-local sockets:

| Socket | Point |
| --- | --- |
| `base.floor` | `[32,128]` |
| `sort.floor` | `[32,128]` |
| `interaction.target` | `[32,126]` |
| `output.primary` | `[28,70]` |
| `effect.origin` | `[28,59]` |
| `viewport.origin` | `[20,46]` |

The cup uses H01's deterministic `visual.center` at native runtime scale one:

```text
propOrigin = parentSocketWorld - propVisualCenterSocket
attachmentDelta = [0,0]
renderOrder = actor-body -> held-prop
```

Timeline:

| Pose frame | Attachment parent |
| ---: | --- |
| 0 | None |
| 1 | None |
| 2 | `facility.output.primary` |
| 3 | `actor.hand.primary.grip` |
| 4 | `actor.hand.primary.grip` |
| 5 | None |

Actor-held frames use a complete front overlay. Hand masks, per-character
scale, per-character offsets, scene offsets, center fallbacks, and
missing-socket fallbacks are disabled.

## Interaction and reservation

The isolated grid locks:

- footprint `(0,0)`;
- stand cell `(0,+1)`;
- approach cell `(0,+2)`;
- exit cell `(-1,+2)`;
- front facing;
- capacity one;
- atomic reservation; and
- release on failure.

State order:

`available -> reserved -> approaching -> interacting -> dispensing -> releasing`

The 30-second deterministic lab uses two actors. Agent Alpha acquires first,
Agent Beta is blocked, Alpha fails and releases at second 7, Beta completes,
and Alpha succeeds on a retry starting at second 17. The run records one
blocked attempt, one failure, one successful retry, zero collisions, a maximum
of one reservation, and no held reservation at second 30.

## Roster evidence

W01 validates:

- 18 characters;
- six `interact-front` frames;
- 108 pose cases;
- 54 visible-cup cases;
- 18 facility-output attachments;
- 36 actor-hand attachments;
- 36 complete front overlays;
- 100% visible cup alpha in every actor-held case;
- zero hand-mask uses;
- zero attachment drift;
- one facility scale; and
- no per-character actor offset.

Prototype character sheets retain their existing commercial-review boundary.
W01 does not promote them or itself into Active Office.

## Review outputs

1. `01-source-ownership.png`
2. `02-alpha-parts.png`
3. `03-clean-front.png`
4. `04-geometry-grid-routes.png`
5. `05-animation-viewport.png`
6. `06-output-handoff.png`
7. `07-roster-fit-18x6.png`
8. `08-reservation-timeline-30s.png`
9. `09-socket-attachment-debug.png`
10. `10-shell-stability-difference.png`
11. `11-three-character-six-frame-front-overlay.png`
12. `12-three-character-hand-closeups-8x.png`

All review images are under:

`assets/art/layout-references/office-facility-family-v1/water-dispenser-w01/`

## Reproduction

Generate:

```bash
npm run art:facility:water:w01
```

Local deterministic rebuild check:

```bash
npm run art:facility:water:w01:rebuild:check
```

Portable CI validation:

```bash
npm run art:facility:water:w01:check
```

## Owner decision and next gate

The owner approved the exact tall Water W01 family and hashes on 2026-07-29
after reviewing the clean front, six-frame front-overlay board, and 8x
held-cup close-ups. The manifest records
`ownerDecision.decision = approved`.

This unlocks isolated Coffee Machine C01 production. Coffee must still pass
F0-F8 independently. Furniture-only F9 composition and Active Office F10
integration remain blocked.

# Office Facility Server Rack N02

Status: visual preflight owner-approved; isolated production authorized

Server Rack N02 is the fresh four-side redesign requested on 2026-07-30. It
replaces the N01 visual direction with a larger `2 x 2 x 4` cabinet and an
empty-hand interaction. The owner approved the exact eleven review hashes on
2026-07-30. This preflight remains F0-F3 evidence, while that visual decision
authorizes the separate N02 production revision. It does not itself claim pose
cases, reservations, F8 approval, room placement, or Active Office integration.

## Locked visual-preflight scope

| Contract | N02 value |
| --- | --- |
| Family | `server.rack.generated-modern` |
| Physical scale | `2 x 2 x 4` tiles |
| Floor footprint | `2 x 2` tiles |
| Render box | `3 x 4` tiles |
| Orientations | front, left, right, and back |
| Capacity target | One person per instance |
| Planned instances | Two, sharing one family |
| Semantic action | `inspect-front` |
| Visual pose authority | I01 `interact-front` |
| Held behavior | No held prop, no H01 dependency, no handoff |
| Status motion | Four-phase A-D-A seam loop |

The authoring canvas is `384 x 512`; runtime is `96 x 128` with uniform
integer divisor `4`. Base and sort pivots are locked to `[48,124]`.

## N01 redesign boundary

N01 remains preserved as historical F0-F3 evidence. Its original-master
front-only `2 x 1 x 3` shape and H01 tablet preview are not inputs to N02.
The N01 manifest records the owner redesign decision and points to
`office.facility.server-rack.n02`.

N02 uses zero N01, Active Office, original-master, processed-library, legacy,
or rejected pixels. The N02 front anchor, turnaround, and status kit are three
fresh built-in ImageGen source files. The front anchor is the only identity
reference used by the other two calls.

The exact prompts, input-image counts, raw files, hashes, key colors, alpha
statistics, component counts, and source-cell ownership are retained under
`assets/art/layout-references/office-facility-family-v1/server-rack-n02/source/`.

## Four-side identity

The family contains four separately extracted orthographic elevations:

- front: four equipment rows, one diagnostic viewport, lower service grille;
- left: opaque structural side with two ventilation groups;
- right: mirrored physical side with the same depth and ventilation language;
- back: rear ventilation, maintenance locks, and lower cable recess.

The four views share the same warm off-white shell, charcoal body, feet,
height, baseline, and material language. They are authored assets, not
runtime-generated turns.

## Modular motion

The status animation formula is:

`immutableShell[orientation] + statusViewport[n]`

The front orientation owns one declared viewport. Left, right, and back remain
static because the physical front display is not visible in those straight
elevations. The status source kit separates a screen base, cyan telemetry,
green nodes, and an amber alert. Code composes four real A-D phases and one
logical E equal to A.

Current evidence proves:

- every A-B-C-D-A transition changes status pixels;
- shell changes: `0`;
- outside-viewport changes: `0`;
- pivot delta: `[0,0]`;
- D-to-A closure mismatch: `0`;
- frame duration: `220 ms`.

## Empty-hand interaction

The development GIF uses semantic `inspect-front` while reusing the
owner-approved I01 `interact-front` visual pixels. Anna approaches, performs
the six-frame front interaction with empty hands, and departs.

No held prop is created or attached. N02 has no H01 dependency, tablet,
handoff, per-character offset, magic offset, or missing-socket fallback.
The machine-local target is declared independently from the actor root. This
single-actor preview does not count toward roster, orientation, or reservation
validation. Character pixels remain pending commercial review.

## Production and reservation stop

The later production target is:

- `18 x 6 = 108` base I01 pose cases;
- `108 x 4 = 432` four-orientation composition cases;
- two independent capacity-one instances;
- a thirty-second blocked, failure, release, and retry simulation.

None of those cases is built or claimed by this preflight revision. Server Rack
N02 therefore contributes zero slots here and Facility v1 remains `15/20`.
The approved shape unlocks the separate F4-F7 production build; its two
instances target `17/20` only after that exact production revision passes F8.

## Gate state

- F0 fresh generation policy and prompt/source hashes: passed.
- F1 `2 x 2 x 4` geometry, footprint, render box, and pivots: passed.
- F2 four-side alpha extraction and ownership: passed.
- F3 modular status and empty-hand visual previews: passed.
- F4-F8 are authorized only in the separate production revision.
- F9-F10 remain blocked.

Owner approval of the N02 visual shape authorizes the separate F4-F7
production build. It does not approve production hashes, slots, F9, or Active
Office promotion.

## Review outputs

1. `01-four-side-turnaround.png`
2. `02-alpha-source-ownership.png`
3. `03-clean-four-orientations.png`
4. `04-scale-2x2x4-vs-actor.png`
5. `05-footprint-renderbox-approach.png`
6. `06-parts-shell-status-composite.png`
7. `07-status-loop-a-d-a.png`
8. `08-orientations-two-instances.png`
9. `09-empty-hand-inspect-preview.png`
10. `server-rack-n02-status-loop.gif`
11. `anna-empty-hand-inspect.gif`

All review files live under
`assets/art/layout-references/office-facility-family-v1/server-rack-n02/`.

## Reproduction and validation

```bash
npm run art:facility:server:n02
npm run art:facility:server:n02:rebuild:check
npm run art:facility:server:n02:check
```

The builder owns all processed and review outputs. The rebuild check compares
the complete deterministic byte set without rewriting it.

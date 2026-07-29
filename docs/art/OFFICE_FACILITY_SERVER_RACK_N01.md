# Office Facility Server Rack N01

Status: visual preflight awaiting owner review

Server Rack N01 is a deterministic F0-F3 visual preflight for the next
Facility v1 family. It stops before production sockets, the 108/216-case
roster lab, two-instance reservation simulation, F8 approval, room placement,
or Active Office integration.

## Locked preflight scope

| Contract | Value |
| --- | --- |
| Family | `server.rack.noc` |
| Physical scale | `2 x 1 x 3` tiles |
| Floor footprint | `2 x 1` tiles |
| Render box | `2 x 3` tiles |
| Capacity target | One person per instance |
| Planned instances | Two, sharing one accepted raster family |
| Planned slots after F8 | Two independent reservations |
| Interaction semantic | `inspect-front` |
| Visual pose authority | I01 `interact-front` |
| Held prop | H01 `held.tablet` |
| Authored orientation | Front only |

The preflight uses a `256 x 384` authoring canvas and a `64 x 96` runtime
canvas with uniform integer divisor `4`. Base and sort pivots are locked to
`[32,92]`.

## Source ownership

Only two original project-created masters supply Server Rack pixels:

- the static front comes from
  `assets/art/layout-references/release-qa-noc-sheet-modern-bright-v1-source.png`;
- status phases A-D come from
  `assets/art/layout-references/mechanical-loops-sheet-modern-bright-v1-source.png`.

The new extraction does not reuse processed library crops, Active Office
pixels, generated repair pixels, or rejected side views. The static front is
one isolated component with no nominal-cell boundary contact.

Each audited mechanical-loop rack component crosses the nominal source-cell
top by ten pixels. N01 therefore does not claim or reuse those full animated
shells. It selects only an interior status viewport from each original source
cell. Every selected viewport stays inside its cell and contains only pixels
owned by the rack status panel. The exact source boxes, component bounds,
ownership masks, hashes, and audit records are recorded in
`assets/game/manifests/office-facility-server-rack-n01.json`.

Both audited side-view records remain rejected and unused. N01 authors front
only because that is the map-required interaction direction.

## Modular status motion

The animation formula is:

`immutableShell + statusViewport[n]`

The loop stores four real phases A-D at `220 ms` per frame and validates the
logical transition A-D-A. Only the declared status viewport may change.
Evidence currently proves:

- all four consecutive transitions contain changed status pixels;
- shell changes: `0`;
- outside-viewport changes: `0`;
- pivot delta: `[0,0]`;
- D-to-A closure mismatch: `0`.

This follows the modular motion standard: the facility shell, local status
loop, actor action, held prop, route, and reservation timelines remain
independent pieces.

## Interaction preview boundary

The Anna GIF is a development-only visual demonstration. The semantic action
is `inspect-front`, while its pixels reuse the owner-approved I01
`interact-front` pose. H01 `held.tablet` attaches through
`midpoint-primary-secondary` with `front-overlay`; visible held frames
`2,3,4` all prove attachment delta `[0,0]`.

The preview has no per-character offset and no missing-socket fallback. It
does not count toward roster validation or reservation validation. Actor
assets remain pending commercial review.

## Two-instance and reservation boundary

The review board shows `server-rack-01` and `server-rack-02` using the same
family pixels. Each instance is planned to have capacity one and an
independent reservation.

This preflight does not contribute reservation slots. Facility v1 remains
`15/20`. If the owner approves this shape and the later F4-F8 production
evidence passes, the two instances target `17/20`.

## Gate state

- F0 source policy and audit authority: passed.
- F1 geometry, scale, pivot, footprint, and approach: passed.
- F2 new versioned extraction and alpha ownership: passed.
- F3 visual part decomposition, loop, instance, and tablet preview: passed.
- F4-F10 remain blocked.

Owner approval of this visual preflight would authorize the separate F4-F7
production build. It would not approve reservation slots, F9 room placement,
or Active Office promotion.

## Review outputs

1. `01-source-ownership.png`
2. `02-clean-front-alpha.png`
3. `03-parts-shell-status.png`
4. `04-scale-actor-tablet.png`
5. `05-geometry-footprint-approach.png`
6. `06-status-loop-a-d-a.png`
7. `07-two-instance-preview.png`
8. `08-inspect-tablet-preview.png`
9. `server-status-loop.gif`
10. `anna-inspect-tablet.gif`

All review files live under
`assets/art/layout-references/office-facility-family-v1/server-rack-n01/`.

## Reproduction and validation

```bash
npm run art:facility:server:n01
npm run art:facility:server:n01:rebuild:check
npm run art:facility:server:n01:check
```

The builder owns all processed and review outputs. The rebuild check compares
the complete deterministic byte set without rewriting it.

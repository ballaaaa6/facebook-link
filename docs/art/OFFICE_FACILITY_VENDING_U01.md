# Office Facility Vending U01-r03

Status: F0-F7 passed; owner review F8 pending
Updated: 2026-07-29
Scope: One front-only `vending.machine.modern` facility family

## Decision boundary

U01-r03 is a development-only vertical slice. It is not imported by Active
Office, is not authorized for a furniture-only room, and cannot approve
another facility family. Water and Coffee production, F9 room placement, and
F10 runtime integration remain blocked until this exact revision receives an
explicit owner decision at F8.

The machine uses only the original project-created mechanical-loop master
admitted by
`assets/game/manifests/office-furniture-master-audit-v1.json`. Historical
processed vending crops are not pixel sources. The older item-neutral staging
loop remains behavior reference only.

## Why r03 exists

U01-r01 exposed a fixed-coordinate attachment defect. U01-r02 corrected the
coordinates with per-character, per-frame hand sockets, but owner review found
the soda still hard to see because the hand foreground mask was rendered above
the small prop.

R03 preserves the socket repair and supersedes only that presentation. It uses
Office Spatial Socket I01 and Held Props H01:

```text
propOrigin = parentSocketWorld - propVisualCenterSocket
attachmentDelta = [0,0]
renderOrder = actor-body -> held-prop
```

The r02 output folder and handoff board remain immutable historical evidence.
They are never runtime or pixel sources for r03.

## Facility contract

| Property | Locked value |
| --- | --- |
| Physical size | `2 x 1 x 3` tiles |
| Runtime envelope | `64 x 96` pixels |
| Authoring canvas | `256 x 384` pixels |
| Runtime derivation | Uniform `4:1`, nearest-neighbor |
| Orientation | Front only |
| Anchor | Bottom-center |
| Base/sort pivot | `(1,1)` |
| Capacity | `1` |
| Visual pose | `interact-front`, row `10`, six frames |

The facility contract is implemented in
`packages/contracts/src/officeFacilityProduction.ts`. It requires an immutable
shell, local animation viewport, empty output state, separate effect and held
asset, semantic facility and hand sockets, atomic reservation, release on
failure, 30-second validation, and the F0-F10 stop rules.

## Source ownership

Machine source:

`assets/art/layout-references/mechanical-loops-sheet-modern-bright-v1-source.png`

SHA-256:

`31109c9ecf2bc5b0f7d35caca821c77c29819fe19d73e895c88976e3d877274a`

All four front frames touch or cross the nominal bottom cell edge. The builder
keys the complete `1254 x 1254` master, calculates components across the full
image, and selects the dominant component owned by each audited cell.

| Frame | Audited cell | Owned full-master bounds | Pixels |
| --- | --- | --- | ---: |
| A | `[0,0,314,314]` | `[72,47,272,322]` | 52,209 |
| B | `[314,0,627,314]` | `[375,47,574,322]` | 51,759 |
| C | `[627,0,940,314]` | `[678,47,878,322]` | 51,748 |
| D | `[940,0,1254,314]` | `[981,47,1180,322]` | 51,743 |

Every silhouette is complete and stays away from the next machine and the
master boundary. Historical left and right vending records remain rejected
and are not generated.

The held soda is not cropped from the machine. It references `held.soda-can`
from the independently produced H01 source authority documented in
`docs/art/OFFICE_SPATIAL_SOCKET_SYSTEM_I01.md`.

## Part decomposition

The r03 family contains:

1. `static-shell`;
2. four local viewport states A-D;
3. `pickup-tray-empty`;
4. `effect-dispense`; and
5. a separate H01 `held.soda-can` dependency.

The authoring viewport is `[40,128,220,376]`; the runtime viewport is
`[10,32,55,94]`. Pixel comparison reports zero changed pixels outside the
viewport. The shell, base pivot, sort pivot, and render bounds stay identical
throughout the loop.

The product visible in the original mechanical frame D is removed and never
composited back into the shell or viewport. Product-signature checks report
zero embedded product pixels in machine frames A-D.

## Facility sockets and handoff

U01-r03 declares facility-local runtime sockets:

| Socket | Point |
| --- | --- |
| `base.floor` | `[32,96]` |
| `sort.floor` | `[32,96]` |
| `interaction.target` | `[48,96]` |
| `output.primary` | `[32,78]` |
| `effect.origin` | `[27,81]` |
| `viewport.origin` | `[10,32]` |

The six-frame action timeline uses zero-based indices:

| Pose frame | Prop state | Attachment parent |
| ---: | --- | --- |
| 0 | absent | none |
| 1 | absent | none |
| 2 | dispensed | `facility.output.primary` |
| 3 | held | `actor.hand.primary.grip` |
| 4 | held | `actor.hand.primary.grip` |
| 5 | absent/released | none |

The H01 can uses its alpha-bounds `visual.center` at native scale `1`.
Actor-held frames render:

```text
actor-body
held-prop
```

Nothing draws over the prop afterward. Every visible case resolves the visual
center to its parent with exact delta `[0,0]`; every actor-held case keeps 100%
of the prop alpha visible. Hand masks, per-scene offsets, per-character scale,
and missing-socket fallbacks are disabled for this presentation.

## Interaction and reservation

The isolated grid locks:

- stand cell `(1,+1)` at the front-right;
- approach cell `(1,+2)`;
- exit cell `(0,+2)`;
- capacity one;
- atomic reservation; and
- release on failure.

State order:

`available -> reserved -> approaching -> interacting -> dispensing -> releasing`

The deterministic 30-second lab uses two actors. Agent Alpha acquires first,
Agent Beta is blocked at the approach cell, Alpha's first visit fails and
releases at second 7, Beta completes next, and Alpha retries at second 17.
The proof records one blocked attempt, one failure, one successful retry, no
simultaneous holder, no shared occupied cell, zero collisions, and no
reservation at second 30.

## Character and attachment evidence

U01-r03 validates the I01 `interact-front` authority:

- 18 characters;
- 6 active frames;
- 108 pose cases;
- 54 visible prop cases;
- 18 facility-output attachment cases;
- 36 actor-hand attachment cases;
- one facility scale;
- H01 runtime scale `1`;
- 36 fully visible actor-held front overlays;
- zero hand-foreground-mask uses;
- zero visible-alpha failures;
- no per-character facility scale or actor offset; and
- zero attachment-delta failures.

Prototype character sheets retain `pendingCommercialReview` and remain outside
Active Office.

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
10. `10-r02-r03-before-after.png`
11. `11-three-character-six-frame-front-overlay.png`
12. `12-three-character-hand-closeups-8x.png`

All paths, hashes, dimensions, source records, parts, animation composites,
socket authorities, pose cases, and review boards are locked by
`assets/game/manifests/office-facility-vending-u01.json`.

## Reproduction

```bash
npm run art:facility:vending:u01
npm run art:facility:vending:u01:check
```

The check performs deterministic regeneration, contract validation, source
and dependency hash checks, exact file-set checks, geometry and viewport
checks, all 108 attachment cases, reservation samples, rejected orientations,
and Active Office isolation.

## F8 owner checklist

Review all twelve U01-r03 boards together and decide only this exact hash set:

- the front visual and `2 x 1 x 3` scale;
- static shell and local animation;
- empty pickup tray and separate effect;
- can position at the facility output socket;
- can position and complete top-layer visibility for all 18 characters;
- six-frame and 8x hand close-ups for Einstein, AI Workbot, and Doraemon;
- the r02-to-r03 presentation repair;
- approach and exit cells; and
- two-user failure/retry behavior.

Until that decision is recorded, the manifest remains
`owner-review-f8-pending`, `ownerDecision` remains `null`, and Water/Coffee,
F9, F10, and Active Office imports remain blocked.

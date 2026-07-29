# Office Facility Vending U01

Status: F0-F7 passed; owner review F8 pending
Updated: 2026-07-29
Scope: One front-only `vending.machine.modern` facility family

## Decision boundary

U01 is a development-only vertical slice. It is not imported by Active Office,
is not authorized for a furniture-only room, and cannot approve another
facility family. Water and coffee production, F9 room placement, and F10
runtime integration remain blocked until U01 receives an explicit owner
decision at F8.

The family uses only the original project-created mechanical-loop master
admitted by
`assets/game/manifests/office-furniture-master-audit-v1.json`. The older
processed vending crops and the item-neutral staging loop are not pixel
sources. The staging manifest is retained only as behavior and timing
reference.

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

The separate machine contract is implemented in
`packages/contracts/src/officeFacilityProduction.ts`. It requires an immutable
shell, local animation viewport, empty output state, separate effect and held
output, atomic reservation, release on failure, 30-second validation, and the
same F0-F10 stop rules used by the production gates.

## Source ownership

Source:
`assets/art/layout-references/mechanical-loops-sheet-modern-bright-v1-source.png`

SHA-256:
`31109c9ecf2bc5b0f7d35caca821c77c29819fe19d73e895c88976e3d877274a`

All four front frames touch or cross the nominal bottom cell edge. The builder
therefore keys the complete `1254 x 1254` master once, calculates connected
components across the full image, and selects the one component with dominant
ownership inside each audited cell.

| Frame | Audited cell | Owned full-master bounds | Pixels |
| --- | --- | --- | ---: |
| A | `[0,0,314,314]` | `[72,47,272,322]` | 52,209 |
| B | `[314,0,627,314]` | `[375,47,574,322]` | 51,759 |
| C | `[627,0,940,314]` | `[678,47,878,322]` | 51,748 |
| D | `[940,0,1254,314]` | `[981,47,1180,322]` | 51,743 |

Each selected silhouette continues only into empty magenta row space, retains
the complete feet and shadow, and does not reach the next machine or the master
boundary. The left and right historical records remain rejected because they
do not preserve the front-family identity, palette, or camera-locked
silhouette.

## Part decomposition

The new versioned family contains:

1. `static-shell` — frame A pixels outside the local viewport;
2. `viewport-a` — idle selection and closed tray;
3. `viewport-b` — screen response while the shell stays fixed;
4. `viewport-c` — freshly extracted empty open tray;
5. `viewport-d` — the same item-neutral tray state used for handoff;
6. `pickup-tray-empty` — empty tray child from original frame C;
7. `effect-dispense` — 129 source effect pixels, separate from the tray; and
8. `held-soda-can` — 1,724 freshly segmented source pixels from frame D.

The authoring viewport is `[40,128,220,376]`; the runtime viewport is
`[10,32,55,94]`. Pixel comparison reports zero changed pixels outside the
viewport for all four frames. The shell, base pivot, sort pivot, and render
bounds are identical throughout the loop.

The item in original frame D is never composited back into the machine.
Product-signature checks report zero embedded output pixels in frames A-D.
The held asset is visible only in interact-front pose frames 3-5, matching the
facility action contract.

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

The deterministic 30-second lab uses two actors. Agent Alpha acquires the
facility, Agent Beta is blocked and waits at the approach cell, Alpha's first
visit fails and releases at second 7, Beta completes next, and Alpha's retry
acquires at second 17 and succeeds. The run records one blocked attempt, one
failure, one successful retry, no simultaneous holders, no shared route cell,
zero collisions, and no reservation at second 30.

## Character evidence

The frozen internal prototype roster contains 18 Office agents with
`interact-front` on row 10. U01 validates six active frames for each agent:

- 18 characters;
- 6 active frames;
- 108 pose cases;
- one `64 x 96` facility scale;
- one shared actor position; and
- no per-character scale or offset.

The generated pose authority remains development-only,
`pendingCommercialReview`, and outside Active Office. It does not promote the
prototype character art for public or commercial use.

## Review outputs

1. `01-source-ownership.png`
2. `02-alpha-parts.png`
3. `03-clean-front.png`
4. `04-geometry-grid-routes.png`
5. `05-animation-viewport.png`
6. `06-output-handoff.png`
7. `07-roster-fit-18x6.png`
8. `08-reservation-timeline-30s.png`

All paths, hashes, dimensions, source records, parts, animation composites, and
review boards are locked by
`assets/game/manifests/office-facility-vending-u01.json`.

## Reproduction

Regenerate the candidate and evidence:

```bash
npm run art:facility:vending:u01
```

Verify deterministic regeneration, the facility contract, hashes, geometry,
pose coverage, reservation samples, rejected orientations, and Active Office
isolation:

```bash
python scripts/build-office-facility-vending-u01.py --check
npm run art:facility:vending:u01:check
```

## F8 owner checklist

Review the eight evidence boards together and decide only this exact U01 hash
set. Approval must confirm:

- the front visual and `2 x 1 x 3` scale;
- static shell and local animation;
- empty pickup tray;
- effect and held product separation;
- 18-character interact-front fit;
- approach and exit cells; and
- two-user failure/retry behavior.

Until that decision is recorded, the manifest remains
`owner-review-f8-pending`, `ownerDecision` remains `null`, and F9-F10 remain
blocked.

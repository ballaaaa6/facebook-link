# Office Facility Arcade Machine G01

Status: visual preflight pending owner review

Updated: 2026-07-29

## Decision boundary

Arcade Machine G01 is an isolated visual preflight. It proves source ownership,
the clean front silhouette, physical scale, render envelope, floor footprint,
and one front approach preview before any full facility system is built.

This preflight does not authorize part decomposition, production sockets,
character roster validation, reservation simulation, F8 review, furniture-only
room composition, or Active Office promotion. F4-F10 remain blocked.

Visual approval applies only to the exact front cutout and five review boards
hash-locked by:

`assets/game/manifests/office-facility-arcade-machine-g01.json`

## Locked preflight contract

| Property | Value |
| --- | --- |
| Family | `machine.game.arcade.modern` |
| Revision | `g01-preflight-r01` |
| Physical scale | `2 x 2 x 3` tiles |
| Floor footprint | `2 x 2` tiles |
| Render box | `3 x 3` tiles |
| Authoring canvas | `384 x 384` pixels |
| Runtime preview | `96 x 96` pixels |
| Derivation | Uniform `4:1`, nearest-neighbor |
| Orientation | Front only |
| Anchor | Bottom-center |
| Base and sort pivot | `(1,2)` |
| Capacity target | One |
| Visual pose target | I01 `interact-front` |
| Interaction model | Machine-local controls |
| Held prop | None |

No held controller is created, referenced, or implied. H01 has no Arcade
controller authority. A future full G01 system must keep the joystick and
control panel attached to the machine.

## Source authority

The only two pixel sources are original project-created masters admitted by the
Office furniture master audit.

### Static identity front

- source:
  `assets/art/layout-references/facility-lounge-sheet-modern-bright-v1-source.png`
- SHA-256:
  `9c60ebe86d971b7af8be33b8f1ab07d005e83dd8e3af0e380379719ebe50a6b1`
- audited cell: `[314,627,627,940]`
- audit record:
  `modern-bright-library-v1:env-05-facility-lounge:machine.game.arcade.modern`
- selected full-master component bounds: `[356,638,523,926]`
- selected pixels: `42,762`

The nominal source cell contains another significant component and touches its
right boundary. Full-master connectivity proves that the retained component is
the complete Arcade front while the discarded component belongs to the
neighboring `locker.bank.personal-15` family.

### Screen-source frames A-D

- source:
  `assets/art/layout-references/mechanical-loops-sheet-modern-bright-v1-source.png`
- SHA-256:
  `31109c9ecf2bc5b0f7d35caca821c77c29819fe19d73e895c88976e3d877274a`

| Frame | Audited cell | Selected full-master bounds | Pixels |
| --- | --- | --- | ---: |
| A | `[0,314,314,627]` | `[68,362,278,627]` | 51,259 |
| B | `[314,314,627,627]` | `[368,362,579,627]` | 51,096 |
| C | `[627,314,940,627]` | `[670,362,882,627]` | 51,590 |
| D | `[940,314,1254,627]` | `[972,362,1184,627]` | 51,355 |

Each nominal cell also intersects the preceding vending row. The full-master
ownership pass discards that vending component and keeps the complete Arcade
component. The selected Arcade components touch the nominal bottom cell edge
but do not touch a master-image boundary.

The A-D cutouts are ownership evidence only during this stage. Their cabinets,
bezels, joysticks, buttons, feet, and shadows are forbidden from a future G01
runtime family. After visual approval, only a measured screen-content viewport
may be derived from these sources and composited into the static identity
front.

## Explicit exclusions

G01 preflight uses zero pixels from:

- processed modern-bright Arcade crops;
- processed mechanical-loop crops;
- the rejected left or right Arcade orientations;
- Active Office furniture, facility, equipment, or decor;
- runtime registries or maps;
- legacy or rejected candidates; and
- generative repair.

Extraction starts from both complete `1254 x 1254` original masters. The
builder records keyed masters, full-master ownership masks, normalized source
cutouts, hashes, component bounds, and discarded-neighbor explanations.

## Scale and placement preview

The source-exact front is bottom-centered on a `384 x 384` authoring canvas and
reduced uniformly to the `96 x 96` runtime preview. It is not stretched to fill
the two-tile physical width.

The five-board review intentionally exposes whether that unmodified silhouette
has sufficient visual bulk for the locked `2 x 2` footprint. A rejection
returns G01 to a fresh-source visual preflight instead of repairing or widening
the accepted-master pixels.

The local preview reserves:

- four footprint cells in a `2 x 2` block;
- stand cell `(1,2)`;
- approach cell `(1,3)`;
- exit cell `(0,3)`; and
- one front approach row.

These cells are preflight geometry only. No reservation timeline or room route
is built at this stage.

## Review outputs

1. `01-source-ownership.png`
2. `02-clean-front-alpha.png`
3. `03-scale-actor-1x1x3.png`
4. `04-footprint-render-box.png`
5. `05-floor-approach-preview.png`

The review directory is:

`assets/art/layout-references/office-facility-family-v1/arcade-machine-g01/`

No sixth review board, part board, screen composite, roster matrix, close-up,
or reservation timeline may exist before visual approval.

## Reproduction

```bash
npm run art:facility:arcade:g01
npm run art:facility:arcade:g01:rebuild:check
npm run art:facility:arcade:g01:check
```

The deterministic rebuild check compares every generated byte. The portable
checker validates the preflight contract, original-master hashes, audit
decisions, selected and discarded components, exact file sets, five review
hashes, rejected side orientations, the full-build lock, and Active Office
isolation.

Passing `--stage full` to the builder fails while `visualApproval` is absent.

## Owner decision requested

The owner should review the exact five-board set and choose one outcome:

1. approve the source-exact Arcade silhouette and unlock isolated F4-F7
   production; or
2. reject the silhouette, record the visual reason, and request three or four
   fresh preflight-only replacements.

Until that decision is recorded, Facility v1 remains at 14 of 20 approved
reservation slots. G01 does not contribute its one planned slot.

# Office Semantic Grid v6

Status: Owner-approved final Office V1 Active Office background
Updated: 2026-07-30

Office Semantic Grid v6 contains the V8 background requested from the owner's
annotated V4 grid. The exact reviewed candidate was approved on 2026-07-30 and
promoted byte-for-byte as the final Office V1 Active Office background.

## Requested changes

| Change | Grid range | Exact pixel rectangle |
| --- | --- | --- |
| Blank left whiteboard | `D4:L9` | `x 117..466`, `y 118..352` |
| Future whiteboard content | `E5:K8` | `x 156..427`, `y 157..313` |
| Left slat pillar | `A1:B11` | `x 0..77`, `y 0..430` |
| Center slat pillar | `AB1:AD11` | `x 1050..1166`, `y 0..430` |
| Right slat pillar | `AP1:AQ11` | `x 1594..1671`, `y 0..430` |
| Office SPC floor | `C11:AA11`, `A12:AA24` | Stops at `x=1050` |

The three former beige wall panels are removed. The whiteboard is blank and
the right Relax Area brick wall remains blank. The complete Office floor uses
light warm-oak SPC in a herringbone pattern; the Relax Area straight-plank
floor remains unchanged.

## Promotion boundary

- Candidate:
  `assets/art/backgrounds/office-c-background-modern-v8-owner-review.png`
- Promoted current background:
  `assets/art/backgrounds/office-c-background-modern-v8-current.png`
- Owner markup:
  `assets/art/layout-references/office-semantic-grid-v6/00-owner-markup.png`
- Candidate and current background SHA-256:
  `d0c0ef48c22fd40747b63017e6a24593da1eab1186dfb5d45c3a50853b674f56`
- Historical V7 remains immutable rollback evidence. The V1 runtime imports
  only the promoted V8 current path.

Run `npm run art:office-semantic-grid:v6` to rebuild the candidate, promoted
current background, and review images. Run
`npm run art:office-semantic-grid:v6:check` for the portable CI contract.

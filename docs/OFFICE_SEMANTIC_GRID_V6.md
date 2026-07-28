# Office Semantic Grid v6

Status: Isolated owner-review candidate
Updated: 2026-07-29

Office Semantic Grid v6 contains the V8 background candidate requested from
the owner's annotated V4 grid. It is not the Active Office background and does
not change runtime imports.

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

## Review boundary

- Candidate:
  `assets/art/backgrounds/office-c-background-modern-v8-owner-review.png`
- Owner markup:
  `assets/art/layout-references/office-semantic-grid-v6/00-owner-markup.png`
- Active V7 background and runtime remain unchanged until explicit owner
  approval.

Run `npm run art:office-semantic-grid:v6` to rebuild the candidate and review
images. Run `npm run art:office-semantic-grid:v6:check` for the portable CI
contract.

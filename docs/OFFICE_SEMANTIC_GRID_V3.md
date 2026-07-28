# Office Semantic Grid v3

Status: Rejected; superseded by Office Semantic Grid v4
Updated: 2026-07-29

Office Semantic Grid v3 is retained as rejection evidence. Its left-pillar
source crop included carpet pixels below the original wood base. Resizing that
mixed crop made the visible wood stop before the bottom of row 11.

## Pillar alignment

| Pillar | Semantic range | Exact pixel rectangle |
| --- | --- | --- |
| Left | `A1:B11` | `x 0..77`, `y 0..430` |
| Center | `AB1:AD11` | `x 1050..1166`, `y 0..430` |
| Right | `AP1:AQ11` | `x 1594..1671`, `y 0..430` |

Although the target rectangle ended before row 12, the visible left-pillar
base did not fill its declared `A1:B11` range. V4 corrects this by cropping only
the original wood through source pixel `y=415` and stretching that complete
wood crop through target pixel `y=430`.

## Boundaries

- The v2 window and floor-material corrections remain unchanged.
- The `43 x 24` grid and all 1,032 semantic assignments remain unchanged.
- No people, furniture, props, or runtime placements are added.
- V3 must not be promoted to Active Office.
- V4 is the completed current background.

Run `npm run art:office-semantic-grid:v3` to rebuild the candidate and
`npm run art:office-semantic-grid:v3:check` to verify the rejected evidence.

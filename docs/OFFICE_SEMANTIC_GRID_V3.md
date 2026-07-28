# Office Semantic Grid v3

Status: Isolated owner-review candidate
Updated: 2026-07-29

Office Semantic Grid v3 preserves every v2 semantic cell assignment while
aligning the visible pillar artwork to the three declared pillar ranges.

## Pillar alignment

| Pillar | Semantic range | Exact pixel rectangle |
| --- | --- | --- |
| Left | `A1:B11` | `x 0..77`, `y 0..430` |
| Center | `AB1:AD11` | `x 1050..1166`, `y 0..430` |
| Right | `AP1:AQ11` | `x 1594..1671`, `y 0..430` |

Row 12 begins at pixel `y=431`. No pillar artwork remains in row 12 or below.
Released side pixels are repaired from their adjacent wall surfaces, and the
released bottom pixels are repaired from the appropriate Office or relaxation
floor surface.

## Boundaries

- The v2 window and floor-material corrections remain unchanged.
- The `43 x 24` grid and all 1,032 semantic assignments remain unchanged.
- No people, furniture, props, or runtime placements are added.
- Active Office remains unchanged.

Run `npm run art:office-semantic-grid:v3` to rebuild the candidate and
`npm run art:office-semantic-grid:v3:check` to verify freshness.

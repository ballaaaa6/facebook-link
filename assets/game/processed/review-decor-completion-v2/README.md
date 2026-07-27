# Review and Decor Completion v2

This isolated staging batch replaces the rejected angled review-table source.
It does not modify the active Office map.

## Generation

- Tool: built-in image generation
- Source:
  `assets/art/layout-references/review-decor-completion-sheet-modern-bright-v2-source.png`
- Keyed source: `source-keyed.png`
- Targeted table replacement:
  `assets/art/layout-references/review-table-modern-elevated-v3-source.png`
- Targeted keyed source: `table.review.long.modern.source-keyed.png`
- Style references:
  `decor-architecture-tv-sheet-modern-bright-v1-source.png` and the rejected
  v1 review sheet for pixel density only
- Contract: one 4x4 decor sheet plus one targeted table replacement, flat
  magenta background, Modern Bright Concept C palette, no left/right rotation,
  and a slightly raised frontal table view with parallel edges

The prompt requested one four-seat `table.review.long.modern`, followed by
fifteen library-only planters, office plants, sculptures, and tabletop decor.
It explicitly rejected chairs, characters, machines, cabinets, power hubs,
speakers, text, logos, shadows, and angled furniture.

## Acceptance

- 16 of 16 cells extracted with non-empty alpha bounds.
- The review table uses a 4x1 footprint and 4x2 render box.
- Four existing office chairs are composed as two seats per long side.
- Seat geometry is unchanged. Per author direction, the visual composition
  board was not rerun after the targeted table-only raster replacement.
- The active Office does not import or display this batch.

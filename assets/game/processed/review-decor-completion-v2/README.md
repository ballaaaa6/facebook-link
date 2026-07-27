# Review and Decor Completion v2

This isolated staging batch replaces the rejected angled review-table source.
It does not modify the active Office map.

## Generation

- Tool: built-in image generation
- Source:
  `assets/art/layout-references/review-decor-completion-sheet-modern-bright-v2-source.png`
- Keyed source: `source-keyed.png`
- Style references:
  `decor-architecture-tv-sheet-modern-bright-v1-source.png` and the rejected
  v1 review sheet for pixel density only
- Contract: one 4x4 sheet, flat magenta background, one isolated object per
  cell, Modern Bright Concept C palette, and strict straight-front orthographic
  elevation with no perspective top plane

The prompt requested one four-seat `table.review.long.modern`, followed by
fifteen library-only planters, office plants, sculptures, and tabletop decor.
It explicitly rejected chairs, characters, machines, cabinets, power hubs,
speakers, text, logos, shadows, and angled furniture.

## Acceptance

- 16 of 16 cells extracted with non-empty alpha bounds.
- The review table uses a 4x1 footprint and 4x2 render box.
- Four existing office chairs are composed as two seats per long side.
- Front and rear seated rows pass separately and together.
- The active Office does not import or display this batch.

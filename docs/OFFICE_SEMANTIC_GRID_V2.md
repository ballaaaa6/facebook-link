# Office Semantic Grid v2

Status: Superseded by Office Semantic Grid v3 pillar-alignment review
Updated: 2026-07-29

Office Semantic Grid v2 turns the owner's full-image highlights into one
complete `43 x 24` semantic map. It also provides a new empty-background
candidate whose visible window and floor-material boundary follow the same
grid.

## Owner decisions

- The outside window is `N4-Z9`.
- `AA4-AA9` returns to the Office wall.
- The Office floor is `C11-AA11` plus `A12-AA24`.
- The relaxation floor is `AE11-AO11` plus `AB12-AQ24`.
- The prior `AB12-AB24` buffer is removed.
- The left, center, and right pillars remain separate two-, three-, and
  two-column structures.

## Physical candidate edits

- The window right boundary moves from `x=1050` to the `Z|AA` grid boundary
  at `x=1011`.
- The floor-material boundary moves from `x=1065` to the `AA|AB` grid boundary
  at `x=1050`.
- No people, furniture, props, or runtime map placements are added.
- `office-c-background-modern-v3.png` and Active Office remain unchanged.

Run `npm run art:office-semantic-grid` to rebuild the candidate and review
images. Promotion requires a separate explicit owner decision.

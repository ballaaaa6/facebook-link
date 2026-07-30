# Office Semantic Grid v5

Status: Superseded by Semantic Grid v6; historical V1 rollback
Updated: 2026-07-30

Office Semantic Grid v5 replaces the visually inconsistent localized pillar
repairs in the earlier localized-pillar candidate with a clean native
architectural rerender. The V7 background is normalized across complete
architectural segments, so no small patch is blended into a pillar base or
wall seam. It was superseded by the owner-approved Semantic Grid v6/V8
background on 2026-07-30 and remains immutable rollback evidence.

## Historical scene

- Background:
  `assets/art/backgrounds/office-c-background-modern-v7-current.png`
- Canvas: `1672 x 941`
- Grid: `43 x 24`
- Left pillar: `A1:B11`
- Center pillar: `AB1:AD11`
- Right pillar: `AP1:AQ11`
- Window: `N4:Z9`
- Office/relaxation floor split: `AA|AB`

All three pillars are rendered as complete structures and end at pixel
`y=430`. Row 12 begins at `y=431`.

## Work-status whiteboard

The right relaxation wall now contains one blank whiteboard:

- Reserved wall range: `AF4:AN9`
- Dynamic content range: `AG5:AM8`
- Rendered frame: `x=1205`, `y=136`, `width=350`, `height=195`
- Dynamic content viewport: `x=1244`, `y=157`, `width=272`, `height=157`

The background keeps the board blank. Future runtime content may display the
workflow, current stage, progress, human-review state, and last update time
inside `whiteboardContent` without regenerating the room background.

## Reproduction

The approved generation prompt is recorded in
`assets/art/layout-references/office-semantic-grid-v5/IMAGEGEN_PROMPT.md`.
`scripts/build-office-semantic-grid-v5.py` deterministically normalizes the
generated source to the semantic boundaries and preserves the historical
background and review images.

Run `npm run art:office-semantic-grid:v5` to rebuild the deterministic outputs
and `npm run art:office-semantic-grid:v5:check` for the portable CI contract.

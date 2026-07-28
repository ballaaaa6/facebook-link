# Office Full Grid

`assets/game/maps/office-full-grid-v1.json` defines a neutral coordinate grid
over the entire existing Office background. It contains no inferred floor,
wall, pillar, furniture, or navigation classifications.

- The grid covers the full `1672 x 941` image.
- It has 43 columns labelled `A` through `AQ`.
- It has 24 rows labelled `1` through `24`.
- `A1` is the top-left cell and `AQ24` is the bottom-right cell.
- The owner assigns every future zone by referring to these labels.
- Active Office remains unchanged until a later explicit promotion task.

Run `npm run art:office-full-grid` to rebuild the deterministic review image.

# Office Semantic Grid v6 ImageGen prompt

Use case: precise-object-edit

Asset type: isolated V8 owner-review candidate for the empty Office background

Image 1 is the exact clean V4 scene and composition reference. Image 2 is the
owner's annotated `43 x 24` grid. Pink marks the left whiteboard range
`D4:L9`, and purple marks the three pillar ranges. Grid lines, cell labels,
colored highlights, and legends must not appear in the generated source.

Make exactly three changes:

1. Remove the three beige panels and their shadows. Install one blank
   whiteboard at `D4:L9`, with a clean matte display surface at `E5:K8`.
2. Rerender all three complete pillars as native warm vertical wood-slat
   structures inside `A1:B11`, `AB1:AD11`, and `AP1:AQ11`.
3. Replace the complete Office floor with light warm-oak SPC in a clear,
   consistent herringbone pattern. Keep the Relax Area straight-plank floor.

Preserve the V4 canvas, camera, window `N4:Z9`, city view, wall colors, brick
Relax Area wall, ceiling lights, baseboards, and floor split. Keep the right
brick wall blank. Do not add people, furniture, props, text, UI, labels, grid,
watermarks, or any unrequested decoration.

The generated source is normalized deterministically by
`scripts/build-office-semantic-grid-v6.py` to land on exact grid boundaries.

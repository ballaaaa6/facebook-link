# Office Semantic Grid v5 ImageGen prompt

Use case: precise-object-edit / new clean architectural rerender

Asset type: production empty-office game background, V7 candidate

Image 1 is the exact clean scene and composition reference. Image 2 is the
exact `43 x 24` grid and semantic-zone geometry reference; its grid lines,
labels, legend, and colored overlays must not appear in the output.

Create a clean new render of the same empty room with two requested changes:

1. Natively rerender all three wood pillars and their wall, base, and floor
   joins so they are seamless, naturally constructed, and contain no stretched
   texture or repair artifacts.
2. Install one large blank whiteboard on the right relaxation wall.

Preserve the complete wide room, camera, window design, wall height, floor
depth, office/relaxation split, soft daylight, and polished semi-realistic
illustrated game-background style. Keep the room empty. Do not add people,
furniture, props, signs, UI, text, labels, a grid, a watermark, or extra
decoration. The whiteboard must have a matte blank surface, slim warm-gray
metal frame, and subtle wall-contact shadow.

The generated source is normalized deterministically by
`scripts/build-office-semantic-grid-v5.py` so the final background lands on
the exact semantic-grid boundaries.

# Modern workstation desk v2 source prompt

Generation mode: built-in ImageGen, precise pixel-art asset replacement.

## References

- `desk-workstation-modern-v2-turnaround-chroma.png`: rejected low-camera edit target; replaced by this run.
- `../03-assembly-and-adjacency-v2.png`: approved 3 x 2 geometry and adjacency reference.
- `../../office-modern-operations-target-v2.png`: elevated-camera and usable-surface reference only.

## Final prompt

Use case: precise pixel-art asset replacement for a top-down office game.

Inputs:

- Image 1 is the REJECTED edit target. Replace it; do not preserve its low camera angle or thin tabletop surface.
- Image 2 is the approved geometry/assembly reference. Follow its 3x2 modular footprint, front/back roles, centered workstation logic, and edge-to-edge adjacency intent.
- Image 3 is the owner's visual target reference. Study only the elevated game-camera principle and the fact that broad desk surfaces visibly hold monitors, keyboards, and props. Do not copy its furniture, room, people, branding, or composition.

Create one NEW two-cell turnaround sheet containing exactly two isolated matching modern office desks: LEFT strict FRONT-facing module with a right-side two-drawer pedestal, RIGHT strict BACK-facing module. Both are the same desk viewed from opposite cardinal orientations.

Critical camera correction:

- raise the orthographic game camera substantially above Image 1;
- make the usable TOP SURFACE a broad, clearly visible plane, visually more important than the lower legs/apron/pedestal;
- the visible top-surface depth should be approximately 35-45% of the complete desk sprite height, enough to place one monitor and one keyboard with clear separation;
- the lower structure remains readable but secondary, approximately 55-65% of sprite height;
- this is an elevated top-down orthographic/elevation hybrid for a 2D tile game, not an eye-level front elevation.

Non-negotiable modular tabletop geometry on BOTH desks:

- one complete full rectangular 3-by-2 tabletop slab;
- in screen space the far edge and near edge are perfectly horizontal, parallel, equal full width;
- left and right tabletop edges are perfectly vertical, parallel, equal visible depth;
- all four tabletop corners are square 90-degree corners in screen space;
- exact same left and right limits from far edge through near edge and front lip;
- no trapezoid, no narrowing, no wedge, no sloped/chamfered/diagonal side edge, no rounded or clipped corner;
- identical modules must touch side-by-side with zero triangular gap and a single straight seam;
- FRONT and BACK sprites use identical tabletop outer dimensions and baseline.

Style: polished clean pixel art matching Image 1's pale cream top, dark navy/charcoal outlines and supports, light gray modesty panel, right-side drawer pedestal, compact modern-office proportions, crisp controlled pixel clusters, limited palette, no antialias blur.

Sheet/layout: wide landscape canvas, FRONT centered in left half and BACK centered in right half, generous equal padding, matched scale and baseline. Flat perfectly uniform solid #FF00FF chroma-key background, identical at every pixel, no gradient, texture, shadow, floor, reflection, panel, divider, labels, or text.

Exclude: monitors, keyboards, mouse, chairs, people, props, room, walls, floor, cast shadows, logos, watermark, extra desks, isometric view, oblique view, diagonal view, three-quarter rotation, perspective convergence, cropped pixels.

Acceptance priority: broad usable top plane first; full rectangular edge-to-edge modularity second; matching front/back scale third; decoration last.

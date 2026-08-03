# Workstation Basic V2 Visual Contract

Status: **FROZEN FOR P5-W6.5-R1 REWORK**

This contract freezes the visual and projection facts that must be satisfied by
`workstation-basic/v2` before any pixel output can be considered evidence. It
does not approve the family for runtime use. The existing `workstation-basic/v1`
source and reports remain immutable rejected historical evidence.

## Projection and camera

- Projection: `office-projection-v1`, fixed 2:1 dimetric/isometric diamond.
- Camera rotation: `0`; camera quadrant: **southeast**, looking toward the
  northwest corner of the world cell.
- Visible faces: **top**, **south**, and **east**. The north and west faces are
  occluded for this fixed view.
- World axes per cell: `+X/east -> screen (+32,+16)`,
  `+Y/south -> screen (-32,+16)`, `-X/west -> screen (-32,-16)`, and
  `-Y/north -> screen (+32,-16)`.
- Logical facing mapping remains the accepted projection mapping: north to
  screen-northeast, east to screen-southeast, south to screen-southwest, and
  west to screen-northwest.

## Native canvas and geometry relation

- Native tile: `64x32` logical pixels per world cell, four sub-cell units per
  cell, and `16` logical pixels per elevation unit.
- Family footprint: `2x1` world cells; declared clearance remains `3x2` cells.
- Native sprite canvas: `176x96` pixels with an 8-pixel transparent safety
  margin around the projected footprint and visible height.
- Sprite origin: `(40,24)` is the screen pixel for the ground projection of the
  footprint's north corner `(worldX=0, worldY=0)`.
- Projected footprint corners are fixed to `(40,24)`, `(168,56)`, `(136,72)`,
  and `(8,40)` in clockwise north/east/south/west order.
- Visual height: `48` pixels from the top-plane crest to the lowest ground
  contact; the asset owns only sprite-pixel facts and references the
  authoritative world geometry.
- Ground contact: the south-east footprint corner at `(136,72)`.
- Seated socket: world sub-cell `(4,4)` at zero elevation projects to sprite
  pixel `(40,56)`. The seated actor overlay must use that exact contact and may
  not add a scene-specific offset.

## Pixel construction rules

- Top-plane edge slopes are exactly `+1/2` and `-1/2` screen pixels per
  horizontal pixel run, expressed as a 2-pixel horizontal step for each
  1-pixel vertical step in the native raster.
- Side-plane vertical edges are exactly vertical (`infinite` slope); side-plane
  top and bottom boundaries inherit the same `+1/2` and `-1/2` top-plane
  slopes. No orthographic horizontal tabletop or front-facing rectangle is
  permitted.
- Lighting is fixed from **northwest**: top planes receive the light palette,
  the visible south face is the darkest material plane, and the visible east
  face is the middle plane. Cast shadow pixels use the declared shadow role and
  remain separate from world occupancy.
- Rendering and all enlarged boards use nearest-neighbor filtering only.
- Palette roles are bounded and explicit: transparent, outline, top-light,
  wood-mid, south-shadow, east-mid, metal, accent, actor-skin, actor-cloth,
  and contact-highlight. Light and dark background previews use fixed opaque
  backgrounds and do not alter source pixels.

## Connectivity and variants

The local bit mask remains `north=1`, `east=2`, `south=4`, `west=8`, and the
family supports only the accepted east-west set:

| Mask | Visual difference |
| --- | --- |
| `0` | isolated: west and east end caps are both visible |
| `2` | east-end: the east seam is open/flush for an east neighbor; west cap remains |
| `8` | west-end: the west seam is open/flush for a west neighbor; east cap remains |
| `10` | middle: both east and west seams are open/flush; no end cap is visible |

The top-plane footprint, sprite origin, ground contact, and seated socket are
identical across all four masks. The seams are fixed to the projected end
edges: west seam `(40,24)->(8,40)` and east seam `(168,56)->(136,72)`. North,
south, corner, tee, cross, and vertical-middle masks remain rejected.

## Composition evidence

The rework must generate, outside runtime/manifests:

- enlarged native-scale and connectivity boards using integer nearest-neighbor
  scale;
- a three-workstation seam composition in west-to-east order `2,10,8`;
- a seated actor/contact overlay anchored at `(40,56)`;
- identical light-background and dark-background previews;
- two clean factory builds with byte-identical output and report bytes.

The actor overlay is review-only geometric evidence and does not create or
admit a second character family.

## Prohibited shortcuts and review gate

- No reference or legacy pixels, copied renderer pixels, scene-specific offset,
  orthographic/front-facing substitute, hidden fallback, or disabled connector
  action may enter the family.
- Source, recipe, contract, provenance, geometry, review, boards, registry, and
  output hashes must be versioned under `workstation-basic/v2`.
- The family remains `spec-only` and outside `assets/office-v2/runtime/` and
  `assets/office-v2/manifests/` until explicit owner outcomes are recorded.
- Geometry, visual, and commercial review are independent gates; technical
  hashes and passing automation never infer owner approval.

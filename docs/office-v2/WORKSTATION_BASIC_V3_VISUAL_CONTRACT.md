# Workstation Basic V3 Visual Contract

Status: SELECTED CONCEPT 3 — FROZEN FOR DETERMINISTIC RECONSTRUCTION

This contract records the owner's selection of concept candidate 3. The
concept board is an art-direction reference only. It is not a source pixel
layer and is not eligible for runtime import.

## Projection and geometry

- Projection: office-projection-v1, fixed 2:1 dimetric/isometric diamond.
- Camera quadrant: southeast, with top, south, and east faces visible.
- World axes: +X/east -> (+32,+16), +Y/south -> (-32,+16).
- Native tile: 64x32 logical pixels per world cell.
- Footprint remains 2x1 world cells with the existing authoritative geometry
  and clearance reference.
- Native canvas remains 176x96 with integer nearest-neighbor pixels.
- Sprite origin remains (56,24).
- Projected footprint corners remain (56,24), (120,56), (88,72), and
  (24,40).
- Visual height remains 48 pixels unless a focused fit test proves that the
  selected design cannot be represented without clipping or unreadable
  compression.
- Ground contact remains the southeast footprint corner (88,72).

## Interaction terminology

The workstation owns a workstationDock, not a seated-character socket.

- Dock projection: (56,56), derived from the existing (4,4) world sub-cell
  reference at zero elevation.
- Dock ownership: chair docking region, working-side facing, clearance, and
  keyboard/work-surface target.
- Chair-owned facts: seat socket, seat height, seat facing, pelvis reference,
  and chair base.
- Character-owned facts: skeleton, seated pose, pelvis, hand and foot
  effectors, and stand/sit/work transitions.
- The full workstation + chair + seated-character test is deferred until
  production chair and seated-character families exist.
- No scene-specific pixel offset may be added to make the dock appear to work.

## Selected concept 3 design intent

Preserve the following visual identity while reconstructing the pixels:

- warm wooden desktop;
- charcoal structural supports and exposed end storage;
- restrained teal privacy-panel accent;
- elevated slatted back frame;
- readable open working side;
- a limited planter only on an exposed east end;
- clear 2:1 depth and northwest light.

The selected design must remain legible at native scale. Keyboard, monitor,
chair, character, and loose desk decorations are deferred props and must not
be baked into every connectivity mask.

## Modular component contract

Repeatable components:

- desktop core;
- teal privacy-panel segment;
- slatted back-frame segment;
- back-frame rail;
- structural under-support;
- shadow layer.

Exposed-end components:

- west frame post and west storage only when the west end is exposed;
- east frame post, east storage, and east planter only when the east end is
  exposed.

End storage, planter, and full-height end posts must never repeat inside a
middle run.

## Connectivity

The family supports only the accepted east-west masks. The bit mapping remains
north=1, east=2, south=4, west=8.

| Mask | Required visual difference |
| --- | --- |
| 0 | isolated; both exposed end treatments are visible |
| 2 | east seam open/flush; west end treatment remains |
| 8 | west seam open/flush; east end treatment remains |
| 10 | both seams open/flush; no duplicated end treatment |

The common desktop, privacy panel, slatted frame, origin, ground contact, and
dock projection must remain stable across all four masks. West and east seam
edges remain the projected footprint edges:

- west seam (56,24) -> (24,40);
- east seam (120,56) -> (88,72).

North/south, corner, tee, cross, and vertical-middle masks remain rejected.

## Palette and rendering

- Light direction: northwest.
- Top plane: light wood.
- South plane: darkest structural/shadow plane.
- East plane: middle wood/metal plane.
- Teal is an accent role, not a global flood.
- Background previews use fixed opaque light and dark backgrounds without
  changing source pixels.
- All exports and review boards use nearest-neighbor filtering.
- Alpha edges are hard and translucent pixels are forbidden.

## Review and admission boundary

The v3 family must produce native masks 0/2/8/10, enlarged native-scale and
connectivity boards, a [2,10,8] seam composition, dock/clearance diagnostic,
light and dark previews, provenance, hashes, registry evidence, and two
byte-identical factory builds.

The family remains spec-only. Geometry, visual, and commercial owner outcomes
remain independent and pending. No runtime PNG or production manifest may be
written. No approval, Phase 5 exit, or seated integration pass may be inferred
from deterministic output.

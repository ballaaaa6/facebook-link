# Derived Part 1 lab assets

## `keyboard.only.png`

- Source:
  `assets/game/processed/office-library-modern-bright-v1/env-01-workstation-static/keyboard.mouse.png`
- Operation: lossless crop of source rectangle `x=0, y=0, width=240,
  height=130`.
- Result: the keyboard pixels remain unchanged and the incomplete mouse at the
  right edge is fully excluded.
- The 284 by 130 source remains unchanged for provenance.
- No generated pixels, resampling, recoloring, or legacy asset content are
  present in the accepted derived file.

An image-generation edit was reviewed and rejected because it changed the
keyboard artwork and did not produce a uniform removable background. It is not
part of the repository or the runtime.

## Rejected rectangular workstation v5

- Runtime files:
  - `desk.workstation.viewer-front.v5.png`
  - `desk.workstation.viewer-back.v5.png`
- Source: `../generated/workstation-rectangular-pair-v5-chroma.png`.
- Built-in image generation produced a matched chroma-key pair from the
  modern-bright desk material references.
- The historical prompt required a full rectangular tabletop, exact square
  corners, a `5 x 4` footprint, and a plausible `5 x 3` usable surface grid.
- The standard chroma-key helper removed the flat green background. The pair
  was split at the center and cropped to visible bounds.
- A deterministic edge-normalization pass makes the first 219 tabletop rows
  exactly 752 pixels wide in both orientations. This removes the generated
  corner gaps and lets adjacent five-tile desks meet without a seam.
- Both runtime files are 752 by 508 RGBA PNGs. Furniture, equipment, actors,
  grid lines, labels, and shadows are not baked into either desk.
- These files are `rejected-geometry` inputs for the v6 composition. Their
  straight-front artwork does not represent the declared four-cell top-down
  depth, and their normalized rectangle must not be used as a production
  geometry reference.

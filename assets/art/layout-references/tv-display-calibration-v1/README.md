# TV display calibration set v1

This folder is a production workflow proof for a furniture object that has
an internal display. It is calibration material, not a runtime registration.

## Two-pass workflow

1. Generate the TV shell as a complete opaque object with a flat chroma-key
   viewport.
2. Remove the key, crop to the shell alpha bounds, and measure the actual
   viewport in the cropped render.
3. Generate a single image containing several screen-content frames. The
   generator does not need to hit the final pixel ratio perfectly.
4. Extract each frame, center-crop it to the measured viewport aspect, and
   resize with nearest-neighbor sampling to the exact runtime viewport size.
5. Composite the normalized overlays into the shell and inspect the result
   before any runtime asset registration.

## Measured contract

- Cropped shell: `1082x603`
- Viewport anchor: `(80, 65)`
- Viewport size: `926x464` (approximately 2:1)
- Overlay frame size: `926x464`
- Playback sequence: `A → B → C → B → A`

The shell owns the body, bezel, stand, highlights, and collision silhouette.
Overlay frames own only the pixels inside the screen. Do not redraw the bezel
in an overlay cell.

## Files

- `tv-shell.png` — alpha-clean shell, cropped to its artwork bounds.
- `tv-overlay-a.png`, `tv-overlay-b.png`, `tv-overlay-c.png` — normalized
  screen-content frames.
- `tv-calibration-composite-preview-v1.png` — side-by-side proof of the three
  frames composited into the same shell.
- `tv-calibration-manifest.json` — measured coordinates and processing record.

The source strips are retained for traceability. Once this calibration is
accepted in-game, the same contract can be reused for vending machines,
terminals, and game cabinets with a new measured viewport.

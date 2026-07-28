# Office Workstation v3 Image Generation Record

Generated: 2026-07-28
Tool path: built-in ImageGen with local chroma-key removal
Use: Step 5 R04 isolated workstation components only

## Desk source revision

Input 1: `desk-workstation-modern-v2-turnaround-chroma.png` as the edit target
and exact desk identity/style reference.

Input 2: `Gemini_Generated_Image_8c2wfh8c2wfh8c2w.png` as the elevated-camera
and edge-touching composition reference.

Prompt:

```text
Use case: precise-object-edit
Asset type: two-view pixel-art source turnaround for an office simulation game
Primary request: create a corrected two-view turnaround of the same light modern office desk. Preserve the desk identity, colors, materials, two-pixel dark outline, left-drawer seat side, and plain modesty-panel public side. Change only the camera/geometry so the complete tabletop is much deeper and clearly dominates the desk, suitable for a logical 3 by 2 tile support plane. The tabletop must be a full rectangle with straight parallel horizontal edges and square corners, no slanted far edge, no trapezoid, and both views must have exactly the same overall width and baseline.
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background.
Composition: seat-side desk on the left, public-side desk on the right, equal scale, generous padding, no overlap.
Style: clean polished pixel art matching input 1; orthographic elevated frontal view, not isometric and not three-quarter perspective.
Constraints: bare desks only; no monitor, keyboard, chair, person, props, text, labels, cast shadows, ground plane, watermark, or extra furniture. Keep the legs and drawers below the tabletop; do not bake equipment into the top. Do not use #ff00ff in the desks.
```

## Chair source revision

Inputs 1 and 2: existing front/back navy chair sources for identity, palette,
materials, wheels, armrests, and semantics.

Input 3: Einstein seated-chair calibration for the correct wider seated
proportion.

Prompt:

```text
Use case: stylized-concept
Asset type: two-view pixel-art office chair source turnaround for a 2D office simulation
Primary request: create a corrected bare office chair turnaround without any person. Front view on the left and back view on the right. Preserve the same navy upholstered chair identity, black frame, armrests, central column, and five-wheel base. Correct the proportions so the chair is wide enough for the seated character and the cushion is visibly horizontal at the middle height: base-to-cushion is the lower logical unit, backrest is the upper logical unit. The visual silhouette should be approximately square rather than tall and narrow, suitable for normalization near 60 to 64 pixels wide by 64 pixels high.
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background.
Composition: both chairs equal scale and same floor baseline, generous separation and padding.
Style: crisp polished pixel art matching the references, strict straight orthographic front/back, no perspective convergence.
Constraints: chair only, no person, no desk, no monitor, no keyboard, no props, no labels, no text, no shadow, no floor plane, no watermark. Keep front and back views semantically correct and do not use #ff00ff in the chair.
```

The generated source PNGs remain versioned provenance. Runtime assets are
derived deterministically and never overwrite the R02 files.

## Monitor source revision

Inputs 1 and 2: existing front/back monitor sources for identity and semantic
views. Input 3: the target Office composition for compact workstation scale.

Prompt:

```text
Use case: stylized-concept
Asset type: front/back pixel-art desktop monitor turnaround for a 2D office simulation
Primary request: create a corrected low-profile widescreen monitor turnaround. Front view on the left and back view on the right. Preserve the existing monitor identity but make the overall visual distinctly wider than tall, suitable for normalization to exactly 52 pixels wide by 40 pixels high. Keep a compact central stand and shallow base. Both views must have identical scale and baseline.
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background.
Composition: front monitor left, back monitor right, generous separation and padding.
Style: crisp polished pixel art, strict straight orthographic front/back, no perspective convergence.
Constraints: monitor only; no desk, keyboard, person, chair, cables, props, text, labels, logos, shadows, floor plane, or watermark. Do not use #ff00ff in the monitors.
```

The original `52 x 52` monitor passed the logical reservation check but
visually overlapped the `48 x 24` keyboard in the far orientation. The R04
monitor is intentionally normalized to `52 x 40` so both orientations have a
real non-overlap gap without moving either object outside its support row.

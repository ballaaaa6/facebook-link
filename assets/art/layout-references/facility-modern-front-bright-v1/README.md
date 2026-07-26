# Facility Modern Front Bright v1

- Created: 2026-07-26
- Status: calibration-only; not registered as a runtime atlas
- Purpose: verify the tightened furniture-orientation rule and the bright
  display-palette rule in one 4x4 reference sheet.

Every cell is a straight front orthographic view. This sheet intentionally
does not demonstrate side views; when a side view is required in production,
it must be an exact 90-degree left or right view. Oblique, three-quarter,
diagonal, tilted, or perspective views are rejected and must be regenerated.

Rows 1–3 are four-frame seam loops for TV, vending machine, and arcade game.
Each row is intended to read as `A-B-C-D-A`, with frame D designed to lead
naturally back to frame A. The final row contains static refrigerator,
massage chair, three-seat sofa, and two-seat sofa references.

All display content uses a bright, high-value palette (warm white, pale sky,
light cyan, mint, teal, lime, amber, coral, and lavender). Mostly black,
navy, or dark-blue display backgrounds are not accepted.

The source image is retained for audit; the alpha-cleaned image is only a
preview for cell extraction. Before runtime registration, each cell still
requires crop/normalization, anchor placement, footprint verification, and
an in-game scale pass.

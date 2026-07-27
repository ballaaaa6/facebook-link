# Office rejected geometry cases

This file records Office geometry that must remain available as negative
regression evidence but must not enter the Active Office, production asset
registry, or future generation prompts.

## RG-001 — Paired workstation v6 composition

Status: `rejected-geometry`

The v6 browser captures exercise derived desk assets whose IDs end in `v5`.
The capture version and input-asset version describe one rejected composition,
not two independent approval decisions.

### Evidence

- `assets/game/processed/office-facility-v1-lab/qa/two-row-ground-pivot-office-v6-furniture.png`
- `assets/game/processed/office-facility-v1-lab/qa/two-row-ground-pivot-office-v6-seated.png`
- `assets/game/processed/office-facility-v1-lab/qa/two-row-ground-pivot-office-v6-footprint-grid.png`
- `assets/game/processed/office-facility-v1-lab/derived/desk.workstation.viewer-front.v5.png`
- `assets/game/processed/office-facility-v1-lab/derived/desk.workstation.viewer-back.v5.png`

### Rejection reasons

- The straight-front desk artwork does not visually represent the declared
  four-cell top-down depth.
- The derived bitmap was normalized to fill a logical rectangle instead of
  preserving an authored top-down support plane.
- Workstation-specific foreground clipping stands in for a reusable
  multi-part occlusion contract.
- The same desk concept is described as `4 x 2` in the legacy Scale Bible and
  `5 x 4` in the lab, so neither value is approved until Geometry Contract v3
  resolves physical scale, floor footprint, and support plane independently.

### Required regression behavior

- Preserve every evidence file without overwriting or renaming it.
- Keep the lab development-only and isolated from Active Office data.
- Reject both derived desk IDs from the active map, runtime geometry manifest,
  and active asset registry.
- Do not use the v6 captures as positive visual acceptance evidence.
- Do not delete this case after a replacement passes; it remains the negative
  comparison for future geometry work.

### Replacement requirement

A future desk prototype may supersede this case only after Geometry Contract
v3, the complete asset audit, and the accepted Camera/Scale Bible pass their
combined gate. The replacement must separate its support surface, underframe,
and foreground occluder and must demonstrate top-down depth without stretching
the bitmap to match collision geometry.

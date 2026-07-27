# Part 1 modern paired-workstation lab

This directory records visual QA for the isolated modern workstation lab. The
lab is available only in the web development build at `/?lab=office-layout`;
it does not replace the active Office map.

The original `qa/two-row-office-layout-v1.png` is a rejected historical result.
It uses the retired lab composition and is not an acceptance reference.

## Part 1 result

- Ten modern desks form two directly touching rows of five.
- The complete workstation, seat, route, and aisle assembly is one tile closer
  to the wall than the v2 calibration.
- The far row contains five `working-front-seated` employees.
- The near row contains five `working-back-seated` employees.
- Ten `keyboard.only` crops replace the malformed keyboard-and-half-mouse
  source in the lab renderer.
- Monitor and keyboard render boxes use calibrated fractional tile sizes and
  precise desk-surface anchors.
- Near-row equipment renders above the desk base but below the seated actor, so
  it remains visible without drawing over the head.
- Every desk exposes four reserved future prop slots, forty slots total.
- The room contains no facility or decorative furniture.
- The rendered asset list contains no retired desk or chair ids.
- All ten positions and seated states remain unchanged at 0, 10, 20, and 30
  seconds.
- Browser console warnings and errors are both zero.

## Evidence

- `qa/two-row-modern-office-part1-furniture-grid-v3.png`
- `qa/two-row-modern-office-part1-seated-v3.png`
- `qa/two-row-modern-office-part1-seated-grid-v3.png`

The three Part 1 images were captured from the local browser renderer at a 1280
by 720 viewport on 2026-07-27.

The v2 captures remain as superseded QA history and are not the current
acceptance evidence.

# Part 1 modern paired-workstation lab

This directory records visual QA for the isolated modern workstation lab. The
lab is available only in the web development build at `/?lab=office-layout`;
it does not replace the active Office map.

The original `qa/two-row-office-layout-v1.png` is a rejected historical result.
It uses the retired lab composition and is not an acceptance reference.

## Part 1 result

- Ten modern desks form two directly touching rows of five.
- The far row contains five `working-front-seated` employees.
- The near row contains five `working-back-seated` employees.
- The room contains no facility or decorative furniture.
- The rendered asset list contains no retired desk or chair ids.
- All ten positions and seated states remain unchanged at 0, 10, 20, and 30
  seconds.
- Browser console warnings and errors are both zero.

## Evidence

- `qa/two-row-modern-office-part1-furniture-grid-v2.png`
- `qa/two-row-modern-office-part1-seated-v2.png`
- `qa/two-row-modern-office-part1-seated-grid-v2.png`

The three Part 1 images were captured from the local browser renderer at a 1280
by 720 viewport on 2026-07-27.

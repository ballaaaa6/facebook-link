# Part 1 modern paired-workstation lab

This directory records visual QA for the isolated modern workstation lab. The
lab is available only in the web development build at `/?lab=office-layout`;
it does not replace the active Office map.

The original `qa/two-row-office-layout-v1.png` is a rejected historical result.
It uses the retired lab composition and is not an acceptance reference.

## Part 1 result

- Ten rectangular `5 x 4` modern desks form two directly touching rows of five.
- Each chair reserves only its adjacent `1 x 1` floor base. Sprite height may
  cross a footprint boundary and is never clipped to that base.
- The far chair bases start after exactly one clear floor row below the wall.
- The far row contains five `working-front-seated` employees.
- The near row contains five `working-back-seated` employees.
- The far row uses the viewer-back desk; the near row uses the viewer-front
  desk. Monitor and character directions remain employee-relative.
- Ten `keyboard.only` crops replace the malformed keyboard-and-half-mouse
  source in the lab renderer.
- Each desk has a three-cell center lane: monitor far from the employee,
  keyboard in the middle, and one clear cell nearest the employee.
- Each desk has six left prop cells and six right prop cells, twelve per desk
  and 120 across the ten-desk lab.
- Monitor and keyboard each reserve one center cell while rendering wider than
  that logical cell for a readable, proportionate scale.
- Twenty sample props exercise both side regions without using the protected
  center lane.
- Near-row actors render above every desk, chair, monitor, keyboard, and prop.
  The far row uses a clipped lower desk foreground so furniture cannot cover a
  character head.
- The room contains no facility or decorative furniture.
- The rendered asset list contains no retired desk or chair ids.
- All ten positions and seated states remain unchanged at 0, 10, 20, and 30
  seconds.
- Browser console warnings and errors are both zero.

## Evidence

- `qa/two-row-ground-pivot-office-v6-furniture.png`
- `qa/two-row-ground-pivot-office-v6-seated.png`
- `qa/two-row-ground-pivot-office-v6-footprint-grid.png`

The three v6 images are captured from the local browser renderer at a 1280 by
720 viewport.

The v2, v3, and v5 captures remain as superseded QA history and are not the
current acceptance evidence.

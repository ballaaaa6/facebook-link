# Office Workstation Assembly Bible v3

Status: P0-P3 calibration authority; owner approval required
Updated: 2026-07-28
Machine-readable source:
`assets/game/manifests/office-workstation-assembly-bible-v3.json`

The v2 Assembly Bible and Step 4 desk files remain historical pixel evidence.
They do not define R03 spatial geometry. Step 5 R02 is rejected and cannot be
used as an assembly or renderer input.

## Station components

| Component | Spatial contract | Current pixel decision |
| --- | --- | --- |
| Person | `1 x 1 x 3`, current frame `96 x 104` px | Reuse current Office character and seated pose |
| Chair | `1 x 1 x 2`, same floor cell as person, cushion `z = 1` | Exact render dimensions and split anchors unlocked |
| Desk | `3 x 2 x 2`, complete `96 x 64` support plane at `z = 2` | Existing v2 desk may be measured only |
| Monitor | actor-far `3 x 1` reservation | Reuse current monitor visual without scaling |
| Keyboard | actor-near center `1 x 1` reservation | Proposed `48 x 24` visual, maximum `1.5 x 1` |

## Person and chair contact

The required future back-to-front semantic parts are:

1. `chair-rear`;
2. `person`;
3. `chair-seat`;
4. `chair-foreground`.

The ordering is a semantic model, not permission to create those parts in
P0-P3. Exact pixel splits must be derived from the existing calibration
composites in P4 after owner approval.

The contact rules are:

- chair and person share one centered floor cell;
- the pelvis touches the cushion at `z = 1`;
- the backrest supports the torso;
- the character head remains above the backrest;
- bent or hanging legs may extend below the cushion without moving the floor
  footprint.

## Desk and equipment plan

The desk local origin is the top-left cell. The top contains exactly two
32-pixel rows.

For a person above the desk:

```text
[ person/chair centered outside desk ]
[ keyboard center 1 x 1 in actor-near row ]
[ monitor reservation 3 x 1 in actor-far row ]
```

For a person below the desk:

```text
[ monitor reservation 3 x 1 in actor-far row ]
[ keyboard center 1 x 1 in actor-near row ]
[ person/chair centered outside desk ]
```

The keyboard's logical reservation is one cell. A proportional `48 x 24`
visual may overflow that cell horizontally by eight pixels on each side while
remaining inside the 96-pixel desk width. It cannot overlap the monitor row.

## Historical R02 failures

- The visible desk support band measured 30 px instead of the required 64 px.
- The keyboard incorrectly reserved `3 x 1`.
- The chair was normalized to front/back widths `44/47` px before source
  contact was measured.
- A declared hip anchor was accepted without proof from the calibration
  composite.
- Filename `front` and `back` values were treated as semantic sides before
  visual features were verified.

R03 therefore leaves the desk-side pixel mapping and exact chair anchors
unlocked until P4.

## P0-P3 outputs and gate

The three boards under
`assets/art/layout-references/office-workstation-v3/step5-r03/` show:

1. world projection and z levels;
2. desk and equipment footprints;
3. measured character/chair sources and contact semantics.

Approval of these boards permits P4 normalization for one isolated station
only. It does not permit renderer implementation, ten-seat assembly, Step 6,
or Active Office promotion.

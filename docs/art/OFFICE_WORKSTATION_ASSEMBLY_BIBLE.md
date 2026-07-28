# Office Workstation Assembly Bible v3

Status: Geometry v6; R05 final ten-seat workstation candidate awaiting owner review
Updated: 2026-07-28
Machine-readable source:
`assets/game/manifests/office-workstation-assembly-bible-v3.json`

The v2 Assembly Bible and Step 4 desk files remain historical pixel evidence.
Step 5 R02 is rejected and cannot be used as an assembly or renderer input.
R03 defines the earlier logical ruler. R04 chair/person/equipment composition
is rejected; only its desk pixels remain accepted. Calibration authority is
`office-workstation-step5-r05-calibration.json`; the current assembled review
authority is `office-workstation-step5-r05-final.json`.

## Station components

| Component | Spatial contract | Current pixel decision |
| --- | --- | --- |
| Person | `1 x 1 x 3`, current frame `96 x 104` px | Reuse current Office character and seated pose |
| Chair | `1 x 1 x 2`, base-seat `z0..z1`, backrest-arms `z1..z2` | Existing real 64 x 80 source normalized without scaling; seat y80 and floor y112 on 96 x 112 canvas |
| Desk | `3 x 2 x 2`, complete `96 x 64` support plane at `z = 2` | R04 `96 x 128`; public and seat sides |
| Monitor | actor-far `3 x 1` reservation, centered `1 x 1` support | Owner-accepted `52 x 40`; base-center error 0 px in both orientations |
| Keyboard | actor-near center `1 x 1` reservation | Owner-accepted `48 x 24`, pivot `[24,12]`, frozen |

## Person and chair contact

The required back-to-front semantic parts are:

1. `chair-rear`;
2. `person`;
3. `chair-seat`;
4. `chair-foreground`.

R04 did not implement this model: its `chair-seat` mask contains the wheel/base
region. R05-3A proved the two physical volumes and R05-3B derives the rear and
foreground masks from the existing real chair pixels. The two physical masks
and two render masks reconstruct the source exactly; no mockup chair is a
runtime input.

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

R04 resolves the desk-side mapping from visible features and locks chair-seat
and hip contact at the same pixel anchor.

## P0-P6 outputs and gate

The three boards under
`assets/art/layout-references/office-workstation-v3/step5-r03/` show:

1. world projection and z levels;
2. desk and equipment footprints;
3. measured character/chair sources and contact semantics.

R04 P4-P6 remains rejected evidence. The R05 final pass adds seven deterministic
boards and four browser captures. Its development-only route validates one
station in both directions and a two-by-five bank of ten existing characters
for 60 seconds with 0 px anchor drift, no broken images, and no console
warnings or errors. Owner review applies to this isolated candidate only; it
does not permit other furniture, Step 6, or Active Office promotion.

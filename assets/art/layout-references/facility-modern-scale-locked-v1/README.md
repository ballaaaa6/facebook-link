# Modern scale-locked facility sheet v1

This calibration sheet is the first image generated from the machine-readable
Office Scale Bible and prompt generator. It is a source/reference sheet, not a
runtime atlas.

The common ruler is:

```text
1 logical unit = 64 image pixels inside this 1536x1024 preview
adult reference = 1 x 1 x 3 units
```

The sheet is intentionally not filled edge-to-edge. Empty magenta padding is
required so smaller assets remain smaller relative to larger assets:

```text
TV A       TV B       TV C       TV D
Vending A  Vending B  Vending C  Vending D
Game A     Game B     Game C     Game D
Fridge     Massage    Sofa 3     Sofa 2
```

Expected physical scale:

- TV: `3 x 0 x 2`
- Vending: `2 x 1 x 3`
- Game cabinet: `2 x 2 x 3`
- Refrigerator: `2 x 1 x 3`
- Massage chair: `2 x 2 x 2`
- Three-seat sofa: `4 x 2 x 2`
- Two-seat sofa: `3 x 2 x 2`

The first three rows retain the seam-loop contract `A-B-C-D-A`. Shells,
anchors, and collision silhouettes must remain stable; only the declared
screen, indicator, or game-scene pixels change.

The image is a visual calibration, not a claim that the generated pixels are
already extracted or accepted. The next production step is still crop,
uniform-resize, transparent padding, anchor, footprint, and 1:1 adult-scale
QA.

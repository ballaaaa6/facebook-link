# Modern bright facility seam-loop sheet v1

This is a calibration reference for the modern-bright furniture skin and the
seam-loop animation contract. It is not registered as a runtime atlas.

The sheet remains a 4x4 batch:

```text
TV A       TV B       TV C       TV D
Vending A  Vending B  Vending C  Vending D
Game A     Game B     Game C     Game D
Refrigerator  Massage chair  Sofa 3  Sofa 2
```

The first three rows are not four unrelated redesigns. Each row is one
continuous scene or device state and plays:

```text
A -> B -> C -> D -> A
```

The outer shell, anchor, render box, and collision silhouette must remain
locked. Only the declared local region changes:

- TV: one cyan city-dashboard scene evolves and returns to its opening state.
- Vending: one product-display/light cycle moves across the same cabinet.
- Game: one spaceship scene advances toward a portal and returns to the
  opening composition.

The source image uses a flat magenta key for extraction. For runtime, keep the
shell/content source manifest, then precompose full-frame variants from the
same shell. Do not ask the generator to redraw the complete furniture
independently for every frame.

The palette direction is modern but still belongs to the warm studio office:
lighter graphite, pale slate, brushed metal, warm white, cyan, teal, lime,
amber, and coral accents. Bright accents are reserved for screens, indicators,
controls, and small trim.

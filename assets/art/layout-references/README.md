# Office Layout References

These images are pre-production composition references. They are not runtime
assets and must not be imported by the web application.

## `office-camera-scale-calibration-v1.png`

- Created: 2026-07-27
- Status: accepted deterministic Geometry v3 calibration board
- Source: `assets/game/manifests/office-camera-scale-bible.json`
- Generator: `scripts/build-office-camera-scale-board.py`
- Intended use: lock the 32 px tile, projection split, character scale,
  workstation footprint/support plane, levels, pivots, overflow, orientations,
  adjacency, and occlusion before any authorized replacement generation

This board is generated evidence, not a runtime asset. Regenerate it with
`npm run art:geometry:bible` and never edit the PNG independently.

## `office-c-layout-reference-v1.png`

- Created: 2026-07-24
- Status: approved direction candidate; requires map-grid translation and
  collision validation before implementation
- Source: generated from the current Office C scene and pantry screenshots
- Intended use: guide zoning, furniture scale, support relationships,
  circulation, and facility placement for the archived `office-c-v1` direction;
  `office-c-v2.json` is the active integer-grid implementation

The reference establishes:

- four research and growth workstations in the upper-left zone;
- two creative workstations plus a separate shooting bay;
- three release and QA workstations plus a dedicated printer credenza;
- a clear central corridor connected directly to the right-side entrance;
- a lounge and linear modular pantry in the lower-left area;
- a four-seat mission-review table in the lower-center area;
- one NOC operator desk and a separate two-rack service row;
- small equipment placed on desks, counters, credenzas, or rack slots rather
  than directly on the floor.

The final map remains governed by the asset registry, occupancy footprints,
support-slot rules, facility reservations, route clearance, and automated
validation. Do not copy pixels or infer exact collision geometry directly from
the reference image.

## `office-modern-operations-target-v2.png`

- Created: 2026-07-26
- Status: current visual target for the modernized workstation presentation
- Versioned source: `assets/art/layout-references/office-modern-operations-target-v2.png`
- Intended use: guide workstation chair silhouette, desk grouping, employee
  seating composition, and modern material accents; it is not a runtime
  background or a source for copied pixels

The final V1 active scene background is
`assets/art/backgrounds/office-c-background-modern-v8-current.png`. The target
image only establishes the historical destination composition and chair
language. Runtime geometry continues to come from the integer-grid map and
registered, layered assets.

Calibration sources created from this target are intentionally not registered
as runtime assets yet:

- `office-chair-modern-turnaround-v1.png` — four-view modern task-chair trial.
- `assets/game/characters/einstein/einstein-seated-extension-v1-source.png` —
  first Einstein front/back seated trial.
- `assets/game/characters/einstein/einstein-seated-extension-v2-source.png` —
  targeted retry of the seated strip.
- `assets/game/characters/einstein/einstein-seated-chair-calibration-v1-source.png`
  — approved chair-included posture calibration.
- `assets/game/characters/einstein/einstein-seated-working-v1-source.png` —
  character-only front/back seated working rows after chair removal.

The chair calibration and Einstein seated silhouettes are accepted visual
references. They remain source material rather than registered runtime assets
until cell packing, seated anchors, chair occlusion, and a single in-game
workstation pass are accepted.

## `facility-v1-contact-sheet-preview-v1.png`

- Created: 2026-07-26
- Status: calibration preview only; do not register as a runtime asset
- Source: generated against the Warm Studio Concept C reference
- Intended use: validate the proposed 4x4 batching layout for fixed-front
  Facility v1 shells and three-frame display overlays

Cell order:

```text
TV shell       TV A       TV B       TV C
Vending shell  Vending A  Vending B  Vending C
Game shell     Game A     Game B     Game C
Refrigerator   Massage    Sofa 3     Sofa 2
```

The first pass demonstrates that sixteen logical cells can hold several
furniture families in one generated image. It is not production-ready: some
display cells redraw a bezel or product window instead of containing only the
transparent viewport content required by the shell/overlay contract. Retain it
as a composition reference and regenerate targeted overlay strips before
runtime extraction.

## `tv-display-calibration-v1/`

- Created: 2026-07-26
- Status: calibration-only; not registered as a runtime asset
- Purpose: prove the two-pass workflow for a furniture object with an internal
  display

The TV shell was cropped to `1082x603` and its measured viewport is
`x=80, y=65, width=926, height=464` (approximately 2:1). Three content-only
overlay frames were extracted from one generated strip, center-cropped to the
measured aspect, and normalized with nearest-neighbor sampling before being
composited into the shell. The generated source panels were about `709x474`
(1.5:1), so the raw panels are intentionally not used directly.

See `tv-display-calibration-v1/tv-calibration-manifest.json` for the exact
coordinates and processing record, and
`tv-display-calibration-v1/tv-calibration-composite-preview-v1.png` for the
side-by-side result.

## `facility-modern-seamloop-v1/`

- Created: 2026-07-26
- Status: calibration-only; not registered as a runtime atlas
- Purpose: test the modern-bright furniture skin and four-frame seam-loop
  contract in one 4x4 sheet

The first three rows contain four frames each for TV, vending, and game
furniture. Each row is one continuous scene and plays `A-B-C-D-A`; frame D
must naturally lead back to frame A. The final row contains static
refrigerator, massage-chair, three-seat-sofa, and two-seat-sofa cells.

This sheet is a source reference. The production pipeline still locks one
shell, generates only changing content, and precomposes full-frame runtime
variants from the same shell. The modern-bright material pass uses lighter
graphite, pale slate, brushed metal, warm white, and controlled cyan, teal,
lime, amber, and coral accents.

See `facility-modern-seamloop-v1/facility-modern-seamloop-manifest.json` for
the cell layout and seam-loop acceptance rules.

## `facility-modern-scale-locked-v1/`

- Created: 2026-07-26
- Status: calibration-only; not registered as a runtime atlas
- Purpose: verify that the machine-readable Office Scale Bible produces
  believable relative sizes across a single 4x4 sheet

This sheet uses a common visual ruler of approximately 64 image pixels per
logical unit and compares every object to the adult reference `1 x 1 x 3`.
The TV is intentionally smaller in height than the height-3 vending, game,
and refrigerator assets. The three-seat sofa is wider than the TV, while the
two-seat sofa is narrower. Empty chroma-key padding is intentional.

See `facility-modern-scale-locked-v1/facility-modern-scale-locked-manifest.json`
for the cell-to-scale mapping and
`facility-modern-scale-locked-v1/facility-modern-scale-locked-sheet-v1-alpha.png`
for the cleaned preview.

## `facility-modern-front-bright-v1/`

- Created: 2026-07-26
- Status: calibration-only; not registered as a runtime atlas
- Purpose: enforce the final straight-view and bright-screen rules for the
  modern Facility v1 set.

All cells use straight front orthographic views. If a side view is needed
later, it must be an exact 90-degree view; oblique, three-quarter, diagonal,
tilted, and perspective views are rejected. TV, vending, and arcade rows keep
the `A-B-C-D-A` seam-loop contract. Display panels use warm white, pale sky,
light cyan, mint, teal, lime, amber, coral, and lavender instead of mostly
black/navy/dark-blue backgrounds.

See `facility-modern-front-bright-v1/facility-modern-front-bright-manifest.json`
for cell mapping and physical scales, and
`facility-modern-front-bright-v1/facility-modern-front-bright-sheet-v1-alpha.png`
for the cleaned preview.

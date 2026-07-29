# Printer P01 ImageGen Source Record

Tool: built-in `image_gen`

Generated: 2026-07-30

The two PNG files in this directory are immutable source evidence. The
deterministic builder removes the flat magenta background locally and never
uses a generated replacement or missing-asset fallback.

## Identity anchor

No image references were supplied.

```text
Use case: stylized-concept
Asset type: original game facility source asset for a bright modern office
Primary request: Create one completely original large floor-standing
multifunction office printer/copier designed to read physically as 2 tiles
wide, 2 tiles deep, and 4 tiles high beside a canonical adult who would be
1 x 1 x 3 tiles. The machine must look substantial and freestanding, not like
a desktop printer.
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background only, with
no gradient, texture, reflection, floor plane, horizon, or lighting variation.
Subject and design: single front-facing multifunction copier centered with
generous padding; warm off-white rigid outer shell; dark navy lower chassis
and deep output bay; restrained cyan/teal accents; broad flat scanner lid at
the top; a small angled control screen integrated on the upper front; readable
central paper-output bay; distinct lower paper drawers and a visible tray seam
suitable for later animation. Clean professional industrial design, friendly
modern proportions.
Style/medium: crisp stylized raster game asset with subtle pixel-art character
and clean hard silhouette, consistent with a bright modern management-game
office; controlled front lighting; no cast shadow.
Composition/framing: exact front elevation with only a slight top visibility
needed to understand the scanner lid; full machine visible from top to base;
centered; no person and no other objects.
Output intent: identity anchor for deterministic decomposition into immutable
shell, screen viewport, scanner-light overlay, and tray states.
Constraints: identity-neutral empty machine; no paper or envelope baked into
the output; no logos, brands, letters, numbers, labels, UI text, or watermark;
no side or rear view; no extra props; do not use magenta in the machine;
background must remain uniform #ff00ff; crisp separable edges; no shadow, glow
spill, transparency, halo, or floor contact patch.
```

## Modular motion atlas

Reference input:
`assets/art/layout-references/office-facility-family-v1/printer-p01/source/01-printer-front-anchor-chroma.png`

```text
Use case: precise-object-edit / game asset decomposition
Input images: Image 1 is the approved identity anchor for Printer P01 and is a
strict visual reference, not a background to preserve.
Primary request: Create one square modular parts atlas for deterministic
animation of exactly the same printer identity from Image 1. Preserve its
silhouette, proportions, front camera, warm off-white shell, dark navy
chassis, cyan/teal accents, scanner lid, control screen, output bay, drawers,
materials, and lighting. Do not redesign the machine.
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background only, with
no gradient, texture, floor, shadow, reflection, or lighting variation.
Atlas layout: use a clean 4-column by 3-row grid of twelve separate
non-overlapping cells with generous uniform gutters. Do not draw grid lines or
labels.
Row 1: (1) the complete immutable front-facing printer shell, but with the
control-screen content fully black/blank, scanner-light strip dark, and output
tray in its closed state; (2) the local output-tray child only in closed state;
(3) the exact same local output-tray child only in half-open state; (4) the
exact same local output-tray child only in fully open state.
Row 2: four local control-screen viewport contents A, B, C, D only, each
identical size and frame boundary, abstract cyan/navy geometric status
graphics with no letters or numbers; the four frames must form a natural
A-to-B-to-C-to-D-to-A seam loop.
Row 3: four local scanner-light overlays A, B, C, D only, each identical size,
depicting one thin cyan scanning bar moving across a dark transparent-looking
strip; the four positions must form a natural A-to-B-to-C-to-D-to-A seam loop.
Style/medium: crisp stylized raster game asset with subtle pixel-art character
and hard separable edges, matching Image 1 exactly.
Output intent: source atlas whose children will be chroma-keyed, cropped, and
composited as immutableShell + statusViewport[frame] + scannerLight[frame] +
outputTray[state] + outputChild[state].
Critical constraints: only the first cell may contain the full printer; all
other cells contain isolated local child components, not redrawn machines.
Keep each child's size and orientation stable across its states. No paper or
envelope child is needed because existing held props will be reused. No
people, hands, props, logos, brands, letters, numbers, UI text, labels, grid
lines, or watermark. Do not use magenta inside any component. No cast shadows,
halos, glow spill, or overlapping cells. Preserve exact machine identity and
front camera.
```

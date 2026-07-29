# Refrigerator R01 ImageGen Source Record

Workflow: built-in ImageGen

Generated: 2026-07-30

Both source images are fresh project inputs. They use zero pixels from the
audited refrigerator master, its processed crop, rejected side orientations,
Active Office, legacy runtime assets, or another facility family. The second
source uses the first source only as the identity reference for the same new
family. Flat magenta backgrounds are removed locally before deterministic
composition.

## 01 refrigerator front anchor

Input image count: `0`

```text
Use case: stylized-concept
Asset type: original 2D pixel-art office game facility sprite anchor
Primary request: create one completely original tall modern office
refrigerator cabinet, straight-on FRONT orthographic elevation, designed to
read as physical scale 2 tiles wide x 2 tiles deep x 4 tiles tall in a bright
modern office pixel-art game. The refrigerator must have a substantial deep
full-height body, a thick warm off-white painted-metal shell, one smaller upper
freezer door and one larger lower refrigerator door, dark charcoal edge seals,
sturdy squared feet, one simple vertical charcoal handle on each door, a small
cyan ready light, and a clean premium industrial-office silhouette. Both doors
are fully closed. The design must later support a separate animated lower door
and empty interior.
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background for local
background removal.
Style/medium: crisp polished 2D pixel art, clean compact orthographic game
sprite, hard-edged pixel clusters, subtle 1-2 pixel highlights at final sprite
scale, no perspective room scene.
Composition/framing: exactly one refrigerator centered, full object visible,
generous equal padding, front elevation only, vertically aligned, no cropping.
Color palette: warm off-white shell, charcoal and deep navy seals/base,
restrained cyan ready light and tiny amber accent; never use #ff00ff inside the
subject.
Materials/textures: opaque painted metal and matte plastic only; no glass
transparency and no glossy reflection.
Constraints: background must be one uniform #ff00ff color with no shadows,
gradients, texture, reflections, floor plane, or lighting variation. No food,
bottles, yogurt, products, text, numbers, labels, logos, trademarks,
characters, people, handheld objects, room furniture, watermark, cast shadow,
contact shadow, reflection, multiple views, panels, borders, or guide lines.
Crisp closed silhouette suitable for chroma-key extraction.
```

## 02 refrigerator motion parts

Input image count: `1`

Image 1 was `01-refrigerator-front-anchor-chroma.png` and served only as the
identity reference for this fresh modular parts source.

```text
Use case: stylized-concept
Asset type: modular pixel-art refrigerator parts kit for deterministic finite
animation assembly
Input images: Image 1 is the immutable identity, exact palette, proportions,
closed-door placement, handle placement, shell profile, and 2x2x4 scale
reference for Refrigerator R01.
Primary request: create exactly four isolated opaque pixel-art components
arranged in a clean 2x2 layout with no dividers. TOP-LEFT: the same
refrigerator BODY/SHELL with the upper freezer door still closed but the entire
lower refrigerator door removed, revealing one empty dark deep-navy interior
cavity with three simple empty pale shelves and no products. TOP-RIGHT: the
detached lower refrigerator door in the exact CLOSED straight-on front shape
from Image 1, including its charcoal handle and seals, with no surrounding
shell. BOTTOM-LEFT: the same detached lower door in a HALF-OPEN approximately
45-degree foreshortened state, showing a little of its plain inner off-white
face and keeping the handle, designed to hinge on its right edge. BOTTOM-RIGHT:
the same detached lower door in a FULLY-OPEN approximately 90-degree narrow
side-on state, showing its plain inner face and right-edge hinge thickness,
keeping the handle only where physically visible. The shell and three door
states will be separately cropped and composited by code on one fixed canvas;
these are pieces, not independently redrawn full refrigerator frames.
Scene/backdrop: perfectly flat solid #ff00ff chroma-key surrounding every
isolated component for local background removal.
Style/medium: crisp polished 2D pixel art matching Image 1 exactly, hard-edged
pixel clusters, opaque painted metal and matte plastic, straight orthographic
game asset language.
Composition/framing: four clearly separated non-overlapping components
centered in their quadrants, generous uniform magenta gaps, all fully visible,
no cropping. The shell is the largest component; all three doors share
identical height and hinge reference.
Color palette: preserve Image 1's warm off-white, charcoal/deep navy, cyan
ready light, and tiny amber accent; do not use #ff00ff inside any component.
Constraints: the lower interior and all shelves must be completely empty and
item-neutral. No food, bottles, yogurt, cans, products, text, numbers, labels,
logos, trademarks, characters, people, hands, room furniture, watermark, cast
shadow, contact shadow, reflection, quadrant borders, dividers, guide lines,
or extra objects. Background must be one uniform #ff00ff with no shadows,
gradients, texture, floor plane, reflections, or lighting variation. Exactly
four requested components.
```

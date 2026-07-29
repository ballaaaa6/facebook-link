# Arcade Machine G02 ImageGen Source Record

Workflow: built-in ImageGen

Generated: 2026-07-29

All five source images are fresh project inputs. They use zero pixels from
Arcade G01, Active Office, processed Office libraries, legacy assets, rejected
candidates, or audited original-master crops. The flat magenta backgrounds are
removed locally and the resulting alpha ownership is validated before use.

## 01 cabinet front anchor

```text
Use case: stylized-concept
Asset type: original 2D pixel-art game facility sprite anchor
Primary request: create one completely original tall modern upright arcade
machine, straight-on FRONT orthographic view, designed to read as physical
scale 2 tiles wide x 2 tiles deep x 4 tiles tall in a bright modern office
pixel-art game. The machine must have a substantial full-height cabinet, a
large blank near-black recessed screen viewport, a machine-attached control
panel with one cyan joystick and three small buttons, a locked lower service
panel, and two stable feet. Do not imitate any existing branded arcade cabinet.
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background for local
background removal.
Style/medium: crisp polished 2D pixel art, clean compact sprite silhouette,
subtle 1-2 pixel highlights, orthographic game asset, no perspective scene.
Composition/framing: exactly one cabinet centered, full object visible,
generous equal padding, front elevation only, vertically aligned, no cropping.
Color palette: warm off-white shell, charcoal lower cabinet and bezel,
restrained cyan and amber accents; never use #ff00ff inside the subject.
Materials/textures: opaque painted metal and matte plastic only; no glass
transparency.
Constraints: background must be one uniform #ff00ff color with no shadows,
gradients, texture, reflections, floor plane, or lighting variation. Blank
screen only. No title marquee lettering. No logos, trademarks, characters,
people, room furniture, labels, watermark, cast shadow, contact shadow,
reflection, multiple views, panels, borders, or guide lines. Crisp closed
silhouette suitable for chroma-key extraction.
```

## 02 cabinet turnaround

Image 1 was `01-cabinet-front-anchor-chroma.png` and served only as the identity
reference for the fresh four-view generation.

```text
Use case: stylized-concept
Asset type: four-orientation 2D pixel-art game facility turnaround sheet
Input images: Image 1 is the immutable identity and FRONT-view reference for
the arcade cabinet.
Primary request: create a consistent orthographic turnaround of exactly the
same arcade cabinet in four separate views ordered left-to-right: FRONT, LEFT
SIDE, RIGHT SIDE, BACK. Preserve the cabinet's proportions, warm off-white
outer rails, charcoal body, cyan and amber accents, feet, material language,
and height exactly. Front must match Image 1's silhouette and component
placement. Side views must show the same cabinet depth, sloped control-panel
volume, side rails, and blank dark screen recess; controls may only be visible
where physically plausible. Back must show the same outline, two modest
ventilation groups, one locked service panel, and a small cable recess; no
screen or controls on the back.
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background for local
background removal.
Style/medium: crisp polished 2D pixel art matching Image 1, orthographic game
asset elevations, opaque painted metal and matte plastic.
Composition/framing: four non-overlapping full-height cabinets, equal scale,
same bottom baseline, generous padding between views and around sheet. No
angled three-quarter view. No cropping.
Constraints: background must be one uniform #ff00ff color with no shadows,
gradients, texture, reflections, floor plane, or lighting variation. Do not
use #ff00ff inside any cabinet. Blank near-black screen only. No text,
captions, labels, logos, trademarks, characters, people, room furniture,
watermark, cast shadow, contact shadow, reflection, panels, dividers, borders,
or guide lines. Exactly four cabinets and no extra objects.
```

## Shared game-kit structure

Each game was generated with one separate built-in ImageGen call. Every kit has
four isolated components: a background, player, obstacle, and effect. The
builder, not ImageGen, composes frames A-D so timing, shell stability, and the
D-to-A transition are deterministic.

## 03 Cosmic Drift

```text
Use case: stylized-concept
Asset type: original pixel-art arcade screen art kit for deterministic
animation assembly
Primary request: create one original COSMIC DRIFT arcade game art kit as
exactly four isolated assets arranged in a clean 2x2 layout with no dividers:
TOP-LEFT a wide rectangular deep-space gameplay background tile with tiny
stars and two distant round planets but no player and no obstacle; TOP-RIGHT
one small side-view cyan-and-cream player spaceship; BOTTOM-LEFT one chunky
amber asteroid obstacle; BOTTOM-RIGHT one compact cyan engine-burst effect.
These assets will be separately cropped and composed into four temporal frames
by code.
Scene/backdrop: perfectly flat solid #ff00ff chroma-key surrounding every
isolated asset for local background removal.
Style/medium: crisp polished 2D pixel art, compact arcade screen graphics,
opaque hard-edged sprites, limited colors, no soft transparency.
Composition/framing: four clearly separated non-overlapping assets centered in
their quadrants, generous magenta gaps, all fully visible, no cropping.
Color palette: deep navy, cyan, warm off-white, amber, pale blue; do not use
#ff00ff inside any asset.
Constraints: surrounding background must be uniform #ff00ff with no shadows,
gradients, texture, reflections, floor plane, or lighting variation. No text,
numbers, score, UI, labels, logos, trademarks, copyrighted characters,
watermark, borders, panels, grid lines, cast shadows, or extra objects. Exactly
the four requested assets.
```

## 04 Neon Rally

```text
Use case: stylized-concept
Asset type: original pixel-art arcade screen art kit for deterministic
animation assembly
Primary request: create one original NEON RALLY arcade game art kit as exactly
four isolated assets arranged in a clean 2x2 layout with no dividers: TOP-LEFT
a wide rectangular night highway gameplay background tile seen in simple
behind-the-car arcade perspective, with dark road, cyan lane markers, low amber
city lights, but no car and no obstacle; TOP-RIGHT one compact rear-view
cyan-and-cream rally car; BOTTOM-LEFT one chunky amber-and-white road barrier
obstacle; BOTTOM-RIGHT one compact cyan speed-streak burst effect. These assets
will be separately cropped and composed into four temporal frames by code.
Scene/backdrop: perfectly flat solid #ff00ff chroma-key surrounding every
isolated asset for local background removal.
Style/medium: crisp polished 2D pixel art, compact arcade screen graphics,
opaque hard-edged sprites, limited colors, no soft transparency.
Composition/framing: four clearly separated non-overlapping assets centered in
their quadrants, generous magenta gaps, all fully visible, no cropping.
Color palette: deep navy and charcoal, cyan, warm off-white, amber; do not use
#ff00ff inside any asset.
Constraints: surrounding background must be uniform #ff00ff with no shadows,
gradients, texture, reflections, floor plane, or lighting variation. No text,
numbers, score, UI, labels, logos, trademarks, copyrighted cars or characters,
watermark, borders, panels, grid lines, cast shadows, or extra objects. Exactly
the four requested assets.
```

## 05 Dungeon Pulse

```text
Use case: stylized-concept
Asset type: original pixel-art arcade screen art kit for deterministic
animation assembly
Primary request: create one original DUNGEON PULSE arcade game art kit as
exactly four isolated assets arranged in a clean 2x2 layout with no dividers:
TOP-LEFT a wide rectangular side-view stone dungeon gameplay background tile
with dark teal brick arches, a simple floor, and two amber wall torches but no
hero and no enemy; TOP-RIGHT one small original cyan-and-cream hooded
adventurer sprite in neutral side-view stance holding no recognizable branded
item; BOTTOM-LEFT one chunky original amber crystal-slime enemy; BOTTOM-RIGHT
one compact cyan-and-amber pixel magic-pulse effect. These assets will be
separately cropped and composed into four temporal frames by code.
Scene/backdrop: perfectly flat solid #ff00ff chroma-key surrounding every
isolated asset for local background removal.
Style/medium: crisp polished 2D pixel art, compact arcade screen graphics,
opaque hard-edged sprites, limited colors, no soft transparency.
Composition/framing: four clearly separated non-overlapping assets centered in
their quadrants, generous magenta gaps, all fully visible, no cropping.
Color palette: deep navy and dark teal, cyan, warm off-white, amber; do not use
#ff00ff inside any asset.
Constraints: surrounding background must be uniform #ff00ff with no shadows,
gradients, texture, reflections, floor plane, or lighting variation. No text,
numbers, score, UI, labels, logos, trademarks, copyrighted characters,
watermark, borders, panels, grid lines, cast shadows, or extra objects. Exactly
the four requested assets.
```

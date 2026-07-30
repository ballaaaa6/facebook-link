# Office Facility Integrated Shell V3 ImageGen Prompt Record

All six calls used the built-in ImageGen tool on 2026-07-30. The first four
calls created one new turnaround per facility. Coffee and Water then received
one targeted proportion correction each. Only the corrected Coffee and Water
outputs are retained as V3 sources.

For every initial call:

- Image 1 was that facility's approved Motion V2 alpha atlas.
- Image 2 was Arcade G02's approved cabinet turnaround, used only for
  turnaround presentation, pixel density, line weight, and lighting.

For both targeted corrections:

- Image 1 was the first generated shell turnaround and was the edit target.
- Image 2 was that facility's approved Motion V2 alpha atlas.

## Coffee Machine C02 — initial generation

```text
Use case: stylized-concept
Asset type: production source atlas for a pixel-art office simulation facility
Primary request: Create a completely new four-view turnaround shell for a floor-standing coffee machine, designed specifically around the approved animated screen, steam, and coffee-pour components in Image 1.
Input images: Image 1 is the authoritative effect-component palette, pixel density, line weight, and module-proportion reference. Image 2 is only the approved turnaround presentation/style reference; do not copy its arcade silhouette, joystick, controls, or exact details.
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background, uniform edge to edge, with no floor, shadow, gradient, texture, reflection, or lighting variation.
Subject: one coherent tall 2x2x4-tile coffee-machine shell shown in exactly four separate orthographic game-asset views arranged left to right: FRONT, LEFT SIDE, RIGHT SIDE, BACK. All views equal scale, equal baseline, fully visible, and generously separated. The FRONT has a flush upper receiving recess proportioned for the wide framed screen component from Image 1, a deep dark brewing chamber with enough clean negative space for the approved steam and centered vertical coffee-pour parts, a centered nozzle bridge, a practical drip tray, and a lower service cabinet. Side views show believable water/service access and vents. Back view shows one coherent service panel and vents.
Style/medium: polished high-resolution pixel art, crisp hard pixel clusters, controlled one-pixel-like dark outlines after downscaling, no painterly texture, no antialias blur, consistent top-left lighting.
Color palette: graphite black, dark gunmetal, warm ivory/champagne metal, tiny cyan indicators, restrained amber status accents, matched to Image 1.
Materials/textures: sturdy commercial appliance, inset metal bezels, dark glass, subtle panel seams.
Constraints: brand-new shell pixels; visually compatible with Image 1; tall roughly 2:1 height-to-width front proportion; closed silhouette; feet and base aligned; all four views unmistakably the same machine. Leave the screen recess and brew chamber neutral and empty so the exact approved effect sprites can be composited later.
Avoid: coffee liquid, steam, cups, mugs, people, hands, screen icons, duplicate animated effects, text, labels, logos, watermark, arcade controls, extra objects, perspective floor, cast shadow, cropped views, touching views, inconsistent view sizes.
```

## Coffee Machine C02 — targeted proportion correction

```text
Use case: precise-object-edit
Asset type: corrected production turnaround atlas for a pixel-art office game
Primary request: Correct Image 1 while preserving its coffee-machine identity, materials, panel language, front screen receiving recess, brewing chamber, lower cabinet, lighting, palette, and four-view order. Make the machine body visibly broader and more substantial so the FRONT height is approximately twice its width, appropriate for a 2x2 footprint and 4-tile height. Correct both side views: each side must be a solid continuous outer cabinet with only a shallow front brewing recess, never a huge U-shaped hole or missing middle wall. Keep the front brewing chamber open and centered for the approved steam and coffee-pour components in Image 2. Keep the back coherent with the widened body.
Input images: Image 1 is the edit target. Image 2 is the authoritative effect scale and visual-language reference.
Scene/backdrop: preserve a perfectly flat uniform solid #ff00ff chroma-key background with no floor, shadow, gradient, texture, or reflection.
Composition: exactly four separate views left to right—front, left, right, back—equal scale and baseline, fully visible and separated.
Constraints: change only width/proportions and incorrect side-wall geometry; preserve the selected design and empty effect receiving areas; crisp high-resolution pixel art; all four views must be the same machine.
Avoid: effects, coffee, steam, cups, people, icons beyond the blank receiving module, text, labels, logos, watermark, floor, shadows, cropped/touching views, arcade controls.
```

## Water Dispenser W02 — initial generation

```text
Use case: stylized-concept
Asset type: production source atlas for a pixel-art office simulation facility
Primary request: Create a completely new four-view turnaround shell for a floor-standing water dispenser, designed specifically around the approved animated screen, water-flow, and splash components in Image 1.
Input images: Image 1 is the authoritative effect-component palette, pixel density, line weight, and module-proportion reference. Image 2 is only the approved turnaround presentation/style reference; do not copy its arcade silhouette, joystick, controls, or exact details.
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background, uniform edge to edge, with no floor, shadow, gradient, texture, reflection, or lighting variation.
Subject: one coherent tall 2x2x4-tile water-dispenser shell shown in exactly four separate orthographic game-asset views arranged left to right: FRONT, LEFT SIDE, RIGHT SIDE, BACK. All views equal scale, equal baseline, fully visible, and generously separated. The FRONT has a flush upper receiving recess proportioned for the wide framed display from Image 1, one deep central dispensing alcove, a single centered nozzle housing aligned to the approved vertical water flow, generous clear space for the flow, and a broad recessed drip tray aligned to the approved splash frames. Side views show filtration access and subtle vents. Back shows a coherent filter/service door, tubing cover, and vents.
Style/medium: polished high-resolution pixel art, crisp hard pixel clusters, controlled dark outlines after downscaling, no painterly texture, no antialias blur, consistent top-left lighting.
Color palette: graphite black, dark navy glass, warm ivory/champagne metal, cyan water indicators, tiny blue status lights, matched to Image 1.
Materials/textures: premium commercial dispenser, dark glass, metal bezels, robust base and service panels.
Constraints: brand-new shell pixels; visually compatible with Image 1; tall roughly 2:1 height-to-width front proportion; closed silhouette; all four views unmistakably the same machine. Leave the display recess, dispensing airspace, and tray neutral and dry so the exact approved effect sprites can be composited later.
Avoid: water streams, splashes, bottles, cups, people, hands, screen icons, duplicate effects, multiple nozzles, text, labels, logos, watermark, arcade controls, floor, shadow, cropped or touching views, inconsistent view sizes.
```

## Water Dispenser W02 — targeted proportion correction

```text
Use case: precise-object-edit
Asset type: corrected production turnaround atlas for a pixel-art office game
Primary request: Correct Image 1 while preserving its water-dispenser identity, materials, panel language, top display receiving recess, central single-nozzle dispensing alcove, drip tray, lighting, palette, and four-view order. Make the machine body visibly broader and more substantial so the FRONT height is approximately twice its width, appropriate for a 2x2 footprint and 4-tile height. Widen the central alcove and tray proportionally while preserving clean space for the approved vertical water-flow and splash components in Image 2. Side and rear views must reflect the wider cabinet consistently and remain solid practical service panels.
Input images: Image 1 is the edit target. Image 2 is the authoritative effect scale and visual-language reference.
Scene/backdrop: preserve a perfectly flat uniform solid #ff00ff chroma-key background with no floor, shadow, gradient, texture, or reflection.
Composition: exactly four separate views left to right—front, left, right, back—equal scale and baseline, fully visible and separated.
Constraints: change only width/proportions while preserving the selected design and empty effect receiving areas; crisp high-resolution pixel art; all four views must be the same machine.
Avoid: water, splash, bottles, cups, people, animated screen icons, text, labels, logos, watermark, floor, shadows, cropped/touching views, arcade controls.
```

## Vending Machine U02 — initial generation

```text
Use case: stylized-concept
Asset type: production source atlas for a pixel-art office simulation facility
Primary request: Create a completely new four-view turnaround shell for a full-size vending machine, designed specifically around the approved animated merchandise window, display, coil, and package components in Image 1.
Input images: Image 1 is the authoritative effect-component palette, pixel density, line weight, and module-proportion reference. Image 2 is only the approved turnaround presentation/style reference; do not copy its arcade silhouette, joystick, controls, or exact details.
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background, uniform edge to edge, with no floor, shadow, gradient, texture, reflection, or lighting variation.
Subject: one coherent tall and substantial 2x2x4-tile vending-machine shell shown in exactly four separate orthographic game-asset views arranged left to right: FRONT, LEFT SIDE, RIGHT SIDE, BACK. All views equal scale, equal baseline, fully visible, and generously separated. The FRONT has a large upper-left dark merchandise receiving viewport sized to host the colorful merchandise frames from Image 1, a narrow integrated right control column with a flush blank display mount, payment/contact controls, a believable internal coil zone behind the glass, and a wide deep lower delivery bay with a strong foreground lip sized for the approved package frames. Side views show depth, cooling seams, and service access. Back has coherent refrigeration vents, power/service door, and matching base.
Style/medium: polished high-resolution pixel art, crisp hard pixel clusters, controlled dark outlines after downscaling, no painterly texture, no antialias blur, consistent top-left lighting.
Color palette: graphite black and deep gunmetal, warm ivory/champagne structural rails, cyan indicator accents, restrained amber highlights, matched to Image 1.
Materials/textures: thick commercial cabinet, dark glass, metal rails, practical payment column and delivery aperture.
Constraints: brand-new shell pixels; visually compatible with Image 1; tall roughly 2:1 height-to-width front proportion; all four views unmistakably the same machine. Leave merchandise glass, display mount, coil area, and delivery bay neutral and empty so exact approved effects can be composited later.
Avoid: products, cans, bags, packages, hands, people, animated screen content, duplicate effect art, text, price labels, logos, watermark, arcade controls, floor, shadow, cropped or touching views, inconsistent view sizes.
```

## Massage Chair R03 — initial generation

```text
Use case: stylized-concept
Asset type: production source atlas for a pixel-art office simulation facility
Primary request: Create a completely new four-view turnaround OUTER SHELL for a premium pod massage chair, designed specifically to surround the approved animated seat, roller-light, and controller-display components in Image 1.
Input images: Image 1 is the authoritative moving-seat palette, pixel density, line weight, cavity proportion, and control-module reference. Image 2 is only the approved turnaround presentation/style reference; do not copy its arcade silhouette, joystick, controls, or exact details.
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background, uniform edge to edge, with no floor, shadow, gradient, texture, reflection, or lighting variation.
Subject: one coherent large 2x2x4-tile massage-chair pod shell shown in exactly four separate orthographic game-asset views arranged left to right: FRONT, LEFT SIDE, RIGHT SIDE, BACK. All views equal scale, equal baseline, fully visible, and generously separated. The FRONT is an outer structural pod: thick rounded hood, side wings, armrests, stable base, and a large clean dark central mounting cavity sized to receive the animated seat and roller field from Image 1. Keep the cavity visibly empty and unobstructed. Integrate a small blank controller mount into the right arm, proportioned for the approved display. Side views show the same pod depth and arm structure. Back shows a coherent motor housing, service hatch, and vents.
Style/medium: polished high-resolution pixel art, crisp hard pixel clusters, controlled dark outlines after downscaling, no painterly texture, no antialias blur, consistent top-left lighting.
Color palette: deep charcoal/navy interior, warm ivory/champagne outer shell, cyan luminous trim, tiny amber control accents, matched to Image 1.
Materials/textures: premium molded pod, padded dark edge trim, sturdy mechanical base, believable back motor housing.
Constraints: brand-new shell pixels; visually compatible with Image 1; the front cavity must remain open for exact animated seat compositing; all four views unmistakably the same chair shell; no user.
Avoid: seat cushion, back cushion, leg cushions, roller lights, cyan dots inside the cavity, people, hands, duplicated controller display, massage animation, text, labels, logos, watermark, arcade controls, floor, shadow, cropped or touching views, inconsistent view sizes.
```

## Transparency workflow

Each retained source was converted locally with the installed ImageGen skill
helper:

```text
--auto-key border --soft-matte --transparent-threshold 12
--opaque-threshold 220 --despill
```

The resulting alpha atlases have transparent corners and four independently
owned source components. No native-transparency fallback or API/CLI model path
was used.

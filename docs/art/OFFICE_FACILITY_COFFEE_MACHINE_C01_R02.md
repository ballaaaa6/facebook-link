# Office Facility Coffee Machine C01-r02

Status: F0-F8 passed; owner-approved
Updated: 2026-07-29
Scope: One front-only, capacity-one, `2 x 2 x 2` coffee machine supported by
Counter Bar A01-r02

## Successor boundary

C01-r02 replaces the owner-rejected compact C01 silhouette. It reuses zero C01
pixels. Counter A01-r02, I01 interaction sockets, H01 Coffee mug, the
six-frame handoff timeline, the 18-character pose harness, and the reservation
simulation remain independent approved authorities.

F9, F10, furniture-only room composition, and Active Office promotion remain
blocked.

## Fresh source

The only machine-pixel source is:

`assets/art/layout-references/office-facility-coffee-machine-c01-r02-source.png`

SHA-256:

`853dc1f3b3ad768f758a92cea333d531a46f0ffe50613f4e268810ae4a3af6a5`

The owner selected ImageGen Option B on 2026-07-29 to replace the first
C01-r02 visual. The selected source is an isolated deep forest-green,
satin-black, and brushed-stainless commercial Coffee machine on a flat green
chroma background. It keeps the same C01-r02 system authority and uses zero
pixels from the replaced visual.

The production prompt locks:

- one original commercial Coffee machine;
- architectural twin-pillar bridge silhouette;
- broad two-tile width, deep two-tile body, and long front drip platform;
- front-biased orthographic game camera with a visible top plane;
- recessed empty output bay;
- deep forest-green side towers, satin-black control canopy, and brushed
  stainless trim;
- flat removable green background;
- no ivory, cream, beige, tan, terrazzo, wood, or stone colors;
- no cup, Coffee, steam, person, counter, text, logo, shadow, rejected pixels,
  or Active Office.

The deterministic builder keys the source, verifies one complete component,
normalizes without resampling, and derives all production parts.

## Geometry and counter capacity

- physical scale: `2 x 2 x 2` tiles;
- placement plane: `furniture-surface`;
- runtime canvas: `96 x 96`;
- meaningful runtime silhouette: `[17, 31, 79, 92]`, or `62 x 61` pixels;
- parent support block: `span.block.03-04`;
- occupied cells: back 03-04 and front 03-04;
- parent anchor: front-edge midpoint `[128, 86]`;
- child support socket: `[48, 92]`;
- attachment delta: `[0, 0]`;
- non-uniform scaling: disabled.

Counter A01-r02 exposes five adjacent `2 x 2` placement blocks. C01-r02 passes
all five. Three non-overlapping objects fit exactly at:

1. `span.block.01-02`;
2. `span.block.03-04`;
3. `span.block.05-06`.

The meaningful shells preserve a two-pixel visual gap and record zero overlap
failures.

## Parts and behavior

C01-r02 keeps these parts separate after the visual replacement:

- static twin-pillar shell, bridge top, and drip platform;
- local control-canopy viewport A-D;
- recessed empty output bay;
- ready indicator;
- Coffee stream;
- steam;
- independent H01 Coffee mug.

The output socket, effect origin, viewport origin, interaction target, and
support socket are local machine sockets. No scene-specific offset, center
fallback, missing-socket fallback, or per-character scaling exists.

The established proof remains:

- 18 characters;
- 6 interact-front frames;
- 108 total pose cases;
- 54 visible mug cases;
- zero attachment drift;
- zero clipped held props;
- 30-second capacity-one reservation;
- two users;
- blocked competing attempt;
- failure release and successful retry;
- no collision and no owner at second 30.

## Review bundle

`assets/art/layout-references/office-facility-family-v1/coffee-machine-c01-r02/`

The bundle contains source ownership, geometry, parts, clean shell, animation,
counter placement, routes, handoff, roster, sockets, reservation, hand
close-ups, and exact three-item packing.

## Rebuild and checks

```bash
npm run art:facility:coffee:c01:r02
npm run art:facility:coffee:c01:r02:rebuild:check
npm run art:facility:coffee:c01:r02:check
```

## Gate result

- F0-F8: passed;
- owner decision: approved on 2026-07-29 for the exact dark-green twin-pillar
  source and generated evidence hashes;
- F9: blocked;
- F10: blocked.

Owner approval applies only to the exact C01-r02 hashes shown in the manifest.
It does not promote the rejected C01, unlock another facility family, or
authorize room placement.

# Office Facility Coffee Machine C01-r02

Status: F0-F7 passed; owner-review-f8-pending
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

`833fdf374a47487929fe67c9f9c7eba4f154754ddc2d234170444a80af438cc2`

The built-in ImageGen workflow created one isolated ivory, navy, and brass
commercial Coffee machine on a flat green chroma background. A single
proportion edit made the visible silhouette nearly square by raising the rear
housing and extending the front serving deck.

The production prompt locks:

- one original commercial Coffee machine;
- broad two-tile width and deep two-tile serving deck;
- front-biased orthographic game camera with a visible top plane;
- empty output bay;
- warm ivory, deep navy, and restrained brass;
- flat removable green background;
- no cup, Coffee, steam, person, counter, text, logo, shadow, rejected pixels,
  or Active Office.

The deterministic builder keys the source, verifies one complete component,
normalizes without resampling, and derives all production parts.

## Geometry and counter capacity

- physical scale: `2 x 2 x 2` tiles;
- placement plane: `furniture-surface`;
- runtime canvas: `96 x 96`;
- meaningful runtime silhouette: `[17, 28, 79, 92]`, or `62 x 64` pixels;
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

C01-r02 keeps these parts separate:

- static shell;
- local viewport A-D;
- empty output bay;
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

- F0-F7: passed;
- F8: `pending-owner-review`;
- F9: blocked;
- F10: blocked.

Owner approval can apply only to the exact C01-r02 hashes shown in the
manifest. It does not promote the rejected C01 or authorize room placement.

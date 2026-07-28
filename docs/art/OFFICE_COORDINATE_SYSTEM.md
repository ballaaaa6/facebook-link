# Office Coordinate and Socket System

Status: R05-r02 P0-P3 owner review
Updated: 2026-07-28

This document is the focused placement contract for the isolated workstation
proof. It does not authorize ten-seat expansion, hand sockets, other furniture,
or Active Office promotion.

## Four independent contracts

1. `occupancy` is the top-down world reservation used for collision.
2. `supportPlane` is the physical surface that accepts another object.
3. `renderBounds` is the visible bitmap envelope and may overflow occupancy.
4. `localSocket` is a semantic point inside a sprite, such as a chair seat,
   actor seat contact, monitor base, or keyboard support center.

Canvas size and alpha bounds are never occupancy. A desk may use a 96x128
authoring canvas while reserving only a 96x64, 3x2 floor footprint.

## World and local spaces

- World X increases right.
- World Y increases toward the viewer.
- World Z increases upward.
- One tile is 32 authoring pixels.
- Local sprite sockets use integer pixels.
- Projection is `screenX = worldX * 32` and
  `screenY = worldY * 32 - worldZ * 32`.

Every supported placement uses:

```text
drawOrigin = project(worldSocket.xyz) - localSocket.xy
```

For seating specifically:

```text
chairSeatSocketWorld = chairWorldOrigin + chairSeatSocketLocal
actorDrawOrigin = project(chairSeatSocketWorld) - actorSeatContactLocal
```

The chair and actor may share a `1x1` floor cell, but they must never share a
bitmap top-left origin by assumption.

## Seat records

`assets/game/manifests/office-character-seat-sockets-v1.json` records the seat
contact for each existing seat-capable character, view, and frame. Front-facing
contacts retain the owner-approved visual baseline. Back-facing contacts are
measured independently because coats, hair, tails, and non-human silhouettes
hide the pelvis at different local pixels.

The manifest audits nineteen directories: eighteen 8x15 actor atlases are
seat-capable and Boba's 11-row companion atlas is explicitly not applicable.
No new character or pose may be created to fill the non-applicable record.

## Occlusion

Painter order is derived from physical depth, not station canvas order.

- Two 3x2 desks paired in depth have a two-tile, 64-pixel origin delta.
- The near tabletop draws over the far desk base in their shared projected
  band, hiding the far legs while leaving both tabletops visible.
- On the far desk, the keyboard draws before the upright monitor so the monitor
  occludes projected overlap.
- Chair pixels are divided into behind-actor and foreground masks. The actor is
  placed between them through its recorded seat socket.

## Current stop gate

R05-r02 may render individual stations and exactly one depthwise workstation
pair. Expansion to five columns or ten people requires owner acceptance of the
clean and debug pair proof. Hand/grip sockets are deliberately absent from this
revision.

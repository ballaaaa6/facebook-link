# Historical Office Workstation Assembly Bible v3

Status: Superseded; do not use as assembly authority
Superseded: 2026-07-28
Current authority: `docs/art/OFFICE_COORDINATE_SYSTEM.md`

This file remains as a compatibility tombstone for older links. The former
R05 final composition and its ten-seat layout are rejected. The associated
`office-workstation-assembly-bible-v3.json` records earlier component and
measurement decisions only.

## Reusable pixel decisions

The following existing pixels remain inputs because R05-r02 validates them
under a new coordinate system:

- full rectangular `3 x 2` desk top and semantic desk parts;
- real chair source and exact rear/foreground derivatives;
- `52 x 40` monitor visual with base socket `[26,40]`;
- `48 x 24` keyboard visual;
- existing character and seated-pose pixels.

Pixel reuse does not transfer any old coordinate, renderer, map, or promotion
permission.

## Rejected assembly decisions

- shared actor/chair top-left placement;
- one inherited back-facing pelvis contact;
- 128-pixel depthwise desk separation;
- far keyboard drawn after and over the monitor;
- old R05 final ten-seat scene and map;
- any `5 x 4` workstation footprint or `5 x 3` support plane.

For implementation, follow only the owner-approved R05-r02 manifest, socket
manifest, and coordinate manual. For the next planned expansion, follow
`docs/art/OFFICE_WORKSTATION_TEN_SEAT_NEXT_PLAN.md` after an explicit start.

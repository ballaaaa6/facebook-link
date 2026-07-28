# Office Workstation R05 Owner Review

Status: Awaiting owner decision
Updated: 2026-07-28

## Scope

This candidate contains only the approved workstation subset:

- the accepted full-top `3 x 2` desk;
- the accepted `52 x 40` monitor centered by its base socket;
- the accepted `48 x 24` keyboard with a `1 x 1` reservation;
- the existing real chair source, normalized without scaling;
- ten existing characters and their existing seated poses.

It does not contain old Office furniture, new furniture, new characters, new
poses, or an Active Office promotion.

## What changed from the rejected composition

The rejected chair mockup is no longer a renderer input. The real chair source
is divided into `base-seat` and `backrest-arms` physical masks plus `rear` and
`foreground` draw masks. The person and chair share one `1 x 1` floor cell;
the pelvis and cushion meet at local y80 and the chair reaches the floor at
local y112.

The monitor base uses the center of its support footprint in both directions.
The keyboard remains inside the desk support plane while its 48-pixel visual
width may extend eight pixels beyond each side of the reserved center cell.

## Ten-seat layout

- two rows of five desks;
- eight horizontal joins, each with 0 px gap and 0 px overlap;
- five far-facing and five near-facing stations;
- ten real chairs and ten existing characters;
- all desks inside the left 24-tile work zone;
- the current Office background retained byte-for-byte.

## Verification

- 60-second live animation run;
- maximum station anchor drift: 0 px;
- broken images: 0;
- console warnings: 0;
- console errors: 0;
- contract result: pass;
- Active Office map SHA-256 retained as
  `c40db448eb8e6d0f3fea67a41f716c0108aca63a4136cfad15293534273c618d`.

## Review evidence

Deterministic boards are under
`assets/art/layout-references/office-workstation-v3/step5-r05-final/`.
Browser captures are under
`assets/game/processed/office-workstation-v3/step5-r05-final/qa/`.

The final decision should use the clean single-station image, clean ten-seat
image, grid/debug images, and the rejected-v1-versus-R05 before/after board.
No file in this review set is imported by the Active Office registry.

## Owner decision

Approval of this review confirms the workstation base for later expansion. It
does not itself authorize other furniture or Active Office promotion. Either
requires a separately named next step.

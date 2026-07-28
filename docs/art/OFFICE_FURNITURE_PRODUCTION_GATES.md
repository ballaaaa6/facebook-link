# Office Furniture Production Gates

Status: Current owner directive
Updated: 2026-07-29
Scope: Every new Office furniture, facility, equipment, decor, support,
foreground, and interaction asset

This file is the first authority to read before planning or producing Office
objects. It supersedes every older Office instruction that says to reuse,
derive, promote, or fall back to current or legacy furniture pixels.

## Stop rule

A new Office candidate must contain zero pixels from:

- the current Active Office furniture, facility, equipment, or decor;
- `officeAssetRegistry` and every asset referenced by `office-c-v2.json`;
- `core-furniture-c-v1`, `core-furniture-c-v2`, `decor-mechanical-c-v1`, and
  `equipment-c-v1`;
- rejected Office candidates or their derived composites; and
- existing modern-bright furniture, facility, lounge, side-orientation, or
  decor crops.

Those files remain available only as rollback evidence, dimensional research,
or visual references. Inventory presence, an audit disposition, extracted
alpha, a foreground mask, or a historical `accepted-staging` label does not
authorize a pixel for a new candidate.

The sole furniture exception is the owner-approved R05-r02 workstation family:
its desk, chair, monitor, keyboard, sockets, foreground order, and ten-seat
geometry may be carried forward exactly as approved. It may not be redrawn,
silently substituted, or used to approve another furniture family.

The owner-approved V8 architecture and the frozen prototype characters are
separate authorities. Neither authorizes an old furniture pixel.

## No-fallback rule

Every new furniture registry must be allowlist-only. A missing asset,
orientation, component, slot, mask, or interaction contract is a hard failure.
It must never fall back to the Active Office registry, an older library file,
or the nearest similarly named asset.

Layout sketches, highlighted zones, and capacity targets reserve space only.
They cannot authorize asset pixels or runtime placement.

## Clean-source rule

The first accepted source for each furniture family must be generated on its
own canvas. Multi-object sheets are not allowed for a new shell until that
family has passed the clean extraction gate.

Reject a source immediately when:

- another object, cell, shadow, label, border, or fragment touches the asset;
- the asset is clipped by the canvas or crop;
- transparent padding is insufficient for a stable render box;
- foreground and background components cannot be separated deterministically;
- a chair, person, prop, screen content, or interaction output is baked into
  the shell;
- front, back, or side views are not camera-locked orthographic turns; or
- the visible shape cannot represent the declared footprint and support plane.

Do not repair contaminated furniture by painting over fragments. Generate a
clean replacement.

## One-family-at-a-time sequence

Only one family may advance through the gates at a time. A later family cannot
borrow approval from an earlier one.

### F0 — Need and authority

- Name one furniture family and its operational purpose.
- Record required quantity, seats or interaction slots, and exact orientations.
- Prove that no approved clean asset already exists under this policy.
- Add forbidden-source tests before generating art.

### F1 — Geometry contract

- Lock physical `W x D x H`.
- Lock integer render box and floor footprint independently.
- Declare support plane, anchor, sort pivot, collision mask, and overflow.
- Declare every parent surface and child slot.
- Reserve approach and exit cells without placing the asset in a room.

### F2 — Clean single-source generation

- Generate one isolated shell on a uniform removable background.
- Keep generous empty padding on every side.
- Generate only required camera-locked orientations.
- Keep animation, props, actors, text, and output items out of the shell.

### F3 — Extraction and contamination gate

- Preserve the source and keyed source by hash.
- Produce one normalized alpha cutout without resampling the shell.
- Verify transparent corners, complete bounds, and minimum padding.
- Run connected-component and border-contact checks.
- Produce an alpha/bounds/contact-sheet review image.
- Fail on unexplained secondary components or neighboring-cell pixels.

### F4 — Part and occlusion decomposition

- Separate immutable base, support surface, foreground occlusion, and animated
  viewport or output overlay.
- Keep chairs and people separate from desks and tables.
- Keep held props and dispensed items separate from machines and characters.
- Record source rectangles and hashes for every derived part.

### F5 — Placement contract

- Define legal structural support.
- Define footprint cells, render bounds, ground pivot, sort pivot, and parent
  slots.
- Validate every orientation independently.
- Reject footprint overlap, unsupported children, duplicate slots, and route
  obstruction.

### F6 — Reservation and interaction contract

- Give every usable seat or facility point a stable slot id.
- Record approach cell, exit cell, facing, action family, duration, and
  foreground or prop overlay.
- Prove atomic reservation, capacity, release, and retry behavior.
- Prove the actor can reach and leave every slot without collision.

### F7 — Isolated vertical-slice lab

- Render only the new family, its required children, a neutral scale actor,
  and debug geometry.
- Test normal, occupied, foreground-mask, interaction, and failure states.
- Hold the state for at least thirty simulated seconds.
- Capture clean, footprint, part, anchor, and reservation evidence.

### F8 — Owner family approval

- Present the clean shell, alpha cutout, component board, geometry grid,
  interaction view, and provenance report together.
- Approval applies only to the named family and exact hashes.
- A rejection returns the family to the earliest failed gate.

### F9 — Furniture-only room candidate

- Compose only owner-approved families in a new versioned map.
- Keep people hidden for the first layout review.
- Show footprints, approach cells, reservations, routes, and decor separately.
- The room must not import Active Office or reference-only library assets.

### F10 — Active integration

- Add people only after the furniture-only candidate passes.
- Require explicit owner approval for the complete named room candidate.
- Promote through a reversible runtime switch with the previous Office as
  rollback.
- Run contract, stability, responsive-browser, production-build, and full
  repository checks before commit and push.

## Recommended family order

The first non-workstation family should be one complex single-seat facility,
such as the massage chair, because it exercises footprint, seat socket,
foreground occlusion, approach, reservation, and actor interaction in one
vertical slice.

After that passes, use this order:

1. upright machine;
2. parent-and-child counter or printer family;
3. multi-seat sofa;
4. review table with independent chairs;
5. storage and non-interactive decor;
6. full furniture-only room composition.

Do not batch the remaining room merely because one family passes.

## Required evidence per family

Each approved family must retain:

- prompt or source specification;
- original source and keyed source;
- final transparent cutout;
- component and foreground files;
- geometry and reservation manifest;
- clean and debug-grid review images;
- source and output hashes;
- automated check output; and
- explicit owner decision.

Without the complete evidence set, the family remains non-promotable.

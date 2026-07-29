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
- previously processed modern-bright furniture, facility, lounge,
  side-orientation, or decor crops.

Those files remain available only as rollback evidence, dimensional research,
or visual references. Inventory presence, an audit disposition, extracted
alpha, a foreground mask, or a historical `accepted-staging` label does not
authorize a pixel for a new candidate.

The sole already-approved furniture exception is the owner-approved R05-r02
P0-P3 workstation family: its desk, chair, monitor, keyboard, sockets,
foreground order, and paired-workstation geometry may be carried forward
exactly as approved. It may not be redrawn, silently substituted, or used to
approve another furniture family. Rejected P4-P6 ten-seat coordinates are not
part of this exception.

The owner-approved V8 architecture and the frozen prototype characters are
separate authorities. Neither authorizes an old furniture pixel.

## No-fallback rule

Every new furniture registry must be allowlist-only. A missing asset,
orientation, component, slot, mask, or interaction contract is a hard failure.
It must never fall back to the Active Office registry, an older library file,
or the nearest similarly named asset.

Layout sketches, highlighted zones, and capacity targets reserve space only.
They cannot authorize asset pixels or runtime placement.

## Audited-master salvage rule

An original project-created master sheet is source material, not an approved
asset. It may supply pixels to a new family only when all of these conditions
hold:

- `assets/game/manifests/office-furniture-master-audit-v1.json` identifies the
  exact source path, hash, cell, and salvage decision;
- the complete intended object exists in the master and is not fused with a
  neighboring object, label, border, cast shadow, or clipped edge;
- extraction starts from the full master, not from an existing processed crop;
- a cell-boundary contact is resolved by deterministic full-master ownership,
  never by blindly retaining or deleting the whole neighboring cell fragment;
- output is written under a new versioned family and preserves source
  provenance and hashes;
- no repainting or generative repair is used to hide contamination; and
- the resulting family still passes F0-F8 before entering a room candidate.

If the subject is incomplete, fused with another subject, visually inconsistent
with its family, or incapable of representing the geometry contract, generate
a clean replacement. A salvage decision authorizes extraction work only; it
does not authorize placement or promotion.

## Clean-source rule

The first accepted source for each furniture family must either be generated on
its own canvas or be a new extraction from an original master admitted by the
audited-master salvage rule. Multi-object sheets are not allowed as unreviewed
runtime inputs.

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
- Check the master audit and record whether the family is an R05-r02 authority
  input, a salvage candidate, a partial family, or a regeneration requirement.
- Add forbidden-source tests before generating art.

### F1 — Geometry contract

- Lock physical `W x D x H`.
- Lock integer render box and floor footprint independently.
- Declare support plane, anchor, sort pivot, collision mask, and overflow.
- Declare every parent surface and child slot.
- Reserve approach and exit cells without placing the asset in a room.

### F2 — Clean source or audited extraction

- Generate one isolated shell on a uniform removable background, or extract
  the admitted subject from the full original master.
- Keep generous empty padding on every side.
- Generate only required camera-locked orientations.
- Keep animation, props, actors, text, and output items out of the shell.
- Never copy a previously processed crop into the new family.

### F3 — Extraction and contamination gate

- Preserve the source and keyed source by hash.
- Produce one normalized alpha cutout without resampling the shell.
- Verify transparent corners, complete bounds, and minimum padding.
- Run connected-component and border-contact checks.
- For master salvage, prove why every retained component belongs to the subject
  and why every discarded component does not.
- Produce an alpha/bounds/contact-sheet review image.
- Fail on unexplained secondary components or neighboring-cell pixels.

### F4 — Part and occlusion decomposition

- Separate immutable base, support surface, foreground occlusion, and animated
  viewport or output overlay.
- For a seat using an upright working pose, follow the approved R05 layer
  principle: keep the backrest, support, base, and furniture legs behind the
  actor; keep only the narrow seat lip and required arm sections in front.
- Measure the actor at and below the approved seat contact in every supported
  frame. The seat foreground must preserve 100% of those lower-body pixels so
  the butt rests on the cushion and both legs hang naturally in front.
- Keep chairs and people separate from desks and tables.
- Keep held props and dispensed items separate from machines and characters.
- Give every held prop its own native-scale grip socket. Actor-held props must
  render between the actor body and a source-exact hand foreground mask.
- Record source rectangles and hashes for every derived part.

### F5 — Placement contract

- Define legal structural support.
- Define footprint cells, render bounds, ground pivot, sort pivot, and parent
  slots.
- Define semantic local sockets for every required root, interaction target,
  output, effect, support, or viewport. Resolve attachments by parent socket
  minus child socket; center anchors, scene offsets, runtime scale fixes, and
  missing-socket fallbacks are forbidden.
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
- When a child changes parent during an action, record the frame timeline and
  prove exact attachment delta `[0,0]` before and after the switch.
- Test every supported character, frame, and held-prop profile at native scale.
  Include movement proof so the child follows a moved parent without a
  scene-specific coordinate.
- Hold the state for at least thirty simulated seconds.
- Capture clean, footprint, part, socket, layer, movement, and reservation
  evidence.

### F8 — Owner family approval

- Present the clean shell, alpha cutout, component board, geometry grid,
  interaction view, socket debug, and provenance report together.
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

Current first-family evidence:
`docs/art/OFFICE_FURNITURE_MASSAGE_CHAIR_R02.md`. R01 was rejected at F8
because `lounge-front` was not the intended upright posture. R02 rebuilds the
chair from the audited original master, uses the owner-approved
`working-front-seated` pose, and passed F0-F8 on 2026-07-29. F9 furniture-only
room composition and F10 Active Office integration remain blocked.

After that passes, use this order:

1. upright machine;
2. parent-and-child counter or printer family;
3. multi-seat sofa;
4. review table with independent chairs;
5. storage and non-interactive decor;
6. full furniture-only room composition.

Do not batch the remaining room merely because one family passes.

Current seating execution:
`docs/art/OFFICE_FURNITURE_SEATING_S01.md` uses shared tooling for seven
seat-capable families while preserving an independent manifest and F8 decision
for every family. The batch covers reading chair, pouf, beanbag, stool,
two-seat sofa, three-seat sofa, and the front/back four-seat review table.
All seven passed F0-F8 independently on 2026-07-29. Every family remains
blocked from F9-F10. This is not a room-level batch and does not weaken the
per-family rule above.

Current upright-facility execution:
`docs/art/OFFICE_SPATIAL_SOCKET_SYSTEM_I01.md` defines the isolated I01/H01
coordinate, hand-socket, prop-grip, foreground-mask, and movement authority.
It proves 18 characters, 108 action frames, 16 fresh held props, 864 visible
attachment cases, and zero attachment drift. I01/H01 remain
`owner-review-f8-pending` and are not imported by Active Office.

`docs/art/OFFICE_FACILITY_VENDING_U01.md` rebuilds the front-only
`vending.machine.modern` family from the audited original mechanical-loop
master. Its static shell, local four-frame viewport, empty pickup tray, effect,
and H01 held output pass F0-F7. U01-r02 replaces the rejected fixed-center r01
attachment with a facility-output-to-actor-hand socket timeline across 108
interact-front cases, plus the 30-second contention/failure/retry lab. U01-r02
is independently `owner-review-f8-pending`. Do not begin Water/Coffee, F9 room
placement, or F10 Active Office integration until its F8 decision is recorded.

## Required evidence per family

Each approved family must retain:

- prompt or source specification;
- original master path, source cell, and audit decision when salvage is used;
- original source and keyed source;
- final transparent cutout;
- component and foreground files;
- geometry and reservation manifest;
- local socket and attachment-parent timeline when the family has children;
- clean, debug-grid, socket, layer-order, and movement review images;
- source and output hashes;
- automated check output; and
- explicit owner decision.

Without the complete evidence set, the family remains non-promotable.

The machine-readable source classification is
`assets/game/manifests/office-furniture-master-audit-v1.json`; its readable
decision summary and proposed family order are in
`docs/art/OFFICE_FURNITURE_MASTER_AUDIT_V1.md`.

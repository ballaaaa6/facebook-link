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
- Give every held prop a deterministic alpha-bounds visual-center socket at
  native scale. Actor-held props render after the actor body as a complete
  front overlay; no hand or actor layer may hide prop pixels afterward.
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

Current candidate (2026-07-30):

- `office.furniture-only-room.f9.v1` is pending owner review;
- its 10-workstation island uses the `C12:S19` two-row authority;
- 14 facility objects expose 20 independent reservation slots;
- Server N02 and Arcade G02 use approved left views in a right-edge service
  bank, while front-only families face open approach aisles;
- all `10 x 20 = 200` workstation-to-slot routes are reachable;
- the 300-second, 21-user reservation proof ends with zero double bookings and
  zero leaks; and
- people, character sprite references, and Active Office promotion remain
  disabled.

See `docs/art/OFFICE_FURNITURE_ONLY_ROOM_F9_V1.md`.

### F10 — Active integration

- Add people only after the furniture-only candidate passes.
- Require explicit owner approval for the complete named room candidate.
- Promote through a reversible runtime switch with the previous Office as
  rollback.
- Run contract, stability, responsive-browser, production-build, and full
  repository checks before commit and push.

## Modular motion standard

Every family with visible motion must follow the modular composition recipe in
`docs/art/ASSET_SHEET_PLAN.md`. Arcade G02 r02 is the accepted reference:

- preserve one immutable shell and separate every moving viewport, mechanism,
  effect, output, actor, and held prop;
- compose every frame from the same canvas, origin, pivots, collision geometry,
  support geometry, and fixed layer order;
- constrain all changed pixels to declared local motion regions;
- use integer local transforms with no magic offset or fallback;
- for repeating motion, validate four real A-D phases plus an unstored logical
  phase E that equals A exactly;
- prove the D-to-A seam in an animated preview and retain parts, transition,
  changed-pixel, timing, and hash evidence; and
- keep route, reservation, actor action, and handoff timelines independent
  from the object's local motion loop.

Finite open/close or start/finish actions use the same piece separation but
must declare explicit endpoint and interruption behavior instead of pretending
to be ambient seam loops. Failure to isolate a moving part returns the family
to F4. Pivot, footprint, support, or collision drift returns it to F1.

Arcade G02 production revision `g02-production-r01` applies this standard to
four immutable shells, four machine-local control layers, and twelve viewport
frames. Its F4-F7 evidence passes with zero shell, control, outside-viewport,
pivot, root, route, and seam-closure failures. The owner approved F8 on
2026-07-30, so Arcade contributes one slot and Facility v1 readiness is
`15/20`. F9-F10 remain blocked.

Server Rack N01 is preserved as superseded F0-F3 evidence after the owner
requested no held prop, new `2 x 2 x 4` geometry, and four fresh sides. The
owner approved the exact N02 visual-preflight hashes on 2026-07-30. Production
revision `n02-production-r01` consumes only those approved pixels and passes
F4-F7 with four orientation shells, a viewport-local A-D-A status loop,
`18 x 6 = 108` empty-hand I01 cases, `432` orientation cases, collision-free
routes, and a thirty-second two-instance capacity-one failure/release/retry
proof. The owner approved the exact twelve production review hashes at F8 on
2026-07-30. Both independent slots are active, advancing Facility v1 from
`15/20` to `17/20`. F9-F10 stay blocked. See
`docs/art/OFFICE_FACILITY_SERVER_RACK_N02_PRODUCTION.md`.

Refrigerator R01 is the next isolated family. On 2026-07-30 the owner replaced
the audited static `2 x 1 x 3` plan with a fresh front-only `2 x 2 x 4`
identity, a fixed `2 x 2` footprint, and a reversible finite lower-door action.
The preflight composes `immutableShell + lowerDoor[state]` through closed,
half, and open states. It reuses the approved I01 per-frame hand coordinates
and the existing H01 `held.water-bottle` and `held.yogurt-box`; it creates no
new attachment system. The owner approved the exact ten preflight hashes on
2026-07-30. Production revision `r01-production-r01` consumes only those
approved pixels and passes F4-F7 with `18 x 6 = 108` base I01 cases, `108`
two-prop H01 overlay cases, stable visit selection, both interruption paths,
and a thirty-second capacity-one blocked/failure/release/retry proof. The owner
approved the exact fifteen production review hashes at F8 on 2026-07-30. R01
contributes one slot and advances Facility v1 from `17/20` to `18/20`.
Printer P01 must provide the final two slots before F9; F9-F10 remain blocked. See
`docs/art/OFFICE_FACILITY_REFRIGERATOR_R01_PRODUCTION.md`.

Printer P01 is the next isolated family. On 2026-07-30 the owner replaced the
desktop-printer and credenza plan with a fresh front-only `2 x 2 x 4`
floor-standing copier. Revision `p01-generated-motion-preflight-r02` composes
an immutable shell, local A-D-A status viewport, local A-D-A scanner light,
finite closed/half/open tray children, and job-driven H01 paper or envelope
output. It reuses I01 `interact-front` and the existing
H01 paper and envelope sources. The first midpoint presentation was rejected
because the prop alpha sat between the hands without visibly touching either.
Revision r02 pins `prop.primaryGripSocket` directly to
`actor.primaryGripSocket` and proves six Anna held-frame cases at `[0,0]`
delta. The owner approved the exact twelve r02 preflight hashes on 2026-07-30.
Production revision `p01-production-r01` consumes only those approved pixels
and passes F4-F7 with `18 x 6 = 108` base I01 cases, `18 x 3 x 2 = 108`
exact primary-grip prop cases, both interruption paths, and a thirty-second
three-user/two-instance capacity proof. The owner approved the exact seventeen
production review hashes at F8 on 2026-07-30. Its two independently reservable
instances advance Facility v1 from `18/20` to `20/20`. F9 room composition
must still pass as a separate versioned furniture-only candidate; F10 and
Active Office remain blocked. See
`docs/art/OFFICE_FACILITY_PRINTER_P01.md` and
`docs/art/OFFICE_FACILITY_PRINTER_P01_PRODUCTION.md`.

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
coordinate, hand-target, prop-visual-center, front-overlay, and movement
authority.
It proves 18 characters, 108 action frames, 16 fresh held props, 864 visible
attachment cases, zero mask uses, full prop-alpha visibility, and zero
attachment drift. I01/H01 passed F8 independently on 2026-07-29 and are not
imported by Active Office.

`docs/art/OFFICE_FACILITY_VENDING_U01.md` rebuilds the front-only
`vending.machine.modern` family from the audited original mechanical-loop
master. Its static shell, local four-frame viewport, empty pickup tray, effect,
and H01 held output pass F0-F7. U01-r03 preserves the r02 socket repair and
replaces its occluded hand-mask presentation with a complete front overlay
across 108 interact-front cases, plus the 30-second contention/failure/retry
lab. U01-r03 passed F8 independently on 2026-07-29. Water/Coffee isolated
production may begin. F9 room placement and F10 Active Office integration
remain blocked until their own gates are satisfied.

`docs/art/OFFICE_FACILITY_WATER_DISPENSER_W01.md` records the next
one-family-at-a-time step. The owner directed W01 to replace the short audited
neutral form with a newly generated tall isolated source. The resulting
front-only family uses a one-cell footprint, four-tile physical height,
`64 x 128` runtime envelope, static shell, local ready/water effects, empty
output bay, and the independent H01 clear cup. Its 18-character, 108-pose
socket lab and 30-second capacity-one failure/retry simulation pass F0-F7.
The owner approved the exact W01 hashes on 2026-07-29. Isolated Coffee C01
production is unlocked but must pass F0-F8 independently; F9 and F10 remain
blocked.

Before Coffee begins, the owner directed production to create a reusable cafe
counter from a completely new design. The first A01 candidate passed F0-F7
but the owner rejected its tapered top at F8 on 2026-07-29.
`docs/art/OFFICE_FURNITURE_COUNTER_BAR_A01_R02.md` records the fresh successor
with zero A01 pixels. A01-r02 reserves a `6 x 2` floor footprint, exposes an
exact projected `192 x 64` support plane at `Z=2`, and proves twelve complete
`1 x 1` cells, ten `2 x 1` spans, five `2 x 2` spans, and zero edge-support
failures. Its route, 36-case movement, and 30-second contention proofs pass
F0-F7. The owner approved A01-r02 at F8 on 2026-07-29 and directed isolated
Coffee C01 production to begin on its support surface. Coffee must still pass
F0-F8 independently. F9 and F10 remain blocked.

`docs/art/OFFICE_FACILITY_COFFEE_MACHINE_C01.md` preserves the first isolated
Coffee vertical slice as rejected evidence. C01 passed F0-F7, but the owner
rejected it at F8 on 2026-07-29 because its compact one-cell visual silhouette
did not visibly fill its reserved two-cell depth.

`docs/art/OFFICE_FACILITY_COFFEE_MACHINE_C01_R02.md` records the fresh
successor and uses zero C01 pixels. C01-r02 is a visible and physical
`2 x 2 x 2` machine. It occupies four complete A01-r02 support cells, proves
all five adjacent `2 x 2` placement blocks, and proves an exact
three-object packing at `span.block.01-02`, `span.block.03-04`, and
`span.block.05-06` with zero overlap failures. Its shell, local viewport,
empty output bay, Coffee/steam overlays, and H01 mug remain separate. The
18-character, 108-pose socket matrix and 30-second contention/failure/retry
proof pass F0-F7. On 2026-07-29 the owner selected the exact dark-green
twin-pillar Option B source, directed it to replace the prior C01-r02 visual,
and approved its rebuilt evidence at F8. C01-r02 is `owner-approved`; F9,
F10, other facility families, and Active Office remain blocked.

`docs/art/OFFICE_FACILITY_ARCADE_MACHINE_G01.md` records the next isolated
family. G01 currently stops at a five-board visual preflight so the owner can
judge the audited source-exact silhouette before part decomposition, 108
character cases, or reservation production begins. Its static identity front
comes only from the original facility-lounge master; A-D are ownership-proven
screen-source candidates from the original mechanical-loop master. Processed
crops and rejected side orientations remain forbidden. F0-F3 preflight
evidence passes; visual approval is pending and F4-F10 remain blocked.

`docs/art/OFFICE_FACILITY_ARCADE_MACHINE_G02.md` records the fresh generated
successor and uses zero G01, original-master, processed-crop, or Active Office
pixels. G02 r02 locks a `2 x 2 x 4` cabinet, four elevations, three modular
four-frame game loops, and one development-only Anna approach/use/release
preview. On 2026-07-29 the owner approved the exact 14 review-output hashes and
adopted its separate-parts deterministic seam-loop method as the standard for
future moving families. The isolated F4-F8 production evidence passes and the
owner approved its exact hashes on 2026-07-30. Arcade contributes one Facility
v1 slot; F9, F10, and Active Office remain blocked.

`office.facility-upsize.2x2x4.preflight.v1` records the owner-directed fresh
visual replacement batch for Coffee C02, Water W02, Vending U02, and Massage
R03. Each candidate locks a `2 x 2 x 4` physical scale, `2 x 2` footprint,
`3 x 4` render box, four isolated elevations, and an immutable-shell modular
motion plan. The batch contains 16 views. On 2026-07-30 the owner approved the
exact F3 hashes for all four candidates and authorized isolated F4-F8
production. The approved preflight itself builds no motion frames, pose
matrix, reservation simulation, or room placement. The current accepted
families retain all
`20/20` slots; the five candidate slots do not transfer before independent F8
approval. Counter A01-r02 is retained, F9 v1 is hash-pinned and unchanged,
and F4-F10 plus Active Office remain blocked. See
`docs/art/OFFICE_FACILITY_UPSIZE_2X2X4_PREFLIGHT_V1.md`.

The authorized production revision now completes F4-F7 independently for all
four successors. It proves sixteen A-D motion frames, four finite return-to-idle
sequences, 432 actor pose cases, 1,728 four-orientation placement cases, and
four thirty-second reservation scenarios. Coffee, Water, and Vending reuse
exact I01/H01 primary grips; Massage reuses the approved working-front seat
row and remains interaction-front-only while retaining four static placement
elevations. The owner accepted this behavior evidence but rejected its
procedural motion artwork at F8. All five slot transfers, F9 v2, F10, and
Active Office remain blocked. See
`docs/art/OFFICE_FACILITY_UPSIZE_2X2X4_PRODUCTION_V1.md`.

Motion Artwork V2 applies the Arcade G02 standard: moving pixels must
originate in an authored raster part atlas. Runtime code may crop,
nearest-resize, integer-transform, clip, and alpha-composite those pixels but
may not draw an effect with primitives. Coffee C02, Water W02, Vending U02,
and Massage R03 now provide 52 fresh ImageGen-authored components, sixteen
A-D seam frames, twenty-four finite-use frames, and four person-interaction
previews. The V2 visual hashes are `pending-owner-review`; the 108/432
production rebuild, five-slot transfer, F9, F10, and Active Office remain
blocked. See `docs/art/OFFICE_FACILITY_UPSIZE_MOTION_V2.md`.

The owner accepted the 52 Motion V2 effect parts but rejected the reused shell
integration. `office.facility.upsize-shell.v3` therefore creates four entirely
new ImageGen shell turnarounds: sixteen retained front/left/right/back views.
No old shell pixels or newly generated effect pixels are permitted. The
runtime compositor uses only authored shell crops, the approved Motion V2
cutouts, nearest resize, integer placement, alpha masks, and alpha compositing.
All sixteen A-D frames keep the shell and `[48,124]` pivot stable, and all four
finite sequences return to the exact initial idle hash. Shell V3 is
`pending-owner-review`; the 108/432 rebuild, five-slot transfer, F9, F10, and
Active Office remain blocked. See
`docs/art/OFFICE_FACILITY_UPSIZE_SHELL_V3.md`.

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

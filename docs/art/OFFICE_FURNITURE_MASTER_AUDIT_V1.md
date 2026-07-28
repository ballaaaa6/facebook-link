# Office Furniture Master Audit V1

Status: planning evidence only; not placement or promotion authority

Audit date: 2026-07-29

Machine-readable source:
`assets/game/manifests/office-furniture-master-audit-v1.json`

## Decision

The owner-approved R05-r02 P0-P3 workstation is the only furniture family
currently ready to carry forward. Its approved desk, office-chair layers,
monitor, keyboard, sockets, foreground order, and paired-workstation geometry
must be used without redrawing or substitution.

No other furniture family is room-ready. Original project-created master sheets
contain useful source art, so most families do not need to be generated from
zero. They do need a new extraction from the complete master, a new versioned
output, explicit geometry and part contracts, placement testing, and owner
approval. Previously processed crops remain forbidden as source pixels.

## Evidence snapshot

| Evidence | Result |
| --- | ---: |
| Original source files inspected and hash-locked | 18 |
| Source records inspected | 260 |
| Semantic families classified | 142 |
| Records touching a nominal source-cell boundary | 134 |
| Processed crops allowed for direct reuse | 0 |
| Already approved furniture families | 1 |
| Room-ready non-workstation families | 0 |

The 134 boundary-contact records explain the contamination seen in older
library crops. A rigid cell cut can either retain pixels from a neighbor or
remove pixels that belong to the intended subject. New salvage work must assign
components from the complete master image; it must not recrop an existing
processed file or assume that a grid-cell edge is an object edge.

## Family dispositions

| Disposition | Families | Required outcome |
| --- | ---: | --- |
| Use R05-r02 authority | 4 | Carry forward the approved components and contracts exactly |
| Re-extract from an audited complete master | 113 | Produce a clean versioned cutout, then pass F1-F8 |
| Re-extract and decompose into operational parts | 16 | Produce shell/layers/sockets/reservation contracts, then pass F1-F8 |
| Salvage only as child overlays or held parts | 7 | Bind each part to an approved parent viewport or grip contract |
| Generate a new clean modular shell | 2 | Do not recover a runtime shell from the existing source |

Every individual source record, source hash, cell, pixel measurement,
historical finding, current decision, family action, geometry reference, and
required contract is stored in the machine-readable audit.

## Already approved authority

- `desk.workstation`: use the R05-r02 desk component.
- `chair.office.modern`: use the R05-r02 normalized rear layer, foreground
  layer, and seat socket.
- `monitor`: use the R05-r02 monitor component.
- `keyboard.mouse`: use the R05-r02 keyboard component.

This authority covers P0-P3 paired-workstation assembly only. Rejected P4-P6
ten-seat coordinates are not approved.

## Re-extractable static families

The 113 static families break down as follows:

| Category | Families |
| --- | ---: |
| Surface props | 46 |
| Floor decor | 20 |
| Wall-mounted objects | 18 |
| Static equipment or decor | 18 |
| Storage or fixed composites | 11 |

These source subjects are visually recoverable from their complete masters.
That classification only avoids unnecessary regeneration. Each family still
needs a deterministic ownership mask, transparent isolated output, physical
dimensions, footprint, render bounds, anchor, support plane, sort pivot, and
the remaining F1-F8 evidence.

## Families that need operational decomposition

### Seats

- `beanbag.lounge`
- `chair.massage.modern`
- `chair.reading`
- `pouf.lounge`
- `sofa.modern.three-seat`
- `sofa.modern.two-seat`
- `stool.side`

Each needs a stable rear/base layer, a foreground occlusion layer, one or more
seat sockets, a ground sort pivot, approach and exit cells, and an atomic
reservation contract. A character must be tested behind, seated inside, and in
front of the furniture without stretching or repainting the shell.

### Interactive facilities

- `dispenser.water`
- `locker.bank.personal-15`
- `machine.coffee`
- `machine.game.arcade.modern`
- `printer.desktop`
- `refrigerator.modern`
- `server.rack.noc`
- `vending.machine.modern`

Each needs a stable shell, interaction socket, approach cell, exit cell, and
reservation contract. Arcade and server loops also need a local animation
viewport. Water, coffee, printer, and vending assets need an item-neutral shell,
output anchor, held-prop overlay, and local effect layer so cups, cans, paper,
steam, or glow are not permanently baked into the facility.

### Review table

- `table.review.long.modern`

Use only the isolated V3 review-table master. Build a clean base shell, support
surface, foreground occlusion layer, independent child slots, use or seat
sockets, approach and exit cells, and a reservation contract. Chairs and
tabletop props remain independent children.

## Child-only sources

- `facility.status`
- `held-props`
- `screen.theme.content`
- `screen.theme.dashboard`
- `screen.theme.progress`
- `screen.theme.support`
- `screen.theme.system`

Screen and status art must become normalized overlays inside a stable parent
viewport. Held props need a grip anchor and explicit front/back hand order.
None of these records may be placed as standalone floor furniture.

## Clean regeneration required

- `table.board-game`
- `table.side`

Both existing sources have a child object or state baked into the tabletop, so
a complete clean support surface cannot be recovered. The board-game table also
has rejected side turns. Generate a clean prop-free base only after its F1
geometry and slot contract is declared.

## Rejected orientations

All 32 records in the two historical side-orientation sheets are rejected
because their family identity, palette, or camera-locked silhouette does not
match the accepted front source. The left and right `monitor.shell` records are
also rejected because they are not faithful turns of the R05-r02 monitor.

Affected side-source families are:

- `cabinet.storage.low`
- `cabinet.storage.tall`
- `cart.utility`
- `chair.massage.modern`
- `dispenser.water`
- `machine.coffee`
- `machine.game.arcade.modern`
- `partition.glass`
- `printer.desktop`
- `refrigerator.modern`
- `server.rack.noc`
- `shelf.storage.tall`
- `sofa.modern.three-seat`
- `sofa.modern.two-seat`
- `table.board-game`
- `vending.machine.modern`

Do not regenerate all turns speculatively. Lock the room layout first and create
only the orientations that the actual placement requires.

## Placement invariants

The following rules carry the successful R05 method to every other family:

1. The source bitmap is never stretched to equal the logical footprint.
   Physical width, depth, height, render bounds, footprint, and overflow are
   separate values.
2. If scale changes, it is uniform. The family is rejected when its silhouette
   cannot fit the declared contract without non-uniform distortion.
3. Every floor asset has an explicit ground anchor and sort pivot. Every child
   asset has a parent socket and support plane.
4. Seats and facilities declare approach, occupied, exit, and clearance cells.
   Reservation is atomic and cannot share an occupied cell accidentally.
5. Character occlusion is implemented with stable rear/base and foreground
   layers. It is not simulated by cutting or repainting the character.
6. Animated objects keep the shell and render bounds stable. Only a local
   overlay changes between frames.
7. Props and output items remain independent children. A neutral facility or
   table shell must exist when no interaction is active.
8. Missing assets fail closed. Runtime code must not fall back to an old
   library crop, active-office asset, legacy directory, or rejected candidate.

## Proposed production order

1. Freeze the audit and forbidden-source checks. This prevents an old crop from
   returning while new families are being prepared.
2. Prove the decomposition pipeline with one vertical slice:
   `chair.massage.modern`. R01 now contains the clean full-master extraction,
   two occlusion layers, seat socket, approach/exit cells, reservation contract,
   and isolated lab. F0-F7 evidence passes; F8 owner review remains pending in
   `docs/art/OFFICE_FURNITURE_MASSAGE_CHAIR_R01.md`.
3. Process upright facilities using their preferred front masters:
   vending machine, refrigerator, arcade machine, server rack, printer, water
   dispenser, and coffee machine. Add neutral output and effect layers where
   required.
4. Process lounge seating: two-seat sofa, three-seat sofa, beanbag, pouf,
   reading chair, and stool.
5. Process the isolated V3 review table with independent approved chairs and
   props.
6. Process storage, wall, surface, and floor-decor families in small batches
   that share the same contract type.
7. Generate only the two unrecoverable table shells and only the side
   orientations proven necessary by the locked layout.
8. Build a furniture-only room candidate. Add characters and runtime
   interactions only after every placed family independently passes F0-F8.

Each batch exits only after contamination checks, geometry validation, socket
and reservation tests, a 30-second isolated placement lab, contact-sheet
evidence, and explicit owner approval. Passing one family never promotes the
next family automatically.

## Reproduction and validation

Regenerate the data after an intentional source or authority change:

```bash
npm run art:furniture:audit
```

Run the lightweight hash, policy, count, and decision validator:

```bash
npm run art:furniture:audit:check
```

The validator is part of `npm run check`. The Python builder is intentionally
not part of the main CI path because it performs the slower source-pixel audit;
its `--check` mode can be used during audit maintenance.

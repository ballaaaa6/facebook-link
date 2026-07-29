# Office Furniture Seating S01

Status: all seven families passed F0-F8 with independent owner decisions on
2026-07-29

Batch: `office-furniture-seating-s01`

Created: 2026-07-29

Active Office promotion: blocked

## Purpose

Seating S01 applies the approved massage-chair and R05-r02 workstation method
to every remaining seat-capable furniture family requested by the owner. The
batch shares deterministic extraction, pose, socket, reservation, evidence,
and validation tooling. It does not share approval: a failed family cannot
invalidate or promote another family.

The batch manifest is
`assets/game/manifests/office-furniture-seating-s01.json`. Its consolidated
review image is
`assets/art/layout-references/office-furniture-family-v1/seating-s01/00-batch-overview.png`.

## Family matrix

| Family | Capacity | Runtime pixels | Pose cases | Allowed facing | F8 |
| --- | ---: | ---: | ---: | --- | --- |
| `chair.reading` | 1 | `48 x 80` | 108 | front | owner-approved |
| `pouf.lounge` | 1 | `72 x 64` | 108 | front | owner-approved |
| `beanbag.lounge` | 1 | `72 x 64` | 108 | front | owner-approved |
| `stool.side` | 1 | `54 x 80` | 108 | front | owner-approved |
| `sofa.modern.two-seat` | 2 | `96 x 96` | 216 | front | owner-approved |
| `sofa.modern.three-seat` | 3 | `130 x 96` | 324 | front | owner-approved |
| `table.review.long.modern` | 4 | `128 x 64` | 432 | front and back | owner-approved |

The batch therefore contains 13 candidate seat slots and 1,404 validated
character-frame-slot cases. The already approved massage chair remains a
separate family and adds one further approved seat.

## Source decision

Every selected silhouette was complete in an original project-created master
that the source audit marks `salvage-full-master-and-decompose`. Consequently,
the batch uses deterministic full-master connected-component ownership and no
generated repair.

The builder never reads a processed furniture-library crop. It removes only
the generated magenta background, selects one owned component from the full
master, preserves that component without authoring resampling, adds transparent
canvas padding, and creates new versioned authoring and runtime files.

The three-seat sofa crosses the nominal catalog-cell boundary because the
original object is wider than its cell. Cropping to the nominal cell would
remove its left arm. Its F2/F3 evidence records the complete connected
component, proves that it remains isolated, and proves that it does not touch
the master-image boundary.

Although the historical audit reported nominal boundary contacts for the
beanbag and stool, chroma-key component ownership proves that both real
silhouettes are complete and clear of the master boundary. No replacement
image was needed.

## Direction and pose authority

Front-facing slots use the owner-approved `working-front-seated` row 14.
Back-facing slots use the owner-approved `working-back-seated` row 13.
Character contacts come from
`assets/game/manifests/office-character-seat-sockets-v1.json`.

The following rules are locked:

- furniture and actors are never scaled per character;
- no per-character magic seat offset is introduced;
- all six approved frames are checked for all 18 seat-capable characters;
- the actor's approved seat-contact pixel places the butt on the cushion;
- every opaque actor pixel at or below that contact remains visible in front
  of the seat foreground;
- a front image is never mirrored or relabelled as a back image;
- left and right seating are blocked; and
- `stool.side` is a family name, not permission for a side-facing pose.

## Seat-layer decomposition

Seating S01 copies the proven R05-r02 working-chair layer principle, not its
pixels. The rear layer owns the backrest, support, base, and furniture legs.
The foreground layer contains only a narrow cushion lip and any side arm
sections that must cross the actor at the seat contact. It must never contain
a broad lower panel that hides hanging legs.

The builder measures the actor alpha at and below the approved seat contact
after composing every family, slot, character, orientation, and active frame.
All 1,404 character-frame-slot cases retain 100% of those lower-body pixels.
Generation fails immediately if even one such pixel is covered by the seat
foreground. The four-seat review-table metric ignores table-shell occlusion
and evaluates the approved R05 chair foreground specifically, so the rule
continues to describe the seat rather than an unrelated external surface.

## Multi-seat behavior

Each furniture slot owns an independent reservation identifier, seat cell,
approach cell, exit cell, facing, semantic action, and visual pose. The
reservation proof uses one more actor than capacity for 30 simulated seconds:

- all declared slots may be occupied concurrently;
- the overflow actor waits;
- no slot has two holders;
- no route collision is recorded; and
- all reservations release at the end.

The two-seat and three-seat sofas use the same front pose authority for every
slot. The table uses two rear slots with the front pose and two front slots
with the back pose.

## Review-table chair scope

The review table depends on the exact owner-approved R05-r02 normalized office
chair layers:

- rear-table seats use `chair.office.modern.r05.front`;
- front-table seats use `chair.office.modern.r05.back`; and
- no left or right chair output is consumed.

R05-r02 remains approved only for its original P0-P3 workstation scope.
Seating S01 does not silently broaden that permission. The table manifest
records a `review-table-f7-context-proof-only` dependency, leaves the R05
authority unchanged, and requires a new F8 owner decision for this context.

The four-seat layer order is:

1. rear chair rear;
2. rear actor;
3. rear chair foreground;
4. table shell;
5. front chair rear;
6. front actor; and
7. front chair foreground.

This gives a measurable front/back result without side-facing art.

## Evidence

Every family retains six deterministic review images:

1. original-master source ownership;
2. alpha shell, rear, and foreground parts;
3. geometry, directions, and simultaneous capacity;
4. six-frame Einstein seat lab;
5. all-character roster fit; and
6. capacity and reservation timeline.

Every family manifest records source, part, pose-authority, character-sheet,
review-output, and Active Office baseline hashes. Missing or altered assets
fail closed.

## Gate state

- F0-F7: passed independently for all seven exact family revisions.
- F8: owner-approved independently for all seven families on 2026-07-29.
- F9: blocked for every family.
- F10: blocked for every family.

All seven families may be selected for a future furniture-only F9 candidate.
The review-table decision applies only to its declared front-and-back seated
context and does not expand R05-r02 workstation permissions. Approval does not
place any family in a room and does not authorize Active Office integration.
No Seating S01 path is imported by the Active Office registry.

## Reproduction

Regenerate the exact assets and evidence:

```bash
npm run art:furniture:seating:s01
```

Run the portable source, hash, geometry, pose, capacity, and isolation check:

```bash
npm run art:furniture:seating:s01:check
```

Confirm deterministic Python output when Pillow is available:

```bash
python scripts/build-office-seating-s01.py --check
```

The portable validator is part of `npm run check`.

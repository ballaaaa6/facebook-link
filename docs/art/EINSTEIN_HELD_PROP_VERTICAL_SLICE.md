# Einstein and Held-Prop Vertical Slice

Status: Planned next

## Objective

Prepare one complete runtime-ready Office interaction slice before replacing
the active interior or generating extension rows for the complete PetDex
roster. Einstein is the golden 8x15 character, and one controlled 4x4 sheet
supplies all transient handheld prop identities required by Facility v1.

The accepted Modern v3 background, seasonal window viewport, clock art, and
clock placement remain unchanged.

## Locked Invariants

- Active and future character work starts from PetDex-compatible base atlases.
- Einstein is the first complete 8x15 reference character.
- The original 8x9 PetDex rows remain unchanged.
- Character extension strips contain only the character: no furniture,
  facility, handheld prop, ground, shadow, text, or logo.
- The final contract remains fifteen rows. Facility v1 adds no side-action,
  carry-walk, machine-specific, or sixteenth review row.
- All facilities use a front-facing action presentation for the pilot.
- A held prop exists only during the local facility interaction and disappears
  before route movement resumes.
- Furniture foreground masks are derived from exact accepted furniture pixels,
  never approximated by image generation.

## Deliverable A — Einstein 8x15

Einstein currently owns an active 8x9 atlas and accepted character-only rear
and front seated-working sources. Generate the four missing facility strips
one at a time:

1. `working-back`;
2. `interact-front`;
3. `inspect-front`;
4. `lounge-front`.

Every strip has eight cells: six active frames followed by two empty cells.
Pack those four strips and the two accepted seated-work rows after the original
nine rows:

| Row | Semantic |
| ---: | --- |
| 0–8 | unchanged PetDex base |
| 9 | `working-back` |
| 10 | `interact-front` |
| 11 | `inspect-front` |
| 12 | `lounge-front` |
| 13 | `working-back-seated` |
| 14 | `working-front-seated` |

Record standing feet, seated pelvis, and six per-frame interaction hand
anchors. Add explicit runtime support for a 15-row character definition before
promoting the packed atlas.

## Deliverable B — Held-Prop 4x4 Sheet

Generate one square modern-bright contact sheet on a flat `#ff00ff` background.
The logical cell order is:

| Row | Cells |
| --- | --- |
| 1 | clear water cup; blue water cup; water bottle; coffee mug |
| 2 | takeaway cup; tea cup; soda can; juice box |
| 3 | snack bag; yogurt box; paper sheet; envelope |
| 4 | label card; tablet; notebook; smartphone |

Every object is isolated, front-presented, character-hand scale, padded, and
free from readable text, branding, hands, characters, cast shadows, and floor
planes. Extract all sixteen props to transparent runtime files and record:

- prop ID and source cell;
- normalized grip anchor;
- character-relative scale;
- front/back hand-layer role;
- allowed facility pools.

## Deliverable C — Runtime Interaction Contract

Facility prop selection uses a stable seed derived from:

```text
agentId + facilitySlotId + visitIndex
```

The selected value remains stable for the full visit. When a pool has more than
one value, avoid the immediately previous selection for that agent and
facility. Pools may include `none`.

The six-frame interaction timeline is:

| Frame | Presentation |
| ---: | --- |
| 1 | reach; no prop |
| 2 | facility response; no prop |
| 3 | prop appears at the output or hand anchor |
| 4 | hold or inspect |
| 5 | hold or inspect |
| 6 | lower hand; remove prop |

The actor returns to the route without a carried prop.

## Deliverable D — Furniture Composition

Prepare exact foreground masks for:

- `chair.office.modern`;
- `table.meeting.empty`;
- `sofa.modern.three-seat`;
- `sofa.modern.two-seat`;
- `chair.massage.modern`.

Each seat contract records the seat or pelvis anchor, actor offset, and
foreground mask. The runtime order is furniture rear/base, actor, foreground
mask, then any intentionally front-most local effect.

Water, coffee, and printer loops keep compatible output silhouettes. Process
the vending loop into an item-neutral tray before attaching a selected prop.
The refrigerator stays closed in v1 and presents its selected prop directly at
the hand anchor.

## Validation Slice

Validate Einstein in a small staging harness before changing the active Office:

1. modern desk and chair — rear/front seated anchors and masks;
2. water dispenser — cup or bottle selection;
3. vending machine — item-neutral tray and three different prop silhouettes;
4. printer — transient document variants;
5. mission review — seated front pose with tablet, paper, or notebook;
6. sofa and massage chair — lounge pose, optional prop, and foreground masks;
7. server rack — `inspect-front` with optional tablet;
8. arcade — `interact-front` with no held prop.

## Acceptance Gate

- Einstein packs and renders as exactly 8x15 without modifying the original
  8x9 rows.
- All six new rows keep stable body scale and the correct feet or pelvis
  baseline.
- `interact-front` attaches every prop class without visible hand drift.
- A visit selects one stable prop and a later visit can select another without
  frame-to-frame flicker.
- Props disappear before return movement.
- No vending output conflicts with the selected prop.
- Desk, chair, meeting, sofa, and massage compositions have no floating body,
  double furniture, or mask seam.
- The complete prop sheet extracts to sixteen valid transparent files with no
  magenta fringe.
- The new assets and metadata pass art validation and `npm run check`.
- The active Office interior is not switched until this gate passes.

## Execution Order

1. Add the prop, hand-anchor, seat-mask, and 15-row runtime contracts.
2. Prepare the held-prop source prompt and Einstein strip prompts.
3. Generate and validate the sixteen-cell prop sheet.
4. Generate and validate Einstein's four missing strips.
5. Pack Einstein's final 8x15 runtime atlas.
6. Derive furniture foreground masks.
7. Register the new assets in a runtime-ready catalog.
8. Build and run the staging interaction harness.
9. Close the acceptance gate before beginning the complete interior swap or
   the remaining PetDex roster.

## Implementation Result — 2026-07-27

The asset and contract tranche is complete:

- Einstein runtime v3 is 8x15 at 768x1560 (1x) and 1536x3120 (2x).
- Rows 9-14 contain, in order, `working-back`, `interact-front`,
  `inspect-front`, `lounge-front`, `working-back-seated`, and
  `working-front-seated`; each row has six active frames and two empty cells.
- The held-prop source extracted to sixteen transparent 20x20 runtime overlays
  with 40x40 2x variants.
- The staging contact sheet exercises all sixteen props against frames 3-5 of
  Einstein's real `interact-front` row. The first pass exposed props that were
  too large and too high; the accepted pass uses the corrected 20px box and
  lower hand anchors.
- Stable selection, immediate-repeat avoidance, prop visibility, row geometry,
  mask count, and the eight-facility staging contract have automated tests.
- Five foreground masks retain exact pixels from the accepted chair, meeting
  table, two sofas, and massage chair. The vending output loop now reuses its
  empty open tray instead of a baked item.
- A runtime-ready staging catalog and isolated React harness exist, but the
  active Office imports remain unchanged.

Generated runtime files and measurements are indexed by
`assets/game/manifests/office-interaction-assets.json`. The repeatable build is
`scripts/process-office-interaction-slice.py`.

The remaining acceptance work is locking the complete 14-object/20-slot
Facility v1 geometry on the replacement map. The representative composition
lab below supplies candidate offsets without inferring final coordinates from
the current 10-seat active map.

### Isolated facility lab result

The eight representative facilities were subsequently composed in a separate
runtime-scale QA lab. The lab has no app route and is not imported by the
active Office.

- Tile scale is 32px and every facility uses its declared render box.
- Water, Vending, Printer, Server, and Arcade use a front-right `(1,+1)`
  candidate approach slot. The front-facing pose remains unchanged while the
  horizontal offset keeps the machine readable.
- Printer is attached to `cabinet.storage.low`; it is not treated as a
  floor-standing machine.
- Review, Sofa, and Massage use their seated rows and exact foreground masks.
- All eight actor bounds remain inside their cards, every seated mask overlaps
  the actor where required, and the reservation timeline releases its slot
  after departure.

Measured results are stored in
`assets/game/manifests/office-interaction-lab.json`; the board is generated by
`scripts/build-office-interaction-lab.py`. These are candidate slot offsets for
Facility v1 authoring, not edits to the current Office map.

The original `table.meeting.empty` review candidate was rejected after the
isolated lab showed an obsolete wood style and a center anchor that appeared
to seat the actor on the tabletop. Staging now uses
`table.review.long.modern`: a slim 4x1 Modern v3 table with two chairs per long
side. Its four-seat lab validates the front and back seated rows separately and
together. No side-facing pose is required.

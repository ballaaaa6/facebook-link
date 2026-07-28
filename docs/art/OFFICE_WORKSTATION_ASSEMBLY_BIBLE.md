# Office Workstation Assembly Bible v2

Status: Blueprint and Step 4 desk accepted; isolated Step 5 lab awaiting owner review
Updated: 2026-07-28
Machine-readable source:
`assets/game/manifests/office-workstation-assembly-bible-v2.json`

This is the approved geometry handoff for the ten-seat workstation block. On
2026-07-28 the owner approved the blueprint, accepted the elevated-camera Step 4
desk, and authorized the isolated Step 5 plan. The one-station renderer and five
review images now exist. Ten-seat assembly, roster-wide calibration, and Active
Office promotion remain blocked until later approvals.

## What has been produced

1. `01-target-decomposition-v2.png` separates direct visual observations from
   normalized runtime geometry. It never treats reference pixels as tile
   measurements.
2. `02-furniture-exploded-parts-v2.png` defines rear, surface, base, and
   foreground desk semantics for both actor sides. It is a schematic, not desk
   artwork.
3. `03-assembly-and-adjacency-v2.png` proves chair/actor placement, monitor and
   keyboard bands, one paired module, two touching modules, and the complete
   five-by-two bank.
4. `00-owner-review-contact-sheet-v2.png` places all three boards on one review
   sheet.
5. `step4/01-desk-front-back-v2.png` shows the replacement elevated-camera
   source and the normalized front/back bare desk assets.
6. `step4/02-semantic-layers-v2.png` proves the rear, surface, base, and
   foreground layers reconstruct the bare desk exactly.
7. `step4/03-adjacency-footprint-proof-v2.png` proves two and five full-width
   rectangular desk tops touch without a triangular gap.
8. `step4/00-step4-review-contact-sheet-v2.png` records the accepted Step 4
   evidence set.

All labels are English to comply with repository rules. The diagrams use
simple geometric shapes deliberately: approval here means approval of spatial
meaning, not approval of a final visual style.

## What has not been produced

- no new chair, monitor, keyboard, prop, or character artwork;
- no ten-seat scene;
- no calibration of the other 18 characters;
- no replacement Office background;
- no Active Office change;
- no commercial-use or character-license work.

## Accepted Step 4 criteria

The owner accepted all of the following on 2026-07-28:

- Is one desk exactly a `3 x 2` tabletop and floor footprint?
- Are desk legs/drawers/vertical faces treated as render height, not footprint?
- Is the chair centered outside the desk footprint on both sides?
- Is the monitor centered in the row farthest from the actor?
- Is the keyboard centered in the row nearest the actor?
- Do all five columns touch with no gap and no overlap?
- Do the far and near desk rows touch directly?
- Does the full block stay inside the current left work zone?
- Does the current Office background remain unchanged?
- Does the elevated camera expose enough usable top surface for later monitor
  and keyboard placement?
- Are both top edges equal width with vertical sides and square corners?
- Do the two-module and five-module proofs have one straight seam and no gap?

Future changes that invalidate any answer require a new version and owner
review. Do not patch renderer code to compensate for wrong artwork geometry.

## Step 5 owner-review gate

The owner authorized a detailed isolated single-seat assembly using the
accepted desk plus the already-created chair, monitor, keyboard, and Einstein
seated poses. The implementation is available only through the development lab
route `/?lab=office-workstation-v2-step5`. The full ten-seat scene remains a
later gate; no characters or poses were replaced.

The reviewable plan, including locked asset hashes, exact anchor equations,
layer order, evidence images, rejection conditions, and the permitted file
boundary, is in `docs/art/OFFICE_WORKSTATION_STEP5_SINGLE_SEAT_PLAN.md`.

Machine-readable Step 5 authority and locked inputs are in
`assets/game/manifests/office-workstation-step5-single-seat-v1.json`. Review
images are in `assets/art/layout-references/office-workstation-v2/step5/`.

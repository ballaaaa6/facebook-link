# Office Workstation Assembly Bible v2

Status: Blueprint approved; Step 4 bare desk artwork authorized
Updated: 2026-07-28
Machine-readable source:
`assets/game/manifests/office-workstation-assembly-bible-v2.json`

This is the approved geometry handoff for the ten-seat workstation block. On
2026-07-28 the owner approved the blueprint and authorized Step 4 bare desk v2
artwork only. Renderer code, single-seat lab work, ten-seat assembly, and
Active Office promotion remain blocked.

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
8. `step4/00-step4-review-contact-sheet-v2.png` collects the Step 4 evidence for
   the next owner decision.

All labels are English to comply with repository rules. The diagrams use
simple geometric shapes deliberately: approval here means approval of spatial
meaning, not approval of a final visual style.

## What has not been produced

- no new chair, monitor, keyboard, prop, or character artwork;
- no single-seat person/chair/monitor/keyboard assembly;
- no renderer or compositor;
- no ten-seat scene;
- no replacement Office background;
- no Active Office change;
- no commercial-use or character-license work.

## Step 4 review questions

The owner review must answer yes to all of the following before the next phase:

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

If any answer is no, update the manifest and regenerate these diagrams. Do not
patch artwork or renderer code to compensate for a wrong blueprint.

## Next phase after Step 4 explicit approval

Authorize one isolated Step 5 single-seat assembly using the approved bare desk
plus the already-created chair, monitor, keyboard, and one existing character
pose. The full ten-seat scene remains a later gate. Existing 19 characters and
completed poses are reused; this plan does not create replacement characters
or poses.

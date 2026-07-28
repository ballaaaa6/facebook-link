# Office Workstation Assembly Bible v2

Status: Owner review required; Steps 1-3 only
Updated: 2026-07-28
Machine-readable source:
`assets/game/manifests/office-workstation-assembly-bible-v2.json`

This is the pre-artwork handoff for the ten-seat workstation block. It exists
so the project owner can verify the geometry and semantic part interpretation
before any new furniture image or renderer code is created.

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

All labels are English to comply with repository rules. The diagrams use
simple geometric shapes deliberately: approval here means approval of spatial
meaning, not approval of a final visual style.

## What has not been produced

- no new desk, chair, monitor, keyboard, or character artwork;
- no renderer or compositor;
- no ten-seat scene;
- no replacement Office background;
- no Active Office change;
- no commercial-use or character-license work.

## Review questions

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

If any answer is no, update the manifest and regenerate these diagrams. Do not
patch artwork or renderer code to compensate for a wrong blueprint.

## Next phase after explicit approval

Create one bare v2 desk and one isolated single-seat assembly first. The full
ten-seat scene remains a later gate. Existing 19 characters and completed
poses are reused; this plan does not create replacement characters or poses.

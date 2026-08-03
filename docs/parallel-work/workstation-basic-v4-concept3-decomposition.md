# Workstation Basic v4 — Concept 3 Standalone Decomposition

Status: `DESIGN CHECKPOINT 1 — PENDING OWNER REVIEW`

Task: `P5-W6.5-R1 — 2:1 dimetric workstation proof family`

This document freezes the visual contract for a proposed `workstation-basic/v4`
silhouette only. It does not create a v4 source, recipe, rasterizer, runtime
candidate, manifest, catalog entry, registry entry, or production report.

The owner-provided Concept 3 board is the authoritative visual-design
reference for this checkpoint. It remains outside the repository and is used
only to derive an original project-owned decomposition. No reference, legacy,
or v1/v2/v3 pixel is imported, cropped, resized, traced, or committed.

## Scope and preservation

- `workstation-basic/v1`, `/v2`, and `/v3` remain immutable historical evidence.
- The existing deterministic factory, admission validator, review-board
  generator, and registry tools are unchanged in this checkpoint.
- This proposal is one complete standalone workstation per placed instance.
- Adjacency never removes, moves, or redistributes a workstation component.
- Chair, actor, seated pose, and loose desk props are deferred to a later
  separately reviewed integration slice.
- Runtime and production manifests remain closed until geometry, visual, and
  commercial owner outcomes are explicitly recorded.

## Frozen visual contract for owner review

These values are the proposed v4 visual contract for this review checkpoint.
They are intentionally not a production admission record.

### Projection and camera

- Projection: `office-projection-v1`, original 2:1 dimetric/isometric pixel art.
- Camera quadrant: southeast of the workstation.
- Visible faces: top desktop plane, south/front working side, and east/right
  end. The north/rear and west/left outside faces are not treated as required
  visible faces in this camera.
- World-axis projection: world east runs screen southeast (`+32,+16` per
  logical half-axis step); world south runs screen southwest (`-32,+16`). The
  inverse directions rise toward the northwest. These are projected directions,
  not stored screen positions.
- Tile relationship: one projected world tile is `64x32` logical pixels. The
  candidate workstation retains a `2x1` world footprint and is reviewed inside
  a provisional `176x96` native sprite envelope. The footprint diamond uses
  the four projected corners `(56,24)`, `(120,56)`, `(88,72)`, and `(24,40)`
  in that envelope.
- Top-plane slopes: the east edge uses a `+16 y / +32 x` ramp and the south
  edge uses a `+16 y / -32 x` ramp. Pixel runs are integer and hard-edged.
- Side-plane slopes: vertical supports and storage sides use vertical pixel
  runs; visible south/east side planes do not become front-facing rectangles.
- Rendering: native pixels and all review enlargement use nearest-neighbor
  filtering. No smoothing, interpolation, compression, or scene-specific
  resampling is part of the proposal.

### Origin, contact, and future seating

- Proposed sprite origin: `(56,24)` native pixels, tied to the projected
  footprint anchor rather than to a scene location.
- Proposed ground contact: `(88,72)` native pixels at the projected southeast
  footprint corner. Decorative shadows may extend beyond the contact but do
  not move it.
- Proposed visual height: `72` native pixels from the top of the rear frame's
  highest structural post to the ground contact. The taller value is deliberate
  for Concept 3's elevated frame and is a checkpoint target, not an admitted
  sprite metadata value.
- The working-side interaction target remains a geometry-owned workstation
  dock on the south/front side. The checkpoint marker is projected at `(56,56)`
  in the provisional canvas as a visual review aid only; it is not a character
  or a local placement offset.
- A future seated actor must project from the geometry-owned dock, chair seat,
  actor pelvis, and foot contacts. No actor, chair, or pose is drawn or inferred
  by this standalone furniture silhouette.

### Palette and light

- Light direction: northwest.
- Warm wood: light top-plane wood, medium warm-brown body wood, and a darker
  south/east side value; grain is sparse and subordinate to the silhouette.
- Structure: charcoal outline and supports with a restrained metal highlight.
- Privacy panel: deep teal, behind the desktop and clearly separate from wood.
- Planter: dark wood/charcoal container with a restrained green foliage accent.
- Shadows: compact, opaque-enough contact shadow under the desktop, pedestals,
  and posts, falling toward the southeast. Alpha edges must remain readable on
  both light and dark temporary boards.

### Connectivity and mask semantics

The east-west mask vocabulary remains `north=1`, `east=2`, `south=4`,
`west=8`. The supported review masks are `0`, `2`, `8`, and `10` only.

- West seam: from `(56,24)` to `(24,40)`.
- East seam: from `(120,56)` to `(88,72)`.
- Mask `0` (`isolated`): one complete workstation, with both outer seam caps
  readable. Desktop, both storage masses, all supports, panel, slatted frame,
  posts, planter, footprint, clearance, and working side remain present.
- Mask `2` (`east-neighbor`): the same complete workstation, with only the east
  seam treated as join-ready. No east storage, planter, post, or desktop depth
  is removed or shifted.
- Mask `8` (`west-neighbor`): the same complete workstation, with only the west
  seam treated as join-ready. No west storage, post, or desktop depth is removed
  or shifted.
- Mask `10` (`east-west-neighbors`): the same complete workstation, with both
  seam treatments join-ready. It is not a middle fragment and does not delete
  either pedestal, the planter, the panel, the elevated frame, or the posts.

The only allowed visual differences between masks are seam/cap pixels, shared
edge treatment, and an explicitly approved overlap rule. Occupancy, clearance,
anchor, ground contact, working-side dock, visual height, and component identity
remain invariant. Unsupported masks fail closed; they never select a nearest
looking fragment or silently rotate a variant.

## Concept 3 component decomposition

The target silhouette is a complete, recognizable workstation before it is
placed next to another workstation.

### Desktop and working surface

- Broad warm-wood desktop spanning the full 2x1 workstation length.
- The top plane must show projected depth and a readable thickness lip on its
  south/front edge.
- The top remains the dominant horizontal mass; grain and small surface marks
  are sparse enough not to compete with the structure.
- The south/front working edge stays visually open beneath the desktop.

### Storage masses

- A substantial drawer/storage pedestal occupies the west/left end below the
  desktop. Drawer faces, side thickness, and a dark base make it read as a
  real load-bearing mass rather than a thin decorative box.
- A substantial storage pedestal occupies the east/right end below the
  desktop. It has comparable visual weight while allowing the right-side
  planter to remain legible above/behind it.
- Both pedestals stay inside their authored footprint and do not consume the
  south/front working opening.

### Structural frame and rear treatment

- Charcoal vertical supports and under-frame members carry the desktop visually
  and remain distinct from the wood pedestals.
- A teal rear privacy panel runs behind the desktop along the rear/north edge.
  It is a visible panel, not a full opaque wall that closes the working side.
- An elevated rear frame rises behind the panel. Strong full-height west and
  east end posts establish the silhouette.
- Horizontal warm-wood slats span the rear frame in two readable groups. The
  proposed native treatment uses a restrained, regular slat count and clear
  gaps; slat density may be reduced from the reference where required for
  native readability, but the slatted identity is preserved.
- The frame, panel, and slats are layered so that the top plane remains readable
  and the rear structure does not turn the workstation into a front-facing
  rectangle.

### Planter and negative space

- A restrained right/east-side planter sits on or immediately behind the rear
  frame's east section. It is a compact accent mass, not a hanging garden or a
  second storage unit.
- Foliage is simplified into a few readable clusters with a controlled outline.
- The south/front center remains the working-side negative space for a future
  chair and seated actor.

## Mandatory identity feature disposition

| Mandatory feature | Checkpoint disposition | Proposed treatment | Truthful limitation |
| --- | --- | --- | --- |
| Broad warm-wood desktop with projected depth | preserved | Full-length warm top plane, thickness lip, sparse grain | Exact pixel thickness awaits production proof |
| Substantial left drawer/storage pedestal | preserved | Dense west-side drawer/storage mass below the top | Drawer count is simplified for readability |
| Substantial right storage pedestal | preserved | Dense east-side storage mass below the top | Internal hardware is simplified |
| Charcoal structural frame/supports | preserved | Distinct dark posts, rails, and under-supports | Structural render-part graph is not yet produced |
| Teal rear privacy panel | preserved | Teal panel behind the desktop, below the rear frame | Exact panel pixel height awaits owner approval |
| Elevated rear frame with horizontal wooden slats | preserved and simplified | Tall end posts plus regular horizontal slat groups | Slat count/detail is reduced if native scale needs it |
| Strong full-height end posts | preserved | Clearly taller west/east posts above the desktop | Final pixel contact is not yet validated |
| Restrained right-side planter | preserved and simplified | Small east planter with a few foliage clusters | Foliage is intentionally not botanical detail |
| Open front working side | preserved | South/front opening remains clear under the top | Chair and actor are deliberately absent |
| Complete standalone Concept 3 silhouette | preserved | Every proposed instance contains the full unit | No mask/build/runtime proof exists at this checkpoint |

No mandatory identity feature is intentionally missing from the proposal. The
following are deferred and therefore absent from the temporary standalone
silhouette: chair, person, seated pose, keyboard, monitor, loose decorations,
and operational labels. Their absence is a scope boundary, not a claim that
the workstation is ready for seated interaction.

## Silhouette review criteria

The owner-review silhouette passes this checkpoint only if it satisfies all of
the following visual questions:

1. At native scale, can the viewer identify the broad wood top and both storage
   pedestals without zooming?
2. Does the southeast camera show a top plane plus south/east side planes with
   the correct 2:1 slopes rather than a front-facing or orthographic substitute?
3. Do the teal panel, elevated slatted frame, tall posts, and planter read as
   one rear structure attached to the same complete workstation?
4. Does the south/front opening remain believable as the future chair/working
   side without placing a person in the wrong location?
5. Would repeating the same complete unit still make sense when masks change
   only seam treatment, with no component disappearing at an adjacency?
6. Can every position, contact, and future seating target be explained by the
   declared projection and geometry reference without a scene-specific offset?

The temporary review images are visual proposals only. They do not prove alpha
edges, geometry agreement, render-part depth, deterministic export, or runtime
admission.

## Owner decision

Concept fidelity:

- approve for v4 production
- rework-required
- reject

Recorded outcome: pending owner review.

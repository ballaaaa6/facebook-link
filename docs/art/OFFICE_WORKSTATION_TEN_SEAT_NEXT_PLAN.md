# Office Workstation Ten-Seat Isolated Validation Plan

Status: Planned; execution requires a separate owner start
Baseline: Owner-approved R05-r02 P0-P3
Updated: 2026-07-28

## Objective

Expand the approved one-column workstation pair into a five-column,
two-row, ten-person block on the unchanged current Office background. The work
remains a development-only simulated Office. It does not modify the Active
Office map, register other furniture, create art, or authorize promotion.

This phase rebuilds the ten-seat composition from the accepted coordinate and
socket system. It must not patch, offset, or import the rejected
`office-ten-r05.json` composition.

## Fixed inputs

- `office-workstation-step5-r05-r02.json` is the placement authority.
- `office-character-seat-sockets-v1.json` supplies actor contacts.
- The existing full-top `3 x 2 x 2` desk is reused byte-for-byte.
- The existing real `1 x 1 x 2` chair and its rear/foreground masks are reused.
- The approved monitor and keyboard pixels and sockets are reused.
- The current Office background is reused byte-for-byte.
- No new character, pose, furniture, equipment, or background is generated.
- Boba is not assigned to a seated workstation.

The intended ten-character roster is retained from the operational target,
but only character identities may be reused from older evidence:

| Far row | Near row |
| --- | --- |
| Yinyue | Taffy |
| Einstein | Doraemon |
| Ruri | Rem |
| Noir | Miku |
| Anna | AI Workbot |

Old station coordinates, layer order, and compositor code are not inputs.

## P4 — Freeze the ten-seat geometry contract

Create a new versioned map and contract before implementing the renderer.

### P4.1 World layout

Use five desk columns:

```text
desk origins X = [4, 7, 10, 13, 16]
far desk Y     = 7
near desk Y    = 9
```

This produces:

- a 96-pixel horizontal origin delta between adjacent desks;
- a 64-pixel depthwise origin delta between far and near desks;
- eight horizontal tabletop joins;
- five depthwise tabletop joins;
- no gap and no footprint overlap at every join;
- a complete block from world X `4..19`, inside the left 24-tile work zone.

Actor/chair cells are derived from desk orientation:

```text
far actor/chair Y  = 6
near actor/chair Y = 11
actor/chair X      = desk X + 1
```

Equipment cells are actor-relative:

```text
far row:  keyboard Y=7, monitor band Y=8
near row: monitor band Y=9, keyboard Y=10
```

### P4.2 Contract fields

The new contract records:

- all ten desk, chair, person, monitor, and keyboard reservations;
- character slug and orientation per station;
- seat-socket manifest hash;
- accepted component hashes;
- source-background hash;
- Active Office map hash;
- exact row and column join counts;
- permissions fixed to development-only, no new art, and no promotion.

### P4.3 Four-station intersection preflight

Before rendering all ten stations, render a `2 columns x 2 rows` block. This
is the smallest proof that tests horizontal joins, depthwise joins, and their
four-desk intersection together.

P4 fails immediately if the preflight shows:

- a tabletop gap or overlap;
- the far desk base visible through the near tabletop;
- the wrong desk leg winning the painter order;
- equipment crossing a neighboring support plane;
- a person/chair contact delta other than `[0,0]`.

## P5 — Build the ten-person simulated Office

### P5.1 Renderer composition

Build a new scene component from the R05-r02 station primitive. Do not reuse
the rejected ten-seat scene component.

The compositor must:

1. resolve every object from world coordinates and local sockets;
2. sort stations by physical world depth;
3. preserve the approved internal layer order for each station;
4. draw the complete far row before the near row where depth requires it;
5. preserve independent desk parts so the near tabletop hides the far base;
6. resolve the current animation frame before selecting the actor seat socket;
7. keep all supported equipment inside its owning desk support plane.

### P5.2 Runtime scope

The lab contains only:

- the unchanged current background;
- ten full-top desks;
- ten approved monitors;
- ten approved keyboards;
- ten real chairs;
- ten existing seated characters.

No shelf, cabinet, plant, sofa, machine, prop, divider, wall replacement, or
relaxation-zone furniture enters this proof.

### P5.3 Debug modes

Provide switchable clean and geometry modes. Geometry mode shows:

- world tile grid;
- each `3 x 2` desk footprint;
- each `3 x 2` support plane;
- chair/person shared `1 x 1` cell;
- monitor `3 x 1` reservation and base socket;
- keyboard `1 x 1` reservation;
- actor contact and chair seat points;
- station sort key and final draw order;
- horizontal and depthwise join lines.

## P6 — Automated and visual acceptance

### P6.1 Deterministic checks

The validation gate must prove:

- exactly 10 desks, 10 chairs, 10 people, 10 monitors, and 10 keyboards;
- exactly five far and five near stations;
- all ten character slugs exist in the approved socket manifest;
- 60/60 actor-frame seat contacts resolve to `[0,0]` error;
- eight horizontal joins have zero gap and zero overlap;
- five depthwise joins use a 64-pixel delta;
- far desk base visibility behind each near tabletop is zero pixels;
- every far station draws `keyboard` before `monitor-back`;
- every monitor base is centered on the middle reservation cell;
- every keyboard remains inside its owning support plane;
- every object remains inside the left work zone;
- background and Active Office hashes remain unchanged;
- the Active Office registry imports no candidate artifact.

### P6.2 Browser checks

Run the development lab for at least 60 seconds and verify:

- no anchor or station drift across all six animation frames;
- no broken images;
- no console warning or error;
- no clipping or horizontal page overflow;
- clean and debug views at desktop width;
- clean and debug views at a narrow/mobile width;
- identical geometry after switching views and returning to frame zero.

### P6.3 Owner-review evidence

Return this exact evidence set:

1. `01-four-station-intersection-clean-debug.png`;
2. `02-ten-seat-clean.png`;
3. `03-ten-seat-grid-and-sockets.png`;
4. `04-ten-seat-layer-order.png`;
5. `05-rejected-r05-final-vs-approved-rebuild.png`;
6. desktop clean browser capture;
7. desktop debug browser capture;
8. mobile clean browser capture;
9. mobile debug browser capture;
10. a short machine-readable acceptance summary.

The before/after board must compare the rejected 128-pixel desk-row step and
shared actor/chair origin against the rebuilt 64-pixel step and socket-based
placement. It may use rejected images as negative evidence only.

## P7 — Owner gate

Stop after delivering the evidence. Approval at P7 confirms only the
ten-person workstation block in the simulated Office.

It does not authorize:

- copying the block into Active Office;
- adding other furniture;
- changing the current background;
- hand/grip sockets or held props;
- new characters or poses;
- commercial use.

If P7 is rejected, correct only the failed coordinate, socket, layer, or
occlusion contract and regenerate the affected proof. Do not compensate with
unrecorded visual offsets.

## Work after P7 approval

Later work proceeds in separately approved groups:

1. place the accepted ten-seat block in a full simulated Office layout while
   keeping all other furniture absent;
2. add one furniture family at a time, beginning with the next owner-selected
   family and applying the same occupancy/support/render/socket split;
3. validate routes and interaction clearance only after static geometry is
   accepted;
4. produce a complete simulated-Office candidate and owner evidence;
5. promote that exact candidate behind a reversible feature flag only after a
   separate explicit decision;
6. retain the current Active Office map as the rollback target.

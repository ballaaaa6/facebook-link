# Two-Row Modern Office Lab Test Plan

## Status

Planned for the isolated development lab only. The active Office map and the
production entry point must remain unchanged until the replacement lab render
is explicitly approved.

The first lab screenshot,
`assets/game/processed/office-facility-v1-lab/qa/two-row-office-layout-v1.png`,
is a rejected composition result. It remains only as historical QA evidence
and must not be used as the visual acceptance baseline.

## Corrected Composition Contract

The reference is
`assets/art/layout-references/office-modern-operations-target-v2.png`.
It guides the relative order of the wall, chairs, paired desks, seated
employees, and viewer-facing aisle. Runtime geometry still comes from the
integer-grid map and registered staging assets.

The two workstation rows have different, explicit meanings:

| Row | Position | Employee pose | Chair | Desk | Monitor |
| --- | --- | --- | --- | --- | --- |
| A | Far row, nearer the back wall | Faces the viewer using `working-front-seated` | `chair.office.modern.front` | `desk.workstation.front` | `monitor.back` |
| B | Near row, nearer the viewer | Faces away from the viewer using `working-back-seated` | `chair.office.modern.back` | `desk.workstation.back` | `monitor.front` |

The required vertical order from the back wall toward the viewer is:

```text
back wall
one completely empty floor-tile row
Row A chair + seated employee, facing the viewer
Row A desk footprint
Row B desk footprint, directly touching Row A desk footprint
Row B chair + seated employee, facing away from the viewer
front circulation aisle
viewer
```

The empty wall-clearance row must remain visually empty. A chair render box,
character render box, desk footprint, prop, or wall object may not extend into
that row.

The five workstation columns must align between Rows A and B. Modern
workstation desks are three tiles wide, so consecutive column anchors must be
three tiles apart. Adjacent desk footprints touch edge-to-edge without gaps or
overlap. The two desk rows also touch edge-to-edge without a route or decorative
gap between them.

## Asset Isolation

The lab must start from an empty structural shell containing only declared
floor and wall surfaces. All furniture, equipment, and decor from the rejected
lab composition must be removed before the corrected layout is assembled.

The corrected lab must use a dedicated staging registry built only from
`assets/game/manifests/office-library-sheets.json`, whose library id is
`office-library-modern-bright-v1`.

The first seating test is intentionally limited to these modern assets:

- `desk.workstation.front`
- `desk.workstation.back`
- `chair.office.modern.front`
- `chair.office.modern.back`
- `monitor.front`
- `monitor.back`
- the modern-library `keyboard.mouse`
- optional modern-library workstation props after the base seating pass passes

The lab must not fall back to the active `officeAssetRegistry`. In particular,
it must not render `desk.standard.up`, `desk.creative.up`, `desk.noc.up`,
`chair.office.up`, `chair.studio.up`, or any asset sourced from
`core-furniture-c-v1` or `core-furniture-c-v2`.

Service, pantry, lounge, review, and decorative furniture stay absent during
the workstation seating calibration. They may be added in a later lab pass
only from `office-library-modern-bright-v1`, after the paired workstation block
is approved.

## Part 1: Paired Workstation Seating Test

Part 1 tests only the paired workstation block and the ten seated employees.
The rest of the room stays empty. This prevents unrelated furniture from
hiding spacing, orientation, or occlusion mistakes.

### Fixed target geometry

Part 1 uses the following integer-grid targets in the isolated lab:

| Element | Target |
| --- | --- |
| Back wall | `y=0..3` |
| Required empty clearance row | `y=4` |
| Row A chair and actor seat anchors | `y=8` |
| Row A desk footprints | `y=8..9` |
| Row B desk footprints | `y=10..11` |
| Row B chair and actor seat anchors | `y=14` |
| Front circulation aisle | begins at `y=15` |
| Five workstation column anchors | `x=[5, 8, 11, 14, 17]` |

The pixel-aligned character frame for Row A includes transparent padding near
the required empty row at `y=4`, but no opaque character pixel or furniture
footprint may enter that row. Row A chairs may occupy `y=6..8`. Row B
characters may occupy `y=12..14` and
Row B chairs may occupy `y=13..14`.

Each three-tile desk footprint occupies one of these horizontal ranges:

```text
column 1: x=4..6
column 2: x=7..9
column 3: x=10..12
column 4: x=13..15
column 5: x=16..18
```

This produces one continuous fifteen-tile-wide workstation block with no
horizontal gaps. The Row A desk bottom edge at `y=9` touches the Row B desk top
edge at `y=10`, so there is no route or decorative strip between the rows.

### Test 1A: Empty-room and asset-isolation gate

1. Load the lab with only its floor and wall structural surfaces.
2. Assert that workstations, objects, POIs, facility slots, and companions are
   empty before the new block is added.
3. Build the lab asset registry from `office-library-modern-bright-v1`.
4. Assert that every allowed asset file resolves under
   `assets/game/processed/office-library-modern-bright-v1/`.
5. Deliberately request one legacy desk id in a unit test and require the lab
   registry to reject it. A fallback to an active asset fails Part 1.

Part 1 stops immediately if any old desk, chair, monitor, facility, or decor
asset can enter the lab.

### Test 1B: Furniture-only geometry gate

1. Place five Row A desks and five Row B desks at the fixed anchors.
2. Place the ten matching modern chairs without characters.
3. Attach `monitor.back` to Row A desks and `monitor.front` to Row B desks.
4. Attach only the modern-library keyboard to each desk.
5. Run the structural surface, parent-slot, footprint, and overlap validators.
6. Assert the exact empty row, desk adjacency, aligned columns, and open front
   aisle described above.
7. Render a debug-grid screenshot with wall, empty-row, footprint, seat-anchor,
   and aisle overlays.

This gate verifies the room geometry before character art can conceal a
mistake.

### Test 1C: Seated-pose and orientation gate

1. Add exactly five Row A employees with `working-front-seated`.
2. Add exactly five Row B employees with `working-back-seated`.
3. Force each employee to the matching chair seat anchor.
4. Disable routine movement, POI selection, random pose selection, and facility
   reservations.
5. Assert the Row A modern front-chair variant and Row B modern back-chair
   variant are used.
6. Inspect the layer order for chair base, chair foreground, actor, desk,
   keyboard, and monitor.
7. Fail if an actor is standing, floating, walking, facing the wrong direction,
   clipped through the desk, or visually in front of the wrong chair layer.

The normal screenshot is not captured until all ten employees pass this gate.

### Test 1D: Thirty-second stability gate

The lab clock advances for thirty simulated seconds. Automated checks sample
the scene at `t=0`, `t=10`, `t=20`, and `t=30`.

At every sample:

- all ten actor positions equal their original seat anchors;
- the pose split remains five front-facing and five rear-facing;
- no actor enters a walking or facility state;
- no chair, desk, monitor, or keyboard changes its parent or depth order; and
- no new object appears in the empty room.

Any movement away from a seat fails Part 1 even if the initial screenshot looks
correct.

### Test 1E: Real-browser evidence gate

After the automated gates pass, open the development-only lab in the real
browser renderer at 1280 by 720.

The browser inspection must report:

```text
employees: 10
Row A working-front-seated: 5
Row B working-back-seated: 5
legacy furniture assets: 0
facility/decor objects: 0
console warnings: 0
console errors: 0
```

Capture these Part 1 artifacts:

1. `two-row-modern-office-part1-furniture-grid-v2.png` — furniture-only debug
   geometry from Test 1B.
2. `two-row-modern-office-part1-seated-v2.png` — normal seated result after the
   thirty-second stability gate.
3. `two-row-modern-office-part1-seated-grid-v2.png` — the same seated result
   with grid and anchor overlays.

Part 1 ends by showing the normal seated screenshot to the user. No service,
pantry, lounge, review, or decorative furniture is added, and no active Office
file is changed, until the paired workstation block is approved.

## Character and Occlusion Contract

All ten employees must be forced into deterministic seated work states in the
lab. Routine travel, facility visits, random pose selection, and warm-up
movement are disabled for the screenshot run.

- Row A contains exactly five `working-front-seated` actors.
- Row B contains exactly five `working-back-seated` actors.
- Every actor shares a seat anchor with the matching modern chair.
- Desk and chair foreground masks must be derived from the accepted modern
  assets when required; legacy masks are not allowed.
- Chair backs, armrests, the seated torso, hands, desk edge, keyboard, and
  monitor must have a consistent depth order.
- No employee may appear standing, floating, walking, clipped through a desk,
  or sitting in front of the chair.

The character roster remains staging-only for this test. No staged seated row
is promoted to the active runtime by the lab.

## Implementation Sequence

1. Reset `office-facility-v1-lab.json` to the structural wall and floor shell,
   removing every object and workstation that references the active furniture
   registry.
2. Create a reduced modern-only staging asset registry from
   `office-library-sheets.json`; reject missing ids instead of falling back to
   active assets.
3. Add five aligned Row A workstation modules and five aligned Row B modules.
4. Enforce one visibly empty floor row after the wall and direct desk-to-desk
   adjacency between the two workstation rows.
5. Add explicit workstation orientation and pose fields rather than deriving
   both rows from one default `facing` value.
6. Add a deterministic lab pose override so all ten employees remain seated
   throughout visual QA.
7. Add modern chair and desk occlusion layers or masks where the base sprites
   cannot produce correct seated depth by themselves.
8. Run automated geometry, provenance, pose, and production-isolation tests.
9. Capture new normal and debug-grid screenshots from the real renderer.
10. Present the new screenshot for approval. Do not copy the lab map into the
    active Office until that approval is received.

## Automated Test Matrix

### Asset provenance

- Every lab furniture, equipment, and decor file resolves under
  `assets/game/processed/office-library-modern-bright-v1/`.
- The lab renderer has no fallback path to `officeAssetRegistry`.
- A forbidden legacy asset id or source path fails the test.
- Exactly ten desks, ten chairs, ten seated actors, and ten workstation monitor
  assemblies are present.

### Wall and floor geometry

- The wall surface and floor surface remain distinct.
- The empty clearance row after the wall contains zero footprints and zero
  visible render bounds.
- Every desk and chair is supported by the floor surface.
- Every monitor, keyboard, and optional prop occupies a compatible named desk
  slot.
- No floor footprint overlaps another footprint except the intentional
  actor-chair seat anchor relationship.

### Paired workstation geometry

- There are exactly two rows with five columns each.
- Row A and Row B use identical column anchors.
- Consecutive desk columns are exactly one desk width apart.
- Horizontal desk footprints touch without gaps or overlap.
- Row A and Row B desk footprints touch directly along one edge.
- The near-row chair band is on the viewer side of both desk rows.
- The far-row chair band is on the wall side of both desk rows.
- The front circulation aisle remains unobstructed.

### Pose and layer behavior

- Five actors render `working-front-seated`.
- Five actors render `working-back-seated`.
- All ten actors remain seated for at least thirty simulated seconds.
- Front-facing and rear-facing chair variants match their actor states.
- Monitor fronts face Row B employees and monitor backs face the viewer-side
  view of Row A.
- Occlusion assertions verify that desk fronts cover lower legs where required
  and chair foreground pixels cover the correct actor pixels.

### Runtime isolation

- The active map id and active map file remain unchanged.
- The lab remains accessible only through the development-only lab entry.
- Production build output contains no lab title, lab map id, staging registry,
  or modern seating-test route.
- Existing active Office tests continue to pass.

## Browser and Visual QA

The browser pass uses the real local renderer, not a generated mockup.

Required captures:

1. `two-row-modern-office-layout-v2.png` at 1280 by 720 with the debug grid
   hidden.
2. `two-row-modern-office-layout-v2-grid.png` at 1280 by 720 with surface,
   clearance-row, seat-anchor, desk-footprint, and aisle overlays visible.
3. A narrow viewport capture between 390 and 430 pixels wide to confirm that
   all ten seated employees remain reachable without corrupting geometry.

The normal screenshot passes only when a reviewer can identify the following
without using the debug overlay:

- one empty row between the wall and the first chairs;
- five front-facing employees in the far row;
- five rear-facing employees in the near row;
- two desk rows forming one continuous paired desk block;
- modern furniture only;
- no extra facility furniture competing with the seating test.

Browser console warnings and errors must both be empty. The DOM inspection must
report ten selectable employees and the expected five-to-five pose split.

## Delivery Gate

The corrected lab is ready for review only when:

- all automated checks above pass;
- `npm run check` passes;
- both desktop screenshots are saved as new versioned QA artifacts;
- the active Office remains unchanged;
- the previous rejected furniture does not appear anywhere in the new lab; and
- the new normal screenshot has been shown to the user for explicit approval.

Approval of the lab authorizes a separate integration step. It does not itself
authorize deployment or replacement of the active Office.

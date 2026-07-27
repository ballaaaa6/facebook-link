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

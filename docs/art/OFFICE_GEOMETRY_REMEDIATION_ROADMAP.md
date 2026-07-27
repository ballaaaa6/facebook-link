# Office Geometry Remediation Roadmap

Status: Steps 1-4 accepted; Steps 5-16 accepted-staging on 2026-07-27
Approved: 2026-07-27
Owner: Art, asset-pipeline, shared-contract, and Office-rendering workstreams
Scope: Reconcile the existing Office asset library with top-down placement,
surface support, depth sorting, and compositing before any interior replacement

## 1. Decision

The Office asset program is reuse-first. It will not regenerate the complete
library. The program must audit the current assets and regenerate only an asset
whose visible geometry cannot represent its intended top-down footprint,
support plane, orientation, or occlusion role.

The first implementation batch contains Steps 1-4 from this roadmap:

1. Quarantine the rejected workstation geometry and freeze the active Office.
2. Define and validate the Office Geometry Contract v3.
3. Audit the complete Office asset inventory against that contract.
4. Lock the Camera/Scale Bible and deterministic calibration board.

These steps form one coordinated delivery tranche, but their acceptance gates
remain sequential. Step 2 cannot be accepted before Step 1, final audit
classification cannot be accepted before Step 2, and the calibration board
cannot be accepted before the audit identifies its representative asset
families.

No production asset generation, renderer replacement, Active Office promotion,
or legacy asset deletion is authorized in this batch.

## 2. Verified baseline

The repository baseline on 2026-07-27 contains:

- 212 library assets across 14 sheets in
  `assets/game/manifests/office-library-sheets.json`;
- 50 entries in the current runtime geometry manifest;
- 16 planning-only asset entries;
- 19 character directories;
- 35 library assets without a declared `layer`;
- an isolated paired-workstation lab using `5 x 4` desk collision rectangles;
- an Office Scale Bible that still describes the standard desk as `4 x 2`;
- v6 browser captures currently described as accepted evidence even though
  their furniture geometry is now rejected.

The audit must distinguish inventory records from distinct physical assets.
Runtime entries, library entries, orientations, derived composites, and
versioned files may refer to the same asset family and must not be counted as
independent redesign requirements.

## 3. Source-of-truth order

During Steps 1-4, use this precedence:

1. This roadmap controls execution order and gates.
2. `docs/art/OFFICE_2D_GEOMETRY_PRINCIPLES.md` controls accepted geometry
   after Step 2 is complete.
3. The Geometry v3 schema and shared TypeScript contract control
   machine-readable values.
4. The generated audit JSON controls per-asset disposition after Step 3.
5. The accepted Camera/Scale Bible controls generation prompts after Step 4.

`docs/art/OFFICE_REF_MIGRATION_ROADMAP.md` remains historical context. Its
asset-generation phases are superseded until the first four gates in this
roadmap pass.

## 4. Batch dependency and delivery model

```text
Step 1: quarantine and freeze
    -> Step 2: Geometry Contract v3
        -> Step 3: inventory audit and dispositions
            -> Step 4: Camera/Scale Bible
                -> batch acceptance
```

Discovery work may overlap, but accepted outputs follow this order. Each step
receives its own focused commit so a contract or audit decision can be reviewed
without mixing it with generated visual artifacts. The batch is complete only
after the repository gate passes with all four steps present.

## 5. Step 1 — Quarantine rejected geometry and freeze runtime

### Goal

Stop the current lab geometry from being used as a production template while
preserving it as a regression case. Keep the Active Office unchanged.

The rejection applies to the complete v6 QA composition. The captures use
derived desk sprites whose IDs contain `v5`; the rejection record must name
both the v6 capture set and its v5 desk inputs so version labels cannot be
misread as two independent decisions.

### Work

1. Record the active map, active asset registry, staging registry, lab route,
   lab map, derived desk IDs, and current QA capture paths.
2. Change the lab documentation so the v6 captures are rejected geometry,
   not acceptance evidence.
3. Add a rejection record containing the visual and semantic reasons:
   straight-front artwork does not represent the declared depth, bitmap fill
   was used to occupy a logical rectangle, and workstation-specific clipping
   cannot serve as the general occlusion contract.
4. Preserve the screenshots and derived images. Do not overwrite, rename, or
   delete them.
5. Add a regression assertion that the rejected desk IDs and lab map cannot
   enter the active map or active asset registry.
6. Confirm that no feature flag enables Geometry v3 or promotes staging assets.
7. Run the existing Office and repository checks to capture a clean baseline.

### Planned files

- `assets/game/processed/office-facility-v1-lab/README.md`
- `docs/art/OFFICE_REJECTED_GEOMETRY_CASES.md` (new)
- `apps/web/test/office-modern-lab.test.ts`
- active map/registry tests as required; active runtime data remains unchanged

### Deliverables

- An explicit `rejected-geometry` decision for the v6 composition.
- A preserved negative regression fixture.
- Automated isolation between the lab/staging catalog and Active Office.
- A baseline check result recorded in the implementation handoff.

### Acceptance gate

- The active map and registry have no rejected lab IDs.
- Existing v6 files remain available for regression comparison.
- Documentation no longer calls v6 accepted evidence.
- No runtime behavior or active visual changes.
- `npm run check` passes.

## 6. Step 2 — Office Geometry Contract v3

### Goal

Define one contract that separates placement, collision, rendering, sorting,
surface support, seating, and occlusion. Asset producers and consumers must no
longer infer physical geometry from bitmap dimensions or legacy layer names.

### Contract decisions

Every asset must declare or explicitly omit these concepts:

```text
assetType
placementPlane
footprint
supportPlane
basePivot
sortPivot
renderBounds
renderOffset
verticalExtension
occlusionParts
attachmentSlots
seatSlots
orientation
```

The contract must define the following asset types:

- `floor-decal`
- `upright-floor-object`
- `surface-furniture`
- `seat`
- `wall-mounted`
- `structural-opening`
- `animated-shell`
- `character`

The contract must resolve the current `4 x 2` versus `5 x 4` desk conflict by
separately approving physical scale, floor footprint, and support-plane cells.
A value may not be copied between those concepts merely because it already
exists in a manifest or lab fixture.

### Work

1. Define coordinate spaces, origins, units, axes, rotation rules, and whether
   each field is expressed in tiles, local surface cells, or pixels.
2. Define required and forbidden fields for each asset type and placement
   plane (`floor`, `wall`, `ceiling`, or a furniture surface).
3. Define rectangular footprint rotation and the extension point for future
   non-rectangular collision geometry.
4. Define support-plane bounds and slot ownership independently from floor
   collision.
5. Define `basePivot` for placement and `sortPivot` for depth ordering. Neither
   may default to the bitmap center.
6. Define render overflow, offsets, vertical extension, and multi-part
   occlusion without changing collision.
7. Define orientation completeness, mirroring policy, animation anchor
   stability, and composite-part naming.
8. Add valid fixtures for all eight asset types and invalid fixtures for the
   known failure modes.
9. Add a read-only legacy adapter plan. Current manifests remain readable, but
   missing Geometry v3 fields are visible audit findings rather than silently
   invented values.
10. Update documentation and shared contracts before any renderer consumer.

### Planned files

- `docs/art/OFFICE_2D_GEOMETRY_PRINCIPLES.md`
- `assets/game/manifests/office-asset-geometry.schema.json` (new)
- `packages/contracts/src/officeGeometry.ts` (new)
- `packages/contracts/src/index.ts`
- `packages/contracts/test/office-geometry.test.ts` (new)
- `scripts/office-geometry-check.mjs` (new)
- `package.json` for `art:geometry:check`

### Deliverables

- Human-readable Geometry v3 rules.
- A versioned JSON Schema.
- Shared TypeScript types.
- Positive and negative fixtures.
- A validator that reports exact asset and field paths.
- A documented legacy-read strategy with no bulk manifest rewrite.

### Acceptance gate

- Each asset type has one valid machine-readable example.
- Invalid support, missing pivots, conflicting planes, duplicate slots,
  unstable animation anchors, and impossible orientations are rejected.
- The desk physical-scale, footprint, and support-plane decision is explicit.
- Contract tests and `npm run check` pass.
- No renderer or active map behavior changes.

## 7. Step 3 — Complete asset geometry audit

Status: Complete on 2026-07-27

### Goal

Produce a reproducible inventory and a reviewed disposition for every Office
asset record. Regeneration decisions must be based on actual pixels,
provenance, orientation coverage, and the Geometry v3 contract rather than an
asset filename.

### Disposition values

- `reuse`
- `metadata-fix`
- `derive-composite`
- `regenerate`
- `blocked-by-orientation`
- `blocked-by-license`

### Audit method

The audit pipeline has two inputs and two generated outputs:

1. Existing manifests and files provide deterministic inventory facts.
2. A review manifest records human visual decisions, reasons, and confidence.
3. The script generates the machine-readable audit JSON.
4. The same script generates the Markdown report from that JSON.

Generated reports are never edited by hand. A changed decision is made in the
review manifest and both reports are regenerated.

### Work

1. Enumerate the 14-sheet library, runtime manifest, planning manifest,
   character registry/directories, derived assets, and related provenance.
2. Normalize each record with `assetKey`, `family`, `variantOf`, orientation,
   source sheet, source file, runtime state, and duplicate relationship.
3. Inspect actual file existence, dimensions, alpha bounds, visible overflow,
   declared render box, footprint, layer, support, pivot, and orientation.
4. Compare every record with Geometry v3 and record missing or contradictory
   fields without automatically guessing replacements.
5. Review the actual image for top-down depth, support-plane visibility,
   base contact, orientation validity, compositing potential, and occlusion.
6. Review license/provenance separately from geometry. A geometrically valid
   prototype asset remains blocked when commercial review is pending.
7. Assign exactly one disposition and a non-empty reason to every auditable
   record.
8. Reconcile counts by source, family, disposition, asset type, license state,
   and orientation coverage.
9. Add check mode that fails on stale generated reports, missing files,
   unreviewed records, invalid status values, or count drift.

### Planned files

- `scripts/audit-office-asset-geometry.py` (new)
- `assets/game/manifests/office-asset-geometry-review.json` (new, reviewed input)
- `assets/game/manifests/office-asset-geometry-audit.json` (new, generated)
- `docs/art/OFFICE_ASSET_GEOMETRY_AUDIT.md` (new, generated)
- `package.json` for `art:geometry:audit` and `art:geometry:audit:check`

### Required audit fields

- Stable record ID and asset family ID.
- Source manifest, sheet, file, and provenance/license state.
- Runtime, staging, planning, or reference-only state.
- Asset type and placement plane.
- Current and proposed geometry fields.
- Available and required orientations.
- Image evidence and observed failure modes.
- Disposition, reason, review status, and confidence.
- Duplicate, variant, composite, and replacement relationships.

### Acceptance gate

- All discovered records are present and count reconciliation is exact.
- Every record has one disposition and a reviewed reason.
- No decision is inferred only from a filename.
- The report identifies all missing `layer` values and metadata conflicts.
- Runtime/library duplicates do not inflate the regeneration backlog.
- JSON and Markdown are reproducible and current.
- Audit check and `npm run check` pass.

## 8. Step 4 — Camera/Scale Bible and calibration board

Status: Complete on 2026-07-27

### Goal

Lock a single camera, scale, baseline, and depth presentation before generating
any replacement image. Every later asset sheet must use the same reference.

### Work

1. Define the canonical 32 px authoring tile, orthographic camera, projection,
   pixel-snapping, light direction, outline weight, and allowed orientation
   views.
2. Define the standing `1 x 1` adult, seated reference, and approved
   morphology-safe overflow.
3. Show floor footprints `1 x 1`, `2 x 1`, `2 x 2`, and the approved desk
   footprint/support-plane combination.
4. Show floor level, seat level, work-surface level, wall anchors, vertical
   extension, base pivots, and sort pivots.
5. Include correct and rejected examples for side-by-side placement,
   front-to-back placement, top-surface continuity, actor occlusion, and visual
   overflow.
6. Generate the calibration board deterministically from a machine-readable
   Bible. Do not use an independently improvised camera for each sheet.
7. Update the asset creation guide, controlled sheet plan, and prompt builder
   to read the accepted scale values rather than transcribing them.
8. Record human acceptance in the Bible manifest before enabling any new
   production prompt.

### Planned files

- `docs/art/OFFICE_CAMERA_SCALE_BIBLE.md` (new)
- `assets/game/manifests/office-camera-scale-bible.json` (new)
- `assets/art/layout-references/office-camera-scale-calibration-v1.png` (new)
- a deterministic board-generation script under `scripts/`
- `docs/art/OFFICE_ASSET_CREATION_GUIDE.md`
- `docs/art/ASSET_SHEET_PLAN.md`
- `scripts/office-asset-prompt.mjs`

### Calibration-board contents

- Blueprint top-down grid and rendered Office view.
- Neutral standing and seated character references.
- Required sample footprints and support planes.
- Floor, seat, table, and wall height guides.
- Base-pivot, sort-pivot, render-bounds, and overflow overlays.
- Correct/incorrect adjacency and occlusion pairs.
- Front, back, left, and right orientation examples.

### Acceptance gate

- The board is reproducible from its manifest and script.
- All dimensions match Geometry v3 and audit terminology.
- The approved desk scale conflict is resolved in both text and image.
- Adjacent assets share a continuous floor and support-plane projection.
- The prompt builder refuses unapproved or missing Bible data.
- Human review changes the Bible status to `accepted`.
- Asset, prompt, and repository checks pass.

## 9. Combined Step 1-4 acceptance

The first batch is accepted only when:

- v6 is preserved and clearly rejected as a production geometry reference;
- Active Office remains unchanged;
- Geometry v3 is documented, typed, schema-valid, and tested;
- the full inventory is reconciled and every record has a reviewed disposition;
- the Camera/Scale Bible is accepted and its board is reproducible;
- production asset generation remains blocked until all four gates pass;
- generated files contain no secrets, unlicensed commercial assets, or manual
  edits to generated reports;
- `npm run check` passes;
- each step is committed and the final branch is pushed.

## 10. Work explicitly deferred

The following work starts only after the combined acceptance gate:

- applying the staging-only modular workstation compositor to Active Office;
- separating floor, wall, window, and door runtime semantics;
- calibrating the complete character roster against accepted furniture;
- migrating furniture families in waves;
- promoting any staging asset into the Active Office;
- deleting or replacing legacy runtime assets.

## 11. Step 5 — Workstation Bundle v1 contract

Status: Complete on 2026-07-27

The workstation is now a composition contract rather than one stretched
bitmap. `office-workstation-bundle-v1.json`, its JSON Schema, shared TypeScript
type, validator, and tests lock:

- one canonical `desk.modular.v1` physical family for Standard, Creative, and
  NOC roles;
- front, back, left, and right orientation records with separate rear,
  surface, base, and foreground asset IDs;
- four named attachment slots inside the `5 x 3` support plane and no slots in
  the fourth employee-edge row;
- chair seat, neutral actor pelvis, monitor viewport, and screen-loop anchors;
- a viewport-local screen coordinate space rather than a wall or world plane;
- the semantic compositor order from desk rear through desk foreground.

Acceptance: contract tests reject missing orientations, duplicate or
out-of-bounds slots, a non-local screen loop, a mismatched viewport parent,
and role-specific desk geometry.

## 12. Step 6 — Deterministic modular desk prototype

Status: Complete on 2026-07-27

`build-office-workstation-prototype.py` deterministically produces a 160 px
(`5 x 5` authoring-tile) source, contact sheet, provenance record, and sixteen
transparent part images. The one physical desk family has four strict
orthographic orientations and four compositing parts per orientation. It
contains no monitor, keyboard, chair, character, or role-specific decoration.

Acceptance: `npm run art:workstation:check` compares every generated byte with
the script output on an art workstation with the pinned Pillow dependency.
The Node-only generated-art lock verifies the committed generator, manifest,
source, provenance, and exact output hashes in CI and Cloudflare without a
Python imaging runtime. Provenance is project-authored, commercially unblocked,
and records `accepted-staging`, not active-runtime status.

## 13. Step 7 — Geometry v3 staging compositor

Status: Complete on 2026-07-27

The new compositor is reachable only through the development-only
`?lab=workstation-v1` route. It reads the bundle contract, selects modular desk
parts by orientation, calculates station depth from `sortPivot.y`, and applies
the semantic order declared by the contract. Existing accepted chair,
monitor, keyboard, and four system-screen assets are composed independently.
The screen frames are clipped inside the declared monitor viewport.

Debug mode displays footprint, support-plane, and sort-pivot evidence. The
active map, renderer route, and active asset registry remain unchanged and do
not contain `desk.modular.v1`.

## 14. Step 8 — Paired-workstation vertical slice

Status: Accepted-staging on 2026-07-27

The isolated map contains exactly two `5 x 4` footprints that touch at one
edge without overlap. The far station faces down and the near station faces
up; each owns one external `1 x 1` seat. A code-generated neutral silhouette
tests seated and standing calibration without using the nineteen
commercial-review-blocked character identities.

Acceptance evidence:

- contract and web tests validate map isolation, adjacency, seats, sort order,
  all sixteen part files, and a complete 0-30 second screen-frame schedule;
- a real 30-second browser run retained `viewport-local` and
  `monitor-screen` anchors with no drift;
- desktop and 390 px mobile visual inspection passed, including controls,
  foreground occlusion, debug overlays, and no horizontal overflow;
- the final state remains `accepted-staging` and `activeOfficePromotion` is
  false.

## 15. Next authorized tranche

Steps 5-8 do not authorize an Active Office swap. The next work should migrate
one non-workstation furniture family at a time into Geometry v3 staging,
calibrate the neutral actor contract against representative character
morphologies, and assemble a larger staging room. Active promotion remains a
separate owner decision after those wave gates pass.

## 16. Steps 9-12 — Structural staging deployment

Status: Complete on 2026-07-27

Office Map v2, the ten-workstation room, deterministic structural renderer,
and development-only acceptance lab are complete. Their status and promotion
boundary are recorded in `docs/OFFICE_TEN_WORKSTATION_ACCEPTANCE.md`.

## 17. Steps 13-16 — Derived furniture and facility waves

Status: Accepted-staging on 2026-07-27

The 77 reviewed `derive-composite` records are closed by one source-hash-locked
pipeline and four count-preserving waves: 24 static cleanups, 40 animation
frames, six library composites, and seven legacy runtime composites. The
pipeline emits 64 clean assets, thirteen exact base layers, twelve foreground
overlays, and four before/derived/difference boards under one versioned
staging directory.

Sixteen cleanup records have one coherent alpha component and are deliberately
recorded as verified no-op derivatives. This prevents an audit group override
from authorizing speculative pixel deletion. The remaining 48 cleanup records
remove only the adjacent-cell material outside the primary component envelope.

The development-only derived-asset lab verifies the thirteen composites with
a neutral actor and Geometry v3 labels. Active Office imports remain unchanged
and promotion remains a separate owner decision. Detailed evidence is in
`docs/OFFICE_DERIVED_ASSET_WAVES_ACCEPTANCE.md`.

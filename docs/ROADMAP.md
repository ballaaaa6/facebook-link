# Roadmap

## M0 — Repository foundation (complete)

- Monorepo boundaries, contracts, workflow state machine, database migration, local object storage, code-health gates, configuration, security rules, CI, art pipeline, and responsive three-route prototype.

## M1 — Observable local workflow

- Office UI reads a versioned API read model with a safe local simulation fallback.
- The working fake pipeline persists jobs, agent runs, audit events, and outbox events idempotently through SQLite.
- Complete the local runner-to-control-plane event relay and replace remaining dashboard/settings mock values.
- Replace fake Sheets transport with a credentialed connector behind the same interface.
- Office motion, stable inspection, settings, dashboard, mock brain, action proposals, and fake connectors already exist.

### Immediate Office art tranche — Einstein and transient held props

Before replacing the active Office interior, prepare and validate one complete
runtime slice against the accepted Modern v3 background, seasonal window, and
clock:

1. Complete Einstein as the golden PetDex-compatible 8x15 character by adding
   the four missing facility rows (`working-back`, `interact-front`,
   `inspect-front`, and `lounge-front`) and packing the two accepted seated-work
   rows.
2. Produce one controlled 4x4 sheet containing sixteen isolated handheld props
   for water, coffee, vending, refrigerator, printer, review, lounge, massage,
   and server interactions.
3. Register deterministic per-facility prop pools. A prop appears only during
   the six-frame interaction, never becomes part of the character atlas, and
   is not carried away from the facility.
4. Derive chair, meeting-table, sofa, and massage-chair foreground masks from
   the accepted furniture pixels; do not regenerate masks as approximate art.
5. Validate Einstein's `interact-front` row with representative dispensing,
   document, review, and lounge props before generating extension rows for the
   rest of the PetDex roster.
6. Promote only validated modern-bright assets, animation groups, anchors,
   masks, and prop pools into a runtime-ready catalog. The active Office keeps
   the current interior until this slice passes.

The locked execution and acceptance contract is maintained in
`docs/art/EINSTEIN_HELD_PROP_VERTICAL_SLICE.md`.

Implementation status (2026-07-27):

- Complete: generated and packed Einstein's four missing rows plus the two
  accepted seated rows as an 8x15 staging atlas at 1x and 2x.
- Complete: generated, extracted, and registered the controlled sixteen-item
  held-prop sheet.
- Complete: added the 15-row contract, six measured hand anchors,
  deterministic facility pools, no-repeat selection, and frames 3-5 visibility
  policy.
- Complete: derived five foreground masks from accepted furniture pixels and
  produced an item-neutral vending tray loop.
- Complete: added a runtime-ready staging catalog, a React interaction harness,
  a sixteen-case `interact-front` visual contact sheet, and automated contract
  tests.
- Complete: built an isolated eight-facility composition lab at the real
  32px-tile runtime scale. It is not routed into the web app. All eight cases
  pass geometry checks; standing machines use a front-right `(1,+1)` candidate
  slot so the actor does not hide the facility, and the printer is composed on
  `cabinet.storage.low`.
- Complete: replaced the rejected angled review-table candidate with the
  centered Modern v3 `table.review.long.modern`. Its authored raised-frontal
  exception exposes the tabletop and both legs without left/right rotation or
  perspective convergence. The table has a 4x1 floor footprint, a 4x2 render
  box, and four seats split two per long side using only
  `working-front-seated` and `working-back-seated`.
- Complete: the same controlled 4x4 source provides fifteen library-only decor
  variants: long and low planters, cactus and office-plant families, a floor
  vase, sculptures, an hourglass, a globe, and a terrarium. Existing Printer,
  Water, and Coffee assets are reused instead of regenerated. All sixteen
  cells are extracted and registered; the active Office remains unchanged.
- Complete: closed Doraemon as the second 8x15 character by adding only its two
  seated-work rows, then completed a morphology transfer pilot with Anna
  (human-like) and AI Workbot (non-human robot). All three versioned atlases
  preserve their accepted base rows pixel-exactly, contain six active frames
  plus two empty cells per new row, and are available only through the staging
  asset catalog. The active Office registry remains on the prior versions.
- Complete: extended the remaining fourteen selected PetDex characters across
  standard-human, stylized-human, compact-costume, and non-human morphology
  families. All 84 source strips extract to exactly six frames; every v3 atlas
  is 8x15 at 1x and 2x, preserves visible RGBA and alpha across its nine
  accepted base rows,
  records provisional hand/seat calibration data, and is registered only in
  the staging catalog. The active Office registry and map remain unchanged.
- Complete: added explicit `floor` and `wall` regions to the active Office map.
  Coordinate-placed objects and workstations now name their structural
  surface; runtime validation rejects incompatible supports, anchors or
  footprints outside the region, and supported props that bypass parent slots.
- Held at the intended gate: none of these staging assets replaces the active
  Office interior. The previously planned direct Facility v1 composition and
  interior swap is superseded by the geometry-remediation program below.

### Immediate Office geometry remediation — approved Steps 1-4

The character-art batch is closed in staging. The next Office tranche is not a
full asset rebuild or a direct replacement-interior swap. It is a reuse-first
geometry audit that must decide per asset whether to reuse it, fix metadata,
derive a composite, regenerate it, or block it for orientation or licensing.

Verified baseline on 2026-07-27:

- 212 modern Office library assets across 14 sheets;
- 50 current runtime geometry entries and 16 planning-only entries;
- 19 character directories;
- 35 library assets without a declared `layer`;
- a `4 x 2` standard-desk Scale Bible conflicting with the isolated lab's
  `5 x 4` desk collision contract;
- v6 lab captures that must be retained as rejected regression evidence rather
  than used as the production geometry template.

The approved first batch delivers Steps 1-4 together, with sequential gates:

1. Quarantine the rejected v6 composition, preserve it as a negative
   regression case, and prove that the Active Office remains unchanged.
2. Define Office Geometry Contract v3, including independent placement planes,
   footprints, support planes, pivots, render bounds, offsets, occlusion parts,
   attachment slots, seat slots, and orientations.
3. Generate and review a complete asset audit with one explicit disposition
   and reason for every discovered record.
4. Lock a machine-readable Camera/Scale Bible and deterministic calibration
   board before authorizing replacement asset generation.

Production image generation, renderer replacement, character recalibration,
and Active Office promotion remain blocked until the combined Step 1-4 gate
passes. The detailed execution order, planned files, validation strategy, and
acceptance criteria are maintained in
`docs/art/OFFICE_GEOMETRY_REMEDIATION_ROADMAP.md`.

Implementation status (2026-07-27): Steps 1-4 are complete. The v6 composition
and its v5 desk inputs are explicitly rejected, preserved as negative
regression evidence, and covered by automated isolation checks. Geometry v3
now has a written contract, JSON Schema, shared TypeScript types, a validator,
and positive and negative fixtures for all eight asset types. The workstation
decision independently locks `5 x 4 x 2.4` physical scale, a `5 x 4` floor
footprint, and a `5 x 3` support plane. The deterministic audit reconciles 297
records representing 235 distinct asset keys: 20 reuse, 142 metadata fixes, 77
clean derivatives/composites, 7 regenerations, 32 orientation blocks, and 19
license blocks. It reports all 35 missing library layer declarations, no
missing referenced images, and no unreviewed records. The accepted
machine-readable Camera/Scale Bible and deterministic calibration
board now lock the 32 px tile, projection split, reference levels, orientation
gate, and the canonical `5 x 4` desk with its `5 x 3` support plane. The prompt
builder refuses missing or non-accepted Bible data and substitutes these
accepted workstation generation values without changing the legacy Active
Office manifest. The combined Steps 1-4 gate passes; Active Office data,
renderer behavior, and visuals remain unchanged.

### Immediate Office workstation vertical slice — Steps 5-8 complete in staging

The next reuse-first tranche is complete at its intended staging gate:

5. `Workstation Bundle v1` now composes the canonical desk, four orientation
   part sets, support slots, the accepted chair and monitor families, a neutral
   calibration actor, and a viewport-local four-frame screen loop. Standard,
   Creative, and NOC variants share one physical desk family.
6. A deterministic generator produces one modular bare-desk family in four
   orthographic orientations, split into `rear`, `surface`, `base`, and
   `foreground` parts. Its `5 x 4 x 2.4` scale, `5 x 4` footprint, and `5 x 3`
   support plane match the accepted Camera/Scale Bible. No equipment, chair,
   or character pixels are baked into the desk.
7. A Geometry v3 compositor now exists behind the development-only
   `?lab=workstation-v1` route. Semantic part order and the workstation
   `sortPivot` determine depth; the monitor animation is a viewport-local
   child. The active renderer and active registry do not import this bundle.
8. The isolated vertical slice contains exactly two edge-touching
   workstations: a far down-facing station and a near up-facing station. It
   supports seated, standing, furniture-only, and geometry-debug inspection.
   Automated checks cover footprint adjacency, seat placement, composition
   order, all sixteen desk parts, the 30-second screen-loop interval, and
   Active Office isolation. Desktop and 390 px mobile visual QA passed with no
   horizontal overflow.

Status on 2026-07-27: `accepted-staging`. This is not Active Office promotion
and does not approve the 19 prototype character identities for commercial use.
The next tranche is furniture-family migration and character calibration in
small staging waves, followed by a separate explicit promotion decision.

## M2 — One-account Shopee pilot

- Import the existing login/session recovery approach through a connector.
- Discover products, snapshot evidence, rank winners, create attributed links, and collect affiliate metrics.

## M3 — Content and Meta publishing

- Gemini browser copy, Google Flow browser visuals, QA gate, Meta Graph API scheduling, and publication reconciliation.

## M4 — Learning loop and Oracle migration

- Join Shopee and Meta metrics, strategy proposals, controlled experiments, alerts, encrypted profile migration, and seven-day Oracle acceptance.

## M5 — Multi-account scale

- Profile isolation, queue partitioning, quotas, per-account policies, rate limits, and operational dashboards.

## M6 — Rental product

- Authentication, tenant isolation, billing, onboarding, support tooling, legal terms, retention controls, and commercial asset licensing.

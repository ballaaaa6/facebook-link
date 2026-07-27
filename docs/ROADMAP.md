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
- Held at the intended gate: none of these staging assets replaces the active
  Office interior yet. The next tranche is facility-by-facility composition
  geometry for the complete 14-object/20-slot Facility v1 set, followed by the
  full interior swap only after the final map validates those slots.

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

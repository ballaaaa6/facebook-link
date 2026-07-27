# Commercial Character Roster Plan

## Objective

Replace the commercially blocked prototype character identities with a
project-authored roster, preserve complete rights evidence, and calibrate every
production agent against the accepted Geometry v3 seating contract. Active
Office promotion remains a later, separate owner decision.

## Scope

The audited character inventory contains nineteen prototype directories:
eighteen character identities and one companion. The production scope is ten
agent slots plus one companion slot. The eight unused identities remain
quarantined alternates and do not receive replacements in this tranche.

The ten production agents receive complete `8 x 15` atlases. The original
companion receives only the states required by the companion runtime and is not
included in seated calibration unless a later behavior contract requires it.

## Non-derivative Source Policy

- Prototype pixels and screenshots are never generation inputs.
- Prototype names, franchise names, artist names, signature costumes, and
  identifying palette/silhouette combinations are excluded from prompts.
- Technical animation geometry may be reused: frame dimensions, semantic row
  order, frame counts, empty cells, anchors, and deterministic pack formats.
- Each replacement starts from a new written design brief and a project-authored
  identity master.
- Generated output is not automatically commercial-approved. Prompt, tool,
  terms, inputs, raw output, human edits, final output, similarity review, and
  reviewer sign-off remain separate evidence.

## Step 17 — Rights Contract and Prototype Quarantine

Status: Complete on 2026-07-27.

The reviewed rights input assigns every prototype exactly one usage and
disposition. Active prototypes map to replacement slots; alternates map to no
production slot. Every prototype remains `internal-prototype-only`, and
`generationInputAllowed` remains false.

The production roster contract defines stable `original-*` IDs for ten agents
and one companion. All slots start at `planned`, remain absent from Active
Office, and keep `commercialCharacterApproval: false`.

Required evidence for each replacement:

1. Original written design brief.
2. Prompt hash and generation timestamp.
3. Tool, account class, and applicable terms record.
4. Licensed-input inventory; an empty inventory is recorded explicitly.
5. Raw output hash.
6. Human edit and selection record.
7. Final output hash.
8. Logo, trademark, and likeness review.
9. Explicit commercial reviewer sign-off.

Acceptance:

- nineteen of nineteen prototype directories are reconciled;
- ten active agents, one active companion, and eight alternates are counted;
- all nineteen prototype records remain generation-input blocked;
- eleven unique replacement slots use `original-*` IDs;
- generated audit JSON and Markdown are reproducible;
- Active Office imports and approval flags remain unchanged;
- the character-rights check and `npm run check` pass.

## Step 18 — Three-Morphology Original Pilot

Status: Planned.

The first production wave contains three actual roster identities:

- `original-market-scout-v1`: compact-stylized;
- `original-growth-strategist-v1`: standard-human;
- `original-session-keeper-v1`: non-human-robot.

Each identity master records a four-view turnaround, silhouette, palette,
proportions, pelvis location, outfit construction, distinguishing traits, and
forbidden similarities. One identity is generated per browser workflow. A
failed semantic row is retried without regenerating accepted rows.

Each pilot agent closes the full `8 x 15` contract:

- rows 0-8: the accepted runtime base semantics;
- row 9: `working-back`;
- row 10: `interact-front`;
- row 11: `inspect-front`;
- row 12: `lounge-front`;
- row 13: `working-back-seated`;
- row 14: `working-front-seated`.

Furniture, chairs, desks, monitors, foreground masks, and held props remain
separate layers. The six extension rows contain six active frames and two
empty trailing cells.

Acceptance:

- three of three identity masters receive human design approval;
- all three atlases pass dimensions, alpha, frame-count, and empty-cell checks;
- identity and palette remain stable across rows;
- rights evidence is complete for every generated source and packed output;
- prototype art is absent from prompt inputs and output directories;
- the pilot remains staging-only.

## Step 19 — Full Original Production Roster

Status: Planned.

The accepted pilot is extended with seven agents and one companion. Ten agents
produce 1,200 atlas cells and 930 active frames. The companion uses a separate
contract because it does not require workstation rows.

Every identity follows the same gated sequence:

1. Approve the design brief.
2. Generate the identity master.
3. Produce base and semantic row sources.
4. Extract and validate alpha.
5. Pack lossless 1x and 2x atlases deterministically.
6. Generate identity, motion, and similarity evidence boards.
7. Record raw, edited, and final hashes.
8. Complete human art review.
9. Complete commercial review.
10. Register the identity in the commercial staging manifest only.

`rights-evidence-complete` is not equivalent to
`commercial-review-approved`. Step 19 cannot be accepted until every production
slot has explicit reviewer sign-off. No staging result changes the Active
Office registry.

## Step 20 — Whole-Roster Seat Calibration

Status: Planned.

### Anchor Reconciliation Gate

The Geometry v3 workstation bundle declares the modern chair seat anchor at
`(0.5, 0.58)` in chair-asset normalized coordinates and the neutral actor
pelvis at `(0.5, 0.62)` in actor-asset normalized coordinates. The legacy
interaction manifest declares the chair mask seat anchor at `(0.5, 0.53)`.
These values must not be averaged. The implementation must identify each
coordinate space and create a versioned Geometry v3 interaction record before
calibrating replacement characters.

### Calibration Matrix

Each of ten agents is checked in twelve seat presentations:

| Presentation | Count |
| --- | ---: |
| Workstation front and back | 2 |
| Review table, two horizontal anchors and two actor facings | 4 |
| Three-seat sofa | 3 |
| Two-seat sofa | 2 |
| Massage chair | 1 |

All six frames are rendered for every presentation, producing 720 deterministic
composite checks. Each record stores pelvis anchor, resolved seat offset, sort
pivot, foreground-mask relationship, head-safe region, visible-leg policy,
and review-prop hand anchor where applicable.

An offset may fix coordinate placement only. Anatomy, posture, silhouette, or
occlusion failures require regeneration of the affected seated row. Runtime
offsets must not conceal a structurally incorrect pose.

Acceptance:

- final pelvis-to-seat error is at most one pixel at 1x and two pixels at 2x;
- pelvis drift across six frames is at most one pixel at 1x;
- no foreground mask intersects the declared head-safe region;
- intended lower-body occlusion passes for all seat families;
- standing-to-seated transitions do not jump;
- every frame remains inside morphology-safe bounds;
- the ten-workstation scene holds five front-facing and five back-facing agents
  at their seat anchors for sixty seconds;
- browser QA passes at desktop, tablet, 390 px, and 320 px;
- Active Office remains unchanged.

The accepted result is `accepted-commercial-staging`. Active Office promotion,
legacy asset removal, and public release remain a later tranche.

## Delivery and Checks

The intended commands are:

```bash
npm run art:character:rights
npm run art:character:rights:check
npm run check
```

Later steps add deterministic character-build and seat-calibration checks. Each
accepted step is committed independently and pushed to the configured remote.

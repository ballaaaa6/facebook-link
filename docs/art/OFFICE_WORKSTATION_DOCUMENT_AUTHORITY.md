# Office Workstation Document Authority Index

Status: Current
Updated: 2026-07-28

Use this index before reading any older Office workstation document. A file in
the historical table may explain a failure, but it cannot supply a coordinate,
asset-generation instruction, layer order, map position, or permission.

## Current documents

| Document | Authority |
| --- | --- |
| `docs/art/OFFICE_COORDINATE_SYSTEM.md` | Owner-approved workstation placement, sockets, scale, equipment depth, and desk joins |
| `docs/art/OFFICE_2D_GEOMETRY_PRINCIPLES.md` | Shared geometry concepts for all Office asset families |
| `docs/art/OFFICE_ASSET_CREATION_GUIDE.md` | General asset workflow; workstation sections defer to the coordinate system |
| `docs/art/OFFICE_WORKSTATION_TEN_SEAT_NEXT_PLAN.md` | Planned next phase; not authorized for execution until separately started |
| `docs/ROADMAP.md` | Product-level delivery sequence and promotion gates |

## Current machine-readable authority

| File | Status |
| --- | --- |
| `assets/game/manifests/office-workstation-step5-r05-r02.json` | `owner-approved-p0-p3` |
| `assets/game/manifests/office-character-seat-sockets-v1.json` | `owner-approved` |
| `assets/game/maps/office-workstation-pair-r05-r02.json` | `owner-approved-p0-p3`, development-only |

## Historical or rejected documents

| Document | Classification |
| --- | --- |
| `docs/art/OFFICE_CAMERA_SCALE_BIBLE.md` | Superseded measurement history |
| `docs/art/OFFICE_WORKSTATION_ASSEMBLY_BIBLE.md` | Superseded assembly history |
| `docs/art/OFFICE_WORKSTATION_STEP5_SINGLE_SEAT_PLAN.md` | Superseded execution history |
| `docs/OFFICE_WORKSTATION_R05_REVIEW.md` | Rejected R05 final composition review |
| `docs/OFFICE_TEN_WORKSTATION_ACCEPTANCE.md` | Rejected `5 x 4` structural staging record |
| `docs/OFFICE_CANDIDATE_V1_REVIEW.md` | Rejected Candidate r01 review |
| `docs/TWO_ROW_MODERN_OFFICE_LAB_TEST_PLAN.md` | Rejected earlier two-row plan |
| `docs/art/OFFICE_GEOMETRY_REMEDIATION_ROADMAP.md` | Historical execution record |
| `docs/art/OFFICE_REF_MIGRATION_ROADMAP.md` | Superseded migration context |
| `docs/art/OFFICE_ASSET_GEOMETRY_AUDIT.md` | Frozen 2026-07-27 inventory; workstation conclusions superseded |

Versioned manifests, maps, scripts, tests, screenshots, and labs belonging to
R01, R02, R03, R04, R05 final, Candidate r01, Workstation Bundle v1, or Office
Map v2 are likewise historical or rejected unless the R05-r02 manifest
references a specific pixel asset by hash.

## Reference rule

New work may import an old pixel file only when the current R05-r02 authority
records or validates its hash. It may never inherit the old file's geometry,
status, map, renderer, or permissions. If a future document conflicts with the
current coordinate system, stop and create a new reviewed revision instead of
choosing whichever value makes the scene fit.

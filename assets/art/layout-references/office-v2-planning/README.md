# Office V2 Planning Inputs

Status: Planning-only handoff; not runtime authority
Created: 2026-07-30
V1 base tag: `office-v1-final-2026-07-30`
V1 base commit: `679757c0feff063ac7cb7ce538ffc59342ff4f7a`

These two review images were preserved outside the V1 final commit and moved
onto `codex/office-engine-v2` after the V1 tag was created. They annotate the
final V1 architectural plate only to help define the initial V2 world zones.
They do not extend, amend, or reopen Office V1.

## Files

- `01-zone-boundary-interpretation.png`
  - SHA-256:
    `f1ab91e602b94fd2aeb9b2c8eac51974a4efe2a11b5b9d95c149da0bb0f475b7`
  - Purpose: preserves color boundaries without assigning floor, wall, or
    gameplay meaning.
- `02-semantic-zone-map-review-draft.png`
  - SHA-256:
    `674ad4d408551156221e328116224a223a875fded3a5169d0c34e255e149e914`
  - Purpose: records a review-draft interpretation of Office wall, Relax wall,
    Office floor, Relax floor, outside-window, and pillar regions. Uncolored
    cells remain explicitly unassigned.

## Prohibited use

These images cannot be imported by a renderer, used as collision or
navigation data, treated as an asset-pixel source, or promoted as a V2 map.
V2 must first lock its projection, world-cell schema, occupancy rules, and
machine-readable zone contract. Only then may an independently validated V2
map encode owner-approved cell assignments derived from this review context.

Machine-readable provenance and permissions are recorded in
`assets/game/manifests/office-v2-planning-inputs-v1.json`.

# Decision 0006 — Versioned Source Families and Deterministic Runtime Export

- Status: accepted
- Date: 2026-07-31
- Owners: art and asset pipeline

## Context

The project may use hand-drawn or assisted original art, but runtime files must
be reproducible, attributable, geometrically aligned, and safe for commercial
use. No single authoring application is guaranteed on every machine.

## Options considered

- Commit runtime PNG files only: insufficient provenance and reconstruction.
- Require one proprietary editor: reproducible only for licensed machines.
- Source-neutral family contract with pinned recipes: supports approved tools
  while keeping runtime admission deterministic.

## Decision

Every family stores an immutable versioned source, provenance record, geometry
manifest, export recipe, runtime PNG outputs, output hashes, and review result.
Runtime format is PNG plus canonical JSON metadata using nearest-neighbor
filtering. Aseprite CLI is the preferred pixel-art exporter when an approved
license is available; other tools must produce the same declared outputs and
evidence.

Generated or assisted art records its brief or prompt, tool, date, source hash,
and commercial review. Missing or unapproved material fails; no V1, Git-history,
or unrelated-family fallback is permitted.

## Consequences

The pipeline admits one family at a time. Changing viewpoint, pixel density,
lighting basis, or contact geometry creates a new family version. Source files
remain immutable and runtime outputs are rebuilt into versioned destinations.

## Evidence

Asset and provenance schemas, the asset admission fixtures, the asset check,
neutral-board review, and output hashes.

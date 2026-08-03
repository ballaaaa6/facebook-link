# Phase 4 Main Task Specification — Property, Golden, and T4 Evidence

- Task ID: `P4-W5.7`
- Owner: Main Orchestration Session
- Phase: Phase 4 — Renderer benchmark and selection
- Dependencies: integrated W5.5 and W5.6 evidence
- Status file: `docs/parallel-work/phase4-session-7-status.md`

## Objective

Execute the admitted seeded property/model profile, pin reviewed Canvas golden
captures, validate browser accessibility/responsive/lifecycle evidence, and
prepare the Main-only renderer decision. This task does not alter world,
simulation, operations, asset admission, or generated contracts.

## Acceptance

- `fast-check` 4.9.0 is admitted with exact integrity, license, support, cost,
  alternatives, owner, and removal path before import;
- independent depth, semantic-picking, and lifecycle models pass seed `20260801`
  at 100 CI runs and 1,000 exploration runs;
- golden manifests pin browser, viewport, camera, tick, seed, hashes, renderer
  revision, preferences, geometry independence, reviewer, and no-rewrite policy;
- normal checks validate committed evidence without rewriting artifacts;
- Main reviews numeric evidence and records the winner; P4-EXIT-01 remains
  responsible for final decision/readiness/loser handling/publication.

## Outputs

- `artifacts/office-v2/phase4/property-model-evidence.json`;
- `artifacts/office-v2/phase4/renderer-golden-evidence.json`;
- `artifacts/office-v2/phase4/renderer-qa-evidence.json`;
- `scripts/office-v2-phase4-model*.mjs`, `scripts/office-v2-phase4-golden*.mjs`,
  and `scripts/office-v2-phase4-qa*.mjs`.

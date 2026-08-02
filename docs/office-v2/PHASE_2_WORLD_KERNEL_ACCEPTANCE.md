# Office V2 Phase 2 World Kernel Acceptance

Status: passed
Owner: Office V2 world-kernel final integration
Receiving package: packages/office-v2-world
Entry handoff: PHASE_1_EXIT_HANDOFF.md
Status authority: READINESS_MATRIX.md
Sequence authority: READINESS_REMEDIATION_PLAN.md

## Purpose

This record locks the Phase 2 entry and exit criteria before implementation
starts. It is an evidence record and checklist, not a replacement for the
canonical contracts or the readiness matrix.

Allowed status values are not-started, in-progress, passed, and blocked. Phase
2 cannot be promoted while any required entry or exit row is not passed.

## Entry gate

| ID | Required evidence | Status | Evidence reference |
| --- | --- | --- | --- |
| P2-ENTRY-01 | Phase 1 exit handoff exists and names the receiving contract versions and closure commit | passed | PHASE_1_EXIT_HANDOFF.md |
| P2-ENTRY-02 | Preflight and full repository check pass at the Phase 2 starting commit | passed | Final integration preflight and `npm run check`; integration base `249a104114abd135cd1a9a0855821c9722e78b60` |
| P2-ENTRY-03 | Generated contracts and reports are deterministic and drift-free | passed | Preflight contract generation and `npm run check` contract gates |
| P2-ENTRY-04 | Implementation stays inside the pure world-kernel boundary with no React, renderer, simulation, operations, or runtime-asset imports | passed | Clean-room, boundary, architecture, and asset gates in preflight/check |
| P2-ENTRY-05 | Projection, world, scene, geometry, canonical, hash, and style contract versions are pinned in the implementation record | passed | Version list in the evidence record below |
| P2-ENTRY-06 | No runtime asset, renderer, persistent simulation, or production-readiness claim is introduced by the Phase 2 entry | passed | Phase 1 non-claims |

The first two rows are the minimum executable start gate. The remaining rows
must be recorded before the first Phase 2 implementation commit is accepted.

## In-scope implementation

The Phase 2 kernel must provide pure, deterministic behavior for:

- World bounds, floor-local coordinates, and coordinate-space validation.
- Forward projection and inverse ground picking, including bounds and edge
  behavior.
- Footprints, orientation, rotated asymmetric placement, support, clearance,
  occupancy, overlap, and interaction-use-slot rules.
- Surfaces, normalized structural edges, zones, floor/site boundaries, and
  reference closure.
- Canonical serialization, semantic hashing inputs, version rejection, and
  exact diagnostics.

The implementation must be deterministic, headless, and independent of browser
time or rendering lifecycle.

## Out of scope

Phase 2 must not admit any of the following:

- React components, renderer adapters, browser camera/input loops, or canvas
  lifecycle code.
- Mutable simulation ticks, queues, reducer/replay runtime, or operations
  records.
- Asset export, PNG/atlas validation, runtime asset registries, or visual-owner
  approval.
- Character, furniture, or production scene families.

## Exit checklist

| ID | Required acceptance evidence | Status | Evidence reference |
| --- | --- | --- | --- |
| P2-EXIT-01 | Projection forward/inverse round-trip passes for interior, boundary, outside, and degenerate inputs | passed | `packages/office-v2-world/test/projection.test.ts` and `projection-roundtrip.json` |
| P2-EXIT-02 | Coordinate-space and floor-local invariants reject mixed spaces and invalid bounds | passed | `projection.test.ts`, `coordinate-semantics.test.ts`, and topology floor-reference checks |
| P2-EXIT-03 | Rotated asymmetric placement agrees with footprint, support, clearance, and interaction-use-slot calculations | passed | `packages/office-v2-world/test/placement.test.ts` and `placement-rotation-clearance.json` |
| P2-EXIT-04 | Occupancy and overlap rules distinguish structural blockers, furniture, decoration, and walkable space correctly | passed | `placement.test.ts` immutable occupancy and semantic-kind cases |
| P2-EXIT-05 | Structures, surfaces, zones, and floor/site topology normalize deterministically and preserve reference closure | passed | `topology-kernel.test.ts`, existing topology fixtures, and reused topology/reference validators |
| P2-EXIT-06 | Depth inputs and tie-breaks are stable for equal, adjacent, rotated, and overlapping cases | passed | `depth-ordering.test.ts` and `depth-occlusion.json` |
| P2-EXIT-07 | Missing, stale, circular, or wrong-version references fail closed with exact diagnostics | passed | `topology-kernel.test.ts`, `depth-ordering.test.ts`, and existing reference-closure tests |
| P2-EXIT-08 | Reordered equivalent inputs produce byte-identical canonical serialization and identical hashes; semantic mutation changes the hash | passed | `topology-kernel.test.ts` canonical reorder/hash mutation cases |
| P2-EXIT-09 | Invalid world and placement inputs produce deterministic diagnostics without partial state admission | passed | `placement.test.ts` and `topology-kernel.test.ts` rejection/no-bytes cases |
| P2-EXIT-10 | Clean-room and package-boundary checks pass with no renderer or runtime-asset leakage | passed | Final preflight and `npm run check` |
| P2-EXIT-11 | Full repository check passes and this record is filled with commit, commands, fixtures, and canonical world hashes | passed | `docs/parallel-work/final-integration-report.md` |

At minimum, the evidence bundle must include projection round-trip,
inverse-picking edge cases, rotated asymmetric placement, occupancy/overlap,
stable depth, reference closure, and canonical serialization reorder tests.

## Evidence record

- Acceptance commit: `cbf4f7bf48cb49912374dd2330311fdade29e44c` (final
  integration commit); details are recorded in
  `docs/parallel-work/final-integration-report.md`.
- Accepted by: Session 3 Final Integrator, worker/session
  `019fc076-8582-7db3-ae9f-6425cd4b5068`.
- Acceptance date: 2026-08-02 (Asia/Bangkok).
- Preflight command and result: `node
  .agents/skills/build-office-v2-engine/scripts/preflight.mjs` passed the
  clean-room, boundary, contradiction, generated-contract, coordinate,
  reference, geometry, knowledge, asset, and project-skill gates.
- Full repository check command and result: `npm run check` passed all
  repository gates, 70 Office world tests, workspace typechecks, and builds.
- Fixture and property-test references: `projection-roundtrip.json`,
  `placement-rotation-clearance.json`, `depth-occlusion.json`, the three
  building topology fixtures, `scene-plan-target-floor.json`, and the focused
  projection, placement, depth, and topology-kernel suites. No property/model
  or visual proof is claimed.
- Canonical world serialization hashes: domain `office-v2:world-kernel`,
  version `office-world-v2-v1`; target-floor base hash
  `e9ec65585cfce2ccb873a155f1c5c822b971bf9b340644d89ceb6369b3575f43`
  (11,657 canonical bytes); composition-profile mutation hash
  `311524a6a9d15795b675000aabb735018172982798dffe00b6955c6801e6aab0`;
  explicitly ordered entity-array hash
  `117775ef18d321035221708e50839e1f17d5cb2c5e59de6b531c6f02bfb24620`.
- Contract versions exercised: `office-projection-v1`,
  `office-placement-snapshot-v1`, `office-depth-ordering-v1`,
  `office-building-topology-v1`, `office-world-v2-v1`, and canonical hash
  domain `office-v2:world-kernel`; existing scene/geometry/reference contract
  versions remain authoritative.
- Visual testing: not applicable to this phase

## Promotion rule

Phase 2 is passed only when every required entry and exit row is marked
passed, the evidence references resolve to committed artifacts, and the full
repository gate passes at the acceptance commit. Passing this record authorizes
the next pure/headless world work, including the later persistent simulation
wave; it does not authorize renderer, production assets, or visual release.

## Known not proven by this record

Visual owner approval, production export, runtime asset admission, actor/furniture
readability, mobile viewport proof, renderer lifecycle behavior, and integrated
T4-T6 evidence remain governed by their later phase gates.

# Office V2 Phase 2 World Kernel Acceptance

Status: not-started
Owner: Office V2 world-kernel implementation
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
| P2-ENTRY-02 | Preflight and full repository check pass at the Phase 2 starting commit | not-started | Starting commit: pending |
| P2-ENTRY-03 | Generated contracts and reports are deterministic and drift-free | not-started | Check output: pending |
| P2-ENTRY-04 | Implementation stays inside the pure world-kernel boundary with no React, renderer, simulation, operations, or runtime-asset imports | not-started | Boundary report: pending |
| P2-ENTRY-05 | Projection, world, scene, geometry, canonical, hash, and style contract versions are pinned in the implementation record | not-started | Version list: pending |
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
| P2-EXIT-01 | Projection forward/inverse round-trip passes for interior, boundary, outside, and degenerate inputs | not-started | Projection fixtures/tests: pending |
| P2-EXIT-02 | Coordinate-space and floor-local invariants reject mixed spaces and invalid bounds | not-started | World-kernel tests: pending |
| P2-EXIT-03 | Rotated asymmetric placement agrees with footprint, support, clearance, and interaction-use-slot calculations | not-started | Placement fixture/tests: pending |
| P2-EXIT-04 | Occupancy and overlap rules distinguish structural blockers, furniture, decoration, and walkable space correctly | not-started | Occupancy fixture/tests: pending |
| P2-EXIT-05 | Structures, surfaces, zones, and floor/site topology normalize deterministically and preserve reference closure | not-started | Topology fixture/tests: pending |
| P2-EXIT-06 | Depth inputs and tie-breaks are stable for equal, adjacent, rotated, and overlapping cases | not-started | Depth fixture/tests: pending |
| P2-EXIT-07 | Missing, stale, circular, or wrong-version references fail closed with exact diagnostics | not-started | Rejection fixture/tests: pending |
| P2-EXIT-08 | Reordered equivalent inputs produce byte-identical canonical serialization and identical hashes; semantic mutation changes the hash | not-started | Serialization tests: pending |
| P2-EXIT-09 | Invalid world and placement inputs produce deterministic diagnostics without partial state admission | not-started | Diagnostics report: pending |
| P2-EXIT-10 | Clean-room and package-boundary checks pass with no renderer or runtime-asset leakage | not-started | Boundary report: pending |
| P2-EXIT-11 | Full repository check passes and this record is filled with commit, commands, fixtures, and canonical world hashes | not-started | Final acceptance record: pending |

At minimum, the evidence bundle must include projection round-trip,
inverse-picking edge cases, rotated asymmetric placement, occupancy/overlap,
stable depth, reference closure, and canonical serialization reorder tests.

## Evidence record

- Acceptance commit: pending
- Accepted by: pending
- Acceptance date: pending
- Preflight command and result: pending
- Full repository check command and result: pending
- Fixture and property-test references: pending
- Canonical world serialization hashes: pending
- Contract versions exercised: pending
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

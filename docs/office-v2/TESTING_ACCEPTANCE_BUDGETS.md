# Testing, Acceptance, and Budgets

## Evidence layers

- **Contract**: schemas reject invalid identifiers, geometry, and versions.
- **Unit**: projection, depth, footprints, sockets, and state transitions.
- **Property**: bounds, stable sorting, rotation, path legality, and replay.
- **Fixture**: serialized worlds and traces remain deterministic.
- **Integration**: adapter, simulation, renderer, and inspector boundaries.
- **Visual**: reviewed desktop, tablet, and phone captures.
- **Accessibility**: keyboard, labels, focus, contrast, zoom, and reduced motion.
- **Performance**: measured simulation, rendering, memory, and bundle costs.

## Foundation budgets

Budgets are recorded before a renderer is selected. Initial renderer proof targets
60 display frames per second on the agreed pilot desktop, while simulation remains
correct when that target is missed. The proof records actor count, draw calls,
texture memory, JavaScript bundle contribution, tick time, and frame time.

No dependency is admitted without version, license, maintenance state, bundle or
runtime cost, rejection alternatives, and a decision record.

## Property and model-test reproducibility profile

The future executable property/model harness is pinned to this profile before
its first accepted run:

| Setting | Pinned value |
| --- | --- |
| Library | `fast-check` `4.9.0` |
| Random type | `xorshift128plus` |
| CI seed | `20260801` |
| CI runs per property | `100` |
| Exploration runs per property | `1000` |

Every failure record retains the seed, shrink path, and minimized
counterexample. A minimized counterexample that exposes a project rule becomes
a versioned fixture before the fix is accepted, so a later library upgrade or
random stream cannot erase the regression evidence.

This profile is a reproducibility contract, not dependency admission. T0 does
not claim property or model evidence because `fast-check` is not yet installed,
executable, or admitted through `DEPENDENCY_LEDGER.md`. Before its first
executable use, the dependency record and lockfile must satisfy the complete
admission checklist.

Likewise, a schema-valid trace containing literal digest strings is not reducer
or replay evidence. Accepted replay evidence starts only when the real reducer
produces state through the Decision 0011 canonical pipeline and an independent
verifier reproduces the bytes and SHA-256 envelope digest.

## Responsive acceptance

The production shell is reviewed at 1440x900, 1024x768, and 390x844. There must
be no page-level horizontal overflow, unreachable navigation, obscured controls,
or hidden freshness state. Camera behavior is tested independently from UI flow.

## Feature definition of done

1. Owning architectural layer and canonical rule are named.
2. Valid input, failures, versioning, and migration effect are documented.
3. Deterministic behavior tests pass.
4. Presentation has reviewed visual evidence where applicable.
5. Accessibility and reduced motion are verified.
6. Performance change is measured against the current budget.
7. Repository, clean-room, type, test, and build gates pass.

## Release blocking failures

Non-deterministic traces, legacy asset fallback, unreviewed provenance, connector
bypass, route loss, inaccessible controls, unexplained stale data, and budget
regressions without an approved decision record block promotion.

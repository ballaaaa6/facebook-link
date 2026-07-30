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

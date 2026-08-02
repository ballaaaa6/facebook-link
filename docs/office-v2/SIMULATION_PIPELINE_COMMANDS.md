# Simulation Pipeline and Command Contracts

## Purpose and authority

This document owns the Phase 1 specification for simulation command, result,
event, tick, and lifecycle ordering. `decisions/0005-simulation-state-machine.md`
owns the pure-reducer choice and 10 Hz rate. `decisions/0011-canonical-
serialization-and-hashing.md` owns canonical bytes and hash envelopes.
`ACTORS_NAVIGATION_INTERACTIONS.md` and `SAVE_SNAPSHOT_MIGRATION.md` own the
actor and persistence semantics consumed here.

The schemas in this slice are contract evidence only. They do not admit a
persistent reducer, replay implementation, browser lifecycle, or runtime
simulation package behavior.

## Versioned envelopes

- `simulation-command.schema.json` owns `office-simulation-command-v2`.
- `simulation-result.schema.json` owns `office-simulation-result-v2`.
- `simulation-event.schema.json` owns `office-simulation-event-v2`.
- `simulation-snapshot-v2.schema.json` owns `office-simulation-snapshot-v2`.
- `simulation-trace-v2.schema.json` owns `office-simulation-trace-v2`.

Every command has a typed command ID and version, an owner, issued and
scheduled ticks, source rank and sequence, a correlation envelope, a closed
payload shape, a payload digest, and the expected world revision. A command
with an actor owner must carry an actor ID; a system owner must carry a system
owner slug. The semantic validator rejects a missing or contradictory owner
before apply.

Every result names its command, tick, status, state-change flag, payload digest,
and optional stable diagnostic. A rejected command has no state mutation. A
duplicate command is idempotent only when its command version and canonical
payload digest match the accepted ledger; a different digest is
`simulation.command-id-conflict`.

Events are facts emitted after accepted transitions. Presentation effects may
consume event data but cannot create or advance an operational transition.
Event sequence is assigned by the simulation and is never derived from wall
clock, renderer order, or array position.

## Fixed tick pipeline

The accepted logical order is:

```text
ingest durable inputs
-> validate envelopes
-> deduplicate and detect ID conflicts
-> expire or cancel obsolete commands and intents
-> validate and apply commands in total order
-> assign intents and select targets
-> resolve queues and atomic reservations
-> plan or revalidate routes
-> advance movement
-> start or advance interactions
-> release and clean up resources
-> emit results and simulation events
-> check invariants
-> project hashable state and record hash
```

Snapshots are legal only after the invariant and hash boundary. Eligibility is
based on logical ticks: `notBeforeTick <= currentTick` is eligible, and
expiry/cancellation/reservation timeout with `<= currentTick` wins before a
later interaction completion in the same tick.

Same-tick command order is:

```text
scheduledTick -> sourceRank -> sourceSequence -> commandId
```

The final comparison uses the accepted UTF-16 code-unit ordering. Source rank
and source sequence order ingestion only; facility priority cannot reorder an
already accepted command. A command scheduled before the current tick is
rejected with `simulation.command-scheduled-in-past` in this contract version.

## Lifecycle and migration

The simulation state is independent from display frames, React lifecycle,
animation callbacks, and network arrival. Browser lifecycle is injected later
through the lifecycle port; it cannot advance logical time by wall-clock catch
up. V1 snapshots and traces remain frozen. A V1 in-progress action is rejected
unless complete versioned queue, reservation, intent, and correlation context
is supplied by an explicit migration.

## Required Phase 2/3 evidence

The later reducer gate must prove duplicate delivery, late delivery, stale
world revision, validation/apply races, cancellation before and during every
phase, real reducer-produced hashes, and equal results across display-frame
schedules. Those are deliberately not counted by the W1.6 contract gate.

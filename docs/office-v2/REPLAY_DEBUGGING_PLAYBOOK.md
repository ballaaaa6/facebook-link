# Replay, Snapshot, and Debugging Playbook

## Purpose and authority

This document owns the Phase 1 snapshot/trace contract, migration registry
shape, replay diagnostics, and secret-safe bug-bundle boundary. The canonical
hash pipeline is Decision 0011. Persistence rules are owned by
`SAVE_SNAPSHOT_MIGRATION.md`.

## Snapshot boundary

`office-simulation-snapshot-v2` is legal only after a completed tick's
invariant/hash boundary. It contains versioned world identity and revision,
10 Hz tick state, named PRNG streams and draw counts, accepted command ledger,
pending commands, external-input digests, actor state, facility slots, queue
tickets, reservations, action queues, cleanup generation, event sequence, and
state hash.

It excludes DOM nodes, renderer objects, decoded textures, functions, browser
timers, screen pixels, and presentation acknowledgements. A presentation effect
may affect simulation only by returning as an explicit recorded input.

## Trace and restore

`office-simulation-trace-v2` contains the initial snapshot, ordered external
inputs, command results, simulation events, per-tick hashes, and final hash.
Inputs are recorded before use so network arrival and wall-clock time cannot
change replay order.

Restore fixtures will cover mid-route, mid-queue, mid-interaction, and held
prop states. An uninterrupted run and a restored run must produce the same
event sequence and reducer-produced state hash. A placeholder digest is never
promoted to replay evidence.

## Hashable state and normalization

The simulation owner declares ordered and unordered collections. Only declared
unordered collections may be stably sorted; ordered arrays retain their order.
The shared duplicate-aware loader runs before materialization, followed by the
accepted canonical JSON bytes and SHA-256 domain/version envelope. The state
hash excludes presentation state.

The Phase 2/3 reducer must prove duplicate-key rejection, negative-zero
normalization, lone-surrogate and unsafe-number rejection, Unicode preservation,
UTF-16 ordering, domain separation, and first-field divergence. W1.6 records
the shape and harness interface; it does not count literal fixture hashes as
replay.

## Migration and bug bundles

Migrations are pure, ordered, one-directional, and version-pinned. Unknown
future versions, missing migration paths, incompatible definition versions,
and incomplete V1 in-progress resource state fail closed.

A secret-safe bug bundle may contain schema and engine versions, seed streams,
commands, inputs, state hashes, diagnostics, and the smallest relevant state
diff. Its serializer must omit cookies, tokens, browser profiles, connector
payloads, and unrelated operational records. Replay divergence names the first
divergent tick, subsystem, JSON pointer, and owning diagnostic.

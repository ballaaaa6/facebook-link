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

The integrated P3-W2.5 runtime provides this boundary through injected
fixed-tick steps, explicit completed snapshots, one-direction migration
registries, real state hashes, first-divergence comparison, and an allowlisted
bug-bundle projection. Its focused replay suite passes 8/8. This is bounded
runtime evidence; it does not claim the complete reducer/crowd trace or Phase 3
exit.

## RC-02 closure — explicit restore and disposable presentation

Status: bounded research closure complete. This closure record is owned here for
snapshot/trace and restore evidence; the four-layer definition, instance,
runtime, and derived-view vocabulary remains owned by
`DEFINITION_INSTANCE_RUNTIME_STATE.md`. It is a prerequisite record for T2,
not T2 execution evidence.

### Source record and bounded observations

RC-02 used only the
[FreeSO Project structure](https://github.com/riperiperi/FreeSO/wiki/Project-structure)
page to ask how simulation, presentation, object interaction, static/dynamic
world data, commands, snapshots, and restore are separated. The page was
observed on 2026-08-02. Its header reports an edit on 2020-06-12, and its visible
history identifies latest revision `3a1510a` (committed 2020-06-12; prior
revision `6591ab6`).

No license notice for the wiki text was observed on that page. Rights for FreeSO
code, game data, maps, assets, and other content are not inferred. The page's
own discussion of avoiding redistribution of copyrighted content is treated as
a boundary, not permission. Office records only neutral project-structure
observations, copies no implementation or content, and admits no dependency.

The bounded observations are that the source describes a simulation VM and
serializable command path separately from renderer groupings; full VM state is
marshalled for save and join/resynchronization; and a lot-rendering world state
is split between architectural, dynamic-entity, and static presentation
groupings. The source also describes entity-facing visual components receiving
updates. Office **adapts** the separation and explicit-state idea, but **rejects**
the source VM, marshal format, renderer component protocol, static buffers, and
network behavior as Office contracts.

| Office rule | Disposition | Canonical owner | Migration consequence |
| --- | --- | --- | --- |
| A presentation-disabled interaction still has explicit simulation state, commands, progress, result events, and correlation. | **Adapt**; presentation is a consumer and cannot commit a transition. | `DEFINITION_INSTANCE_RUNTIME_STATE.md`, `SIMULATION_TIME_RANDOMNESS_REPLAY.md`, and the interaction/command contracts | A restore reader requires the versioned action and correlation facts; animation frames and effect acknowledgements cannot supply them. |
| A mid-action snapshot carries enough state to continue without reconstructing it from position or pixels. | **Adapt** the complete snapshot boundary and trace ordering. | `office-simulation-snapshot-v2`, `office-simulation-trace-v2`, `SAVE_SNAPSHOT_MIGRATION.md`, and this playbook | Missing action phase/progress, resource or reservation ownership, held-prop state, target generation, world revision, event sequence, random-stream state, or workflow/task/event correlation fails closed. |
| Static/dynamic renderer groupings may be useful for derived presentation organization. | **Observed-only/adapted boundary**, not simulation truth. | Presentation snapshot/renderer owners downstream of this playbook | Derived presentation can be discarded and rebuilt; it is never a source version for a definition, instance, or runtime snapshot. |
| Source VM/marshal/network implementation can be reused. | **Reject** under the clean-room boundary and because it would introduce an unapproved dependency and behavior model. | Office contracts and the project-owned reducer/replay implementation in the later T2 gate | No external code, data, map, or behavior table is migrated into Office; only explicit Office contract versions are accepted. |

### Explicit RC-02 restore facts

The restore point is legal only at a completed tick boundary. The minimal
mid-action description must carry, by stable identity: the snapshot/engine
contract versions; world and world revision; logical tick and tick rate; actor
state and floor-local position; target instance; action ID and phase; progress
and duration; every required resource key and reservation/queue ownership;
held-prop ownership; target generation; workflow/task/source-event correlation;
pending commands; event sequence; cleanup generation; and named random stream
state/draw count. These are simulation facts even when no renderer is mounted.

The derived view may contain a screen transform, clip, label, or freshness value,
but it is recomputable and disposable. A presentation acknowledgement may enter
the simulation only as an explicitly recorded external input. It cannot complete,
advance, cancel, or restore an interaction by itself.

`rc-02-invalid-state.json` demonstrates the fail-closed boundary: an actor is
marked `interacting`, but resource ownership and workflow/task/event correlation
are missing while position and presentation data are present. The fixture-local
assertion label `rc-02.invalid-state` is rejected; neither position nor
presentation can reconstruct the omitted facts.

### Focused acceptance and evidence limit

`node --test scripts/office-v2-rc-02-evidence.test.mjs` exercises all three
RC-02 fixtures. It checks presentation-disabled state description, explicit
mid-action restore fields, invalid-state rejection, and deterministic comparison
of event/state descriptions. The comparison preserves ordered event arrays and
normalizes only the declared unordered resource-key collection; it does not
compute a digest.

Fixture `placeholderHash` values are visibly marked `isReducerReplayEvidence:
false`. They are test labels only and must never be promoted to
`office-v2:world-kernel` or simulation replay evidence. The focused command
therefore closes research documentation and bounded descriptions only. It does
not claim a reducer, migration registry, replay runner, reducer-produced hash,
or Phase 3/T2 completion.

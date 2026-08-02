# Save, Snapshot, and Migration

## Persisted forms

- A **world definition** describes authored, mostly static spatial truth.
- A **simulation snapshot** contains complete state at one logical tick.
- A **trace** contains the initial snapshot and ordered recorded inputs used to
  reproduce state transitions.
- An **operations snapshot** is an adapter input and is not an engine save.

Each form declares its schema version. Engine build identifiers are diagnostic;
schema versions own compatibility.

The Phase 1 contract slice defines `office-simulation-snapshot-v2` and
`office-simulation-trace-v2`. Their schemas require versioned world identity,
tick state, command ledgers, external-input digests, queue/reservation state,
action queues, cleanup generation, and state-hash fields. They are contract
fixtures only until the Phase 2/3 reducer and migration registry produce and
verify real state hashes.

W1.1 identity and coordinate values use the discriminated shapes in
`DEFINITION_INSTANCE_RUNTIME_STATE.md` and `common-v2.schema.json`. A floor-local
coordinate carries an explicit versioned floor reference; an elevation or
screen pixel cannot stand in for that reference.

W1.2 definition and instance values carry exact version-pinned references. A
definition bundle is immutable for its declared version and must close the
geometry, interaction, socket, asset-family, animation, connectivity,
character, render-part, and instance references it contains. A save or
migration never upgrades a reference to `latest` or chooses a different
geometry version because it is available.

A building references independently versioned floor-local worlds. Saves and
snapshots identify building, selected floor, floor version, world revision, and
stable portal endpoint IDs explicitly. Elevation cannot stand in for a floor,
and a screen position cannot stand in for a portal endpoint.

W1.3 topology envelopes use `office-building-topology-v1`. A selected floor is
the exact `{ id, version }` floor reference from the building and its world is
the exact `{ id, version }` floor-local world reference. Adding a future floor
adds a new reference and does not rewrite the selected floor's coordinates,
world identity, or entity identities. A portal crossing is represented by its
stable versioned endpoint and landing IDs; it is never reconstructed from
elevation or an array position.

## Migration policy

Migrations are pure, ordered, and one-directional. A reader either validates the
current version, migrates through every required tested step, or rejects the
input. It never guesses defaults for a semantic field.

Historical fixtures are immutable. When a contract changes, add a new fixture
and migration test rather than editing the old input to resemble the new one.

V1 world and surface/structure inputs have no complete building/floor envelope.
A migration accepts them only with explicit building, floor, site, bounds, and
portal context that passes reference closure. It rejects missing or conflicting
context instead of deriving floor identity from `worldId`, elevation, array
position, or the V1 structure kind named `floor`.

For W1.3, complete context means explicit building reference, floor reference,
site-envelope reference, floor bounds, and a `portalContext` marker proving
that entrance and vertical endpoint facts were supplied. A partial context is
`contract.migration-context-missing`; a context that disagrees with the
topology envelope is `contract.migration-reference-conflict`.

V1 entity, interaction, and asset records also remain frozen. Repeated geometry
fields are migrated only when a complete version-pinned geometry reference and
an agreement proof are supplied. Missing migration context emits
`contract.migration-context-missing`; conflicting repeated geometry emits
`contract.migration-reference-conflict`. The reader fails closed before
materializing a V2 definition or instance.

## Snapshot rules

- Store integer world and simulation values, stable identifiers, reservations,
  command deduplication state, named random streams, and the tick rate.
- Store versioned floor references and stable portal endpoint IDs whenever
  state can cross a floor boundary.
- Store task claims, facility/use-slot ownership, approach and waiting cells,
  queue tickets and their enqueue ticks, complete reservation sets, held-prop
  ownership, intent priority/issue tick, cleanup idempotency state, and the
  wait-for evidence required to continue an in-progress action.
- Do not store renderer objects, DOM references, decoded textures, functions,
  wall-clock timers, or screen pixels.
- A domain-owned semantic normalizer stable-sorts only collections explicitly
  declared unordered and preserves all ordered arrays.
- A shared duplicate-aware loader rejects duplicate keys before materializing
  hashed JSON.
- Canonical serialization uses RFC 8785-compatible UTF-8 bytes, UTF-16
  code-unit property ordering, no Unicode normalization, and the accepted
  negative-zero, surrogate, finite-number, and safe-integer rules.
- Hashes use SHA-256 over an explicit domain/version envelope, not a naked
  payload or an implementation's ordinary `JSON.stringify` result.

## Failure reporting

Migration failures name the form, source version, target version, JSON pointer,
and reason. Replay failures additionally name the first divergent tick and
subsystem.

A historical placeholder digest is not migrated into evidence. A new version
must normalize and serialize through the accepted pipeline and reproduce its
digest independently or fail closed.

A V1 in-progress action without the complete Decision 0012 resource and queue
state is rejected rather than reconstructed from actor position or target ID.

## RC-03 migration and restore closure

RC-03 closes the persistence side of capability assignment, target
revalidation, retry/cancellation identity, and restore inputs. The command
ordering and full source/disposition record is in
`SIMULATION_PIPELINE_COMMANDS.md`; this section owns the save and migration
consequence.

### Bounded source record

The six named source files were observed at their `master` paths on 2026-08-02
(Asia/Bangkok). The file revisions and dates were:

| Source files | Revision and date | Rights boundary |
| --- | --- | --- |
| Widelands [`cmd_queue.h`](https://github.com/widelands/widelands/blob/master/src/commands/cmd_queue.h), [`worker.h`](https://github.com/widelands/widelands/blob/master/src/logic/map_objects/tribes/worker.h), [`request.h`](https://github.com/widelands/widelands/blob/master/src/economy/request.h) | [`c40599cdce8a0c735313076486554a5670058732`](https://github.com/widelands/widelands/commit/c40599cdce8a0c735313076486554a5670058732), 2026-01-01 | GPL-2.0-or-later source headers; no source code or data is copied. |
| Unknown Horizons [`worldobject.py`](https://github.com/unknown-horizons/unknown-horizons/blob/master/horizons/util/worldobject.py) | [`1e3e6153764b05f6f5a4e2b7266751c95ee9d23b`](https://github.com/unknown-horizons/unknown-horizons/commit/1e3e6153764b05f6f5a4e2b7266751c95ee9d23b), 2017-09-16 | GPL-2.0 code; repository README separates artwork and other content licenses, all out of scope. |
| Unknown Horizons [`scheduler.py`](https://github.com/unknown-horizons/unknown-horizons/blob/master/horizons/scheduler.py) | [`e4d81d2a0ec19981b9603de2d9d738312e1bb392`](https://github.com/unknown-horizons/unknown-horizons/commit/e4d81d2a0ec19981b9603de2d9d738312e1bb392), 2018-06-01 | GPL-2.0 code; repository README separates artwork and other content licenses, all out of scope. |
| Unknown Horizons [`building.py`](https://github.com/unknown-horizons/unknown-horizons/blob/master/horizons/command/building.py) | [`056d5a570c7f8a7a8c807dffd5905fb1ae5b5bd2`](https://github.com/unknown-horizons/unknown-horizons/commit/056d5a570c7f8a7a8c807dffd5905fb1ae5b5bd2), 2017-09-19 | GPL-2.0 code; repository README separates artwork and other content licenses, all out of scope. |

These are neutral architecture observations only: Widelands exposes pending
command save/load and worker/request ownership or transfer state; Unknown
Horizons exposes stable world IDs, tick-keyed scheduled work, and delayed
command revalidation. The Office decision adapts explicit versioned snapshot
and trace inputs, but rejects pointer registries, callbacks, automatic IDs,
and game-specific persistence shapes. No external code, map, asset, value, or
behavior table becomes an Office dependency.

### Office migration decision and canonical owners

An RC-03 restore input must carry, explicitly and together, the snapshot and
trace versions, versioned world identity and world revision, pending command
IDs and expected revision, external input IDs and digests, queue/action
identity, target generation or facility revision, cancellation/cleanup
generation, and the recorded input order. The reader may validate or migrate
only through a tested, one-directional path. It cannot infer a missing value
from an actor position, target array index, visual identity, or a replacement
object.

`JOBS_INTENTS_ASSIGNMENT.md` owns capability, facility-slot, target-generation,
and action identity. `SIMULATION_PIPELINE_COMMANDS.md` owns command/result/event
ordering and pre-apply revalidation. This document owns the snapshot/trace
input boundary, fail-closed migration, and the explicit restore consequence.
Decision 0011 remains the owner of canonical bytes and hash envelopes; RC-03
does not create or promote a hash.

When required RC-03 context is absent, the existing
`contract.migration-context-missing` failure applies. When supplied versioned
world, target, or resource references disagree, the existing
`contract.migration-reference-conflict` failure applies. A V1 in-progress
action without that complete context rejects before materialization; it is
not converted into a pending or retried V2 action by guessing.

### Focused restore evidence and limits

`packages/office-v2-simulation/test/fixtures/rc-03-retry-cancellation.json`
records explicit `office-simulation-snapshot-v2` and
`office-simulation-trace-v2` input fields alongside stable retry and
cancellation IDs. The local test command is
`node --test scripts/office-v2-rc-03-evidence.test.mjs`; it checks presence,
identity, pending/terminal state, and idempotent cleanup without invoking a
reducer or replay runner. Its `stateHash` values are visibly labeled
placeholders and are not evidence. Real reducer-produced state hashes,
uninterrupted-versus-restored replay equality, and migration registry
execution remain later T2/W2.2 work.

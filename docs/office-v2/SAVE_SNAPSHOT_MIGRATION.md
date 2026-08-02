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

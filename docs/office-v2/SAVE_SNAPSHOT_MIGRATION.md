# Save, Snapshot, and Migration

## Persisted forms

- A **world definition** describes authored, mostly static spatial truth.
- A **simulation snapshot** contains complete state at one logical tick.
- A **trace** contains the initial snapshot and ordered recorded inputs used to
  reproduce state transitions.
- An **operations snapshot** is an adapter input and is not an engine save.

Each form declares its schema version. Engine build identifiers are diagnostic;
schema versions own compatibility.

A building references independently versioned floor-local worlds. Saves and
snapshots identify building, selected floor, floor version, world revision, and
stable portal endpoint IDs explicitly. Elevation cannot stand in for a floor,
and a screen position cannot stand in for a portal endpoint.

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

## Snapshot rules

- Store integer world and simulation values, stable identifiers, reservations,
  command deduplication state, named random streams, and the tick rate.
- Store versioned floor references and stable portal endpoint IDs whenever
  state can cross a floor boundary.
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

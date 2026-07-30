# Save, Snapshot, and Migration

## Persisted forms

- A **world definition** describes authored, mostly static spatial truth.
- A **simulation snapshot** contains complete state at one logical tick.
- A **trace** contains the initial snapshot and ordered recorded inputs used to
  reproduce state transitions.
- An **operations snapshot** is an adapter input and is not an engine save.

Each form declares its schema version. Engine build identifiers are diagnostic;
schema versions own compatibility.

## Migration policy

Migrations are pure, ordered, and one-directional. A reader either validates the
current version, migrates through every required tested step, or rejects the
input. It never guesses defaults for a semantic field.

Historical fixtures are immutable. When a contract changes, add a new fixture
and migration test rather than editing the old input to resemble the new one.

## Snapshot rules

- Store integer world and simulation values, stable identifiers, reservations,
  command deduplication state, named random streams, and the tick rate.
- Do not store renderer objects, DOM references, decoded textures, functions,
  wall-clock timers, or screen pixels.
- Canonical serialization sorts maps and visible collections by declared keys.
- Hashes use the canonical UTF-8 JSON representation.

## Failure reporting

Migration failures name the form, source version, target version, JSON pointer,
and reason. Replay failures additionally name the first divergent tick and
subsystem.

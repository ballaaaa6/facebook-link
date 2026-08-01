# Decision 0011 — Canonical Serialization and Hashing

- Status: accepted
- Date: 2026-08-01
- Owners: contracts, world, simulation, and operations adapter

## Context

Deterministic scene compilation, snapshots, replay, and adapter deduplication
need byte-identical representations. V1 prose says collections are sorted, but
does not separate domain semantics from byte serialization or define duplicate
keys, number limits, Unicode edge cases, key ordering, array order, and hash
domain separation. The V1 replay fixture contains illustrative hashes that no
reducer produces.

## Options considered

- Use `JSON.stringify` directly: dependency-free, but leaves input ordering,
  invalid numeric values, duplicate keys, and cross-runtime rules unowned.
- Sort every array recursively: deterministic bytes, but corrupts collections
  whose order is semantically meaningful.
- Normalize declared domain semantics first, then use an RFC 8785-compatible
  byte serializer and a domain-separated hash envelope: explicit and reusable.

## Decision

Adopt canonical representation version `office-canonical-json-v1` and hash
envelope version `office-sha256-envelope-v1`.

The pipeline is ordered and cannot be collapsed:

```text
raw UTF-8 JSON bytes
-> duplicate-key rejecting loader
-> domain validation and semantic normalization
-> RFC 8785-compatible canonical UTF-8 serialization
-> SHA-256 of a domain/version envelope
```

The raw loader rejects duplicate object keys before a general JSON parser can
discard the duplicate. It also rejects malformed UTF-8, lone UTF-16 surrogates,
non-finite runtime numbers, integer tokens or values outside the JavaScript safe
integer range, and values the owning schema does not admit. Unicode spelling is
preserved; neither keys nor string values receive NFC or another normalization.

Before serialization, negative zero is normalized to positive zero. Domain
normalizers may stable-sort only collections whose owning contract explicitly
declares them unordered and supplies a total stable key. They preserve every
ordered collection. A missing declaration is treated as ordered. World,
simulation, and operations packages own their own semantic normalization rules;
the shared utility cannot infer order from field names or data shape.

The canonical serializer recursively orders object property names by UTF-16
code units, emits no insignificant whitespace, uses RFC 8785-compatible string
escaping and ECMAScript number serialization, preserves array order exactly,
and emits UTF-8 bytes. It performs no domain-specific reordering.

The hash input is the canonical serialization of this envelope:

```json
{
  "envelopeVersion": "office-sha256-envelope-v1",
  "canonicalizationVersion": "office-canonical-json-v1",
  "domain": "office-v2:<owning-domain>",
  "domainVersion": "<contract-or-projection-version>",
  "payload": {}
}
```

The lowercase hexadecimal SHA-256 digest covers the entire envelope, including
the envelope and canonicalization versions. Domain and domain version are
explicit nonempty contract values; the same payload under a different domain,
domain version, envelope version, or canonicalization version must hash
differently.

The raw loader, canonical byte serializer, envelope validator, and SHA-256
primitive belong to a shared pure contract utility under
`@affiliate-ops/office-v2-contracts`. Domain normalizers and hashable-state
projections remain with world, simulation, or operations. Presentation never
chooses or mutates hashable state.

The V1 schemas and `fixtures/deterministic-replay.json` remain frozen. Its
sample `aaaa...`, `bbbb...`, and `cccc...` strings are schema-shape placeholders,
not reducer or replay evidence. No V1 hash is promoted or migrated. W1.5 first
uses the shared primitive for canonical scene output; W2.2 later defines the
simulation hashable-state projection and produces hashes from the real reducer.

## Consequences

Input reorder can be distinguished from semantic reorder, and a byte digest is
portable across supported runtimes. Producers must parse raw bytes through the
duplicate-aware loader when canonical or hashed evidence is required. Ordinary
already-materialized JavaScript objects cannot prove absence of duplicate keys.

This decision does not implement a loader, serializer, normalizer, hasher,
scene compiler, reducer, replay runner, or new schema. Reducer/replay evidence
and property/model evidence remain zero.

## Evidence

`SIMULATION_TIME_RANDOMNESS_REPLAY.md`, `SAVE_SNAPSHOT_MIGRATION.md`, and
`MAP_AUTHORING_AND_IMPORT.md` own the canonical rules. W1.5 will add reference
vectors for duplicate keys, negative zero, lone surrogates, non-finite and
unsafe numbers, Unicode spelling, UTF-16 key order, ordered-array preservation,
declared unordered collections, cross-process bytes, domain separation, and
one-field hash changes. W2.2 adds independent reducer-state hash verification.

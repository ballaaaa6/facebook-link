# Scene Composition Grammar

## Purpose and ownership

This document owns the deterministic authoring rules for an Office V2 scene
plan. The scene-plan schema and compiler are W1.5 integration deliverables;
this document first fixes the serialization and collection-order vocabulary
that they must use.

The canonical representation versions are:

- office-canonical-json-v1 for canonical UTF-8 JSON bytes;
- office-sha256-envelope-v1 for domain-separated SHA-256 digests;
- scene-plan-v1 for the first scene-plan contract, once its schema is admitted.

The scene compiler consumes an editor-neutral scene plan and emits a
versioned, renderer-neutral world document. It never emits PNG references as
world truth, CSS offsets, renderer branches, character identity, or IDs
derived from array positions.

## Serialization pipeline

Every canonical or hashed scene artifact follows the same ordered pipeline:

    raw UTF-8 JSON bytes
      -> duplicate-key rejecting loader
      -> scene-plan schema and semantic validation
      -> declared collection normalization
      -> RFC 8785-compatible canonical UTF-8 bytes
      -> SHA-256 envelope for the owning domain and version

The shared contracts package owns the loader, canonical byte serializer, and
hash primitive. The scene compiler owns the semantic declarations that it
passes to the normalizer. A serializer never infers ordering from property
names, collection shape, or the fact that a field happens to contain IDs.

## Collection grammar

Every collection is ordered unless its owning contract declares otherwise.
An unordered declaration names:

- an RFC 6901 JSON pointer to the array;
- the unordered order kind;
- a pure total key function whose result is a unique, well-formed string for
  every member.

An ordered declaration may be recorded explicitly for review, but it does not
sort its array. A declaration that targets a missing value or non-array,
provides no total key, or produces duplicate keys is rejected. The normalizer
clones the input, preserves array member values, and never mutates authoring
input.

Example declaration:

    {
      "pointer": "/floors",
      "order": "unordered",
      "key": "floor-reference-key"
    }

The example records the rule; the executable key function remains code owned by
the scene/world contract and is not a user-provided string expression.
Ordered collections such as route steps, portal endpoints in a declared
traversal, and authored decoration sequences retain their input order. A
reorder of one of those collections is a semantic change and therefore changes
canonical bytes and the owning hash.

## Identity and reference rules

Scene members have stable typed IDs and positive versions. A member's identity
is authored independently from its location in an array. Compilers must reject
array-index-derived IDs, duplicate namespace/version keys, dangling references,
latest aliases, and a reference that changes kind or version during
normalization.

The compiler emits a complete reference graph so a report can identify every
source member, target member, version, and diagnostic. Reordering authoring
members may change source order, but it must not change the graph, canonical
world bytes, or canonical world hash when all semantic collections are
declared unordered.

## Hash domains

The digest input is the canonical serialization of this envelope:

    {
      "envelopeVersion": "office-sha256-envelope-v1",
      "canonicalizationVersion": "office-canonical-json-v1",
      "domain": "office-v2:scene",
      "domainVersion": "scene-plan-v1",
      "payload": {}
    }

The whole envelope is hashed, not only the payload. A change to the domain,
domain version, envelope version, canonicalization version, or one semantic
payload field must produce a different lowercase hexadecimal SHA-256 digest.
Unicode spelling is preserved without NFC normalization. Object keys use
UTF-16 code-unit order, negative zero becomes zero, arrays keep their order,
and unsafe numbers or lone surrogates fail before hashing.

## Evidence and migration boundary

W1.5 evidence must show duplicate-key, malformed UTF-8, negative-zero,
unsafe-number, lone-surrogate, UTF-16 key-order, ordered-array, declared
unordered-array, domain-separation, and one-field hash-change cases. Two clean
compilations of one semantic scene must produce identical bytes and hashes.

The V1 world shape and its historical fixtures remain frozen. A V1 input is
accepted only through the explicit building/floor/site/portal migration
context owned by W1.3. The scene compiler does not infer floor identity from
elevation, world IDs, array position, or a structure kind named floor.

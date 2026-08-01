import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CANONICAL_JSON_VERSION,
  SHA256_ENVELOPE_VERSION,
  canonicalHashBytes,
  canonicalHashHex,
  createCanonicalHashEnvelope,
  hashCanonicalJson,
  sha256Hex,
  type CanonicalHashOptions,
} from "./canonical-hash.ts";

const encoder = new TextEncoder();

test("produces the standard SHA-256 digest", () => {
  assert.equal(
    sha256Hex(encoder.encode("abc")),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
});

test("uses an explicit domain and version envelope", () => {
  const base: CanonicalHashOptions = {
    domain: "office-v2:scene",
    domainVersion: "scene-plan-v1",
    payload: { field: "same" },
  };
  const bytes = new TextDecoder().decode(canonicalHashBytes(base));
  assert.equal(
    bytes,
    '{"canonicalizationVersion":"office-canonical-json-v1","domain":"office-v2:scene","domainVersion":"scene-plan-v1","envelopeVersion":"office-sha256-envelope-v1","payload":{"field":"same"}}',
  );
  assert.deepEqual(createCanonicalHashEnvelope(base), {
    envelopeVersion: SHA256_ENVELOPE_VERSION,
    canonicalizationVersion: CANONICAL_JSON_VERSION,
    domain: "office-v2:scene",
    domainVersion: "scene-plan-v1",
    payload: { field: "same" },
  });
});

test("changes the digest for domain, version, and one-field semantic changes", () => {
  const base: CanonicalHashOptions = {
    domain: "office-v2:scene",
    domainVersion: "scene-plan-v1",
    payload: { field: "same", other: 1 },
  };
  const domainChange = { ...base, domain: "office-v2:simulation" };
  const versionChange = { ...base, domainVersion: "scene-plan-v2" };
  const fieldChange = { ...base, payload: { field: "changed", other: 1 } };
  const envelopeChange = { ...base, envelopeVersion: "office-sha256-envelope-v2" };
  const canonicalizationChange = { ...base, canonicalizationVersion: "office-canonical-json-v2" };
  const hashes = [
    canonicalHashHex(base),
    canonicalHashHex(domainChange),
    canonicalHashHex(versionChange),
    canonicalHashHex(fieldChange),
    canonicalHashHex(envelopeChange),
    canonicalHashHex(canonicalizationChange),
  ];
  assert.equal(new Set(hashes).size, hashes.length);
  assert.equal(hashCanonicalJson(base), hashes[0]);
});

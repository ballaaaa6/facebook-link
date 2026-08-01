import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CanonicalJsonError,
  canonicalJson,
  normalizeDeclaredCollections,
  parseJsonBytes,
  parseJsonText,
  type JsonObject,
  type JsonValue,
} from "./canonical-json.ts";

function assertCanonicalError(action: () => unknown, code: CanonicalJsonError["code"]): void {
  assert.throws(action, (error: unknown) => {
    if (!(error instanceof CanonicalJsonError)) return false;
    assert.equal(error.code, code);
    return true;
  });
}

function entryId(entry: JsonValue): string {
  if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
    throw new TypeError("expected an object collection entry");
  }
  const id = (entry as JsonObject).id;
  if (typeof id !== "string") throw new TypeError("expected a string collection id");
  return id;
}

test("rejects duplicate keys before materializing JSON", () => {
  assertCanonicalError(
    () => parseJsonText('{"answer": 1, "answer": 2}'),
    "contract.json-duplicate-key",
  );
  assertCanonicalError(
    () => parseJsonText('{"answer": 1, "\\u0061nswer": 2}'),
    "contract.json-duplicate-key",
  );
});

test("rejects malformed UTF-8, lone surrogates, and unsafe numbers", () => {
  assertCanonicalError(
    () => parseJsonBytes(new Uint8Array([0x22, 0xc3, 0x28, 0x22])),
    "contract.json-utf8-invalid",
  );
  assertCanonicalError(() => parseJsonText('"\\ud800"'), "contract.json-surrogate");
  assertCanonicalError(() => parseJsonText("9007199254740992"), "contract.json-number-unsafe");
  assertCanonicalError(() => parseJsonText("1e999"), "contract.json-number-unsafe");
});

test("normalizes negative zero and emits canonical UTF-8 JSON", () => {
  assert.equal(parseJsonText("-0"), 0);
  assert.equal(Object.is(parseJsonText("-0"), -0), false);
  assert.equal(canonicalJson({ negative: -0, small: 1e-7 }), '{"negative":0,"small":1e-7}');
  assertCanonicalError(() => canonicalJson({ value: Number.POSITIVE_INFINITY }), "contract.json-number-unsafe");
  assertCanonicalError(() => canonicalJson({ value: "\ud800" }), "contract.json-surrogate");
});

test("orders object keys by UTF-16 code units and preserves Unicode spelling", () => {
  const canonical = canonicalJson({ "\ue000": 1, "\u{10000}": 2, composed: "é", decomposed: "e\u0301" });
  assert.equal(canonical, '{"composed":"é","decomposed":"é","𐀀":2,"":1}');
  assert.notEqual(canonicalJson({ text: "é" }), canonicalJson({ text: "e\u0301" }));
});

test("preserves array order unless a collection is explicitly unordered", () => {
  const first = {
    items: [{ id: "b", value: 2 }, { id: "a", value: 1 }],
    ordered: ["second", "first"],
  } as JsonValue;
  const second = {
    items: [{ id: "a", value: 1 }, { id: "b", value: 2 }],
    ordered: ["first", "second"],
  } as JsonValue;
  const declarations = [
    { pointer: "/items", order: "unordered" as const, key: entryId },
    { pointer: "/ordered", order: "ordered" as const },
  ];
  const normalizedFirst = normalizeDeclaredCollections(first, declarations);
  const normalizedSecond = normalizeDeclaredCollections(second, declarations);
  assert.notEqual(canonicalJson(normalizedFirst), canonicalJson(normalizedSecond));
  assert.equal(canonicalJson((normalizedFirst as { items: JsonValue[] }).items), '[{"id":"a","value":1},{"id":"b","value":2}]');
  assert.equal(canonicalJson((normalizedFirst as { ordered: JsonValue[] }).ordered), '["second","first"]');
  assert.notEqual(canonicalJson(normalizeDeclaredCollections(first, [{ pointer: "/items", order: "ordered" }])), canonicalJson(normalizedSecond));
});

test("requires a total unique key for unordered collections", () => {
  const value = { items: [{ id: "same" }, { id: "same" }] } as JsonValue;
  assertCanonicalError(
    () => normalizeDeclaredCollections(value, [{ pointer: "/items", order: "unordered", key: entryId }]),
    "contract.collection-key-invalid",
  );
  assertCanonicalError(
    () => normalizeDeclaredCollections(value, [{ pointer: "/missing", order: "ordered" }]),
    "contract.collection-declaration-invalid",
  );
});

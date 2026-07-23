import assert from "node:assert/strict";
import test from "node:test";
import { encodeSubIds, sanitizeSubId } from "../src/index.ts";

test("removes unsupported Shopee Sub ID characters", () => {
  assert.equal(sanitizeSubId("page-01_evening"), "page01evening");
});

test("encodes the five stable attribution dimensions", () => {
  assert.deepEqual(
    encodeSubIds({ platform: "fb", account: "page01", placement: "feed", campaign: "evening", creative: "p123c02" }),
    ["fb", "page01", "feed", "evening", "p123c02"],
  );
});

test("rejects an empty normalized value", () => {
  assert.throws(() => sanitizeSubId("---"), /at least one ASCII/);
});

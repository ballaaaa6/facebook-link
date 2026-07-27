import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  validateOfficeDerivedAssetManifest,
  type OfficeDerivedAssetManifest,
} from "../src/officeDerivedAssets.ts";

const manifest = JSON.parse(readFileSync(new URL(
  "../../../assets/game/manifests/office-derived-assets-v1.json",
  import.meta.url,
), "utf8")) as OfficeDerivedAssetManifest;

test("all four derivation waves remain staging-only", () => {
  assert.deepEqual(validateOfficeDerivedAssetManifest(manifest), []);
  assert.equal(manifest.status, "accepted-staging");
  assert.equal(manifest.activeOfficePromotion, false);
  assert.deepEqual(manifest.counts.byWave, {
    "step-13": 24,
    "step-14": 40,
    "step-15": 6,
    "step-16": 7,
  });
});

test("the audit resolution covers 77 unique records", () => {
  assert.equal(manifest.records.length, 77);
  assert.equal(new Set(manifest.records.map(({ recordId }) => recordId)).size, 77);
  assert.equal(manifest.counts.cleanup, 64);
  assert.equal(manifest.counts.composites, 13);
});

test("composite records include valid Geometry v3 metadata", () => {
  const composites = manifest.records.filter(({ operation }) => operation.endsWith("composite"));
  assert.equal(composites.length, 13);
  assert.ok(composites.every(({ geometry }) => geometry !== null));
  assert.ok(composites.every(({ outputs }) => outputs.some(({ role }) => role === "base")));
});

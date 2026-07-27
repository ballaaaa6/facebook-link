import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { validateOfficeDerivedAssetManifest, type OfficeDerivedAssetManifest } from "@affiliate-ops/contracts";

const manifestUrl = new URL("../../../assets/game/manifests/office-derived-assets-v1.json", import.meta.url);
const manifest = JSON.parse(readFileSync(manifestUrl, "utf8")) as OfficeDerivedAssetManifest;

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

test("derived Office waves resolve the audit without Active Office promotion", () => {
  assert.deepEqual(validateOfficeDerivedAssetManifest(manifest), []);
  assert.equal(manifest.records.length, 77);
  assert.equal(manifest.activeOfficePromotion, false);
  assert.equal(manifest.records.filter(({ geometry }) => geometry !== null).length, 13);
});

test("all versioned outputs and QA boards exist", () => {
  for (const record of manifest.records) {
    for (const output of record.outputs) {
      assert.ok(existsSync(new URL(`../../../${output.file}`, import.meta.url)), output.file);
    }
  }
  for (const board of Object.values(manifest.qa)) {
    assert.ok(existsSync(new URL(`../../../${board}`, import.meta.url)), board);
  }
});

test("the derivation lab is development-only and the active registry stays isolated", () => {
  assert.match(source("../src/main.tsx"), /requestedLab === "office-derived-v1"/);
  assert.match(source("../src/features/office/lab/OfficeDerivedAssetsLabPage.tsx"), /Active Office imports disabled/);
  assert.equal(source("../src/features/office/components/officeAssetRegistry.ts").includes("office-derived-v1"), false);
});

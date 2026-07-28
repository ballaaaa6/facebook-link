import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  validateOfficeSemanticGridV2,
  type OfficeSemanticGridV2Manifest,
  type OfficeSemanticGridV2Map,
} from "../src/index.ts";

const root = join(import.meta.dirname, "../../..");
const readJson = <T>(path: string) => JSON.parse(readFileSync(join(root, path), "utf8")) as T;
const hash = (path: string) => createHash("sha256").update(readFileSync(join(root, path))).digest("hex");
const map = readJson<OfficeSemanticGridV2Map>("assets/game/maps/office-semantic-grid-v2.json");
const manifest = readJson<OfficeSemanticGridV2Manifest>("assets/game/manifests/office-semantic-grid-v2.json");

test("semantic grid classifies every cell without floor-pillar overlap", () => {
  assert.deepEqual(validateOfficeSemanticGridV2(manifest, map), []);
  assert.equal(Object.keys(map.cellAssignments).length, 1032);
  assert.equal(map.cellAssignments.A1, "pillar-left");
  assert.equal(map.cellAssignments.AB11, "pillar-center");
  assert.equal(map.cellAssignments.AP11, "pillar-right");
});

test("owner changes restore one wall column and remove the floor buffer", () => {
  assert.equal(map.physicalEdits.window.newCells, "N4-Z9");
  assert.equal(map.cellAssignments.AA4, "office-wall");
  assert.equal(map.cellAssignments.AB12, "relax-floor");
  assert.equal(map.cellAssignments.AB24, "relax-floor");
  assert.equal(map.physicalEdits.floor.newBoundaryX, 1050);
});

test("candidate and evidence are hash-locked while Active Office stays unchanged", () => {
  assert.equal(hash(map.sourceBackground.file), map.sourceBackground.sha256);
  assert.equal(hash(map.candidateBackground.file), map.candidateBackground.sha256);
  assert.equal(hash(map.activeOfficeBaseline.file), map.activeOfficeBaseline.sha256);
  assert.equal(hash(manifest.map.file), manifest.map.sha256);
  for (const output of manifest.reviewOutputs) {
    assert.equal(existsSync(join(root, output.file)), true);
    assert.equal(hash(output.file), output.sha256);
  }
  for (const evidence of manifest.ownerEvidence) {
    assert.equal(existsSync(join(root, evidence.file)), true);
    assert.equal(hash(evidence.file), evidence.sha256);
  }
  assert.equal(map.activeOfficePromotion, false);
  assert.equal(manifest.permissions.activeOfficePromotion, false);
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  validateOfficeMapV2,
  type OfficeMapV2,
  type OfficeWorkstationDeploymentManifestV1,
} from "@affiliate-ops/contracts";

function readJson(relative: string) {
  return JSON.parse(readFileSync(new URL(relative, import.meta.url), "utf8"));
}

const map = readJson("../../../assets/game/maps/office-ten-v1.json") as OfficeMapV2;
const presets = readJson(
  "../../../assets/game/manifests/office-workstation-deployment-v1.json",
) as OfficeWorkstationDeploymentManifestV1;
const activeMapSource = readFileSync(new URL(
  "../../../assets/game/maps/office-c-v2.json",
  import.meta.url,
), "utf8");
const activeRegistrySource = readFileSync(new URL(
  "../src/features/office/components/officeAssetRegistry.ts",
  import.meta.url,
), "utf8");

const expectedAgents = [
  "market-scout",
  "product-ranker",
  "growth-strategist",
  "performance-analyst",
  "gemini-copywriter",
  "flow-visual-producer",
  "link-attribution",
  "qa-editor",
  "publisher",
  "session-keeper",
];

function overlaps(
  left: { x: number; y: number; width: number; depth: number },
  right: { x: number; y: number; width: number; depth: number },
) {
  return left.x < right.x + right.width && left.x + left.width > right.x
    && left.y < right.y + right.depth && left.y + left.depth > right.y;
}

test("the ten-workstation staging map passes its structural contract", () => {
  assert.deepEqual(validateOfficeMapV2(map), []);
  assert.equal(map.schemaVersion, 2);
  assert.equal(map.status, "accepted-staging");
  assert.equal(map.activeOfficePromotion, false);
  assert.deepEqual(map.grid, { width: 29, height: 20, tilePixels: 32 });
});

test("the exact pilot roster maps to seven Standard, two Creative, and one NOC station", () => {
  assert.equal(map.workstationDeployments.length, 10);
  assert.deepEqual(map.workstationDeployments.map(({ agentId }) => agentId), expectedAgents);
  assert.equal(new Set(map.workstationDeployments.map(({ agentId }) => agentId)).size, 10);
  assert.deepEqual(
    Map.groupBy(map.workstationDeployments, ({ role }) => role),
    new Map([
      ["standard", map.workstationDeployments.filter(({ role }) => role === "standard")],
      ["creative", map.workstationDeployments.filter(({ role }) => role === "creative")],
      ["noc", map.workstationDeployments.filter(({ role }) => role === "noc")],
    ]),
  );
  assert.equal(map.workstationDeployments.filter(({ role }) => role === "standard").length, 7);
  assert.equal(map.workstationDeployments.filter(({ role }) => role === "creative").length, 2);
  assert.equal(map.workstationDeployments.filter(({ role }) => role === "noc").length, 1);
});

test("two five-station rows touch horizontally and vertically without overlap", () => {
  const [far, near] = [
    map.workstationDeployments.slice(0, 5),
    map.workstationDeployments.slice(5),
  ];
  for (const row of [far, near]) {
    assert.deepEqual(row.map(({ footprint }) => footprint.x), [2, 7, 12, 17, 22]);
    for (let index = 1; index < row.length; index += 1) {
      assert.equal(row[index - 1]!.footprint.x + 5, row[index]!.footprint.x);
    }
  }
  for (const station of map.workstationDeployments) {
    assert.equal(station.footprint.width, 5);
    assert.equal(station.footprint.depth, 4);
    assert.equal(station.supportPlane.width, 5);
    assert.equal(station.supportPlane.depth, 3);
  }
  for (let left = 0; left < map.workstationDeployments.length; left += 1) {
    for (let right = left + 1; right < map.workstationDeployments.length; right += 1) {
      assert.equal(overlaps(map.workstationDeployments[left]!.footprint, map.workstationDeployments[right]!.footprint), false);
    }
  }
  assert.equal(far[0]!.footprint.y + 4, near[0]!.footprint.y);
});

test("seats stay outside desks and every deployment preset owns monitor and keyboard equipment", () => {
  const presetById = new Map(presets.presets.map((preset) => [preset.id, preset]));
  for (const station of map.workstationDeployments) {
    assert.equal(overlaps(station.footprint, station.seat), false);
    const preset = presetById.get(station.presetId);
    assert.ok(preset);
    assert.equal(preset.role, station.role);
    assert.ok(preset.equipment.some(({ kind }) => kind === "monitor-shell"));
    assert.ok(preset.equipment.some(({ kind }) => kind === "keyboard"));
  }
});

test("rejected desks and staging identifiers remain isolated from Active Office", () => {
  const stagingSource = JSON.stringify(map);
  assert.equal(stagingSource.includes("viewer-front.v5"), false);
  assert.equal(stagingSource.includes("viewer-back.v5"), false);
  assert.equal(stagingSource.includes(".v6"), false);
  assert.equal(activeMapSource.includes("staging-station-"), false);
  assert.equal(activeRegistrySource.includes("desk.modular.v1"), false);
  assert.equal(activeRegistrySource.includes("office-ten-v1"), false);
});

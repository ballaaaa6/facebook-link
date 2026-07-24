import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  resolveOfficeLayout,
  validateOfficeLayout,
} from "../src/features/office/layout/officeLayout.ts";
import type { OfficeMapDefinition } from "../src/features/office/officeTypes.ts";

interface GeometryManifest {
  assets: Parameters<typeof resolveOfficeLayout>[1];
  slotSets: Parameters<typeof resolveOfficeLayout>[2];
}

const map = JSON.parse(
  readFileSync(new URL("../../../assets/game/maps/office-c-v1.json", import.meta.url), "utf8"),
) as OfficeMapDefinition;
const geometry = JSON.parse(
  readFileSync(new URL("../../../assets/game/manifests/office-assets.json", import.meta.url), "utf8"),
) as GeometryManifest;

test("the Office C map has no occupancy or support violations", () => {
  const resolved = resolveOfficeLayout(map, geometry.assets, geometry.slotSets);
  assert.deepEqual(validateOfficeLayout(map, geometry.assets, resolved), []);
});

test("surface slots cannot be claimed twice", () => {
  const duplicate = structuredClone(map);
  duplicate.objects.push({
    id: "duplicate-monitor",
    asset: "monitor.front.active",
    parentId: "market-scout",
    slot: "desk-rear-center",
    layer: "equipment",
    anchor: "bottom-center",
  });
  const resolved = resolveOfficeLayout(duplicate, geometry.assets, geometry.slotSets);
  assert.ok(resolved.issues.some((issue) => issue.includes("parent slot already occupied")));
});

test("floor footprints cannot overlap", () => {
  const overlapping = structuredClone(map);
  const plant = overlapping.objects.find((object) => object.id === "creative-plant-tall");
  assert.ok(plant);
  plant.x = 15.5;
  plant.y = 8.8;
  const resolved = resolveOfficeLayout(overlapping, geometry.assets, geometry.slotSets);
  const issues = validateOfficeLayout(overlapping, geometry.assets, resolved);
  assert.ok(issues.some((issue) => issue.includes("creative-cabinet overlaps creative-plant-tall")));
});

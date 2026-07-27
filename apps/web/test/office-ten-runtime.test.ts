import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import type {
  DoorOpening,
  OfficeMapV2,
  WallSegment,
  WindowOpening,
} from "@affiliate-ops/contracts";
import { screenFrameAt } from "../src/features/office/workstation/workstationBundleRuntime.ts";
import {
  openingWorldBounds,
  portalStatus,
  structurePercentRect,
  windowViewportWorldBounds,
} from "../src/features/office/structure/structuralSceneRuntime.ts";

function source(relative: string) {
  return readFileSync(new URL(relative, import.meta.url), "utf8");
}

const map = JSON.parse(source("../../../assets/game/maps/office-ten-v1.json")) as OfficeMapV2;
const wall = map.structures.find((item): item is WallSegment => item.kind === "wall-segment");
const window = map.structures.find((item): item is WindowOpening => item.kind === "window-opening");
const door = map.structures.find((item): item is DoorOpening => item.kind === "door-opening");

test("window content stays viewport-local across deterministic stage scales", () => {
  assert.ok(wall && window);
  assert.equal(window.viewport.coordinateSpace, "viewport-local");
  assert.deepEqual(openingWorldBounds(window, wall), { x: 7, y: 0.5, width: 14, height: 2.75 });
  const viewport = windowViewportWorldBounds(window, wall);
  assert.deepEqual(viewport, { x: 7.25, y: 0.75, width: 13.5, height: 2.25 });
  assert.deepEqual(structurePercentRect(viewport, map.grid), {
    left: "25%",
    top: "3.75%",
    width: "46.55172413793103%",
    height: "11.25%",
  });
});

test("door leaf state deterministically controls the semantic portal", () => {
  assert.ok(door);
  assert.equal(door.floorYSort, false);
  assert.equal(portalStatus("closed"), "blocked");
  assert.equal(portalStatus("open"), "passable");
  assert.deepEqual(map.portals[0]!.statePolicy, { open: "passable", closed: "blocked" });
});

test("the structural renderer has no monolithic Office backdrop dependency", () => {
  const layerSource = source("../src/features/office/structure/OfficeStructureLayer.tsx");
  const assetSource = source("../src/features/office/structure/structuralSceneAssets.ts");
  assert.equal(layerSource.includes("OfficeBackdrop"), false);
  assert.equal(layerSource.includes("officeSceneReference"), false);
  assert.equal(assetSource.includes("office-c-background-modern-v3"), false);
  assert.equal((assetSource.match(/office-window-/g) ?? []).length, 16);
});

test("ten workstations consume one shared clock with no per-station interval", () => {
  const compositeSource = source("../src/features/office/workstation/GeometryWorkstationComposite.tsx");
  const deploymentSource = source("../src/features/office/workstation/WorkstationDeployment.tsx");
  const pageSource = source("../src/features/office/lab/OfficeTenWorkstationLabPage.tsx");
  const clockSource = source("../src/features/office/workstation/useSceneClock.ts");
  assert.equal(compositeSource.includes("setInterval"), false);
  assert.equal(deploymentSource.includes("setInterval"), false);
  assert.equal((pageSource.match(/useSceneClock\(/g) ?? []).length, 1);
  assert.equal((clockSource.match(/setInterval\(/g) ?? []).length, 1);
  for (let elapsedMs = 0; elapsedMs <= 60_000; elapsedMs += 100) {
    assert.equal(screenFrameAt(elapsedMs, 500, 4), Math.floor(elapsedMs / 500) % 4);
  }
});

test("the lab route remains development-only and preserves older fixtures", () => {
  const mainSource = source("../src/main.tsx");
  assert.match(mainSource, /import\.meta\.env\.DEV/);
  assert.match(mainSource, /office-ten-v1/);
  assert.match(mainSource, /workstation-v1/);
  assert.match(mainSource, /office-layout/);
  assert.equal(map.activeOfficePromotion, false);
  assert.equal(map.commercialCharacterApproval, false);
});

test("door provenance retains the original asset without overwriting it", () => {
  const manifest = JSON.parse(source(
    "../../../assets/game/manifests/office-structural-assets-v1.json",
  ));
  assert.equal(manifest.provenance.originalDoorOverwritten, false);
  assert.equal(manifest.provenance.backgroundBitmapImported, false);
  assert.equal(manifest.provenance.windowVariantCount, 16);
  assert.equal(
    manifest.assets["door.closed.leaf.v1"].source,
    "assets/game/processed/decor-mechanical-c-v1/door.closed.png",
  );
});

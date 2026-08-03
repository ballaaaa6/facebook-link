import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as fc from "fast-check";
import { fitCameraToWorld, projectCameraPosition } from "../apps/web/src/features/office-v2/renderer/camera.ts";
import { buildSyntheticScene } from "../apps/web/src/features/office-v2/renderer/candidate-scene.ts";
import { createFixtureSnapshot, LAB_BOUNDS, LAB_FLOOR } from "../apps/web/src/features/office-v2/renderer/lab-fixture.ts";
import { pickSemanticEntity } from "../apps/web/src/features/office-v2/renderer/semantic-picking.ts";
import { RendererLifecycle } from "../apps/web/src/features/office-v2/renderer/lifecycle.ts";
import { createPresentationSnapshot } from "../apps/web/src/features/office-v2/renderer/presentation-snapshot.ts";

export const PROPERTY_MODEL_PROFILE = Object.freeze({
  schemaVersion: "office-property-model-profile-v1",
  randomType: "xorshift128plus",
  ciSeed: 20260801,
  ciRuns: 100,
  explorationRuns: 1000,
  shrinkPath: "retain-in-failure-artifact",
  counterexamplePromotion: "minimized-failure-becomes-versioned-fixture",
});

const ACTOR_COUNTS = [1, 10, 15, 25, 50];
const VIEWPORTS = Object.freeze([{ width: 1440, height: 900 }, { width: 1024, height: 768 }, { width: 390, height: 844 }]);
const DEPTH_BAND_RANK = Object.freeze({ floor: 0, ground: 1, world: 2, upper: 3, effect: 4, ui: 5 });
const LIFECYCLE_EVENTS = ["mount", "show", "hide", "pagehide", "pageshow", "bfcache-restore", "unmount-during-load", "teardown", "remount", "context-lost", "context-restored"];
const LIFECYCLE_MODEL = Object.freeze({
  mount: { mounted: "mounted", visible: "visible", hidden: "hidden", restoring: "restoring", destroyed: "mounted" },
  show: { mounted: "visible", visible: "visible", hidden: "visible", restoring: "visible", destroyed: null },
  hide: { mounted: "hidden", visible: "hidden", hidden: "hidden", restoring: "hidden", destroyed: null },
  pagehide: { mounted: "hidden", visible: "hidden", hidden: "hidden", restoring: "hidden", destroyed: null },
  pageshow: { mounted: "restoring", visible: "restoring", hidden: "restoring", restoring: "restoring", destroyed: null },
  "bfcache-restore": { mounted: "visible", visible: "visible", hidden: "visible", restoring: "visible", destroyed: null },
  "unmount-during-load": { mounted: "destroyed", visible: "destroyed", hidden: "destroyed", restoring: "destroyed", destroyed: "destroyed" },
  teardown: { mounted: "destroyed", visible: "destroyed", hidden: "destroyed", restoring: "destroyed", destroyed: "destroyed" },
  remount: { mounted: null, visible: null, hidden: null, restoring: null, destroyed: "mounted" },
  "context-lost": { mounted: "restoring", visible: "restoring", hidden: "restoring", restoring: "restoring", destroyed: null },
  "context-restored": { mounted: "visible", visible: "visible", hidden: "visible", restoring: "visible", destroyed: null },
});

function compareText(left, right) {
  const length = Math.min(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const difference = left.charCodeAt(index) - right.charCodeAt(index);
    if (difference !== 0) return difference;
  }
  return left.length - right.length;
}

function modelDepthOrder(snapshot, camera) {
  return snapshot.entities.map((entity) => {
    const projected = projectCameraPosition(camera, entity.transform.position);
    return {
      id: entity.entityId.value,
      groundX: projected.groundContact.xPx,
      groundY: projected.groundContact.yPx,
      elevation: entity.transform.position.coordinate.elevation,
      bandRank: DEPTH_BAND_RANK.world,
      owner: entity.entityId.value,
    };
  }).sort((left, right) => left.bandRank - right.bandRank
    || left.groundY - right.groundY
    || left.groundX - right.groundX
    || left.elevation - right.elevation
    || compareText(left.owner, right.owner)
    || compareText(left.id, right.id)).map((entry) => entry.id);
}

function modelPick(snapshot, camera, point) {
  return snapshot.entities.map((entity) => {
    const projected = projectCameraPosition(camera, entity.transform.position);
    const distanceSquared = ((projected.groundContact.xPx - point.xPx) ** 2) + ((projected.groundContact.yPx - point.yPx) ** 2);
    return { entityId: entity.entityId.value, distanceSquared, groundX: projected.groundContact.xPx, groundY: projected.groundContact.yPx, elevation: entity.transform.position.coordinate.elevation };
  }).filter((candidate) => candidate.distanceSquared <= 24 ** 2).sort((left, right) => left.groundY - right.groundY || left.groundX - right.groundX || left.elevation - right.elevation || compareText(left.entityId, right.entityId)).at(-1)?.entityId ?? null;
}

function snapshotWithOrder(snapshot, order) {
  return createPresentationSnapshot({ ...snapshot, entities: order.map((index) => snapshot.entities[index]) });
}

function depthAndPickingProperty() {
  const input = fc.record({
    actorCount: fc.constantFrom(...ACTOR_COUNTS),
    viewport: fc.constantFrom(...VIEWPORTS),
    targetIndex: fc.integer({ min: 0, max: 49 }),
    shuffleKeys: fc.array(fc.integer({ min: 0, max: 1_000_000 }), { minLength: 50, maxLength: 50 }),
  });
  return fc.property(input, ({ actorCount, viewport, targetIndex, shuffleKeys }) => {
    const snapshot = createFixtureSnapshot(actorCount, 0);
    const camera = fitCameraToWorld(LAB_FLOOR, LAB_BOUNDS, viewport);
    const order = snapshot.entities.map((_, index) => index).sort((left, right) => shuffleKeys[left] - shuffleKeys[right] || left - right);
    const shuffled = snapshotWithOrder(snapshot, order);
    const originalScene = buildSyntheticScene(snapshot, camera);
    const shuffledScene = buildSyntheticScene(shuffled, camera);
    const originalIds = originalScene.commands.filter((command) => command.kind === "entity").map((command) => command.entityId);
    const shuffledIds = shuffledScene.commands.filter((command) => command.kind === "entity").map((command) => command.entityId);
    assert.deepEqual(originalIds, modelDepthOrder(snapshot, camera));
    assert.deepEqual(shuffledIds, originalIds);
    assert.equal(shuffledScene.sceneHash, originalScene.sceneHash);
    const target = snapshot.entities[targetIndex % actorCount];
    assert.ok(target);
    const point = projectCameraPosition(camera, target.transform.position).groundContact;
    const expected = modelPick(snapshot, camera, point);
    assert.equal(pickSemanticEntity(shuffled, camera, point)?.entityId ?? null, expected);
  });
}

function lifecycleModelProperty() {
  const events = fc.array(fc.constantFrom(...LIFECYCLE_EVENTS), { minLength: 1, maxLength: 64 });
  return fc.property(events, (sequence) => {
    const lifecycle = new RendererLifecycle();
    lifecycle.transition("mount");
    lifecycle.transition("show");
    const releaseListener = lifecycle.trackResource("listeners");
    const settleLoad = lifecycle.beginLoad();
    const releaseHandle = lifecycle.trackResourceHandle();
    let state = "visible";
    for (const event of sequence) {
      const expected = LIFECYCLE_MODEL[event][state];
      if (expected === null) {
        assert.throws(() => lifecycle.transition(event), /presentation\.lifecycle-invalid/);
      } else {
        assert.equal(lifecycle.transition(event), expected);
        state = expected;
      }
    }
    const expectedFinal = LIFECYCLE_MODEL.teardown[state];
    assert.equal(expectedFinal, "destroyed");
    assert.equal(lifecycle.transition("teardown"), expectedFinal);
    releaseListener();
    settleLoad();
    releaseHandle();
    const snapshot = lifecycle.snapshot();
    assert.equal(snapshot.state, "destroyed");
    assert.equal(snapshot.pendingLoads, 0);
    assert.equal(snapshot.listeners, 0);
    assert.equal(snapshot.resourceHandles, 0);
  });
}

function runProperty(name, property, runs) {
  try {
    fc.assert(property, { seed: PROPERTY_MODEL_PROFILE.ciSeed, numRuns: runs, endOnFailure: true });
    return Object.freeze({ name, passed: true, runs });
  } catch (error) {
    return Object.freeze({ name, passed: false, runs, error: error instanceof Error ? error.message : String(error) });
  }
}

export function runPropertySuite(runs = PROPERTY_MODEL_PROFILE.ciRuns) {
  const results = [
    runProperty("depth-and-semantic-picking-model", depthAndPickingProperty(), runs),
    runProperty("renderer-lifecycle-model", lifecycleModelProperty(), runs),
  ];
  return Object.freeze({ passed: results.every((result) => result.passed), runs, results: Object.freeze(results) });
}

function parseRuns(argv) {
  const index = argv.indexOf("--runs");
  return index >= 0 ? Number(argv[index + 1]) : PROPERTY_MODEL_PROFILE.explorationRuns;
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const runs = parseRuns(process.argv.slice(2));
  const evidence = runPropertySuite(runs);
  const report = {
    schemaVersion: "office-property-model-evidence-v1",
    sourceRevision: process.env.SOURCE_REVISION ?? "unprovided",
    profile: PROPERTY_MODEL_PROFILE,
    library: { name: "fast-check", version: "4.9.0", license: "MIT", admitted: true },
    models: [
      { kind: "depth", reference: "independent-depth-sort-model-v1", independent: true },
      { kind: "picking", reference: "independent-semantic-picking-model-v1", independent: true },
      { kind: "lifecycle", reference: "independent-renderer-lifecycle-model-v1", independent: true },
    ],
    evidence: [runPropertySuite(PROPERTY_MODEL_PROFILE.ciRuns), evidence],
  };
  const output = resolve(root, "artifacts/office-v2/phase4/property-model-evidence.json");
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ output, passed: evidence.passed, runs, results: evidence.results }));
  if (!evidence.passed) process.exitCode = 1;
}

import assert from "node:assert/strict";
import test from "node:test";
import interactionAssets from "../../../assets/game/manifests/office-interaction-assets.json" with { type: "json" };
import {
  characterRows15,
  facilityPropPools,
  facilityVerticalSlice,
  heldPropAtInteractFrame,
  heldPropIds,
  interactFrontHandAnchors1x,
  selectHeldProp,
} from "../src/features/office/interactions/officeInteractionContract.ts";

test("Einstein has a complete 8x15 staging atlas contract", () => {
  assert.equal(interactionAssets.einstein.rows, 15);
  assert.equal(interactionAssets.einstein.columns, 8);
  assert.deepEqual(interactionAssets.einstein.size1x, [768, 1560]);
  assert.deepEqual(interactionAssets.einstein.size2x, [1536, 3120]);
  assert.deepEqual(
    interactionAssets.einstein.extensionRows.map(({ name, activeFrames }) => [name, activeFrames]),
    [
      ["working-back", 6],
      ["interact-front", 6],
      ["inspect-front", 6],
      ["lounge-front", 6],
      ["working-back-seated", 6],
      ["working-front-seated", 6],
    ],
  );
  assert.equal(characterRows15["working-front-seated"], 14);
});

test("the held-prop sheet extracts all 16 declared items", () => {
  assert.equal(interactionAssets.heldProps.count, 16);
  assert.equal(interactionAssets.heldProps.assets.length, 16);
  assert.deepEqual(
    new Set(interactionAssets.heldProps.assets.map(({ id }) => id)),
    new Set(heldPropIds),
  );
});

test("prop selection is deterministic for an entire visit", () => {
  const selection = {
    agentId: "product-ranker",
    facilitySlotId: "water.01",
    visitIndex: 4,
    facility: "water" as const,
  };
  const chosen = selectHeldProp(selection);
  for (let render = 0; render < 20; render += 1) {
    assert.equal(selectHeldProp(selection), chosen);
  }
});

test("a repeated visit can exclude the previous result", () => {
  const first = selectHeldProp({
    agentId: "product-ranker",
    facilitySlotId: "printer.01",
    visitIndex: 1,
    facility: "printer",
  });
  const second = selectHeldProp({
    agentId: "product-ranker",
    facilitySlotId: "printer.01",
    visitIndex: 2,
    facility: "printer",
    previous: first,
  });
  assert.notEqual(second, first);
});

test("props appear only during frames three through five", () => {
  assert.deepEqual(
    Array.from({ length: 6 }, (_, frame) =>
      heldPropAtInteractFrame("held.water-cup-clear", frame)),
    [null, null, "held.water-cup-clear", "held.water-cup-clear", "held.water-cup-clear", null],
  );
  assert.equal(interactFrontHandAnchors1x.length, 6);
});

test("the eight staging interactions declare action, duration, pool, and overlay policy", () => {
  assert.equal(Object.keys(facilityVerticalSlice).length, 8);
  for (const contract of Object.values(facilityVerticalSlice)) {
    assert.ok(contract.durationSeconds > 0);
    assert.ok(contract.propPool in facilityPropPools);
    assert.ok(contract.action in characterRows15);
  }
  assert.deepEqual(facilityPropPools.arcade, [null]);
  assert.ok(facilityPropPools["server-rack"].includes(null));
});

test("all five foreground masks were derived and recorded", () => {
  assert.equal(interactionAssets.foregroundMasks.count, 5);
  assert.equal(interactionAssets.foregroundMasks.assets.length, 5);
  for (const mask of interactionAssets.foregroundMasks.assets) {
    assert.ok(mask.bounds);
    assert.ok(mask.regions.length > 0);
  }
});

test("vending uses an item-neutral output tray before prop overlay", () => {
  const overlay = interactionAssets.facilityOverlays.vendingItemNeutral;
  assert.equal(overlay.frames.length, 4);
  assert.match(overlay.frames[3]!, /item-neutral\.d\.png$/);
  assert.deepEqual(overlay.outputAnchor, { x: 0.5, y: 0.78 });
  assert.match(overlay.policy, /frame d reuses the empty open tray/i);
});

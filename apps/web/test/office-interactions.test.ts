import assert from "node:assert/strict";
import test from "node:test";
import interactionAssets from "../../../assets/game/manifests/office-interaction-assets.json" with { type: "json" };
import interactionLab from "../../../assets/game/manifests/office-interaction-lab.json" with { type: "json" };
import reviewFacility from "../../../assets/game/manifests/review-facility-completion.json" with { type: "json" };
import {
  characterRows15,
  facilityPropPools,
  facilityVisitAt,
  facilityVerticalSlice,
  heldPropAtInteractFrame,
  heldPropIds,
  interactFrontHandAnchors1x,
  selectHeldProp,
} from "../src/features/office/interactions/officeInteractionContract.ts";
import { reviewTableModernContract } from "../src/features/office/interactions/reviewTableContract.ts";

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
    assert.equal(contract.interactionFacing, "front");
    assert.ok(contract.renderBoxTiles.width > 0);
    assert.ok(contract.renderBoxTiles.height > 0);
    assert.ok(Number.isInteger(contract.approach.x));
    assert.ok(Number.isInteger(contract.approach.y));
  }
  assert.deepEqual(facilityPropPools.arcade, [null]);
  assert.ok(facilityPropPools["server-rack"].includes(null));
});

test("an isolated facility visit holds and then releases its reservation", () => {
  const contract = facilityVerticalSlice.water!;
  assert.deepEqual(facilityVisitAt(0, contract), {
    phase: "approaching",
    reservationHeld: true,
    interactionFrame: null,
  });
  assert.equal(facilityVisitAt(1, contract).interactionFrame, 0);
  assert.equal(facilityVisitAt(6.9, contract).interactionFrame, 5);
  assert.deepEqual(facilityVisitAt(7.5, contract), {
    phase: "departing",
    reservationHeld: true,
    interactionFrame: null,
  });
  assert.deepEqual(facilityVisitAt(8, contract), {
    phase: "complete",
    reservationHeld: false,
    interactionFrame: null,
  });
});

test("the isolated eight-facility composition lab passes runtime-scale geometry", () => {
  assert.equal(interactionLab.scope, "isolated-staging-only");
  assert.equal(interactionLab.activeOfficeImported, false);
  assert.equal(interactionLab.caseCount, 8);
  assert.equal(interactionLab.allGeometryPass, true);
  assert.ok(interactionLab.cases.every(({ geometryPass }) => geometryPass));
  assert.equal(
    interactionLab.cases.find(({ id }) => id === "printer")?.support?.includes("cabinet.storage.low"),
    true,
  );
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

test("the new review table replaces the old meeting table in staging", () => {
  assert.equal(facilityVerticalSlice.review?.assetId, "table.review.long.modern");
  assert.equal(facilityVerticalSlice.review?.reservationCapacity, 4);
  assert.deepEqual(facilityVerticalSlice.review?.renderBoxTiles, { width: 4, height: 1 });
  assert.notEqual(facilityVerticalSlice.review?.assetId, "table.meeting.empty");
});

test("the four-seat review contract uses only front and back seated rows", () => {
  assert.equal(reviewTableModernContract.reservationCapacity, 4);
  assert.equal(reviewTableModernContract.seats.length, 4);
  assert.deepEqual(
    reviewTableModernContract.seats.map(({ action }) => action),
    [
      "working-front-seated",
      "working-front-seated",
      "working-back-seated",
      "working-back-seated",
    ],
  );
  assert.equal(
    new Set(reviewTableModernContract.seats.map(({ id }) => id)).size,
    4,
  );
  assert.equal(
    new Set(reviewTableModernContract.seats.map(({ seat }) => `${seat.x}:${seat.y}`)).size,
    4,
  );
});

test("the review completion sheet extracts 16 useful runtime cells", () => {
  assert.equal(reviewFacility.activeOfficeImported, false);
  assert.deepEqual(reviewFacility.grid, [4, 4]);
  assert.equal(reviewFacility.assetCount, 16);
  assert.equal(reviewFacility.assets.length, 16);
  assert.equal(reviewFacility.reviewFacility.reservationCapacity, 4);
  assert.equal(reviewFacility.qa.allFourActors, true);
  for (const group of [
    "printer.neutral",
    "dispenser.water.neutral",
    "machine.coffee.neutral",
  ]) {
    assert.equal(
      reviewFacility.assets.filter((asset) => asset.animationGroup === group).length,
      4,
    );
  }
});

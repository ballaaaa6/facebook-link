import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import type { RoomTemplateDocument } from "@affiliate-ops/office-v2-contracts";
import {
  roomTemplateFingerprint,
  validateRoomTemplate,
} from "../src/index.ts";

function readRoomTemplate(): RoomTemplateDocument {
  return JSON.parse(readFileSync(new URL("../../../docs/office-v2/fixtures/room-template-ground-floor.json", import.meta.url), "utf8")) as RoomTemplateDocument;
}

function cloneRoomTemplate(): RoomTemplateDocument {
  return structuredClone(readRoomTemplate());
}

function hasCode(document: RoomTemplateDocument, code: string): boolean {
  return validateRoomTemplate(document).diagnostics.some((diagnostic) => diagnostic.code === code);
}

test("valid ground-floor room provides ten assigned and five reserved actor slots", () => {
  const document = readRoomTemplate();
  const result = validateRoomTemplate(document);

  assert.equal(result.ok, true, JSON.stringify(result.diagnostics, null, 2));
  assert.deepEqual(result.counts, {
    assignedActors: 10,
    reservedActorSlots: 5,
    totalActorSlots: 15,
    facilities: 19,
  });
  assert.deepEqual(
    document.facilityGroups
      .filter(({ requirement }) => requirement === "required")
      .map(({ semantic }) => semantic)
      .sort(),
    ["lounge", "pantry", "reliability", "review", "work"],
  );
});

test("blocked entrance and unreachable required facility fail with stable diagnostics", () => {
  const blockedEntrance = cloneRoomTemplate() as unknown as Record<string, any>;
  blockedEntrance.entrances[0].cell = structuredClone(blockedEntrance.facilityGroups[0].facilities[0].placementSlot.occupiedCells[0]);
  assert.equal(hasCode(blockedEntrance as RoomTemplateDocument, "room.entrance-blocked"), true);

  const unreachable = cloneRoomTemplate() as unknown as Record<string, any>;
  const approach = unreachable.facilityGroups[1].facilities[0].placementSlot.approachCells[0];
  unreachable.circulation.blockedCells.push(approach);
  assert.equal(hasCode(unreachable as RoomTemplateDocument, "room.required-facility-unreachable"), true);
});

test("narrow circulation, overlapping props, and decorative navigation conflict fail closed", () => {
  const narrow = cloneRoomTemplate() as unknown as Record<string, any>;
  narrow.circulation.aisles[0].widthCells = 1;
  assert.equal(hasCode(narrow as RoomTemplateDocument, "room.circulation-too-narrow"), true);

  const overlap = cloneRoomTemplate() as unknown as Record<string, any>;
  overlap.propSlots[1].placementSlot.occupiedCells = structuredClone(overlap.propSlots[0].placementSlot.occupiedCells);
  assert.equal(hasCode(overlap as RoomTemplateDocument, "room.prop-slot-overlap"), true);

  const decoration = cloneRoomTemplate() as unknown as Record<string, any>;
  decoration.decorationSlots[0].placementSlot.navigationImpact = "blocking";
  assert.equal(hasCode(decoration as RoomTemplateDocument, "room.decoration-navigation-conflict"), true);
});

test("capacity and adjacency contracts reject insufficient, excessive, and illegal composition", () => {
  const insufficient = cloneRoomTemplate() as unknown as Record<string, any>;
  insufficient.capacity.assignedWorkstations = 11;
  assert.equal(hasCode(insufficient as RoomTemplateDocument, "room.capacity-insufficient"), true);

  const overflow = cloneRoomTemplate() as unknown as Record<string, any>;
  overflow.capacity.reservedActorSlots = 4;
  assert.equal(hasCode(overflow as RoomTemplateDocument, "room.capacity-overflow"), true);

  const adjacency = cloneRoomTemplate() as unknown as Record<string, any>;
  adjacency.adjacencyConstraints[0].maxDistanceCells = 1;
  assert.equal(hasCode(adjacency as RoomTemplateDocument, "room.adjacency-illegal"), true);
});

test("room validation is invariant under authoring input order", () => {
  const original = readRoomTemplate();
  const reordered = structuredClone(original) as unknown as Record<string, any>;
  reordered.facilityGroups.reverse();
  reordered.facilityGroups.forEach((group: { facilities: unknown[] }) => group.facilities.reverse());
  reordered.actorSlots.reverse();
  reordered.propSlots.reverse();
  reordered.circulation.aisles.reverse();
  reordered.adjacencyConstraints.reverse();
  reordered.focalPoints.reverse();
  reordered.densityBands.reverse();
  reordered.decorationSlots.reverse();

  const originalResult = validateRoomTemplate(original);
  const reorderedResult = validateRoomTemplate(reordered as RoomTemplateDocument);
  assert.equal(roomTemplateFingerprint(original), roomTemplateFingerprint(reordered as RoomTemplateDocument));
  assert.deepEqual(reorderedResult, originalResult);
});

test("decoration changes do not change navigation occupancy", () => {
  const original = readRoomTemplate();
  const moved = cloneRoomTemplate() as unknown as Record<string, any>;
  moved.decorationSlots[0].placementSlot.anchor.coordinate.x = 26;
  moved.decorationSlots[0].placementSlot.anchor.coordinate.y = 6;

  assert.deepEqual(
    validateRoomTemplate(moved as RoomTemplateDocument).navigation,
    validateRoomTemplate(original).navigation,
  );
});

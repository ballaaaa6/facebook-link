import { validateRoomTemplate } from "@affiliate-ops/office-v2-world";
import {
  compareExpectedDiagnostic,
  mismatch,
  validateSchema,
} from "./office-v2-knowledge-evidence.mjs";

export const roomTemplateFixturePath = "fixtures/room-template-ground-floor.json";
export const roomTemplateFixturePaths = new Set([
  roomTemplateFixturePath,
  "fixtures/room-template-target-floor-envelope.json",
  "fixtures/room-template-valid.json",
]);
export const targetRoomTemplateFixturePaths = new Set([
  roomTemplateFixturePath,
  "fixtures/room-template-target-floor-envelope.json",
]);

function clone(value) {
  return structuredClone(value);
}

function facility(document, groupId, index = 0) {
  const group = document.facilityGroups.find(({ id }) => id === groupId);
  if (!group?.facilities[index]) throw new Error(`Room fixture is missing facility ${groupId}[${index}]`);
  return group.facilities[index];
}

export function applyRoomTemplateMutation(baseDocument, mutation) {
  const document = clone(baseDocument);
  if (mutation === "block-entrance-cell") {
    document.entrances[0].cell = clone(facility(document, "workstations").placementSlot.occupiedCells[0]);
  } else if (mutation === "block-review-approach") {
    document.circulation.blockedCells.push(clone(facility(document, "review-facilities").placementSlot.approachCells[0]));
  } else if (mutation === "narrow-entry-aisle") {
    document.circulation.aisles[0].widthCells = 1;
  } else if (mutation === "require-eleven-assigned-workstations") {
    document.capacity.assignedWorkstations = 11;
  } else if (mutation === "declare-four-reserved-slots") {
    document.capacity.reservedActorSlots = 4;
  } else if (mutation === "tighten-work-review-adjacency") {
    document.adjacencyConstraints.find(({ id }) => id === "work-review-adjacency").maxDistanceCells = 1;
  } else if (mutation === "overlap-prop-slots") {
    document.propSlots[1].placementSlot.occupiedCells = clone(document.propSlots[0].placementSlot.occupiedCells);
  } else if (mutation === "make-decoration-blocking") {
    document.decorationSlots[0].placementSlot.navigationImpact = "blocking";
  } else {
    throw new Error(`Unsupported room-template mutation: ${mutation}`);
  }
  return document;
}

function documentForCase(context, fixture, entry) {
  if (fixture.baseFixture) {
    const base = context.readJson(fixture.baseFixture);
    if (!base) return null;
    return applyRoomTemplateMutation(base, entry.mutation);
  }
  return entry.document ?? fixture.document ?? fixture;
}

export function evaluateRoomTemplateCase(context, ajv, fixturePath, fixture, entry) {
  const document = documentForCase(context, fixture, entry);
  if (!document) return null;
  const schema = fixture.schema ?? "room-template.schema.json";
  const shape = validateSchema(context, ajv, schema, document, `${fixturePath} (${entry.name})`, true, fixturePath);
  if (!shape.valid) return null;

  const result = validateRoomTemplate(document);
  if (entry.expectedFailure) {
    compareExpectedDiagnostic(context, fixturePath, entry.expectedFailure, result.diagnostics[0] ?? null);
  } else if (!result.ok) {
    context.add("knowledge.fixture-mismatch", `${fixturePath} (${entry.name}): valid room template was rejected`, {
      fixture: fixturePath,
      caseName: entry.name,
      diagnostics: result.diagnostics,
    });
  }
  return result;
}

export function assertGroundFloorRoomEvidence(context, fixturePath, entry, result) {
  if (!targetRoomTemplateFixturePaths.has(fixturePath) || !result) return;
  context.evidence.semanticRules += 1;
  mismatch(context, fixturePath, entry, "assigned actor slots", result.counts.assignedActors, 10);
  mismatch(context, fixturePath, entry, "reserved actor slots", result.counts.reservedActorSlots, 5);
  mismatch(context, fixturePath, entry, "maximum actor slots", result.counts.totalActorSlots, 15);
  const requiredSemantics = ["work", "review", "reliability", "pantry", "lounge"].sort();
  if (!requiredSemantics) return;
  const document = context.readJson(fixturePath);
  const actual = document?.facilityGroups
    ?.filter(({ requirement }) => requirement === "required")
    .map(({ semantic }) => semantic)
    .sort();
  mismatch(context, fixturePath, entry, "required facility semantics", actual, requiredSemantics);
  const verticalCore = document?.facilityGroups?.find(({ id }) => id === "reserved-vertical-core");
  mismatch(context, fixturePath, entry, "reserved vertical core facilities", verticalCore?.facilities?.length ?? 0, 1);
}

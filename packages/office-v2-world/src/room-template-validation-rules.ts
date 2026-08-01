import type { RoomTemplateDocument } from "@affiliate-ops/office-v2-contracts";
import type {
  RoomNavigationProjection,
  RoomTemplateDiagnostic,
  RoomTemplateValidationResult,
} from "./room-template-validation-helpers.ts";
import {
  addSlotDiagnostics,
  cellKey,
  checkDuplicateIds,
  collectFacilityEntries,
  collectSlotOwners,
  coordinateOf,
  deriveRoomNavigation,
  diagnostic,
  facilityLookup,
  inBounds,
  placementLookup,
  stableString,
} from "./room-template-validation-helpers.ts";

function validateCapacity(
  diagnostics: RoomTemplateDiagnostic[],
  document: RoomTemplateDocument,
  facilities: ReadonlyMap<string, ReturnType<typeof facilityLookup> extends ReadonlyMap<string, infer Entry> ? Entry : never>,
  placementSlots: ReadonlyMap<string, ReturnType<typeof placementLookup> extends ReadonlyMap<string, infer Entry> ? Entry : never>,
): { assigned: number; reserved: number } {
  const assignedActors = document.actorSlots.filter(({ assignment }) => assignment === "assigned");
  const reservedActors = document.actorSlots.filter(({ assignment }) => assignment === "reserved");
  const total = document.actorSlots.length;
  const capacity = document.capacity;
  const insufficient = total < capacity.minActors
    || assignedActors.length < capacity.assignedWorkstations
    || reservedActors.length < capacity.reservedActorSlots;
  const overflow = total > capacity.maxActors
    || assignedActors.length > capacity.assignedWorkstations
    || reservedActors.length > capacity.reservedActorSlots;
  if (insufficient) diagnostics.push(diagnostic("room.capacity-insufficient", "Room capacity does not provide the declared actor slots.", {
    assignedActors: assignedActors.length,
    reservedActorSlots: reservedActors.length,
    expectedAssignedWorkstations: capacity.assignedWorkstations,
    expectedReservedActorSlots: capacity.reservedActorSlots,
    minActors: capacity.minActors,
  }));
  if (overflow) diagnostics.push(diagnostic("room.capacity-overflow", "Room capacity exceeds the declared actor or workstation limit.", {
    totalActorSlots: total,
    maxActors: capacity.maxActors,
    assignedActors: assignedActors.length,
    reservedActorSlots: reservedActors.length,
  }));

  const assignedFacilities = new Set<string>();
  for (const actor of document.actorSlots) {
    const slot = placementSlots.get(actor.placementSlotId);
    const facility = actor.facilityId ? facilities.get(actor.facilityId) : undefined;
    if (!slot || (actor.assignment === "assigned" && !facility)) {
      diagnostics.push(diagnostic("room.capacity-insufficient", "An actor slot does not resolve to its required facility placement slot.", {
        actorSlotId: actor.id,
        facilityId: actor.facilityId ?? null,
        placementSlotId: actor.placementSlotId,
      }));
      continue;
    }
    if (actor.assignment === "assigned" && actor.facilityId && facility) {
      if (assignedFacilities.has(actor.facilityId)) diagnostics.push(diagnostic("room.capacity-overflow", "Two assigned actor slots claim one exclusive facility.", {
        actorSlotId: actor.id,
        facilityId: actor.facilityId,
      }));
      assignedFacilities.add(actor.facilityId);
      if (facility.facility.placementSlot.id !== actor.placementSlotId) diagnostics.push(diagnostic("room.capacity-overflow", "An assigned actor slot points at a different placement slot than its facility.", {
        actorSlotId: actor.id,
        facilityId: actor.facilityId,
        expectedPlacementSlotId: facility.facility.placementSlot.id,
        actualPlacementSlotId: actor.placementSlotId,
      }));
    }
  }
  return { assigned: assignedActors.length, reserved: reservedActors.length };
}

function validateFacilityCounts(diagnostics: RoomTemplateDiagnostic[], document: RoomTemplateDocument): void {
  for (const group of document.facilityGroups) {
    const count = group.facilities.length;
    if (count < group.minCount) diagnostics.push(diagnostic("room.capacity-insufficient", "A facility group has fewer facilities than its minimum.", {
      groupId: group.id,
      semantic: group.semantic,
      count,
      minCount: group.minCount,
    }));
    if (count > group.maxCount) diagnostics.push(diagnostic("room.capacity-overflow", "A facility group exceeds its maximum facility count.", {
      groupId: group.id,
      count,
      maxCount: group.maxCount,
    }));
    if (group.minCount > group.maxCount) diagnostics.push(diagnostic("room.capacity-overflow", "A facility group declares a minimum above its maximum.", {
      groupId: group.id,
      minCount: group.minCount,
      maxCount: group.maxCount,
    }));
  }
}

function validateEntrances(diagnostics: RoomTemplateDiagnostic[], document: RoomTemplateDocument, blocked: ReadonlySet<string>): void {
  for (const entrance of document.entrances) {
    const entryCells = [entrance.cell, ...entrance.approachCells];
    const validCells = entryCells.filter((cell) => inBounds(document, cell));
    const blockedCells = validCells.filter((cell) => blocked.has(cellKey(cell)));
    const entranceCellBlocked = blocked.has(cellKey(entrance.cell));
    const validApproachCells = entrance.approachCells.filter((cell) => inBounds(document, cell));
    const allApproachesBlocked = validApproachCells.length === 0 || validApproachCells.every((cell) => blocked.has(cellKey(cell)));
    if (!entrance.legal || validCells.length !== entryCells.length || entranceCellBlocked || allApproachesBlocked) diagnostics.push(diagnostic(
      "room.entrance-blocked",
      "A legal room entrance has no unblocked in-bounds entry cell.",
      { entranceId: entrance.id, entryCells: entryCells.map(cellKey), blockedCells: blockedCells.map(cellKey) },
    ));
  }
}

function validateCirculation(diagnostics: RoomTemplateDiagnostic[], document: RoomTemplateDocument, blocked: ReadonlySet<string>): void {
  for (const aisle of document.circulation.aisles) {
    const cells = aisle.cells.map(cellKey);
    if (aisle.widthCells < document.circulation.minimumWidthCells || aisle.cells.some((cell) => !inBounds(document, cell)) || cells.some((cell) => blocked.has(cell))) diagnostics.push(diagnostic(
      "room.circulation-too-narrow",
      "A declared circulation aisle is narrower than the room minimum or is blocked.",
      { aisleId: aisle.id, widthCells: aisle.widthCells, minimumWidthCells: document.circulation.minimumWidthCells, cells },
    ));
  }
}

function validateRequiredReachability(diagnostics: RoomTemplateDiagnostic[], document: RoomTemplateDocument, navigation: RoomNavigationProjection): void {
  const reachable = new Set(navigation.reachableCells);
  for (const group of document.facilityGroups.filter(({ requirement }) => requirement === "required")) {
    for (const facility of group.facilities.slice().sort((left, right) => left.id.localeCompare(right.id))) {
      const approaches = facility.placementSlot.approachCells.map(cellKey);
      if (!approaches.some((approach) => reachable.has(approach))) diagnostics.push(diagnostic(
        "room.required-facility-unreachable",
        "An entrance cannot reach a required facility approach cell.",
        { groupId: group.id, facilityId: facility.id, placementSlotId: facility.placementSlot.id, approachCells: approaches },
      ));
    }
  }
}

function validatePropOverlaps(diagnostics: RoomTemplateDiagnostic[], document: RoomTemplateDocument): void {
  const props = document.propSlots.slice().sort((left, right) => left.id.localeCompare(right.id));
  for (let leftIndex = 0; leftIndex < props.length; leftIndex += 1) {
    const left = props[leftIndex];
    if (!left) continue;
    const leftCells = new Set([
      ...left.placementSlot.occupiedCells.map(cellKey),
      ...left.placementSlot.clearanceCells.map(cellKey),
    ]);
    for (const right of props.slice(leftIndex + 1)) {
      const rightCells = [
        ...right.placementSlot.occupiedCells.map(cellKey),
        ...right.placementSlot.clearanceCells.map(cellKey),
      ];
      const overlap = rightCells.find((cell) => leftCells.has(cell));
      if (overlap) diagnostics.push(diagnostic(
        "room.prop-slot-overlap",
        "Two prop placement slots overlap in their geometric envelope.",
        { leftPropSlotId: left.id, rightPropSlotId: right.id, cell: overlap },
      ));
    }
  }
}

function validateDecorations(diagnostics: RoomTemplateDiagnostic[], document: RoomTemplateDocument): void {
  const bands = new Map(document.densityBands.map((band) => [band.id, band]));
  const counts = new Map<string, number>();
  for (const decoration of document.decorationSlots) {
    const slot = decoration.placementSlot;
    if (slot.navigationImpact !== "none" || slot.occupiedCells.length > 0 || slot.clearanceCells.length > 0 || slot.approachCells.length > 0) diagnostics.push(diagnostic(
      "room.decoration-navigation-conflict",
      "A decoration slot declares navigation or occupancy impact.",
      { decorationSlotId: decoration.id, placementSlotId: slot.id, navigationImpact: slot.navigationImpact },
    ));
    const band = bands.get(decoration.densityBandId);
    if (!band || !inBounds(document, slot.anchor)) {
      diagnostics.push(diagnostic("room.decoration-navigation-conflict", "A decoration slot is not assigned to a valid in-bounds density band.", {
        decorationSlotId: decoration.id,
        densityBandId: decoration.densityBandId,
      }));
      continue;
    }
    const regionOrigin = coordinateOf(band.region.origin);
    const anchor = coordinateOf(slot.anchor);
    const inRegion = anchor.x >= regionOrigin.x
      && anchor.x < regionOrigin.x + band.region.width
      && anchor.y >= regionOrigin.y
      && anchor.y < regionOrigin.y + band.region.depth;
    if (!inRegion) diagnostics.push(diagnostic("room.decoration-navigation-conflict", "A decoration slot lies outside its density band.", {
      decorationSlotId: decoration.id,
      densityBandId: decoration.densityBandId,
    }));
    counts.set(decoration.densityBandId, (counts.get(decoration.densityBandId) ?? 0) + 1);
  }
  for (const [bandId, count] of counts) {
    const band = bands.get(bandId);
    if (band && count > band.maxDecorationSlots) diagnostics.push(diagnostic("room.decoration-navigation-conflict", "A density band has more decoration slots than its declared limit.", {
      densityBandId: bandId,
      count,
      maxDecorationSlots: band.maxDecorationSlots,
    }));
  }
}

function validateAdjacency(diagnostics: RoomTemplateDiagnostic[], document: RoomTemplateDocument): void {
  const groups = new Map(document.facilityGroups.map((group) => [group.id, group]));
  for (const constraint of document.adjacencyConstraints.slice().sort((left, right) => left.id.localeCompare(right.id))) {
    const left = groups.get(constraint.leftGroupId);
    const right = groups.get(constraint.rightGroupId);
    if (!left || !right) {
      diagnostics.push(diagnostic("room.adjacency-illegal", "An adjacency constraint references an unknown facility group.", {
        constraintId: constraint.id,
        leftGroupId: constraint.leftGroupId,
        rightGroupId: constraint.rightGroupId,
      }));
      continue;
    }
    const distances = left.facilities.flatMap((leftFacility) => right.facilities.map((rightFacility) => {
      const leftCoordinate = coordinateOf(leftFacility.placementSlot.anchor);
      const rightCoordinate = coordinateOf(rightFacility.placementSlot.anchor);
      return Math.abs(leftCoordinate.x - rightCoordinate.x) + Math.abs(leftCoordinate.y - rightCoordinate.y);
    }));
    const minimum = constraint.minDistanceCells;
    const maximum = constraint.maxDistanceCells ?? Number.MAX_SAFE_INTEGER;
    const valid = constraint.relation === "adjacent"
      ? distances.some((distance) => distance >= minimum && distance <= maximum)
      : distances.every((distance) => distance >= minimum);
    if (!valid) diagnostics.push(diagnostic("room.adjacency-illegal", "A facility-group adjacency constraint is not satisfied.", {
      constraintId: constraint.id,
      relation: constraint.relation,
      leftGroupId: constraint.leftGroupId,
      rightGroupId: constraint.rightGroupId,
      distances,
      minDistanceCells: minimum,
      maxDistanceCells: constraint.maxDistanceCells ?? null,
    }));
  }
}

function validateFocalPoints(diagnostics: RoomTemplateDiagnostic[], document: RoomTemplateDocument): void {
  for (const focalPoint of document.focalPoints) {
    if (!inBounds(document, focalPoint.position)) diagnostics.push(diagnostic("room.focal-point-out-of-bounds", "A room focal point is outside the room envelope.", {
      focalPointId: focalPoint.id,
      position: cellKey(focalPoint.position),
    }));
  }
}

function sortDiagnostics(diagnostics: readonly RoomTemplateDiagnostic[]): readonly RoomTemplateDiagnostic[] {
  return diagnostics.slice().sort((left, right) => (
    left.code.localeCompare(right.code)
    || String(left.context.pointer ?? "").localeCompare(String(right.context.pointer ?? ""))
    || stableString(left.context).localeCompare(stableString(right.context))
  ));
}

export function validateRoomComposition(document: RoomTemplateDocument): RoomTemplateValidationResult {
  const diagnostics: RoomTemplateDiagnostic[] = [];
  checkDuplicateIds(diagnostics, document);
  for (const owner of collectSlotOwners(document)) addSlotDiagnostics(diagnostics, document, owner);
  for (const decoration of document.decorationSlots) addSlotDiagnostics(diagnostics, document, {
    kind: "prop",
    id: decoration.id,
    slot: decoration.placementSlot,
  });

  validateFacilityCounts(diagnostics, document);
  const facilities = facilityLookup(document);
  const placementSlots = placementLookup(document);
  const counts = validateCapacity(diagnostics, document, facilities, placementSlots);
  const navigation = deriveRoomNavigation(document);
  const blocked = new Set(navigation.blockingCells);
  validateEntrances(diagnostics, document, blocked);
  validateCirculation(diagnostics, document, blocked);
  validateRequiredReachability(diagnostics, document, navigation);
  validatePropOverlaps(diagnostics, document);
  validateDecorations(diagnostics, document);
  validateAdjacency(diagnostics, document);
  validateFocalPoints(diagnostics, document);
  return {
    ok: diagnostics.length === 0,
    diagnostics: sortDiagnostics(diagnostics),
    navigation,
    counts: {
      assignedActors: counts.assigned,
      reservedActorSlots: counts.reserved,
      totalActorSlots: document.actorSlots.length,
      facilities: collectFacilityEntries(document).length,
    },
  };
}

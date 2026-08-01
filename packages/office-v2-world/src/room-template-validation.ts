import type {
  ActorSlot,
  AdjacencyConstraint,
  FacilityGroup,
  FacilitySlot,
  FloorCell,
  PlacementSlot,
  RoomTemplateDocument,
} from "@affiliate-ops/office-v2-contracts";
import {
  validateRoomComposition,
} from "./room-template-validation-rules.ts";
import { stableString } from "./room-template-validation-helpers.ts";

export {
  deriveRoomNavigation,
} from "./room-template-validation-helpers.ts";
export type {
  RoomNavigationProjection,
  RoomTemplateDiagnostic,
  RoomTemplateDiagnosticCode,
  RoomTemplateValidationResult,
} from "./room-template-validation-helpers.ts";

/** Validate room composition, capacity, and circulation without simulation state. */
export function validateRoomTemplate(document: RoomTemplateDocument) {
  return validateRoomComposition(document);
}

/** Stable room-level projection used to prove that authoring order is irrelevant. */
export function roomTemplateFingerprint(document: RoomTemplateDocument): string {
  const result = validateRoomComposition(document);
  return stableString({
    counts: result.counts,
    diagnostics: result.diagnostics,
    navigation: result.navigation,
  });
}

export type { ActorSlot, AdjacencyConstraint, FacilityGroup, FacilitySlot, FloorCell, PlacementSlot };

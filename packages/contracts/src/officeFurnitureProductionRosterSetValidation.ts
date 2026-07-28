import {
  validateFurniturePoseContract,
} from "./officeFurnitureProductionPoseValidation.ts";
import {
  validateFurnitureRosterEvidence,
} from "./officeFurnitureProductionRosterValidation.ts";

type RecordValue = Record<string, unknown>;

function isRecord(value: unknown): value is RecordValue {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireValue(
  issues: string[],
  condition: boolean,
  message: string,
) {
  if (!condition) issues.push(message);
}

export function validateFurnitureRosterSet(
  manifest: RecordValue,
): string[] {
  const issues: string[] = [];
  const hasSingleRoster = isRecord(manifest.rosterValidation);
  const hasRosterList = Array.isArray(manifest.rosterValidations);
  requireValue(
    issues,
    hasSingleRoster !== hasRosterList,
    "exactly one of rosterValidation or rosterValidations must be present",
  );
  const rosterRecords: RecordValue[] = hasSingleRoster
    ? [manifest.rosterValidation as RecordValue]
    : hasRosterList
      ? (manifest.rosterValidations as unknown[]).filter(isRecord)
      : [];
  if (hasRosterList) {
    requireValue(
      issues,
      rosterRecords.length === (manifest.rosterValidations as unknown[]).length
        && rosterRecords.length > 0,
      "rosterValidations must contain at least one object",
    );
  }

  const interaction = isRecord(manifest.interaction)
    ? manifest.interaction
    : null;
  const interactionSlots = interaction && Array.isArray(interaction.slots)
    ? interaction.slots.filter(isRecord)
    : [];
  const allSlotIds = interactionSlots
    .map((slot) => slot.id)
    .filter((id): id is string => typeof id === "string");
  const coveredSlots = new Set<string>();

  for (const [index, roster] of rosterRecords.entries()) {
    issues.push(...validateFurnitureRosterEvidence(roster));
    const slotIds = Array.isArray(roster.slotIds)
      ? roster.slotIds.filter((id): id is string => typeof id === "string")
      : hasSingleRoster
        ? allSlotIds
        : [];
    requireValue(
      issues,
      slotIds.length > 0 && new Set(slotIds).size === slotIds.length,
      `rosterValidations[${index}].slotIds must be unique and non-empty`,
    );
    for (const slotId of slotIds) {
      requireValue(
        issues,
        allSlotIds.includes(slotId),
        `rosterValidations[${index}].slotIds contains unknown slot ${slotId}`,
      );
      requireValue(
        issues,
        !coveredSlots.has(slotId),
        `seat slot ${slotId} has duplicate roster evidence`,
      );
      coveredSlots.add(slotId);
    }
    if (manifest.status !== "rejected" && interaction) {
      issues.push(...validateFurniturePoseContract(
        interaction,
        roster,
        new Set(slotIds),
      ));
    }
  }

  if (manifest.status !== "rejected") {
    requireValue(
      issues,
      allSlotIds.length === coveredSlots.size
        && allSlotIds.every((slotId) => coveredSlots.has(slotId)),
      "roster evidence must cover every interaction slot exactly once",
    );
  }
  return issues;
}

import {
  officeFacilityInteractionStates,
} from "./officeFacilityProduction.ts";
import {
  isIntegerPoint,
  isRecord,
  requireValue,
  type RecordValue,
} from "./officeFacilityProductionValidationPrimitives.ts";

function validateInteraction(value: unknown, issues: string[]) {
  requireValue(issues, isRecord(value), "interaction must be an object");
  if (!isRecord(value)) return;
  requireValue(issues, value.capacity === 1, "interaction.capacity must equal one");
  requireValue(
    issues,
    value.atomicReservation === true && value.releaseOnFailure === true,
    "interaction must reserve atomically and release on failure",
  );
  requireValue(
    issues,
    JSON.stringify(value.states) === JSON.stringify(officeFacilityInteractionStates),
    "interaction.states must preserve the facility state flow",
  );
  requireValue(issues, isRecord(value.slot), "interaction.slot must be an object");
  if (!isRecord(value.slot)) return;
  const slot = value.slot;
  for (const field of ["stand", "approach", "exit"]) {
    requireValue(
      issues,
      isIntegerPoint(slot[field]),
      `interaction.slot.${field} must use integer cells`,
    );
  }
  requireValue(
    issues,
    new Set(
      ["stand", "approach", "exit"]
        .map((field) => JSON.stringify(slot[field])),
    ).size === 3,
    "interaction stand, approach, and exit cells must be distinct",
  );
  requireValue(
    issues,
    value.slot.action !== value.slot.visualPose,
    "interaction action must remain separate from its visual pose",
  );
  requireValue(
    issues,
    value.slot.visualPose === "interact-front",
    "visual pose must be interact-front",
  );
}

function validateRoster(value: unknown, issues: string[]) {
  requireValue(issues, isRecord(value), "rosterValidation must be an object");
  if (!isRecord(value)) return;
  requireValue(
    issues,
    value.visualPose === "interact-front",
    "roster pose must be interact-front",
  );
  requireValue(
    issues,
    isRecord(value.poseAuthority)
      && value.poseAuthority.status === "frozen-prototype-internal"
      && value.poseAuthority.activeOfficeImported === false,
    "roster pose authority must remain internal and isolated",
  );
  requireValue(
    issues,
    value.perCharacterFacilityScaling === false
      && value.perCharacterActorOffsets === false,
    "roster validation cannot use per-character scaling or offsets",
  );
  requireValue(
    issues,
    Array.isArray(value.characters),
    "roster characters must be an array",
  );
  if (!Array.isArray(value.characters)) return;
  requireValue(
    issues,
    value.characterCount === value.characters.length,
    "roster characterCount must match its records",
  );
  requireValue(
    issues,
    value.validatedPoseCases
      === (value.characterCount as number) * (value.activeFrames as number),
    "roster validatedPoseCases must cover every active frame",
  );
  const ids = new Set<string>();
  for (const [index, character] of value.characters.entries()) {
    requireValue(
      issues,
      isRecord(character),
      `roster character ${index} must be an object`,
    );
    if (!isRecord(character)) continue;
    requireValue(
      issues,
      typeof character.id === "string" && !ids.has(character.id),
      `roster character ${index} must be unique`,
    );
    if (typeof character.id === "string") ids.add(character.id);
    requireValue(
      issues,
      Array.isArray(character.frames)
        && character.frames.length === value.activeFrames,
      `${character.id} must cover every active frame`,
    );
    if (!Array.isArray(character.frames)) continue;
    for (const frame of character.frames) {
      requireValue(
        issues,
        isRecord(frame)
          && JSON.stringify(frame.actorPosition)
            === JSON.stringify(value.sharedActorPosition)
          && frame.actorInsideReviewCard === true,
        `${character.id} has a character-specific offset or leaves the review card`,
      );
    }
  }
}

function validateReservation(value: unknown, issues: string[]) {
  requireValue(
    issues,
    isRecord(value),
    "reservationValidation must be an object",
  );
  if (!isRecord(value)) return;
  requireValue(
    issues,
    value.durationSeconds === 30
      && value.actorCount === 2
      && value.maximumConcurrentReservations === 1
      && value.collisionCount === 0,
    "reservation validation must prove a 30-second two-actor capacity-one run",
  );
  requireValue(
    issues,
    Number.isInteger(value.blockedAttemptCount)
      && (value.blockedAttemptCount as number) > 0,
    "reservation validation must include a blocked second actor",
  );
  requireValue(
    issues,
    Number.isInteger(value.failureCount)
      && (value.failureCount as number) > 0
      && Number.isInteger(value.retrySuccessCount)
      && (value.retrySuccessCount as number) > 0,
    "reservation validation must include failure and successful retry",
  );
  requireValue(
    issues,
    value.releasedAtEnd === true,
    "reservation must release at the end",
  );
  requireValue(
    issues,
    Array.isArray(value.samples) && value.samples.length === 31,
    "reservation validation must sample seconds 0 through 30",
  );
}

export function validateFacilityBehaviorContract(
  manifest: RecordValue,
  issues: string[],
) {
  validateInteraction(manifest.interaction, issues);
  validateRoster(manifest.rosterValidation, issues);
  validateReservation(manifest.reservationValidation, issues);
}

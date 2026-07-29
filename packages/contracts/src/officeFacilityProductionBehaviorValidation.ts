import {
  officeFacilityInteractionStates,
} from "./officeFacilityProduction.ts";
import {
  hasSha256,
  isRecord,
  requireValue,
  type RecordValue,
} from "./officeFacilityProductionValidationPrimitives.ts";

function isPixelPoint(value: unknown) {
  return Array.isArray(value)
    && value.length === 2
    && value.every(Number.isInteger);
}

function isHalfTilePoint(value: unknown) {
  return isRecord(value)
    && typeof value.x === "number"
    && Number.isInteger(value.x * 2)
    && typeof value.y === "number"
    && Number.isInteger(value.y * 2);
}

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
      isHalfTilePoint(slot[field]),
      `interaction.slot.${field} must use half-tile cells`,
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

function validateRoster(
  value: unknown,
  outputHandoff: unknown,
  issues: string[],
) {
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
      && ["owner-review-f8-pending", "owner-approved"].includes(
        String(value.poseAuthority.status),
      )
      && value.poseAuthority.activeOfficeImported === false,
    "roster pose authority must remain owner-reviewed and isolated",
  );
  requireValue(
    issues,
    isRecord(value.spatialAuthority)
      && ["owner-review-f8-pending", "owner-approved"].includes(
        String(value.spatialAuthority.status),
      )
      && value.spatialAuthority.activeOfficeImported === false
      && hasSha256(value.spatialAuthority.manifestSha256),
    "roster spatial authority must remain owner-reviewed and isolated",
  );
  requireValue(
    issues,
    isRecord(value.heldPropAuthority)
      && isRecord(outputHandoff)
      && value.heldPropAuthority.assetId === outputHandoff.heldAssetId
      && value.heldPropAuthority.runtimeScale === 1
      && hasSha256(value.heldPropAuthority.manifestSha256)
      && hasSha256(value.heldPropAuthority.assetSha256),
    "roster held prop authority must hash-lock H01 at scale one",
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
  requireValue(
    issues,
    value.characterCount === 18
      && value.activeFrames === 6
      && value.visiblePropCases === 54
      && value.facilityOutputAttachmentCases === 18
      && value.actorHandAttachmentCases === 36
      && value.attachmentDeltaFailures === 0,
    "roster must prove 18x6 poses, 54 visible props, and zero socket drift",
  );
  requireValue(
    issues,
    value.frontOverlayCases === 36
      && value.foregroundMaskUses === 0
      && value.visibleAlphaFailures === 0,
    "roster must prove 36 complete actor-held front overlays",
  );
  const expectedParents = [
    null,
    null,
    "facility.output.primary",
    "actor.hand.primary.grip",
    "actor.hand.primary.grip",
    null,
  ];
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
    for (const [frameIndex, frame] of character.frames.entries()) {
      requireValue(
        issues,
        isRecord(frame)
          && JSON.stringify(frame.actorPosition)
            === JSON.stringify(value.sharedActorPosition)
          && frame.actorInsideReviewCard === true,
        `${character.id} has a character-specific offset or leaves the review card`,
      );
      if (!isRecord(frame)) continue;
      const parent = expectedParents[frameIndex];
      const actorHeld = parent === "actor.hand.primary.grip";
      const visible = parent !== null;
      requireValue(
        issues,
        frame.frame === frameIndex
          && frame.attachmentParent === parent
          && frame.heldAssetVisible === visible
          && frame.heldByActor === actorHeld,
        `${character.id} frame ${frameIndex} has an invalid attachment state`,
      );
      requireValue(
        issues,
        isPixelPoint(frame.rootSocket)
          && isPixelPoint(frame.primaryGripSocket)
          && isPixelPoint(frame.propGripSocket)
          && isPixelPoint(frame.propVisualCenterSocket),
        `${character.id} frame ${frameIndex} must use integer sockets`,
      );
      requireValue(
        issues,
        visible
          ? isPixelPoint(frame.propOrigin)
            && isPixelPoint(frame.parentSocketWorld)
            && JSON.stringify(frame.attachmentDelta) === "[0,0]"
          : frame.propOrigin === null
            && frame.parentSocketWorld === null
            && frame.attachmentDelta === null,
        `${character.id} frame ${frameIndex} attachment does not resolve exactly`,
      );
      if (actorHeld) {
        requireValue(
          issues,
          frame.foregroundMask === null
            && frame.foregroundMaskUsed === false
            && frame.visiblePropAlphaFraction === 1,
          `${character.id} frame ${frameIndex} must keep the complete prop visible`,
        );
        requireValue(
          issues,
          JSON.stringify(frame.renderOrder)
            === JSON.stringify(["actor-body", "held-prop"]),
          `${character.id} frame ${frameIndex} render order is invalid`,
        );
      }
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
  validateRoster(manifest.rosterValidation, manifest.outputHandoff, issues);
  validateReservation(manifest.reservationValidation, issues);
}

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

export function validateFurnitureRosterEvidence(
  value: RecordValue,
): string[] {
  const issues: string[] = [];
  requireValue(
    issues,
    Number.isInteger(value.activeFrames) && (value.activeFrames as number) > 0,
    "rosterValidation.activeFrames must be a positive integer",
  );
  requireValue(
    issues,
    value.perCharacterFurnitureScaling === false,
    "rosterValidation.perCharacterFurnitureScaling must equal false",
  );
  requireValue(
    issues,
    value.perCharacterSeatOffsets === false,
    "rosterValidation.perCharacterSeatOffsets must equal false",
  );
  const characters = value.characters;
  requireValue(
    issues,
    Array.isArray(characters),
    "rosterValidation.characters must be an array",
  );
  if (!Array.isArray(characters)) return issues;
  requireValue(
    issues,
    characters.length === value.characterCount,
    "rosterValidation character count is stale",
  );
  for (const [characterIndex, character] of characters.entries()) {
    requireValue(
      issues,
      isRecord(character),
      `rosterValidation.characters[${characterIndex}] must be an object`,
    );
    if (!isRecord(character)) continue;
    requireValue(
      issues,
      typeof character.sha256 === "string"
        && /^[a-f0-9]{64}$/.test(character.sha256),
      `rosterValidation.characters[${characterIndex}].sha256 is invalid`,
    );
    const frames = character.frames;
    requireValue(
      issues,
      Array.isArray(frames) && frames.length === value.activeFrames,
      `rosterValidation.characters[${characterIndex}].frames is incomplete`,
    );
    if (!Array.isArray(frames)) continue;
    for (const [frameIndex, frame] of frames.entries()) {
      requireValue(
        issues,
        isRecord(frame),
        `rosterValidation.characters[${characterIndex}].frames[${frameIndex}] must be an object`,
      );
      if (!isRecord(frame)) continue;
      requireValue(
        issues,
        frame.actorInsideReviewCard === true,
        `rosterValidation.characters[${characterIndex}].frames[${frameIndex}] leaves the review card`,
      );
      requireValue(
        issues,
        Number.isInteger(frame.foregroundOverlapPixels)
          && (frame.foregroundOverlapPixels as number) > 0,
        `rosterValidation.characters[${characterIndex}].frames[${frameIndex}] misses the foreground`,
      );
      if (frame.slots === undefined) continue;
      requireValue(
        issues,
        Array.isArray(frame.slots) && frame.slots.length > 0,
        `rosterValidation.characters[${characterIndex}].frames[${frameIndex}].slots must contain seat-layer evidence`,
      );
      if (!Array.isArray(frame.slots)) continue;
      for (const [slotIndex, slot] of frame.slots.entries()) {
        requireValue(
          issues,
          isRecord(slot),
          `rosterValidation.characters[${characterIndex}].frames[${frameIndex}].slots[${slotIndex}] must be an object`,
        );
        if (!isRecord(slot)) continue;
        requireValue(
          issues,
          Number.isInteger(slot.lowerBodyPixels)
            && (slot.lowerBodyPixels as number) > 0,
          `rosterValidation.characters[${characterIndex}].frames[${frameIndex}].slots[${slotIndex}] must measure lower-body pixels`,
        );
        requireValue(
          issues,
          slot.visibleLowerBodyPixels === slot.lowerBodyPixels
            && slot.lowerBodyVisibilityRatio === 1,
          `rosterValidation.characters[${characterIndex}].frames[${frameIndex}].slots[${slotIndex}] hides lower-body pixels behind the seat foreground`,
        );
      }
    }
  }
  return issues;
}

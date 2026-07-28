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

function isIntegerPair(value: unknown): boolean {
  return Array.isArray(value)
    && value.length === 2
    && value.every(Number.isInteger);
}

export function validateFurniturePoseContract(
  interaction: RecordValue,
  roster: RecordValue,
  coveredSlotIds?: ReadonlySet<string>,
): string[] {
  const issues: string[] = [];
  requireValue(
    issues,
    typeof roster.visualPose === "string" && roster.visualPose.length > 0,
    "rosterValidation.visualPose must name a frozen visual pose",
  );
  const authority = roster.poseAuthority;
  requireValue(
    issues,
    isRecord(authority),
    "rosterValidation.poseAuthority must be an object",
  );
  if (isRecord(authority)) {
    requireValue(
      issues,
      typeof authority.id === "string" && authority.id.length > 0,
      "rosterValidation.poseAuthority.id is required",
    );
    requireValue(
      issues,
      typeof authority.manifest === "string"
        && !authority.manifest.includes("/processed/"),
      "rosterValidation.poseAuthority.manifest must be an authority manifest",
    );
    requireValue(
      issues,
      typeof authority.manifestSha256 === "string"
        && /^[a-f0-9]{64}$/.test(authority.manifestSha256),
      "rosterValidation.poseAuthority.manifestSha256 is invalid",
    );
    requireValue(
      issues,
      authority.status === "owner-approved",
      "rosterValidation.poseAuthority.status must equal owner-approved",
    );
    requireValue(
      issues,
      authority.orientation === "front" || authority.orientation === "back",
      "rosterValidation.poseAuthority.orientation is unsupported",
    );
    requireValue(
      issues,
      Number.isInteger(authority.row) && authority.row === roster.row,
      "rosterValidation.poseAuthority.row must match rosterValidation.row",
    );
  }

  const slots = interaction.slots;
  if (Array.isArray(slots)) {
    for (const [index, slot] of slots.entries()) {
      if (!isRecord(slot)) continue;
      if (
        coveredSlotIds
        && typeof slot.id === "string"
        && !coveredSlotIds.has(slot.id)
      ) continue;
      requireValue(
        issues,
        typeof slot.visualPose === "string"
          && slot.visualPose === roster.visualPose,
        `interaction.slots[${index}].visualPose must match rosterValidation.visualPose`,
      );
      requireValue(
        issues,
        slot.action !== slot.visualPose,
        `interaction.slots[${index}] must separate semantic action from visual pose`,
      );
      if (isRecord(authority)) {
        requireValue(
          issues,
          slot.facing === authority.orientation,
          `interaction.slots[${index}].facing must match pose authority orientation`,
        );
      }
    }
  }

  const characters = roster.characters;
  if (!Array.isArray(characters)) return issues;
  for (const [characterIndex, character] of characters.entries()) {
    if (!isRecord(character) || !Array.isArray(character.frames)) continue;
    for (const [frameIndex, frame] of character.frames.entries()) {
      if (!isRecord(frame)) continue;
      requireValue(
        issues,
        isIntegerPair(frame.actorContactLocal),
        `rosterValidation.characters[${characterIndex}].frames[${frameIndex}].actorContactLocal must use integer pixels`,
      );
    }
  }
  return issues;
}

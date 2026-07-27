export const characterRightsDispositions = [
  "replace-and-quarantine",
  "retain-with-approved-license",
] as const;

export const characterPrototypeUsages = [
  "active-agent-prototype",
  "active-companion-prototype",
  "alternate-prototype",
] as const;

export const commercialCharacterReviewStatuses = [
  "planned",
  "rights-evidence-complete",
  "commercial-review-approved",
  "rejected",
] as const;

export type CharacterRightsDisposition = typeof characterRightsDispositions[number];
export type CharacterPrototypeUsage = typeof characterPrototypeUsages[number];
export type CommercialCharacterReviewStatus = typeof commercialCharacterReviewStatuses[number];

export interface CharacterRightsReviewRecord {
  id: string;
  currentLicenseState: string;
  usage: CharacterPrototypeUsage;
  disposition: CharacterRightsDisposition;
  permittedUse: "internal-prototype-only";
  generationInputAllowed: false;
  replacementSlot: string | null;
  reason: string;
  reviewStatus: "reviewed";
}

export interface CharacterRightsReview {
  version: 1;
  reviewedOn: string;
  records: readonly CharacterRightsReviewRecord[];
}

export interface CommercialCharacterSlot {
  slotId: string;
  kind: "agent" | "companion";
  characterId: string;
  morphology: "standard-human" | "stylized-human" | "compact-stylized" | "non-human-robot";
  productionWave: 1 | 2;
  reviewStatus: CommercialCharacterReviewStatus;
}

export interface CommercialCharacterRoster {
  version: 1;
  status: "rights-contract";
  activeOfficeImported: false;
  commercialCharacterApproval: false;
  sourcePolicy: {
    prototypePixelsAllowed: false;
    prototypeImagesAllowedAsGenerationInput: false;
    thirdPartyNamesAllowedInPrompts: false;
    technicalAnimationContractAllowed: true;
  };
  slots: readonly CommercialCharacterSlot[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function add(issues: string[], condition: boolean, path: string, message: string) {
  if (!condition) issues.push(`${path}: ${message}`);
}

export function validateCharacterRightsReview(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["review: must be an object"];
  add(issues, value.version === 1, "version", "must equal 1");
  add(issues, typeof value.reviewedOn === "string" && value.reviewedOn.length > 0, "reviewedOn", "is required");
  add(issues, Array.isArray(value.records), "records", "must be an array");
  const ids = new Set<string>();
  for (const [index, item] of (Array.isArray(value.records) ? value.records : []).entries()) {
    const path = `records[${index}]`;
    if (!isRecord(item)) {
      issues.push(`${path}: must be an object`);
      continue;
    }
    add(issues, typeof item.id === "string" && item.id.length > 0, `${path}.id`, "is required");
    if (typeof item.id === "string") {
      add(issues, !ids.has(item.id), `${path}.id`, "must be unique");
      ids.add(item.id);
    }
    add(issues, typeof item.currentLicenseState === "string" && item.currentLicenseState.length > 0, `${path}.currentLicenseState`, "is required");
    add(issues, characterPrototypeUsages.includes(item.usage as CharacterPrototypeUsage), `${path}.usage`, "is unsupported");
    add(issues, characterRightsDispositions.includes(item.disposition as CharacterRightsDisposition), `${path}.disposition`, "is unsupported");
    add(issues, item.permittedUse === "internal-prototype-only", `${path}.permittedUse`, "must remain internal-prototype-only");
    add(issues, item.generationInputAllowed === false, `${path}.generationInputAllowed`, "must remain false");
    add(issues, item.replacementSlot === null || typeof item.replacementSlot === "string", `${path}.replacementSlot`, "must be a string or null");
    add(issues, typeof item.reason === "string" && item.reason.length > 0, `${path}.reason`, "is required");
    add(issues, item.reviewStatus === "reviewed", `${path}.reviewStatus`, "must equal reviewed");
  }
  return issues;
}

export function validateCommercialCharacterRoster(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["roster: must be an object"];
  add(issues, value.version === 1, "version", "must equal 1");
  add(issues, value.status === "rights-contract", "status", "must equal rights-contract");
  add(issues, value.activeOfficeImported === false, "activeOfficeImported", "must remain false");
  add(issues, value.commercialCharacterApproval === false, "commercialCharacterApproval", "must remain false");
  const policy = isRecord(value.sourcePolicy) ? value.sourcePolicy : {};
  add(issues, policy.prototypePixelsAllowed === false, "sourcePolicy.prototypePixelsAllowed", "must remain false");
  add(issues, policy.prototypeImagesAllowedAsGenerationInput === false, "sourcePolicy.prototypeImagesAllowedAsGenerationInput", "must remain false");
  add(issues, policy.thirdPartyNamesAllowedInPrompts === false, "sourcePolicy.thirdPartyNamesAllowedInPrompts", "must remain false");
  add(issues, policy.technicalAnimationContractAllowed === true, "sourcePolicy.technicalAnimationContractAllowed", "must remain true");
  add(issues, Array.isArray(value.slots), "slots", "must be an array");
  const slotIds = new Set<string>();
  const characterIds = new Set<string>();
  for (const [index, item] of (Array.isArray(value.slots) ? value.slots : []).entries()) {
    const path = `slots[${index}]`;
    if (!isRecord(item)) {
      issues.push(`${path}: must be an object`);
      continue;
    }
    add(issues, typeof item.slotId === "string" && item.slotId.length > 0, `${path}.slotId`, "is required");
    add(issues, typeof item.characterId === "string" && item.characterId.startsWith("original-"), `${path}.characterId`, "must use an original- ID");
    if (typeof item.slotId === "string") {
      add(issues, !slotIds.has(item.slotId), `${path}.slotId`, "must be unique");
      slotIds.add(item.slotId);
    }
    if (typeof item.characterId === "string") {
      add(issues, !characterIds.has(item.characterId), `${path}.characterId`, "must be unique");
      characterIds.add(item.characterId);
    }
    add(issues, item.kind === "agent" || item.kind === "companion", `${path}.kind`, "is unsupported");
    add(issues, ["standard-human", "stylized-human", "compact-stylized", "non-human-robot"].includes(String(item.morphology)), `${path}.morphology`, "is unsupported");
    add(issues, item.productionWave === 1 || item.productionWave === 2, `${path}.productionWave`, "must equal 1 or 2");
    add(issues, commercialCharacterReviewStatuses.includes(item.reviewStatus as CommercialCharacterReviewStatus), `${path}.reviewStatus`, "is unsupported");
  }
  add(issues, slotIds.size === 11, "slots", "must define ten agents and one companion");
  return issues;
}

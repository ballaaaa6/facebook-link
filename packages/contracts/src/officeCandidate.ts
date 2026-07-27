export type OfficeCandidateScenario = "live" | "workstations" | "facilities" | "roster";

export interface OfficeCandidateFileReference {
  file: string;
  sha256: string;
}

export interface OfficeCandidateManifestV1 {
  version: 1;
  id: string;
  status: "review-candidate";
  activeOfficePromotion: false;
  commercialCharacterApproval: false;
  sources: {
    structuralMap: OfficeCandidateFileReference;
    workstationBundle: OfficeCandidateFileReference;
    workstationDeployment: OfficeCandidateFileReference;
    derivedAssets: OfficeCandidateFileReference;
  };
  activeOfficeBaseline: readonly OfficeCandidateFileReference[];
  roster: {
    activeAgentIds: readonly string[];
    alternateCharacterIds: readonly string[];
    companionIds: readonly string[];
  };
  selectedCompositeIds: readonly string[];
  scenarios: readonly OfficeCandidateScenario[];
  review: {
    revision: string;
    status: "draft" | "awaiting-owner-review" | "changes-requested" | "owner-approved";
    ownerApproval: false;
    captureDirectory: string;
    savedImageCount: number;
  };
  acceptance: {
    activeAgentCount: 10;
    alternateCharacterCount: 8;
    companionCount: 1;
    derivedRecordCount: 77;
    requiredDurationSeconds: 60;
    consoleWarningsAllowed: 0;
    consoleErrorsAllowed: 0;
  };
}

const SHA256 = /^[a-f0-9]{64}$/;
const requiredScenarios: readonly OfficeCandidateScenario[] = [
  "live",
  "workstations",
  "facilities",
  "roster",
];

function add(issues: string[], condition: boolean, path: string, message: string) {
  if (!condition) issues.push(`${path}: ${message}`);
}

function validateReference(issues: string[], path: string, reference: OfficeCandidateFileReference) {
  add(issues, Boolean(reference.file), `${path}.file`, "must be non-empty");
  add(issues, SHA256.test(reference.sha256), `${path}.sha256`, "must be lowercase SHA-256");
}

export function validateOfficeCandidateManifest(manifest: OfficeCandidateManifestV1) {
  const issues: string[] = [];
  add(issues, manifest.version === 1, "version", "must equal 1");
  add(issues, manifest.id === "office-candidate-v1", "id", "must equal office-candidate-v1");
  add(issues, manifest.status === "review-candidate", "status", "must remain review-candidate");
  add(issues, manifest.activeOfficePromotion === false, "activeOfficePromotion", "must remain disabled");
  add(issues, manifest.commercialCharacterApproval === false, "commercialCharacterApproval", "must remain disabled");

  for (const [name, reference] of Object.entries(manifest.sources)) {
    validateReference(issues, `sources.${name}`, reference);
  }
  add(issues, manifest.activeOfficeBaseline.length === 4, "activeOfficeBaseline", "must lock four active files");
  manifest.activeOfficeBaseline.forEach((reference, index) => {
    validateReference(issues, `activeOfficeBaseline[${index}]`, reference);
  });

  const activeIds = new Set(manifest.roster.activeAgentIds);
  const alternateIds = new Set(manifest.roster.alternateCharacterIds);
  add(issues, activeIds.size === manifest.acceptance.activeAgentCount, "roster.activeAgentIds", "must contain ten unique IDs");
  add(issues, alternateIds.size === manifest.acceptance.alternateCharacterCount, "roster.alternateCharacterIds", "must contain eight unique IDs");
  add(issues, manifest.roster.companionIds.length === manifest.acceptance.companionCount, "roster.companionIds", "must contain one companion");
  add(issues, manifest.roster.companionIds[0] === "boba", "roster.companionIds[0]", "must retain Boba");
  add(
    issues,
    [...activeIds].every((id) => !alternateIds.has(id)),
    "roster",
    "active and alternate IDs must not overlap",
  );
  add(issues, manifest.selectedCompositeIds.length === 13, "selectedCompositeIds", "must select thirteen accepted composites");
  add(issues, new Set(manifest.selectedCompositeIds).size === 13, "selectedCompositeIds", "must be unique");
  add(issues, manifest.acceptance.derivedRecordCount === 77, "acceptance.derivedRecordCount", "must equal 77");
  add(issues, manifest.acceptance.requiredDurationSeconds === 60, "acceptance.requiredDurationSeconds", "must equal 60");
  add(issues, manifest.acceptance.consoleWarningsAllowed === 0, "acceptance.consoleWarningsAllowed", "must equal 0");
  add(issues, manifest.acceptance.consoleErrorsAllowed === 0, "acceptance.consoleErrorsAllowed", "must equal 0");
  add(issues, manifest.review.ownerApproval === false, "review.ownerApproval", "cannot be approved before owner review");
  add(issues, /^r\d{2}$/.test(manifest.review.revision), "review.revision", "must use rNN format");
  add(issues, manifest.review.captureDirectory.includes(manifest.review.revision), "review.captureDirectory", "must include the revision");
  add(
    issues,
    requiredScenarios.every((scenario) => manifest.scenarios.includes(scenario)),
    "scenarios",
    "must include all four review scenarios",
  );
  return issues;
}

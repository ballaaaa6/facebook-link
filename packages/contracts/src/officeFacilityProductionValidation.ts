import { validateOfficeGeometryV3 } from "./officeGeometry.ts";
import {
  officeFacilityProductionGates,
} from "./officeFacilityProduction.ts";
import {
  validateFacilityAssetContract,
} from "./officeFacilityProductionAssetValidation.ts";
import {
  validateFacilityBehaviorContract,
} from "./officeFacilityProductionBehaviorValidation.ts";
import {
  isRecord,
  requireValue,
} from "./officeFacilityProductionValidationPrimitives.ts";

function validatePolicy(value: unknown, issues: string[]) {
  requireValue(issues, isRecord(value), "sourcePolicy must be an object");
  if (!isRecord(value)) return;
  for (const field of [
    "processedCropDirectReuse",
    "activeOfficePixelReuse",
    "legacyOrRejectedPixelReuse",
    "stagingPixelReuse",
    "generativeRepair",
    "missingAssetFallback",
  ]) {
    requireValue(issues, value[field] === false, `sourcePolicy.${field} must be false`);
  }
  requireValue(
    issues,
    value.sharedProductionAssetDependency === "office.held-props.h01",
    "sourcePolicy must declare the H01 production asset dependency",
  );
}

function validateGates(
  value: unknown,
  status: unknown,
  ownerDecision: unknown,
  issues: string[],
) {
  requireValue(issues, isRecord(value), "gates must be an object");
  if (!isRecord(value)) return;
  for (const gate of officeFacilityProductionGates) {
    const record = value[gate];
    requireValue(issues, isRecord(record), `gates.${gate} must be an object`);
    if (!isRecord(record)) continue;
    requireValue(
      issues,
      ["passed", "pending-owner-review", "blocked"].includes(String(record.status)),
      `gates.${gate}.status is unsupported`,
    );
    requireValue(
      issues,
      Array.isArray(record.evidence),
      `gates.${gate}.evidence must be an array`,
    );
  }
  for (const gate of officeFacilityProductionGates.slice(0, 8)) {
    requireValue(
      issues,
      isRecord(value[gate]) && value[gate].status === "passed",
      `gates.${gate} must pass`,
    );
  }
  requireValue(
    issues,
    isRecord(value.F9) && value.F9.status === "blocked",
    "gates.F9 must remain blocked",
  );
  requireValue(
    issues,
    isRecord(value.F10) && value.F10.status === "blocked",
    "gates.F10 must remain blocked",
  );
  if (status === "owner-review-f8-pending") {
    requireValue(
      issues,
      isRecord(value.F8) && value.F8.status === "pending-owner-review",
      "gates.F8 must await owner review",
    );
    requireValue(issues, ownerDecision === null, "ownerDecision must be null before F8");
  }
  if (status === "owner-approved") {
    requireValue(
      issues,
      isRecord(value.F8) && value.F8.status === "passed",
      "gates.F8 must pass after approval",
    );
    requireValue(
      issues,
      isRecord(ownerDecision) && ownerDecision.decision === "approved",
      "ownerDecision must record approval",
    );
  }
  if (status === "rejected") {
    requireValue(
      issues,
      isRecord(value.F8) && value.F8.status === "blocked",
      "gates.F8 must be blocked after rejection",
    );
    requireValue(
      issues,
      isRecord(ownerDecision) && ownerDecision.decision === "rejected",
      "ownerDecision must record rejection",
    );
  }
}

export function validateOfficeFacilityProductionManifest(value: unknown): string[] {
  if (!isRecord(value)) return ["manifest must be an object"];
  const issues: string[] = [];
  requireValue(issues, value.schemaVersion === 2, "schemaVersion must equal 2");
  requireValue(
    issues,
    ["owner-review-f8-pending", "owner-approved", "rejected"].includes(String(value.status)),
    "status is unsupported",
  );
  requireValue(issues, value.developmentOnly === true, "developmentOnly must be true");
  requireValue(
    issues,
    value.activeOfficePromotion === false,
    "activeOfficePromotion must be false",
  );
  validatePolicy(value.sourcePolicy, issues);
  validateFacilityAssetContract(value, issues);
  if (!isRecord(value.geometry)) issues.push("geometry must be an object");
  else {
    issues.push(
      ...validateOfficeGeometryV3(value.geometry)
        .map((issue) => `geometry.${issue}`),
    );
  }
  validateFacilityBehaviorContract(value, issues);
  validateGates(value.gates, value.status, value.ownerDecision, issues);
  return issues;
}

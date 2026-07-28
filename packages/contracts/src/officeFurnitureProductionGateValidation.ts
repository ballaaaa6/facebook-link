import {
  officeFurnitureProductionGates,
} from "./officeFurnitureProduction.ts";

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

export function validateFurnitureGates(
  value: RecordValue,
  manifestStatus: unknown,
  ownerDecision: unknown,
): string[] {
  const issues: string[] = [];
  for (const gate of officeFurnitureProductionGates) {
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
  for (const gate of officeFurnitureProductionGates.slice(0, 8)) {
    requireValue(
      issues,
      isRecord(value[gate]) && value[gate].status === "passed",
      `gates.${gate} must pass before owner review`,
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

  if (manifestStatus === "owner-review-f8-pending") {
    requireValue(
      issues,
      isRecord(value.F8) && value.F8.status === "pending-owner-review",
      "gates.F8 must await owner review",
    );
    requireValue(
      issues,
      ownerDecision === null,
      "ownerDecision must be null while F8 is pending",
    );
  }
  if (manifestStatus === "rejected") {
    requireValue(
      issues,
      isRecord(value.F8) && value.F8.status === "blocked",
      "gates.F8 must be blocked after owner rejection",
    );
    requireValue(
      issues,
      isRecord(ownerDecision) && ownerDecision.decision === "rejected",
      "ownerDecision must record the rejection",
    );
  }
  if (manifestStatus === "owner-approved") {
    requireValue(
      issues,
      isRecord(value.F8) && value.F8.status === "passed",
      "gates.F8 must pass after owner approval",
    );
    requireValue(
      issues,
      isRecord(ownerDecision) && ownerDecision.decision === "approved",
      "ownerDecision must record the approval",
    );
  }
  return issues;
}

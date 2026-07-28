import { validateOfficeGeometryV3 } from "./officeGeometry.ts";
import {
  officeFurnitureProductionGates,
} from "./officeFurnitureProduction.ts";
import {
  validateFurnitureRosterEvidence,
} from "./officeFurnitureProductionRosterValidation.ts";

type RecordValue = Record<string, unknown>;

function isRecord(value: unknown): value is RecordValue {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isIntegerPoint(value: unknown) {
  return isRecord(value) && Number.isInteger(value.x) && Number.isInteger(value.y);
}

function hasSha256(value: unknown) {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function isBox(value: unknown) {
  return Array.isArray(value)
    && value.length === 4
    && value.every(Number.isInteger)
    && value[0] < value[2]
    && value[1] < value[3];
}

function requireValue(
  issues: string[],
  condition: boolean,
  message: string,
) {
  if (!condition) issues.push(message);
}

function validateSource(value: RecordValue, issues: string[]) {
  requireValue(
    issues,
    value.kind === "audited-original-master",
    "source.kind must identify an audited original master",
  );
  requireValue(
    issues,
    typeof value.path === "string"
      && value.path.startsWith("assets/art/layout-references/")
      && !value.path.includes("/processed/"),
    "source.path must be an original layout-reference master",
  );
  requireValue(issues, hasSha256(value.sha256), "source.sha256 must be a SHA-256 hash");
  requireValue(issues, isBox(value.sourceBounds), "source.sourceBounds must be an integer box");
  requireValue(issues, isBox(value.ownedBounds), "source.ownedBounds must be an integer box");
  const extraction = value.extraction;
  requireValue(issues, isRecord(extraction), "source.extraction must be an object");
  if (!isRecord(extraction)) return;
  requireValue(
    issues,
    extraction.method === "full-master-component-ownership",
    "source.extraction.method must use full-master component ownership",
  );
  requireValue(
    issues,
    extraction.selectedComponentCount === 1,
    "source.extraction must select exactly one connected component",
  );
  requireValue(
    issues,
    Number.isInteger(extraction.selectedPixelCount)
      && (extraction.selectedPixelCount as number) > 0,
    "source.extraction.selectedPixelCount must be positive",
  );
  requireValue(
    issues,
    extraction.touchesNominalCellBoundary === false,
    "selected source pixels touch the nominal cell boundary",
  );
  requireValue(
    issues,
    extraction.touchesMasterBoundary === false,
    "selected source pixels touch the master boundary",
  );
  requireValue(
    issues,
    extraction.sourcePixelsResampled === false,
    "authoring source pixels must not be resampled",
  );
}

function validateRender(value: RecordValue, issues: string[]) {
  const authoring = value.authoringCanvas;
  const runtime = value.runtimeCanvas;
  const divisor = value.uniformIntegerDivisor;
  requireValue(
    issues,
    Array.isArray(authoring)
      && authoring.length === 2
      && authoring.every(Number.isInteger),
    "render.authoringCanvas must contain two integers",
  );
  requireValue(
    issues,
    Array.isArray(runtime)
      && runtime.length === 2
      && runtime.every(Number.isInteger),
    "render.runtimeCanvas must contain two integers",
  );
  requireValue(
    issues,
    Number.isInteger(divisor) && (divisor as number) > 0,
    "render.uniformIntegerDivisor must be a positive integer",
  );
  if (Array.isArray(authoring) && Array.isArray(runtime) && Number.isInteger(divisor)) {
    requireValue(
      issues,
      authoring[0] === (runtime[0] as number) * (divisor as number)
        && authoring[1] === (runtime[1] as number) * (divisor as number),
      "render canvases must use one uniform integer divisor",
    );
  }
  requireValue(
    issues,
    value.nonUniformScaling === false,
    "render.nonUniformScaling must remain false",
  );
  requireValue(
    issues,
    value.anchor === "bottom-center",
    "render.anchor must equal bottom-center",
  );
}

function validateParts(value: unknown, issues: string[]) {
  requireValue(issues, Array.isArray(value), "parts must be an array");
  if (!Array.isArray(value)) return;
  const ids = new Set<string>();
  const roles = new Set<string>();
  for (const [index, part] of value.entries()) {
    requireValue(issues, isRecord(part), `parts[${index}] must be an object`);
    if (!isRecord(part)) continue;
    requireValue(
      issues,
      typeof part.id === "string" && !ids.has(part.id),
      `parts[${index}].id must be unique`,
    );
    if (typeof part.id === "string") ids.add(part.id);
    requireValue(
      issues,
      ["shell", "rear", "foreground"].includes(String(part.role))
        && !roles.has(String(part.role)),
      `parts[${index}].role must be unique and supported`,
    );
    roles.add(String(part.role));
    for (const field of ["authoringFile", "runtimeFile"]) {
      requireValue(
        issues,
        typeof part[field] === "string"
          && (part[field] as string).startsWith("assets/game/processed/")
          && !(part[field] as string).includes("office-library-modern-bright-v1"),
        `parts[${index}].${field} must be a new versioned output`,
      );
    }
    requireValue(
      issues,
      hasSha256(part.authoringSha256),
      `parts[${index}].authoringSha256 is invalid`,
    );
    requireValue(
      issues,
      hasSha256(part.runtimeSha256),
      `parts[${index}].runtimeSha256 is invalid`,
    );
  }
  requireValue(
    issues,
    ["shell", "rear", "foreground"].every((role) => roles.has(role)),
    "parts must contain shell, rear, and foreground roles",
  );
}

function validateInteraction(
  value: RecordValue,
  geometry: RecordValue,
  issues: string[],
) {
  const slots = value.slots;
  requireValue(
    issues,
    Number.isInteger(value.capacity) && (value.capacity as number) > 0,
    "interaction.capacity must be a positive integer",
  );
  requireValue(
    issues,
    value.atomicReservation === true,
    "interaction.atomicReservation must equal true",
  );
  requireValue(
    issues,
    value.releaseOnFailure === true,
    "interaction.releaseOnFailure must equal true",
  );
  requireValue(issues, Array.isArray(slots), "interaction.slots must be an array");
  if (!Array.isArray(slots)) return;
  requireValue(
    issues,
    slots.length === value.capacity,
    "interaction slot count must equal capacity",
  );
  const reservations = new Set<string>();
  for (const [index, slot] of slots.entries()) {
    requireValue(
      issues,
      isRecord(slot),
      `interaction.slots[${index}] must be an object`,
    );
    if (!isRecord(slot)) continue;
    requireValue(
      issues,
      isRecord(slot.seat),
      `interaction.slots[${index}].seat must be an object`,
    );
    requireValue(
      issues,
      isIntegerPoint(slot.approach),
      `interaction.slots[${index}].approach must use integer cells`,
    );
    requireValue(
      issues,
      isIntegerPoint(slot.exit),
      `interaction.slots[${index}].exit must use integer cells`,
    );
    requireValue(
      issues,
      typeof slot.reservationId === "string"
        && !reservations.has(slot.reservationId),
      `interaction.slots[${index}].reservationId must be unique`,
    );
    if (typeof slot.reservationId === "string") reservations.add(slot.reservationId);
  }
  requireValue(
    issues,
    Array.isArray(geometry.seatSlots)
      && geometry.seatSlots.length === slots.length,
    "interaction slots must match geometry seat slots",
  );
}

function validateGates(value: RecordValue, issues: string[]) {
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
}

export function validateOfficeFurnitureFamilyManifest(
  value: unknown,
): string[] {
  if (!isRecord(value)) return ["manifest must be an object"];
  const issues: string[] = [];
  requireValue(issues, value.schemaVersion === 1, "schemaVersion must equal 1");
  requireValue(
    issues,
    ["owner-review-f8-pending", "owner-approved", "rejected"].includes(String(value.status)),
    "status is unsupported",
  );
  requireValue(issues, value.developmentOnly === true, "developmentOnly must equal true");
  requireValue(
    issues,
    value.activeOfficePromotion === false,
    "activeOfficePromotion must equal false",
  );

  const policy = value.sourcePolicy;
  requireValue(issues, isRecord(policy), "sourcePolicy must be an object");
  if (isRecord(policy)) {
    for (const field of [
      "processedCropDirectReuse",
      "activeOfficePixelReuse",
      "legacyOrRejectedPixelReuse",
      "generativeRepair",
      "missingAssetFallback",
    ]) {
      requireValue(issues, policy[field] === false, `sourcePolicy.${field} must equal false`);
    }
  }

  requireValue(issues, isRecord(value.source), "source must be an object");
  if (isRecord(value.source)) validateSource(value.source, issues);
  requireValue(issues, isRecord(value.render), "render must be an object");
  if (isRecord(value.render)) validateRender(value.render, issues);
  validateParts(value.parts, issues);

  if (!isRecord(value.geometry)) issues.push("geometry must be an object");
  else {
    issues.push(
      ...validateOfficeGeometryV3(value.geometry)
        .map((issue) => `geometry.${issue}`),
    );
  }
  requireValue(issues, isRecord(value.interaction), "interaction must be an object");
  if (isRecord(value.interaction) && isRecord(value.geometry)) {
    validateInteraction(value.interaction, value.geometry, issues);
  }
  requireValue(
    issues,
    isRecord(value.rosterValidation),
    "rosterValidation must be an object",
  );
  if (isRecord(value.rosterValidation)) {
    issues.push(...validateFurnitureRosterEvidence(value.rosterValidation));
  }

  requireValue(issues, isRecord(value.gates), "gates must be an object");
  if (isRecord(value.gates)) {
    validateGates(value.gates, issues);
    if (value.status === "owner-review-f8-pending") {
      requireValue(
        issues,
        isRecord(value.gates.F8)
          && value.gates.F8.status === "pending-owner-review",
        "gates.F8 must await owner review",
      );
      requireValue(
        issues,
        value.ownerDecision === null,
        "ownerDecision must be null while F8 is pending",
      );
    }
  }

  const reservation = value.reservationValidation;
  requireValue(
    issues,
    isRecord(reservation),
    "reservationValidation must be an object",
  );
  if (isRecord(reservation)) {
    requireValue(
      issues,
      isFiniteNumber(reservation.durationSeconds)
        && reservation.durationSeconds >= 30,
      "reservationValidation.durationSeconds must be at least 30",
    );
    requireValue(
      issues,
      reservation.maximumConcurrentReservations === 1,
      "reservation validation must prove capacity one",
    );
    requireValue(
      issues,
      reservation.collisionCount === 0,
      "reservation validation found collisions",
    );
    requireValue(
      issues,
      reservation.releasedAtEnd === true,
      "reservation must release at the end",
    );
  }
  return issues;
}

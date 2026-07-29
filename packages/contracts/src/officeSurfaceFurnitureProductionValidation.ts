import { validateOfficeGeometryV3 } from "./officeGeometry.ts";
import { validateFurnitureGates } from "./officeFurnitureProductionGateValidation.ts";
import {
  hasSha256,
  isBox,
  isRecord,
  requireValue,
  type RecordValue,
  validateFileHash,
} from "./officeFacilityProductionValidationPrimitives.ts";

function isIntegerPair(value: unknown): value is [number, number] {
  return Array.isArray(value)
    && value.length === 2
    && value.every(Number.isInteger);
}

function isHalfTile(value: unknown) {
  return typeof value === "number"
    && Number.isFinite(value)
    && Number.isInteger(value * 2);
}

function validateGeneratedSource(
  value: unknown, outputPrefix: string, issues: string[],
) {
  requireValue(issues, isRecord(value), "source must be an object");
  if (!isRecord(value)) return;
  requireValue(
    issues,
    value.kind === "generated-isolated-clean-source"
      && value.extractionMethod === "generated-source-chroma-key",
    "source must use a generated isolated chroma-key source",
  );
  requireValue(
    issues,
    typeof value.path === "string"
      && value.path.startsWith("assets/art/layout-references/")
      && !value.path.includes("/processed/"),
    "source.path must be a clean layout-reference source",
  );
  requireValue(issues, hasSha256(value.sha256), "source.sha256 must be SHA-256");
  requireValue(
    issues,
    isRecord(value.generation)
      && value.generation.workflow === "built-in-imagegen"
      && value.generation.inputImageCount === 0
      && value.generation.conceptPixelsAsSource === false,
    "source generation must use ImageGen without concept pixels",
  );
  requireValue(
    issues,
    isIntegerPair(value.sourceSize)
      && isBox(value.ownedBounds)
      && value.connectedComponentCount === 1
      && Number.isInteger(value.selectedVisiblePixels)
      && (value.selectedVisiblePixels as number) > 0
      && value.sourcePixelsResampled === false
      && value.canvasContact === false,
    "source ownership evidence is incomplete",
  );
  for (const field of ["keyedSource", "ownershipMask", "normalizedCutout"]) {
    const evidence = value[field];
    requireValue(issues, isRecord(evidence), `source.${field} must be an object`);
    if (isRecord(evidence)) {
      validateFileHash(evidence, "file", "sha256", outputPrefix, issues);
    }
  }
  if (isRecord(value.geometryNormalizedSource)) {
    validateFileHash(
      value.geometryNormalizedSource,
      "file",
      "sha256",
      outputPrefix,
      issues,
    );
  }
  const normalization = value.geometryNormalization;
  if (normalization !== undefined) {
    requireValue(
      issues,
      isRecord(normalization)
        && normalization.method
          === "orthographic-row-removal-without-resampling"
        && isBox(normalization.sourceSurfaceBounds)
        && isIntegerPair(normalization.removedRows)
        && isBox(normalization.outputSurfaceBounds)
        && normalization.pixelsResampled === false,
      "source geometry normalization must remove rows without resampling",
    );
  }
  const padding = value.authoringPadding;
  requireValue(
    issues,
    isRecord(padding)
      && ["left", "top", "right", "bottom"].every(
        (field) => Number.isInteger(padding[field])
          && (padding[field] as number) >= 32,
      ),
    "source authoring padding must be at least 32 pixels per side",
  );
}

function validateRender(value: unknown, issues: string[]) {
  requireValue(issues, isRecord(value), "render must be an object");
  if (!isRecord(value)) return;
  const authoring = value.authoringCanvas;
  const runtime = value.runtimeCanvas;
  const divisor = value.uniformIntegerDivisor;
  requireValue(
    issues,
    isIntegerPair(authoring)
      && isIntegerPair(runtime)
      && Number.isInteger(divisor)
      && (divisor as number) > 0,
    "render canvases and divisor must use positive integers",
  );
  if (isIntegerPair(authoring) && isIntegerPair(runtime) && Number.isInteger(divisor)) {
    requireValue(
      issues,
      authoring[0] === runtime[0] * (divisor as number)
        && authoring[1] === runtime[1] * (divisor as number),
      "render canvases must share one uniform integer divisor",
    );
  }
  requireValue(
    issues,
    value.nonUniformScaling === false
      && value.orientation === "front"
      && value.anchor === "bottom-center",
    "render must remain front-only and bottom-centered without distortion",
  );
  requireValue(
    issues,
    isRecord(value.projection)
      && value.projection.screenX === "worldX * 32"
      && value.projection.screenY === "worldY * 32 - worldZ * 32"
      && value.projection.perspective === false,
    "render projection must use the Office orthographic authority",
  );
}

function validateCleanAsset(
  value: unknown, outputPrefix: string, issues: string[],
) {
  requireValue(issues, isRecord(value), "cleanAsset must be an object");
  if (isRecord(value)) {
    validateFileHash(value, "file", "sha256", outputPrefix, issues);
  }
}

function validateParts(
  value: unknown, outputPrefix: string, issues: string[],
) {
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
      ["base-shell", "support-surface", "foreground-occlusion"]
        .includes(String(part.role))
        && !roles.has(String(part.role)),
      `parts[${index}].role must be unique and supported`,
    );
    roles.add(String(part.role));
    validateFileHash(part, "authoringFile", "authoringSha256", outputPrefix, issues);
    validateFileHash(part, "runtimeFile", "runtimeSha256", outputPrefix, issues);
  }
  requireValue(
    issues,
    ["base-shell", "support-surface", "foreground-occlusion"]
      .every((role) => roles.has(role)),
    "parts must contain the base, support surface, and foreground",
  );
}

function validateSpatial(value: unknown, issues: string[]) {
  requireValue(issues, isRecord(value), "spatial must be an object");
  if (!isRecord(value)) return;
  requireValue(
    issues,
    value.coordinateSpace === "counter-runtime-pixel"
      && value.tilePixels === 32
      && value.rootSocketId === "root.floor"
      && value.sortSocketId === "sort.floor",
    "spatial root must use Counter runtime pixels and 32-pixel tiles",
  );
  requireValue(
    issues,
    value.attachmentFormula === "parent-socket-minus-child-socket"
      && value.perSceneAttachmentOffsets === false
      && value.centerFallback === false
      && value.missingSocketFallback === false
      && value.attachmentDeltaFailures === 0,
    "spatial attachment must use semantic sockets without fallbacks",
  );
  requireValue(issues, isRecord(value.localSockets), "localSockets must be an object");
  if (isRecord(value.localSockets)) {
    for (const [id, point] of Object.entries(value.localSockets)) {
      requireValue(issues, isIntegerPair(point), `localSockets.${id} must be integer`);
    }
  }
}

function validateSurfaceContract(
  value: unknown,
  geometry: unknown,
  issues: string[],
) {
  requireValue(issues, isRecord(value), "surfaceContract must be an object");
  if (!isRecord(value)) return;
  requireValue(
    issues,
    value.atomicOccupancy === true
      && value.rejectOverlap === true
      && value.rejectUnsupportedChild === true
      && value.childInteractionDelegated === true
      && value.coffeeC01Imported === false,
    "surface contract must fail closed and keep Coffee detached",
  );
  requireValue(
    issues,
    Array.isArray(value.slots) && value.slots.length > 1,
    "surface contract must expose multiple slots",
  );
  if (!Array.isArray(value.slots)) return;
  const ids = new Set<string>();
  const laneIds = new Set<string>();
  for (const [index, slot] of value.slots.entries()) {
    requireValue(issues, isRecord(slot), `surface slots[${index}] must be an object`);
    if (!isRecord(slot)) continue;
    requireValue(
      issues,
      typeof slot.id === "string" && !ids.has(slot.id),
      `surface slots[${index}].id must be unique`,
    );
    if (typeof slot.id === "string") ids.add(slot.id);
    requireValue(
      issues,
      isRecord(slot.point)
        && isHalfTile(slot.point.x)
        && isHalfTile(slot.point.y)
        && slot.point.unit === "tile"
        && isIntegerPair(slot.localSocket),
      `surface slots[${index}] must use integer tile and pixel points`,
    );
    requireValue(
      issues,
      typeof slot.pairedUseLaneId === "string",
      `surface slots[${index}] must name a use lane`,
    );
  }
  requireValue(issues, Array.isArray(value.useLanes) && value.useLanes.length > 0,
    "surface contract must define use lanes");
  if (Array.isArray(value.useLanes)) {
    for (const [index, lane] of value.useLanes.entries()) {
      requireValue(issues, isRecord(lane), `use lanes[${index}] must be an object`);
      if (!isRecord(lane)) continue;
      requireValue(
        issues,
        typeof lane.id === "string"
          && !laneIds.has(lane.id)
          && (
            ids.has(String(lane.surfaceSlotId))
            || (
              Array.isArray(lane.surfaceSlotIds)
              && lane.surfaceSlotIds.length > 0
              && lane.surfaceSlotIds.every((id) => ids.has(String(id)))
            )
          )
          && ["stand", "approach", "exit"].every(
            (field) => isRecord(lane[field])
              && isHalfTile(lane[field].x)
              && isHalfTile(lane[field].y),
          )
          && lane.facing === "front",
        `use lanes[${index}] must be unique and route an owned slot`,
      );
      if (typeof lane.id === "string") laneIds.add(lane.id);
    }
  }
  requireValue(
    issues,
    value.slots.every(
      (slot) => isRecord(slot) && laneIds.has(String(slot.pairedUseLaneId)),
    ),
    "every surface slot must pair with a declared use lane",
  );
  requireValue(
    issues,
    isRecord(geometry)
      && isRecord(geometry.supportPlane)
      && geometry.supportPlane.id === value.supportPlaneId
      && Array.isArray(geometry.attachmentSlots)
      && geometry.attachmentSlots.length === ids.size,
    "surface contract must match Geometry v3 support and attachment slots",
  );
}

function validateProofs(value: RecordValue, issues: string[]) {
  const placement = value.placementValidation;
  requireValue(issues, isRecord(placement), "placementValidation must be an object");
  if (isRecord(placement)) {
    requireValue(
      issues,
      Number.isInteger(placement.oneByOneCases)
        && (placement.oneByOneCases as number) > 0
        && Number.isInteger(placement.twoByOneCases)
        && (placement.twoByOneCases as number) > 0
        && (placement.overlapRejections as number) > 0
        && (placement.unsupportedChildRejections as number) > 0
        && placement.routeObstructionCount === 0
        && placement.attachmentDeltaFailures === 0,
      "placement proof must cover modular occupancy and rejection cases",
    );
  }
  const movement = value.movementValidation;
  requireValue(
    issues,
    isRecord(movement)
      && Array.isArray(movement.worldPositions)
      && movement.worldPositions.length >= 3
      && (movement.childAttachmentCases as number) > 0
      && movement.attachmentDeltaFailures === 0
      && movement.propFollowFailures === 0,
    "movement proof must cover multiple world positions without drift",
  );
  const reservation = value.reservationValidation;
  requireValue(
    issues,
    isRecord(reservation)
      && reservation.durationSeconds === 30
      && reservation.contenderCount === 2
      && reservation.maximumConcurrentReservations === 1
      && (reservation.blockedAttemptCount as number) > 0
      && (reservation.failureCount as number) > 0
      && (reservation.retrySuccessCount as number) > 0
      && reservation.releasedAtEnd === true
      && Array.isArray(reservation.samples)
      && reservation.samples.length === 31,
    "reservation proof must cover 30-second contention, failure, and retry",
  );
}

export function validateOfficeSurfaceFurnitureProductionManifest(
  value: unknown,
): string[] {
  if (!isRecord(value)) return ["manifest must be an object"];
  const issues: string[] = [];
  const revision = typeof value.revision === "string" ? value.revision : "";
  const outputPrefix =
    `assets/game/processed/office-furniture-counter-bar-${revision}/`;
  requireValue(issues, value.schemaVersion === 1, "schemaVersion must equal 1");
  requireValue(
    issues,
    ["owner-review-f8-pending", "owner-approved", "rejected"]
      .includes(String(value.status)),
    "status is unsupported",
  );
  requireValue(
    issues,
    value.developmentOnly === true && value.activeOfficePromotion === false,
    "surface furniture must remain development-only",
  );
  requireValue(issues, isRecord(value.sourcePolicy), "sourcePolicy must be an object");
  if (isRecord(value.sourcePolicy)) {
    for (const [field, setting] of Object.entries(value.sourcePolicy)) {
      requireValue(issues, setting === false, `sourcePolicy.${field} must equal false`);
    }
  }
  validateGeneratedSource(value.source, outputPrefix, issues);
  validateRender(value.render, issues);
  validateCleanAsset(value.cleanAsset, outputPrefix, issues);
  if (!isRecord(value.geometry)) issues.push("geometry must be an object");
  else {
    issues.push(
      ...validateOfficeGeometryV3(value.geometry)
        .map((issue) => `geometry.${issue}`),
    );
  }
  validateParts(value.parts, outputPrefix, issues);
  validateSpatial(value.spatial, issues);
  validateSurfaceContract(value.surfaceContract, value.geometry, issues);
  validateProofs(value, issues);
  requireValue(issues, isRecord(value.gates), "gates must be an object");
  if (isRecord(value.gates)) {
    issues.push(...validateFurnitureGates(
      value.gates,
      value.status,
      value.ownerDecision,
    ));
  }
  requireValue(
    issues,
    Array.isArray(value.reviewOutputs)
      && value.reviewOutputs.length >= 8
      && value.reviewOutputs.every(
        (entry) => isRecord(entry)
          && typeof entry.file === "string"
          && entry.file.startsWith(
            "assets/art/layout-references/office-furniture-family-v1/",
          )
          && hasSha256(entry.sha256),
      ),
    "reviewOutputs must hash-lock the complete review bundle",
  );
  return issues;
}

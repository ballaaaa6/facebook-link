import {
  isRecord,
  requireValue,
  validateFileHash,
} from "./officeFacilityProductionValidationPrimitives.ts";

function isPixelPoint(value: unknown): value is [number, number] {
  return Array.isArray(value)
    && value.length === 2
    && value.every(Number.isInteger);
}

export function validateFacilitySpatialContract(
  value: unknown,
  issues: string[],
) {
  requireValue(issues, isRecord(value), "spatial must be an object");
  if (!isRecord(value)) return;
  requireValue(
    issues,
    value.coordinateSpace === "facility-runtime-pixel" && value.unit === "pixel",
    "spatial must use facility runtime pixels",
  );
  requireValue(
    issues,
    value.perSceneAttachmentOffsets === false
      && value.centerToCenterAttachment === false
      && value.missingSocketFallback === false,
    "spatial attachment cannot use scene offsets, center anchors, or fallbacks",
  );
  requireValue(
    issues,
    isRecord(value.authority),
    "spatial.authority must be an object",
  );
  if (isRecord(value.authority)) {
    validateFileHash(
      value.authority,
      "file",
      "sha256",
      "assets/game/manifests/",
      issues,
    );
    requireValue(
      issues,
      ["owner-review-f8-pending", "owner-approved"].includes(
        String(value.authority.status),
      ),
      "spatial authority must remain owner-reviewed",
    );
  }
  requireValue(
    issues,
    isRecord(value.localSockets),
    "spatial.localSockets must be an object",
  );
  if (!isRecord(value.localSockets)) return;
  for (const socketId of [
    "base.floor",
    "sort.floor",
    "interaction.target",
    "output.primary",
    "effect.origin",
    "viewport.origin",
  ]) {
    requireValue(
      issues,
      isPixelPoint(value.localSockets[socketId]),
      `spatial.localSockets.${socketId} must be an integer pixel point`,
    );
  }
}

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

function isCompleteBlockSpan(value: unknown): boolean {
  if (!isRecord(value)) return false;
  const slotIds = value.slotIds;
  const anchorSlotIds = value.anchorSlotIds;
  return typeof value.id === "string"
    && Array.isArray(slotIds)
    && slotIds.length === 4
    && slotIds.every((slotId) => typeof slotId === "string")
    && new Set(slotIds).size === 4
    && Array.isArray(anchorSlotIds)
    && anchorSlotIds.length === 2
    && anchorSlotIds.every((slotId) => slotIds.includes(slotId))
    && Array.isArray(value.useLaneIds)
    && value.useLaneIds.length === 2
    && isPixelPoint(value.parentSocket);
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
  const supportParent = value.supportParent;
  const requiredSockets = [
    ...(isRecord(supportParent)
      ? ["base.support"]
      : ["base.floor", "sort.floor"]),
    "interaction.target",
    "output.primary",
    "effect.origin",
    "viewport.origin",
  ];
  for (const socketId of requiredSockets) {
    requireValue(
      issues,
      isPixelPoint(value.localSockets[socketId]),
      `spatial.localSockets.${socketId} must be an integer pixel point`,
    );
  }
  if (!isRecord(supportParent)) return;
  requireValue(
    issues,
    supportParent.placementPlane === "furniture-surface"
      && supportParent.activeOfficeImported === false,
    "support parent must remain an isolated furniture surface",
  );
  requireValue(
    issues,
    isRecord(supportParent.authority),
    "supportParent.authority must be an object",
  );
  if (isRecord(supportParent.authority)) {
    validateFileHash(
      supportParent.authority,
      "file",
      "sha256",
      "assets/game/manifests/",
      issues,
    );
    requireValue(
      issues,
      supportParent.authority.status === "owner-approved",
      "support parent authority must be owner-approved",
    );
  }
  const compatibleDepthSpans = supportParent.compatibleDepthSpans;
  const compatibleBlockSpans = supportParent.compatibleBlockSpans;
  requireValue(
    issues,
    Array.isArray(compatibleDepthSpans) !== Array.isArray(compatibleBlockSpans),
    "support parent must declare exactly one span geometry",
  );
  if (Array.isArray(compatibleBlockSpans)) {
    const blockSlotIds = compatibleBlockSpans.flatMap((span) =>
      isRecord(span) && Array.isArray(span.slotIds) ? span.slotIds : []);
    const validBlocks = compatibleBlockSpans.length > 0
      && compatibleBlockSpans.every(isCompleteBlockSpan);
    const selectedBlock = compatibleBlockSpans.find((span) =>
      isRecord(span) && span.id === supportParent.selectedBlockSpanId);
    const packing = supportParent.nonOverlappingPacking;
    requireValue(
      issues,
      validBlocks
        && new Set(compatibleBlockSpans.map((span) => span.id)).size
          === compatibleBlockSpans.length
        && new Set(blockSlotIds).size >= 4
        && isRecord(selectedBlock)
        && JSON.stringify(supportParent.occupiedSlotIds)
          === JSON.stringify(selectedBlock.slotIds)
        && JSON.stringify(supportParent.selectedAnchorSlotIds)
          === JSON.stringify(selectedBlock.anchorSlotIds)
        && JSON.stringify(supportParent.useLaneIds)
          === JSON.stringify(selectedBlock.useLaneIds)
        && JSON.stringify(supportParent.selectedParentSocket)
          === JSON.stringify(selectedBlock.parentSocket)
        && supportParent.anchorDerivation === "span-front-edge-midpoint",
      "support parent block placement must select one complete 2x2 block",
    );
    requireValue(
      issues,
      isRecord(packing)
        && packing.capacity === 3
        && Array.isArray(packing.spanIds)
        && packing.spanIds.length === 3
        && packing.overlapFailures === 0
        && supportParent.placementCases === compatibleBlockSpans.length
        && supportParent.supportFailures === 0
        && JSON.stringify(supportParent.attachmentDelta) === "[0,0]",
      "support parent block placement must prove three-item packing",
    );
    return;
  }
  const validDepthSpans = Array.isArray(compatibleDepthSpans)
    && compatibleDepthSpans.length > 0
    && compatibleDepthSpans.every((span) =>
      isRecord(span)
      && typeof span.id === "string"
      && Array.isArray(span.slotIds)
      && span.slotIds.length === 2
      && span.slotIds.every((slotId) => typeof slotId === "string")
      && new Set(span.slotIds).size === 2
      && typeof span.anchorSlotId === "string"
      && span.anchorSlotId === span.slotIds[1]
      && typeof span.useLaneId === "string");
  const depthSpanSlotIds = validDepthSpans
    ? compatibleDepthSpans.flatMap((span) => span.slotIds)
    : [];
  requireValue(
    issues,
    validDepthSpans
      && new Set(compatibleDepthSpans.map((span) => span.id)).size
        === compatibleDepthSpans.length
      && new Set(depthSpanSlotIds).size === depthSpanSlotIds.length,
    "support parent depth spans must be unique two-slot columns",
  );
  const selectedDepthSpan = Array.isArray(compatibleDepthSpans)
    ? compatibleDepthSpans.find((span) =>
      isRecord(span) && span.id === supportParent.selectedDepthSpanId)
    : undefined;
  requireValue(
    issues,
    typeof supportParent.supportPlaneId === "string"
      && typeof supportParent.selectedDepthSpanId === "string"
      && isRecord(selectedDepthSpan)
      && Array.isArray(supportParent.occupiedSlotIds)
      && supportParent.occupiedSlotIds.length === 2
      && JSON.stringify(supportParent.occupiedSlotIds)
        === JSON.stringify(selectedDepthSpan.slotIds)
      && typeof supportParent.selectedAnchorSlotId === "string"
      && supportParent.selectedAnchorSlotId === selectedDepthSpan.anchorSlotId
      && typeof supportParent.useLaneId === "string"
      && supportParent.useLaneId === selectedDepthSpan.useLaneId
      && isPixelPoint(supportParent.selectedParentSocket),
    "support parent placement must select one complete depth span and its front anchor",
  );
  requireValue(
    issues,
    Array.isArray(supportParent.attachmentDelta)
      && JSON.stringify(supportParent.attachmentDelta) === "[0,0]"
      && Array.isArray(compatibleDepthSpans)
      && supportParent.placementCases === compatibleDepthSpans.length
      && supportParent.supportFailures === 0,
    "support parent placement must prove every depth span with zero drift",
  );
}

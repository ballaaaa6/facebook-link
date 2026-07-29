import {
  hasSha256,
  isBox,
  isRecord,
  requireValue,
  type RecordValue,
  validateFileHash,
} from "./officeFacilityProductionValidationPrimitives.ts";

const outputPrefix = "assets/game/processed/office-facility-family-v1/";

function validateSource(value: unknown, issues: string[]) {
  requireValue(issues, isRecord(value), "source must be an object");
  if (!isRecord(value)) return;
  requireValue(
    issues,
    value.kind === "audited-original-mechanical-loop-master",
    "source.kind must identify an audited original mechanical-loop master",
  );
  requireValue(
    issues,
    typeof value.path === "string"
      && value.path.startsWith("assets/art/layout-references/")
      && !value.path.includes("/processed/"),
    "source.path must be an original layout-reference master",
  );
  requireValue(
    issues,
    value.extractionMethod === "full-master-component-ownership",
    "source extraction must use full-master component ownership",
  );
  requireValue(issues, hasSha256(value.sha256), "source.sha256 must be SHA-256");
  for (const field of ["keyedSource", "ownershipMask"]) {
    const evidence = value[field];
    requireValue(issues, isRecord(evidence), `source.${field} must be an object`);
    if (isRecord(evidence)) {
      validateFileHash(evidence, "file", "sha256", outputPrefix, issues);
    }
  }
  requireValue(
    issues,
    Array.isArray(value.frames) && value.frames.length > 0,
    "source.frames must contain audited frames",
  );
  if (!Array.isArray(value.frames)) return;
  const ids = new Set<string>();
  for (const [index, frame] of value.frames.entries()) {
    requireValue(issues, isRecord(frame), `source.frames[${index}] must be an object`);
    if (!isRecord(frame)) continue;
    requireValue(
      issues,
      typeof frame.frameId === "string" && !ids.has(frame.frameId),
      `source.frames[${index}].frameId must be unique`,
    );
    if (typeof frame.frameId === "string") ids.add(frame.frameId);
    requireValue(
      issues,
      isBox(frame.sourceBounds) && isBox(frame.ownedBounds),
      `source.frames[${index}] must contain valid bounds`,
    );
    requireValue(
      issues,
      frame.selectedComponentCount === 1
        && Number.isInteger(frame.selectedPixelCount)
        && (frame.selectedPixelCount as number) > 0,
      `source.frames[${index}] must select one non-empty component`,
    );
    requireValue(
      issues,
      frame.touchesMasterBoundary === false && frame.sourcePixelsResampled === false,
      `source.frames[${index}] must preserve pixels away from the master boundary`,
    );
    if (frame.touchesNominalCellBoundary === true) {
      const review = frame.boundaryReview;
      requireValue(
        issues,
        isRecord(review)
          && review.status === "passed-complete-silhouette"
          && typeof review.reason === "string"
          && review.reason.length > 0,
        `source.frames[${index}] must explain its complete boundary silhouette`,
      );
    }
    validateFileHash(
      frame,
      "authoringCutout",
      "authoringCutoutSha256",
      outputPrefix,
      issues,
    );
  }
}

function validateRender(value: unknown, issues: string[]) {
  requireValue(issues, isRecord(value), "render must be an object");
  if (!isRecord(value)) return;
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
    "render.uniformIntegerDivisor must be positive",
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
    value.nonUniformScaling === false && value.anchor === "bottom-center",
    "render must use bottom-center without non-uniform scaling",
  );
  requireValue(
    issues,
    Array.isArray(value.requiredOrientations)
      && value.requiredOrientations.length > 0
      && new Set(value.requiredOrientations).size === value.requiredOrientations.length,
    "render.requiredOrientations must be non-empty and unique",
  );
}

function validateParts(
  value: unknown,
  issues: string[],
): Map<string, RecordValue> {
  requireValue(issues, Array.isArray(value), "parts must be an array");
  if (!Array.isArray(value)) return new Map();
  const parts = new Map<string, RecordValue>();
  const roles = new Set<string>();
  const supported = new Set([
    "static-shell",
    "animation-viewport",
    "pickup-tray-empty",
    "effect-overlay",
    "held-output",
  ]);
  for (const [index, part] of value.entries()) {
    requireValue(issues, isRecord(part), `parts[${index}] must be an object`);
    if (!isRecord(part)) continue;
    requireValue(
      issues,
      typeof part.id === "string" && !parts.has(part.id),
      `parts[${index}].id must be unique`,
    );
    if (typeof part.id === "string") parts.set(part.id, part);
    requireValue(
      issues,
      supported.has(String(part.role)),
      `parts[${index}].role is unsupported`,
    );
    roles.add(String(part.role));
    validateFileHash(
      part,
      "authoringFile",
      "authoringSha256",
      outputPrefix,
      issues,
    );
    validateFileHash(
      part,
      "runtimeFile",
      "runtimeSha256",
      outputPrefix,
      issues,
    );
  }
  for (const role of supported) {
    requireValue(issues, roles.has(role), `parts must contain ${role}`);
  }
  return parts;
}

function validateAnimation(
  value: unknown,
  parts: Map<string, RecordValue>,
  render: unknown,
  issues: string[],
) {
  requireValue(issues, isRecord(value), "animation must be an object");
  if (!isRecord(value)) return;
  requireValue(
    issues,
    Number.isInteger(value.frameCount) && (value.frameCount as number) > 1,
    "animation.frameCount must exceed one",
  );
  requireValue(
    issues,
    typeof value.shellPartId === "string"
      && parts.get(value.shellPartId)?.role === "static-shell",
    "animation.shellPartId must reference the static shell",
  );
  requireValue(
    issues,
    isBox(value.viewportBoundsAuthoring) && isBox(value.viewportBoundsRuntime),
    "animation viewport bounds are invalid",
  );
  if (
    isBox(value.viewportBoundsAuthoring)
    && isBox(value.viewportBoundsRuntime)
    && isRecord(render)
    && Array.isArray(render.authoringCanvas)
    && Array.isArray(render.runtimeCanvas)
  ) {
    const authoringBox = value.viewportBoundsAuthoring as number[];
    const runtimeBox = value.viewportBoundsRuntime as number[];
    const authoringCanvas = render.authoringCanvas as number[];
    const runtimeCanvas = render.runtimeCanvas as number[];
    requireValue(
      issues,
      authoringBox[0]! >= 0
        && authoringBox[1]! >= 0
        && authoringBox[2]! <= authoringCanvas[0]!
        && authoringBox[3]! <= authoringCanvas[1]!
        && runtimeBox[0]! >= 0
        && runtimeBox[1]! >= 0
        && runtimeBox[2]! <= runtimeCanvas[0]!
        && runtimeBox[3]! <= runtimeCanvas[1]!,
      "animation viewport must remain inside both canvases",
    );
  }
  for (const field of [
    "shellStableAcrossFrames",
    "basePivotStableAcrossFrames",
    "sortPivotStableAcrossFrames",
  ]) {
    requireValue(issues, value[field] === true, `animation.${field} must be true`);
  }
  requireValue(
    issues,
    value.outsideViewportChangedPixels === 0,
    "animation changed pixels outside the local viewport",
  );
  requireValue(
    issues,
    Array.isArray(value.frames) && value.frames.length === value.frameCount,
    "animation frames must match frameCount",
  );
  if (!Array.isArray(value.frames)) return;
  for (const [index, frame] of value.frames.entries()) {
    requireValue(issues, isRecord(frame), `animation.frames[${index}] must be an object`);
    if (!isRecord(frame)) continue;
    requireValue(
      issues,
      typeof frame.viewportPartId === "string"
        && parts.get(frame.viewportPartId)?.role === "animation-viewport",
      `animation.frames[${index}] must reference a viewport part`,
    );
    requireValue(
      issues,
      Array.isArray(frame.effectPartIds)
        && frame.effectPartIds.every(
          (id) => parts.get(id)?.role === "effect-overlay",
        ),
      `animation.frames[${index}] has an invalid effect part`,
    );
    requireValue(
      issues,
      Number.isInteger(frame.durationMs) && (frame.durationMs as number) > 0,
      `animation.frames[${index}].durationMs must be positive`,
    );
    validateFileHash(
      frame,
      "authoringCompositeFile",
      "authoringCompositeSha256",
      outputPrefix,
      issues,
    );
    validateFileHash(
      frame,
      "runtimeCompositeFile",
      "runtimeCompositeSha256",
      outputPrefix,
      issues,
    );
  }
}

function validateOutputHandoff(
  value: unknown,
  parts: Map<string, RecordValue>,
  issues: string[],
) {
  requireValue(issues, isRecord(value), "outputHandoff must be an object");
  if (!isRecord(value)) return;
  requireValue(
    issues,
    parts.get(String(value.pickupTrayPartId))?.role === "pickup-tray-empty",
    "outputHandoff must reference the empty pickup tray",
  );
  requireValue(
    issues,
    parts.get(String(value.heldAssetPartId))?.role === "held-output",
    "outputHandoff must reference a separate held output",
  );
  requireValue(
    issues,
    Array.isArray(value.effectPartIds)
      && value.effectPartIds.every(
        (id) => parts.get(id)?.role === "effect-overlay",
      ),
    "outputHandoff effect overlays are invalid",
  );
  requireValue(
    issues,
    value.productEmbeddedInShell === false
      && value.productEmbeddedInViewportFrames === false,
    "held output pixels must not be embedded in the machine",
  );
  requireValue(
    issues,
    value.transition === "pickup-tray-to-held-prop-layer",
    "output handoff transition is unsupported",
  );
}

export function validateFacilityAssetContract(
  manifest: RecordValue,
  issues: string[],
) {
  validateSource(manifest.source, issues);
  validateRender(manifest.render, issues);
  const parts = validateParts(manifest.parts, issues);
  validateAnimation(manifest.animation, parts, manifest.render, issues);
  validateOutputHandoff(manifest.outputHandoff, parts, issues);
}

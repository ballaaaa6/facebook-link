import {
  officeHeldPropProfiles,
  type OfficePixelPoint,
} from "./officeSpatialProduction.ts";

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function point(value: unknown): value is OfficePixelPoint {
  return Array.isArray(value)
    && value.length === 2
    && value.every(Number.isInteger);
}

function requireValue(
  issues: string[],
  condition: boolean,
  message: string,
) {
  if (!condition) issues.push(message);
}

function validateFileHash(
  value: unknown,
  path: string,
  issues: string[],
) {
  requireValue(issues, record(value), `${path} must be an object`);
  if (!record(value)) return;
  requireValue(
    issues,
    typeof value.file === "string" && value.file.length > 0,
    `${path}.file must be present`,
  );
  requireValue(
    issues,
    typeof value.sha256 === "string" && /^[a-f0-9]{64}$/.test(value.sha256),
    `${path}.sha256 must be a SHA-256 digest`,
  );
}

function validateGates(value: unknown, path: string, issues: string[]) {
  requireValue(issues, record(value), `${path} must be an object`);
  if (!record(value)) return;
  for (let index = 0; index <= 8; index += 1) {
    const gate = value[`F${index}`];
    requireValue(issues, record(gate), `${path}.F${index} must be an object`);
    if (!record(gate)) continue;
    requireValue(
      issues,
      gate.status === (index === 8 ? "pending-owner-review" : "passed"),
      `${path}.F${index} has the wrong status`,
    );
    requireValue(
      issues,
      Array.isArray(gate.evidence) && gate.evidence.length > 0,
      `${path}.F${index}.evidence must not be empty`,
    );
  }
}

export function validateOfficeCharacterActionSocketsManifest(
  value: unknown,
): string[] {
  if (!record(value)) return ["character sockets manifest must be an object"];
  const issues: string[] = [];
  requireValue(issues, value.schemaVersion === 1, "schemaVersion must equal 1");
  requireValue(
    issues,
    value.id === "office.character-action-sockets.i01",
    "character sockets identity is wrong",
  );
  requireValue(
    issues,
    value.status === "owner-review-f8-pending",
    "character sockets must stop at F8",
  );
  requireValue(issues, value.activeOfficeImported === false, "Active Office import is forbidden");
  requireValue(issues, value.characterCount === 18, "characterCount must equal 18");
  requireValue(issues, value.frameRecordCount === 108, "frameRecordCount must equal 108");
  requireValue(issues, value.foregroundMaskCount === 54, "foregroundMaskCount must equal 54");
  validateFileHash(value.authoringInput, "authoringInput", issues);
  validateGates(value.gates, "gates", issues);
  requireValue(issues, value.ownerDecision === null, "ownerDecision must remain null before F8");
  const characters = Array.isArray(value.characters) ? value.characters : [];
  requireValue(issues, characters.length === 18, "characters must contain eighteen records");
  const ids = new Set<string>();
  let maskCount = 0;
  for (const [characterIndex, character] of characters.entries()) {
    const base = `characters[${characterIndex}]`;
    requireValue(issues, record(character), `${base} must be an object`);
    if (!record(character)) continue;
    requireValue(
      issues,
      typeof character.id === "string" && !ids.has(character.id),
      `${base}.id must be unique`,
    );
    if (typeof character.id === "string") ids.add(character.id);
    requireValue(
      issues,
      JSON.stringify(character.frameSize) === JSON.stringify([96, 104]),
      `${base}.frameSize must equal 96 x 104`,
    );
    const frames = Array.isArray(character.frames) ? character.frames : [];
    requireValue(issues, frames.length === 6, `${base}.frames must contain six records`);
    for (const [frameIndex, frame] of frames.entries()) {
      const framePath = `${base}.frames[${frameIndex}]`;
      requireValue(issues, record(frame), `${framePath} must be an object`);
      if (!record(frame)) continue;
      requireValue(issues, frame.frame === frameIndex, `${framePath}.frame is out of order`);
      for (const key of ["rootSocket", "primaryGripSocket", "secondaryGripSocket"]) {
        requireValue(issues, point(frame[key]), `${framePath}.${key} must be an integer point`);
      }
      const mask = frame.foregroundMask;
      if ([2, 3, 4].includes(frameIndex)) {
        requireValue(issues, record(mask), `${framePath}.foregroundMask is required`);
        if (record(mask)) {
          validateFileHash(mask, `${framePath}.foregroundMask`, issues);
          requireValue(
            issues,
            Number.isInteger(mask.pixelCount) && Number(mask.pixelCount) > 0,
            `${framePath}.foregroundMask must contain source pixels`,
          );
          requireValue(
            issues,
            mask.sourcePixelExact === true,
            `${framePath}.foregroundMask must be source-pixel exact`,
          );
          maskCount += 1;
        }
      } else {
        requireValue(issues, mask === null, `${framePath}.foregroundMask must be null`);
      }
    }
  }
  requireValue(issues, maskCount === 54, "exactly 54 held-frame masks are required");
  return issues;
}

export function validateOfficeHeldPropsManifest(value: unknown): string[] {
  if (!record(value)) return ["held props manifest must be an object"];
  const issues: string[] = [];
  requireValue(issues, value.schemaVersion === 1, "schemaVersion must equal 1");
  requireValue(issues, value.id === "office.held-props.h01", "held props identity is wrong");
  requireValue(issues, value.status === "owner-review-f8-pending", "held props must stop at F8");
  requireValue(issues, value.activeOfficeImported === false, "Active Office import is forbidden");
  requireValue(issues, value.count === 16, "held props count must equal 16");
  validateFileHash(value.authoringInput, "authoringInput", issues);
  validateGates(value.gates, "gates", issues);
  requireValue(issues, value.ownerDecision === null, "ownerDecision must remain null before F8");
  const policy = record(value.sourcePolicy) ? value.sourcePolicy : {};
  for (const key of [
    "processedPixelReuse",
    "activeOfficePixelReuse",
    "missingAssetFallback",
    "runtimeScaling",
  ]) {
    requireValue(issues, policy[key] === false, `sourcePolicy.${key} must be false`);
  }
  const props = Array.isArray(value.props) ? value.props : [];
  requireValue(issues, props.length === 16, "props must contain sixteen records");
  const ids = new Set<string>();
  for (const [index, prop] of props.entries()) {
    const path = `props[${index}]`;
    requireValue(issues, record(prop), `${path} must be an object`);
    if (!record(prop)) continue;
    requireValue(
      issues,
      typeof prop.id === "string" && !ids.has(prop.id),
      `${path}.id must be unique`,
    );
    if (typeof prop.id === "string") ids.add(prop.id);
    requireValue(
      issues,
      officeHeldPropProfiles.includes(prop.profile as never),
      `${path}.profile is unsupported`,
    );
    requireValue(issues, point(prop.primaryGripSocket), `${path}.primaryGripSocket is invalid`);
    requireValue(
      issues,
      prop.secondaryGripSocket === null || point(prop.secondaryGripSocket),
      `${path}.secondaryGripSocket is invalid`,
    );
    requireValue(issues, prop.runtimeScale === 1, `${path}.runtimeScale must equal one`);
    requireValue(issues, point(prop.visualCenterSocket), `${path}.visualCenterSocket is invalid`);
    requireValue(
      issues,
      ["primary-hand", "midpoint-primary-secondary"].includes(
        String(prop.actorSocketRule),
      ),
      `${path}.actorSocketRule is invalid`,
    );
    requireValue(
      issues,
      prop.attachmentMode === "front-overlay"
        && prop.layerRole === "front-overlay",
      `${path} must use the front-overlay presentation`,
    );
    for (const key of ["runtimeSha256", "authoringSha256"]) {
      requireValue(
        issues,
        typeof prop[key] === "string" && /^[a-f0-9]{64}$/.test(prop[key]),
        `${path}.${key} must be a SHA-256 digest`,
      );
    }
  }
  return issues;
}

export function validateOfficeSpatialAuthorityManifest(value: unknown): string[] {
  if (!record(value)) return ["spatial authority manifest must be an object"];
  const issues: string[] = [];
  requireValue(issues, value.schemaVersion === 1, "schemaVersion must equal 1");
  requireValue(
    issues,
    value.id === "office.spatial-socket-authority.i01",
    "spatial authority identity is wrong",
  );
  requireValue(issues, value.status === "owner-review-f8-pending", "spatial authority must stop at F8");
  requireValue(issues, value.activeOfficeImported === false, "Active Office import is forbidden");
  const policies = record(value.policies) ? value.policies : {};
  for (const key of [
    "centerToCenterAttachment",
    "perSceneAttachmentOffsets",
    "perCharacterRuntimeScale",
    "normalizedCoordinatesAuthority",
    "missingSocketFallback",
    "activeOfficeImport",
  ]) {
    requireValue(issues, policies[key] === false, `policies.${key} must be false`);
  }
  const matrix = record(value.matrixValidation) ? value.matrixValidation : {};
  requireValue(issues, matrix.visibleCaseCount === 864, "visibleCaseCount must equal 864");
  requireValue(issues, matrix.absentCaseCount === 54, "absentCaseCount must equal 54");
  requireValue(issues, matrix.attachmentDeltaFailures === 0, "attachment deltas must be zero");
  requireValue(issues, matrix.runtimeScaleFailures === 0, "runtime scaling is forbidden");
  requireValue(issues, matrix.missingMaskFailures === 0, "held frames require masks");
  requireValue(issues, matrix.frontOverlayCaseCount === 864, "front overlay matrix is incomplete");
  requireValue(issues, matrix.foregroundMaskUses === 0, "front overlays cannot use hand masks");
  requireValue(issues, matrix.visibleAlphaFailures === 0, "front overlay prop alpha must remain visible");
  const movement = record(value.movementValidation) ? value.movementValidation : {};
  requireValue(
    issues,
    movement.maximumAttachmentDeltaPixels === 0
      && movement.propFollowFailures === 0,
    "movement attachment must remain exact",
  );
  requireValue(issues, value.ownerDecision === null, "ownerDecision must remain null before F8");
  validateGates(value.gates, "gates", issues);
  return issues;
}

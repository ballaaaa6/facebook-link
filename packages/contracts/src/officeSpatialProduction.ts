import type {
  OfficeScreenPoint,
  OfficeWorldPoint,
} from "./officeSpatialProjection.ts";

export const officeSpatialSocketKinds = [
  "root.floor",
  "root.seat",
  "body.center",
  "head.center",
  "hand.primary.grip",
  "hand.secondary.grip",
  "grip.primary",
  "grip.secondary",
  "visual.center",
  "interaction.tip",
  "output.contact",
  "base.floor",
  "sort.floor",
  "interaction.target",
  "output.primary",
  "effect.origin",
  "support.primary",
  "viewport.origin",
] as const;

export const officeHeldPropProfiles = [
  "single-body",
  "single-handle",
  "two-hand-wide",
] as const;

export const officeAttachmentLayerRoles = [
  "behind-actor",
  "between-actor-and-hand",
  "front-effect",
] as const;

export type OfficeSpatialSocketKind =
  (typeof officeSpatialSocketKinds)[number];
export type OfficeHeldPropProfile =
  (typeof officeHeldPropProfiles)[number];
export type OfficeAttachmentLayerRole =
  (typeof officeAttachmentLayerRoles)[number];
export type OfficePixelPoint = readonly [number, number];
export type OfficeSpatialGate = `F${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`;
export type OfficeSpatialGateRecord = Record<
  OfficeSpatialGate,
  {
    status: "passed" | "pending-owner-review";
    evidence: readonly string[];
  }
>;

export interface OfficeWorldTransform {
  position: OfficeWorldPoint;
  orientation: "front" | "back" | "left" | "right";
}

export interface OfficeCharacterFrameSocket {
  frame: number;
  rootSocket: OfficePixelPoint;
  primaryGripSocket: OfficePixelPoint;
  secondaryGripSocket: OfficePixelPoint;
  holdState: "none" | "reach" | "held" | "release";
  foregroundMask: null | {
    file: string;
    sha256: string;
    pixelCount: number;
    sourcePixelExact: true;
  };
}

export interface OfficeCharacterActionSocketRecord {
  id: string;
  sheet: string;
  sheetSha256: string;
  frameSize: readonly [96, 104];
  pose: "interact-front";
  row: 10;
  frames: readonly OfficeCharacterFrameSocket[];
}

export interface OfficeCharacterActionSocketsManifest {
  schemaVersion: 1;
  id: "office.character-action-sockets.i01";
  status: "owner-review-f8-pending";
  developmentOnly: true;
  pendingCommercialReview: true;
  activeOfficeImported: false;
  coordinateRules: {
    localUnit: "runtime-pixel-1x";
    integerCoordinatesOnly: true;
    fullFrameOrigin: "top-left";
    normalizedCoordinatesAuthority: false;
    density2xDerivation: "multiply-by-two";
    missingSocketFallback: false;
  };
  authoringInput: { file: string; sha256: string };
  pose: "interact-front";
  row: 10;
  activeFrames: 6;
  heldFrames: readonly [2, 3, 4];
  characterCount: 18;
  frameRecordCount: 108;
  foregroundMaskCount: 54;
  characters: readonly OfficeCharacterActionSocketRecord[];
  gates: OfficeSpatialGateRecord;
  ownerDecision: null;
}

export interface OfficeHeldPropRecord {
  id: string;
  auditRecordId: string;
  sourceCell: readonly [number, number];
  sourceBounds: readonly [number, number, number, number];
  sourceCutout: { file: string; sha256: string };
  profile: OfficeHeldPropProfile;
  runtimeCanvas: readonly [20, 20];
  authoringCanvas: readonly [40, 40];
  runtimeFile: string;
  runtimeSha256: string;
  authoringFile: string;
  authoringSha256: string;
  alphaBoundsRuntime: readonly [number, number, number, number];
  primaryGripSocket: OfficePixelPoint;
  secondaryGripSocket: OfficePixelPoint | null;
  layerRole: "between-actor-and-hand";
  runtimeScale: 1;
}

export interface OfficeHeldPropsManifest {
  schemaVersion: 1;
  id: "office.held-props.h01";
  status: "owner-review-f8-pending";
  developmentOnly: true;
  activeOfficeImported: false;
  sourcePolicy: {
    originalAuditedMasterOnly: true;
    processedPixelReuse: false;
    activeOfficePixelReuse: false;
    missingAssetFallback: false;
    runtimeScaling: false;
  };
  source: {
    path: string;
    sha256: string;
    auditManifest: string;
    extractionMethod: "fresh-full-master-cell-ownership";
    keyedMaster: { file: string; sha256: string };
    ownershipMask: { file: string; sha256: string };
  };
  authoringInput: { file: string; sha256: string };
  count: 16;
  props: readonly OfficeHeldPropRecord[];
  gates: OfficeSpatialGateRecord;
  ownerDecision: null;
}

export interface OfficeResolvedAttachment {
  parentOrigin: OfficeScreenPoint;
  parentSocketWorld: OfficeScreenPoint;
  childOrigin: OfficeScreenPoint;
  attachmentDelta: OfficeScreenPoint;
  layerRole: OfficeAttachmentLayerRole;
}

export interface OfficeAttachmentMatrixValidation {
  characterCount: 18;
  propCount: 16;
  heldFrameCount: 3;
  visibleCaseCount: 864;
  absentCaseCount: 54;
  exactPrimarySocketCaseCount: 864;
  attachmentDeltaFailures: 0;
  runtimeScaleFailures: 0;
  missingMaskFailures: 0;
}

export interface OfficeSpatialAuthorityManifest {
  schemaVersion: 1;
  id: "office.spatial-socket-authority.i01";
  status: "owner-review-f8-pending";
  developmentOnly: true;
  activeOfficeImported: false;
  world: {
    tilePixels: 32;
    axes: {
      x: "increases-right";
      y: "increases-toward-viewer";
      z: "increases-up";
    };
    projection: {
      screenX: "worldX * 32";
      screenY: "worldY * 32 - worldZ * 32";
    };
  };
  local: {
    unit: "runtime-pixel-1x";
    integerCoordinatesOnly: true;
    canvasOrigin: "top-left";
  };
  formula: {
    entityOrigin: "project(worldPosition) - rootSocket";
    parentSocketWorld: "parentOrigin + parentLocalSocket";
    childOrigin: "parentSocketWorld - childLocalSocket";
  };
  authorities: {
    characterActions: { file: string; sha256: string };
    heldProps: { file: string; sha256: string };
    approvedSeatSockets: { file: string; sha256: string };
    seatingS01: { file: string; sha256: string };
  };
  policies: {
    centerToCenterAttachment: false;
    perSceneAttachmentOffsets: false;
    perCharacterRuntimeScale: false;
    normalizedCoordinatesAuthority: false;
    missingSocketFallback: false;
    activeOfficeImport: false;
  };
  matrixValidation: OfficeAttachmentMatrixValidation;
  movementValidation: {
    worldPositionsTested: number;
    frameCasesTested: number;
    maximumAttachmentDeltaPixels: 0;
    propFollowFailures: 0;
  };
  gates: OfficeSpatialGateRecord;
  reviewOutputs: readonly string[];
  reviewEvidence: readonly { file: string; sha256: string }[];
  ownerDecision: null;
}

export {
  officeAttachmentRenderOrder,
  resolveOfficeAttachment,
  resolveOfficeEntityOrigin,
} from "./officeSpatialAttachment.ts";

export {
  validateOfficeCharacterActionSocketsManifest,
  validateOfficeHeldPropsManifest,
  validateOfficeSpatialAuthorityManifest,
} from "./officeSpatialProductionValidation.ts";

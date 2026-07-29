import type {
  OfficeGeometryV3,
  OfficeOrientation,
} from "./officeGeometry.ts";

export const officeFacilityProductionGates = [
  "F0",
  "F1",
  "F2",
  "F3",
  "F4",
  "F5",
  "F6",
  "F7",
  "F8",
  "F9",
  "F10",
] as const;

export const officeFacilityInteractionStates = [
  "available",
  "reserved",
  "approaching",
  "interacting",
  "dispensing",
  "releasing",
] as const;

export type OfficeFacilityProductionGate =
  (typeof officeFacilityProductionGates)[number];
export type OfficeFacilityGateStatus =
  | "passed"
  | "pending-owner-review"
  | "blocked";
export type OfficeFacilityInteractionState =
  (typeof officeFacilityInteractionStates)[number];

export interface OfficeFacilitySourceFrameEvidence {
  frameId: string;
  auditRecordId: string;
  sourceBounds: readonly [number, number, number, number];
  ownedBounds: readonly [number, number, number, number];
  selectedComponentCount: 1;
  selectedPixelCount: number;
  touchesNominalCellBoundary: boolean;
  touchesMasterBoundary: false;
  sourcePixelsResampled: false;
  boundaryReview?: {
    status: "passed-complete-silhouette";
    reason: string;
  };
  authoringCutout: string;
  authoringCutoutSha256: string;
}

export interface OfficeFacilitySourceEvidence {
  kind:
    | "audited-original-mechanical-loop-master"
    | "audited-original-neutral-master"
    | "generated-isolated-clean-source";
  path: string;
  sha256: string;
  auditManifest: string;
  extractionMethod:
    | "full-master-component-ownership"
    | "generated-source-chroma-key";
  keyedSource: { file: string; sha256: string };
  ownershipMask: { file: string; sha256: string };
  frames: readonly OfficeFacilitySourceFrameEvidence[];
}

export type OfficeFacilityPartRole =
  | "static-shell"
  | "animation-viewport"
  | "pickup-tray-empty"
  | "output-bay-empty"
  | "effect-overlay"
  | "held-output";

export interface OfficeFacilityPartEvidence {
  id: string;
  role: OfficeFacilityPartRole;
  state?: string;
  sourceFrame: string;
  authoringFile: string;
  authoringSha256: string;
  runtimeFile: string;
  runtimeSha256: string;
}

export interface OfficeFacilityAnimationFrame {
  id: string;
  viewportPartId: string;
  effectPartIds: readonly string[];
  durationMs: number;
  authoringCompositeFile: string;
  authoringCompositeSha256: string;
  runtimeCompositeFile: string;
  runtimeCompositeSha256: string;
}

export interface OfficeFacilityPoseSource {
  manifest: string;
  manifestSha256: string;
  characterIds: readonly string[];
}

export interface OfficeFacilityRosterValidation {
  visualPose: "interact-front";
  poseAuthority: {
    manifest: string;
    manifestSha256: string;
    status: "owner-review-f8-pending" | "owner-approved";
    activeOfficeImported: false;
  };
  spatialAuthority: {
    manifest: string;
    manifestSha256: string;
    status: "owner-review-f8-pending" | "owner-approved";
    activeOfficeImported: false;
  };
  heldPropAuthority: {
    manifest: string;
    manifestSha256: string;
    assetId: string;
    assetSha256: string;
    runtimeScale: 1;
  };
  row: number;
  activeFrames: number;
  characterCount: number;
  validatedPoseCases: number;
  visiblePropCases: number;
  facilityOutputAttachmentCases: number;
  actorHandAttachmentCases: number;
  attachmentDeltaFailures: 0;
  frontOverlayCases: 36;
  foregroundMaskUses: 0;
  visibleAlphaFailures: 0;
  sharedActorPosition: readonly [number, number];
  perCharacterFacilityScaling: false;
  perCharacterActorOffsets: false;
  poseSources: readonly OfficeFacilityPoseSource[];
  characters: readonly {
    id: string;
    sheet: string;
    sha256: string;
    frames: readonly {
      frame: number;
      frameBounds: readonly [number, number, number, number] | null;
      actorPosition: readonly [number, number];
      actorInsideReviewCard: boolean;
      facilityOverlapPixels: number;
      heldAssetVisible: boolean;
      heldByActor: boolean;
      attachmentParent:
        | "facility.output.primary"
        | "actor.hand.primary.grip"
        | null;
      rootSocket: readonly [number, number];
      primaryGripSocket: readonly [number, number];
      secondaryGripSocket: readonly [number, number] | null;
      propGripSocket: readonly [number, number];
      propVisualCenterSocket: readonly [number, number];
      propOrigin: readonly [number, number] | null;
      parentSocketWorld: readonly [number, number] | null;
      attachmentDelta: readonly [number, number] | null;
      foregroundMask: {
        file: string;
        sha256: string;
      } | null;
      foregroundMaskUsed: false;
      visiblePropAlphaFraction: 1 | null;
      renderOrder: readonly string[];
    }[];
  }[];
}

export interface OfficeFacilityProductionManifest {
  schemaVersion: 2;
  id: string;
  familyId: string;
  revision: string;
  status: "owner-review-f8-pending" | "owner-approved" | "rejected";
  developmentOnly: true;
  activeOfficePromotion: false;
  sourcePolicy: {
    processedCropDirectReuse: false;
    activeOfficePixelReuse: false;
    legacyOrRejectedPixelReuse: false;
    stagingPixelReuse: false;
    generativeRepair: false;
    missingAssetFallback: false;
    sharedProductionAssetDependency: string;
  };
  source: OfficeFacilitySourceEvidence;
  render: {
    authoringCanvas: readonly [number, number];
    runtimeCanvas: readonly [number, number];
    uniformIntegerDivisor: number;
    nonUniformScaling: false;
    anchor: "bottom-center";
    requiredOrientations: readonly Exclude<OfficeOrientation, "none">[];
  };
  spatial: {
    authority: {
      file: string;
      sha256: string;
      id: string;
      status: "owner-review-f8-pending" | "owner-approved";
    };
    coordinateSpace: "facility-runtime-pixel";
    unit: "pixel";
    localSockets: Record<string, readonly [number, number]>;
    supportParent?: {
      authority: {
        file: string;
        sha256: string;
        id: string;
        revision: string;
        status: "owner-approved";
      };
      placementPlane: "furniture-surface";
      supportPlaneId: string;
      compatibleDepthSpans?: readonly {
        id: string;
        slotIds: readonly [string, string];
        anchorSlotId: string;
        useLaneId: string;
      }[];
      compatibleBlockSpans?: readonly {
        id: string;
        slotIds: readonly [string, string, string, string];
        anchorSlotIds: readonly [string, string];
        useLaneIds: readonly [string, string];
        parentSocket: readonly [number, number];
      }[];
      selectedDepthSpanId?: string;
      selectedBlockSpanId?: string;
      occupiedSlotIds: readonly string[];
      selectedAnchorSlotId?: string;
      selectedAnchorSlotIds?: readonly [string, string];
      useLaneId?: string;
      useLaneIds?: readonly [string, string];
      anchorDerivation?: "span-front-edge-midpoint";
      selectedParentSocket: readonly [number, number];
      attachmentDelta: readonly [0, 0];
      placementCases: number;
      supportFailures: 0;
      activeOfficeImported: false;
      nonOverlappingPacking?: {
        capacity: 3;
        spanIds: readonly [string, string, string];
        overlapFailures: 0;
      };
    };
    perSceneAttachmentOffsets: false;
    centerToCenterAttachment: false;
    missingSocketFallback: false;
  };
  geometry: OfficeGeometryV3;
  geometryCalibration?: {
    auditRenderBox: readonly [1, 3];
    guideRenderBox: readonly [1, 2];
    selectedRenderBox: readonly [2, 3];
    selectedPhysicalScale: readonly [1, 2, 2];
    sourceSilhouettePixels: readonly [number, number];
    sourceAspectPreserved: true;
    uniformScalingOnly: true;
    decision: string;
  };
  parts: readonly OfficeFacilityPartEvidence[];
  animation: {
    frameCount: number;
    shellPartId: string;
    viewportBoundsAuthoring: readonly [number, number, number, number];
    viewportBoundsRuntime: readonly [number, number, number, number];
    shellStableAcrossFrames: true;
    basePivotStableAcrossFrames: true;
    sortPivotStableAcrossFrames: true;
    outsideViewportChangedPixels: 0;
    frames: readonly OfficeFacilityAnimationFrame[];
  };
  outputHandoff: {
    pickupTrayPartId?: string;
    emptyOutputPartId?: string;
    heldAssetPartId: string;
    heldAssetId: string;
    heldAssetManifest: string;
    heldAssetManifestSha256: string;
    heldAssetRuntimeSha256: string;
    effectPartIds: readonly string[];
    productEmbeddedInShell: false;
    productEmbeddedInViewportFrames: false;
    transition: "facility-output-socket-to-actor-hand-socket";
    heldVisiblePoseFrames: readonly [2, 3, 4];
    facilityOutputSocketId: "output.primary";
    actorGripSocketId: "hand.primary.grip";
    propGripSocketId: "visual.center";
    attachmentMode: "front-overlay";
    renderOrder: readonly ["actor-body", "held-prop"];
    runtimeScale: 1;
    handForegroundMaskRequired: false;
    foregroundMaskUses: 0;
    visibleAlphaFailures: 0;
    attachmentDeltaFailures: 0;
    timeline: readonly {
      poseFrame: number;
      attachmentParent:
        | "facility.output.primary"
        | "actor.hand.primary.grip"
        | null;
    }[];
  };
  interaction: {
    capacity: number;
    durationSeconds: number;
    atomicReservation: true;
    releaseOnFailure: true;
    states: readonly OfficeFacilityInteractionState[];
    slot: {
      id: string;
      stand: { x: number; y: number };
      approach: { x: number; y: number };
      exit: { x: number; y: number };
      facing: Exclude<OfficeOrientation, "none">;
      action: string;
      visualPose: "interact-front";
      reservationId: string;
    };
  };
  rosterValidation: OfficeFacilityRosterValidation;
  reservationValidation: {
    durationSeconds: number;
    actorCount: number;
    maximumConcurrentReservations: number;
    collisionCount: number;
    blockedAttemptCount: number;
    failureCount: number;
    retrySuccessCount: number;
    releasedAtEnd: boolean;
    samples: readonly {
      second: number;
      heldBy: string | null;
      actorStates: Record<string, string>;
    }[];
  };
  gates: Record<
    OfficeFacilityProductionGate,
    { status: OfficeFacilityGateStatus; evidence: readonly string[] }
  >;
  reviewOutputs: readonly string[];
  permissions: {
    familyLab: true;
    ownerReview: boolean;
    furnitureOnlyRoom: false;
    otherFacilityFamilies: boolean;
    activeOfficePromotion: false;
  };
  activeOfficeEvidence?: {
    file: string;
    sha256: string;
    imported: false;
  };
  ownerDecision: null | {
    decision: "approved" | "rejected";
    decidedOn: string;
    notes: string;
  };
}

export {
  validateOfficeFacilityProductionManifest,
} from "./officeFacilityProductionValidation.ts";

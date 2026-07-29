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
  kind: "audited-original-mechanical-loop-master";
  path: string;
  sha256: string;
  auditManifest: string;
  extractionMethod: "full-master-component-ownership";
  keyedSource: { file: string; sha256: string };
  ownershipMask: { file: string; sha256: string };
  frames: readonly OfficeFacilitySourceFrameEvidence[];
}

export type OfficeFacilityPartRole =
  | "static-shell"
  | "animation-viewport"
  | "pickup-tray-empty"
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
    status: "frozen-prototype-internal";
    activeOfficeImported: false;
  };
  row: number;
  activeFrames: number;
  characterCount: number;
  validatedPoseCases: number;
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
    }[];
  }[];
}

export interface OfficeFacilityProductionManifest {
  schemaVersion: 1;
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
  geometry: OfficeGeometryV3;
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
    pickupTrayPartId: string;
    heldAssetPartId: string;
    effectPartIds: readonly string[];
    productEmbeddedInShell: false;
    productEmbeddedInViewportFrames: false;
    transition: "pickup-tray-to-held-prop-layer";
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
  ownerDecision: null | {
    decision: "approved" | "rejected";
    decidedOn: string;
    notes: string;
  };
}

export {
  validateOfficeFacilityProductionManifest,
} from "./officeFacilityProductionValidation.ts";

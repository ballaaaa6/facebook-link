export const officeFacilityUpsizeProductionOrientations = [
  "front", "right", "back", "left",
] as const;

export const officeFacilityUpsizeProductionGates = [
  "F0", "F1", "F2", "F3", "F4", "F5",
  "F6", "F7", "F8", "F9", "F10",
] as const;

export type OfficeFacilityUpsizeProductionOrientation =
  (typeof officeFacilityUpsizeProductionOrientations)[number];
export type OfficeFacilityUpsizeProductionGate =
  (typeof officeFacilityUpsizeProductionGates)[number];

export interface OfficeFacilityUpsizeProductionAsset {
  file: string;
  sha256: string;
  size: readonly [number, number];
}

export interface OfficeFacilityUpsizeGeneratedProductionManifest {
  schemaVersion: 1;
  id: string;
  familyId: string;
  revision: "upsize-production-r01";
  status: "production-owner-review";
  productionStage: "f4-f7-complete";
  createdOn: "2026-07-30";
  developmentOnly: true;
  activeOfficePromotion: false;
  preflightAuthority: {
    manifest: string;
    manifestSha256: string;
    id: string;
    revision: "generated-2x2x4-visual-preflight-r01";
    status: "visual-preflight-owner-approved";
    approvedOn: "2026-07-30";
    approvedReviewHashCount: 5;
    hashMismatchCount: 0;
  };
  sourcePolicy: {
    approvedPreflightPixelsOnly: true;
    newImageGeneration: false;
    predecessorProductionPixelReuse: false;
    activeOfficePixelReuse: false;
    processedForeignFamilyReuse: false;
    generativeRepair: false;
    missingAssetFallback: false;
  };
  render: {
    physicalScale: { width: 2; depth: 2; height: 4; unit: "tile" };
    footprint: { width: 2; depth: 2; unit: "tile" };
    renderBox: { width: 3; height: 4; unit: "tile" };
    authoringCanvas: readonly [384, 512];
    runtimeCanvas: readonly [96, 128];
    uniformIntegerDivisor: 4;
    anchor: "bottom-center";
    basePivotRuntime: readonly [48, 124];
    sortPivotRuntime: readonly [48, 124];
    visualOrientations: readonly OfficeFacilityUpsizeProductionOrientation[];
    interactionOrientations: readonly OfficeFacilityUpsizeProductionOrientation[];
    collisionChangesByOrientation: false;
  };
  parts: {
    shells: readonly {
      orientation: OfficeFacilityUpsizeProductionOrientation;
      authoring: OfficeFacilityUpsizeProductionAsset;
      runtime: OfficeFacilityUpsizeProductionAsset;
      approvedPreflightRuntimeSha256: string;
    }[];
    localBaseFront: {
      authoring: OfficeFacilityUpsizeProductionAsset;
      runtime: OfficeFacilityUpsizeProductionAsset;
    };
    seatLayers: null | Record<
      "rear" | "foreground",
      {
        authoring: OfficeFacilityUpsizeProductionAsset;
        runtime: OfficeFacilityUpsizeProductionAsset;
      }
    >;
  };
  animation: {
    compositionFormula:
      "immutableShell[orientation] + machineLocalChild[state]";
    seamLoop: {
      kind: "deterministic-seam-loop";
      frameIds: readonly ["a", "b", "c", "d"];
      transition: readonly ["a", "b", "c", "d", "a"];
      frameDurationMs: 220;
      frames: readonly unknown[];
    };
    finiteUse: {
      kind: "invoked-finite-return-to-idle";
      sequence: readonly string[];
      states: readonly unknown[];
      outputSelectionRandomPerFrame: false;
    };
    declaredLocalRegionsRuntime: Record<string, readonly number[]>;
    shellMoves: false;
    basePivotDeltaPixels: readonly [0, 0];
    sortPivotDeltaPixels: readonly [0, 0];
    footprintDeltaTiles: readonly [0, 0];
    changedPixelsOutsideDeclaredRegions: 0;
    staticRecompositionPixelExact: true;
  };
  spatial: {
    i01Manifest: string;
    i01ManifestSha256: string;
    spatialManifest: string;
    spatialManifestSha256: string;
    seatManifest: string | null;
    seatManifestSha256: string | null;
    coordinateFormula: "worldRoot - actorFrameRootSocket";
    integerCoordinatesOnly: true;
    newCoordinateSystem: false;
    perCharacterOffsets: false;
    magicOffsets: false;
    missingSocketFallback: false;
    orientationCaseCount: 432;
    orientationRouteCollisionCount: 0;
    orientationCases: readonly unknown[];
    spatialAuthorityStatus: "owner-approved";
  };
  interaction: {
    action: string;
    visualPose: string;
    capacityPerInstance: 1;
    plannedInstanceIds: readonly string[];
    plannedInstanceCount: number;
    independentReservations: true;
    heldPropIds: readonly string[];
    heldPropManifest: string | null;
    heldPropManifestSha256: string | null;
    propSelectionRule: string;
    propSocketRule: string;
    reservationSlotContribution: 0;
    plannedReservationSlotsAfterF8: number;
    slotTransferBeforeF8: false;
  };
  rosterValidation: {
    characterCount: 18;
    activeFrames: 6;
    poseCaseCount: 108;
    primaryGripCaseCount: number;
    seatCaseCount: number;
    orientationCaseCount: 432;
    attachmentDeltaFailures: 0;
    seatForegroundFailures: 0;
    perCharacterFacilityScaling: false;
    perCharacterOffsets: false;
    magicOffsetCases: 0;
    fallbackSocketCases: 0;
    poseCases: readonly unknown[];
    primaryGripCases: readonly unknown[];
  };
  reservationValidation: {
    durationSeconds: 30;
    actorCount: number;
    instanceCount: number;
    capacityPerInstance: 1;
    maximumConcurrentReservations: number;
    blockedAttemptCount: 1;
    failureCount: 1;
    retrySuccessCount: 1;
    collisionCount: 0;
    releasedAtEnd: true;
    events: readonly unknown[];
    samples: readonly unknown[];
  };
  validation: Record<string, number>;
  gates: Record<
    OfficeFacilityUpsizeProductionGate,
    { status: "passed" | "pending-owner-review" | "blocked" }
  >;
  reviewOutputs: readonly string[];
  reviewEvidence: readonly {
    path: string;
    sha256: string;
    kind: "png" | "gif";
    size: readonly [number, number];
    frameCount?: number;
    durationMs?: number;
  }[];
  permissions: {
    familyLab: true;
    ownerReview: true;
    reservationSlotActivation: false;
    furnitureOnlyRoom: false;
    activeOfficePromotion: false;
  };
  ownerDecision: null;
}

export interface OfficeFacilityUpsizeBatchProductionManifest {
  schemaVersion: 1;
  id: "office.facility-upsize.2x2x4.production.v1";
  revision: "upsize-production-batch-r01";
  status: "production-owner-review";
  productionStage: "f4-f7-complete";
  createdOn: "2026-07-30";
  developmentOnly: true;
  activeOfficePromotion: false;
  families: readonly {
    id: string;
    label: string;
    manifest: string;
    sha256: string;
    status: "production-owner-review";
    poseCaseCount: 108;
    orientationCaseCount: 432;
    plannedInstanceCount: number;
    plannedReservationSlotsAfterF8: number;
  }[];
  validation: {
    familyCount: 4;
    visualOrientationCount: 16;
    rosterPoseCaseCount: 432;
    orientationCaseCount: 1728;
    seamLoopFrameCount: 16;
    reservationSimulationSecondsPerFamily: 30;
    shellOrPivotFailureCount: 0;
    routeFailureCount: 0;
    attachmentFailureCount: 0;
    reservationFailureCount: 0;
  };
  slotTransferPolicy: {
    facilityV1ReadySlotsCurrent: 20;
    candidateActiveSlotContribution: 0;
    plannedPredecessorSlotsToTransferAfterAllF8: 5;
    facilityV1ReadySlotsAfterTransferTarget: 20;
    doubleCountOldAndNew: false;
    atomicPerFamily: true;
  };
  ownerDecision: null;
}

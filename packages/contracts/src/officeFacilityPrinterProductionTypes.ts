export const officeFacilityPrinterProductionGates = [
  "F0", "F1", "F2", "F3", "F4", "F5",
  "F6", "F7", "F8", "F9", "F10",
] as const;

export type OfficeFacilityPrinterProductionGate =
  (typeof officeFacilityPrinterProductionGates)[number];

export interface OfficeFacilityPrinterProductionManifest {
  schemaVersion: 1;
  id: "office.facility.printer.p01.production";
  familyId: "printer.multifunction.floor";
  revision: "p01-production-r01";
  status: "owner-approved";
  productionStage: "f8-owner-approved";
  developmentOnly: true;
  activeOfficePromotion: false;
  preflightAuthority: {
    manifest: string;
    manifestSha256: string;
    revision: "p01-generated-motion-preflight-r02";
    approvedOn: "2026-07-30";
    approvedReviewHashCount: 12;
    hashMismatchCount: 0;
  };
  sourcePolicy: {
    approvedPreflightPixelsOnly: true;
    newImageGeneration: false;
    originalMasterPixelReuse: false;
    processedForeignFamilyReuse: false;
    activeOfficePixelReuse: false;
    generativeRepair: false;
    missingAssetFallback: false;
  };
  render: {
    physicalScale: { width: 2; depth: 2; height: 4; unit: "tile" };
    footprint: { width: 2; depth: 2; unit: "tile" };
    renderBox: { width: 3; height: 4; unit: "tile" };
    runtimeCanvas: readonly [96, 128];
    anchor: "bottom-center";
    basePivotRuntime: readonly [48, 124];
    sortPivotRuntime: readonly [48, 124];
    requiredOrientations: readonly ["front"];
    collisionChangesDuringMotion: false;
    footprintChangesDuringMotion: false;
  };
  parts: Record<string, PrinterProductionAsset>;
  states: Record<string, PrinterProductionAsset>;
  animation: {
    compositionFormula: string;
    processingLoop: readonly ["A", "B", "C", "D", "A"];
    processingChangedPixels: readonly number[];
    processingChangedPixelsOutsideLocalRegions: readonly [0, 0, 0, 0];
    finiteTrayPath: readonly ["closed", "half", "open", "half", "closed"];
    trayChangedPixels: readonly number[];
    trayChangedPixelsOutsideTrayRegion: readonly [0, 0, 0, 0];
    shellChangedPixels: 0;
    pivotDeltaPixels: readonly [0, 0];
    footprintDeltaTiles: readonly [0, 0];
    processingEndpointMismatchPixels: 0;
    trayEndpointMismatchPixels: 0;
    interruptionBeforePickup: Record<string, boolean>;
    interruptionAfterPickup: Record<string, boolean>;
  };
  spatial: Record<string, unknown> & {
    coordinateFormula: "worldRoot - actorFrameRootSocket";
    instances: Record<"printer-01" | "printer-02", PrinterRoute>;
    routeCollisionCount: 0;
    perCharacterOffsets: false;
    magicOffsets: false;
    missingSocketFallback: false;
  };
  interaction: {
    semanticAction: "interact-use";
    visualPose: "interact-front";
    instanceIds: readonly ["printer-01", "printer-02"];
    familyInstanceCount: 2;
    capacityPerInstance: 1;
    independentReservations: true;
    jobOutputMap: {
      "print-document": "held.paper-sheet";
      "prepare-mail": "held.envelope";
    };
    outputSelectionRule: "job-driven-once-per-visit";
    handoffParents: readonly [
      "facility.output.primary",
      "actor.hand.primary.grip",
      "none",
    ];
    propSocketRule: "primary-grip-to-primary-grip";
    attachmentDelta: readonly [0, 0];
    newCoordinateSystem: false;
    reservationSlotContribution: 2;
    plannedReservationSlotContributionAfterF8: 2;
    facilityV1ReadySlotsBeforePrinterF8: 18;
    facilityV1ReadySlotsAfterPrinterF8Target: 20;
    facilityV1ReadySlotsCurrent: 20;
  };
  rosterValidation: {
    characterCount: 18;
    activeFrames: 6;
    poseCaseCount: 108;
    rootAlignmentFailures: 0;
    pivotDriftFailures: 0;
    routeFailures: 0;
    perCharacterOffsets: false;
    poseCases: readonly PrinterPoseCase[];
  } & Record<string, unknown>;
  propOverlayValidation: {
    propIds: readonly ["held.paper-sheet", "held.envelope"];
    visibleFrames: readonly [2, 3, 4];
    caseCount: 108;
    attachmentFailures: 0;
    actorAlphaContactRadiusPixels: 3;
    maximumActorAlphaDistance: number;
    maximumPropAlphaDistance: 0;
    alphaContactFailures: 0;
    clippedPropCases: 0;
    foregroundMaskUses: 0;
    midpointPlacementUses: 0;
    magicOffsetCases: 0;
    fallbackSocketCases: 0;
    cases: readonly PrinterGripCase[];
  } & Record<string, unknown>;
  reservationValidation: {
    durationSeconds: 30;
    actorCount: 3;
    instanceIds: readonly ["printer-01", "printer-02"];
    capacityPerInstance: 1;
    maximumConcurrentReservations: 2;
    maximumPerInstanceReservations: 1;
    collisionCount: 0;
    blockedAttemptCount: 1;
    failureCount: 1;
    releaseCount: 3;
    retrySuccessCount: 1;
    beforePickupInterruptionCount: 1;
    afterPickupInterruptionCount: 1;
    handoffCount: 2;
    releasedAtEnd: true;
    orphanPropCountAtEnd: 0;
    events: readonly Record<string, unknown>[];
    samples: readonly Record<string, unknown>[];
  };
  gates: Record<
    OfficeFacilityPrinterProductionGate,
    {
      status: "passed" | "pending-owner-review" | "blocked";
      evidence: readonly string[];
    }
  >;
  reviewOutputs: readonly string[];
  reviewEvidence: readonly PrinterProductionReviewEvidence[];
  permissions: {
    familyLab: true;
    ownerReview: false;
    reservationSlotActivation: true;
    furnitureOnlyRoom: false;
    otherFacilityFamilies: false;
    activeOfficePromotion: false;
  };
  activeOfficeEvidence: readonly { file: string; imported: false }[];
  ownerDecision: {
    decision: "approved";
    decidedOn: "2026-07-30";
    approvedRevision: "p01-production-r01";
    scope: "exact-review-output-hashes";
    approvedReviewHashes: readonly { path: string; sha256: string }[];
    notes: string;
  };
}

export interface PrinterProductionAsset {
  file: string;
  sha256: string;
  size: readonly [96, 128];
  approvedPreflightSha256?: string;
  sourcePartSha256?: readonly string[];
}

export interface PrinterProductionReviewEvidence {
  path: string;
  sha256: string;
  kind: "png" | "gif";
  size: readonly [number, number];
  frameCount?: number;
  durationMs?: number;
}

export interface PrinterRoute {
  footprintCells: readonly (readonly [number, number])[];
  stand: readonly [number, number];
  approach: readonly [number, number];
  exit: readonly [number, number];
  route: readonly (readonly [number, number])[];
}

export interface PrinterPoseCase {
  caseId: string;
  actorId: string;
  frame: number;
  rootSocket: readonly [number, number];
  actorOrigin: readonly [number, number];
  worldRoot: readonly [number, number];
  resolvedRoot: readonly [number, number];
  rootAlignmentDelta: readonly [0, 0];
  pivotDelta: readonly [0, 0];
  routeValid: true;
  perCharacterOffset: false;
}

export interface PrinterGripCase {
  caseId: string;
  actorId: string;
  frame: 2 | 3 | 4;
  propId: "held.paper-sheet" | "held.envelope";
  attachmentParent: "actor.hand.primary.grip";
  actorPrimaryGripSocket: readonly [number, number];
  actorSecondaryGripSocket: readonly [number, number];
  propPrimaryGripSocket: readonly [number, number];
  propOrigin: readonly [number, number];
  resolvedPropPrimaryGrip: readonly [number, number];
  primaryGripDelta: readonly [0, 0];
  actorAlphaContactDistance: number;
  propAlphaContactDistance: 0;
  fullPropAlphaVisible: true;
  foregroundMaskUsed: false;
  midpointPlacementUsed: false;
  magicOffset: false;
  fallbackSocket: false;
}

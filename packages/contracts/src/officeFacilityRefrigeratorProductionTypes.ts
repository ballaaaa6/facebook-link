export const officeFacilityRefrigeratorProductionGates = [
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

export type OfficeFacilityRefrigeratorProductionGate =
  (typeof officeFacilityRefrigeratorProductionGates)[number];

export type OfficeFacilityRefrigeratorDoorState =
  | "closed"
  | "half"
  | "open";

export type OfficeFacilityRefrigeratorPropId =
  | "held.water-bottle"
  | "held.yogurt-box";

export interface OfficeFacilityRefrigeratorProductionAsset {
  file: string;
  sha256: string;
  size: readonly [number, number];
}

interface ApprovedProductionAsset
  extends OfficeFacilityRefrigeratorProductionAsset {
  approvedPreflightSha256: string;
}

export interface OfficeFacilityRefrigeratorProductionManifest {
  schemaVersion: 1;
  id: "office.facility.refrigerator.r01.production";
  familyId: "refrigerator.modern";
  revision: "r01-production-r01";
  status: "owner-approved";
  productionStage: "f8-owner-approved";
  developmentOnly: true;
  activeOfficePromotion: false;
  preflightAuthority: {
    manifest: string;
    manifestSha256: string;
    id: "office.facility.refrigerator.r01";
    revision: "r01-generated-motion-preflight-r01";
    status: "visual-motion-preflight-owner-approved";
    approvedOn: "2026-07-30";
    approvedReviewHashCount: 10;
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
    authoringCanvas: readonly [384, 512];
    runtimeCanvas: readonly [96, 128];
    uniformIntegerDivisor: 4;
    anchor: "bottom-center";
    basePivotRuntime: readonly [48, 124];
    sortPivotRuntime: readonly [48, 124];
    requiredOrientations: readonly ["front"];
    doorSwingRegionRuntime: readonly [14, 38, 89, 124];
    collisionChangesDuringMotion: false;
    footprintChangesDuringMotion: false;
  };
  parts: Record<
    "shell" | "door-closed" | "door-half" | "door-open",
    {
      authoring: ApprovedProductionAsset;
      runtime: ApprovedProductionAsset;
    }
  >;
  states: Record<
    OfficeFacilityRefrigeratorDoorState,
    ApprovedProductionAsset
  >;
  finiteAnimation: {
    kind: "reversible-finite-state";
    repeatingAmbientLoop: false;
    compositionFormula: "immutableShell + lowerDoor[state]";
    states: readonly ["closed", "half", "open"];
    forwardPath: readonly ["closed", "half", "open"];
    reversePath: readonly ["open", "half", "closed"];
    productionTransition: readonly [
      "closed",
      "half",
      "open",
      "half",
      "closed",
    ];
    transitionChangedPixels: readonly [number, number, number, number];
    changedPixelsOutsideDoorSwingRegion: readonly [0, 0, 0, 0];
    shellChangedPixels: 0;
    pivotDeltaPixels: readonly [0, 0];
    footprintDeltaTiles: readonly [0, 0];
    closedEndpointMismatchPixels: 0;
    interruptionBeforePickup: {
      reverseToClosed: true;
      facilityOutputRemoved: true;
      heldPropCreated: false;
      reservationReleased: true;
    };
    interruptionAfterPickup: {
      closeBeforeRelease: true;
      heldPropRemovedBeforeDeparture: true;
      reservationReleased: true;
    };
  };
  spatial: {
    authority: {
      file: string;
      sha256: string;
      status: "owner-approved";
    };
    coordinateFormula: "worldRoot - actorFrameRootSocket";
    perCharacterOffsets: false;
    magicOffsets: false;
    missingSocketFallback: false;
    fractionalCoordinates: false;
    footprintCells: readonly (readonly [number, number])[];
    stand: readonly [1, 2];
    approach: readonly [1, 3];
    exit: readonly [2, 3];
    route: readonly (readonly [number, number])[];
    routeCollisionCount: 0;
    machineLocalSockets: {
      base: readonly [48, 124];
      sort: readonly [48, 124];
      interactionRoot: readonly [48, 124];
      outputPrimary: readonly [49, 76];
    };
  };
  interaction: {
    semanticAction: "interact-use";
    visualPose: "interact-front";
    instanceIds: readonly ["refrigerator-01"];
    familyInstanceCount: 1;
    capacityPerInstance: 1;
    independentReservations: true;
    propPool: readonly ["held.water-bottle", "held.yogurt-box"];
    selectionAlgorithm:
      "(stable-hash(actorId|slotId) + visitIndex) % pool.length";
    selectedOncePerVisit: true;
    frameStableSelection: true;
    handoffParents: readonly [
      "facility.output.primary",
      "actor.hand.primary.grip",
      "none",
    ];
    attachmentDelta: readonly [0, 0];
    foregroundMaskUses: 0;
    newCoordinateSystem: false;
    reservationSlotContribution: 1;
    plannedReservationSlotContributionAfterF8: 1;
    facilityV1ReadySlotsBeforeRefrigeratorF8: 17;
    facilityV1ReadySlotsAfterRefrigeratorF8Target: 18;
    facilityV1ReadySlotsCurrent: 18;
  };
  rosterValidation: {
    authorityManifest: string;
    authoritySha256: string;
    pendingCommercialReview: true;
    characterCount: 18;
    activeFrames: 6;
    poseCaseCount: 108;
    rootAlignmentFailures: 0;
    pivotDriftFailures: 0;
    routeFailures: 0;
    perCharacterOffsets: false;
    poseCases: readonly RefrigeratorPoseCase[];
  };
  propOverlayValidation: {
    authorityManifest: string;
    authoritySha256: string;
    propIds: readonly ["held.water-bottle", "held.yogurt-box"];
    visibleFrames: readonly [2, 3, 4];
    caseCount: 108;
    attachmentFailures: 0;
    foregroundMaskUses: 0;
    clippedPropCases: 0;
    magicOffsetCases: 0;
    fallbackSocketCases: 0;
    cases: readonly RefrigeratorPropOverlayCase[];
    selectionCases: readonly RefrigeratorSelectionCase[];
  };
  reservationValidation: {
    durationSeconds: 30;
    actorCount: 2;
    instanceIds: readonly ["refrigerator-01"];
    capacityPerInstance: 1;
    maximumConcurrentReservations: 1;
    collisionCount: 0;
    blockedAttemptCount: 1;
    failureCount: 1;
    releaseCount: 3;
    retrySuccessCount: 1;
    beforePickupInterruptionCount: 1;
    afterPickupInterruptionCount: 1;
    handoffCount: 2;
    releasedAtEnd: true;
    propAttachedAtEnd: false;
    events: readonly Record<string, unknown>[];
    samples: readonly RefrigeratorReservationSample[];
  };
  gates: Record<
    OfficeFacilityRefrigeratorProductionGate,
    {
      status: "passed" | "pending-owner-review" | "blocked";
      evidence: readonly string[];
    }
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
    ownerReview: false;
    reservationSlotActivation: true;
    furnitureOnlyRoom: false;
    otherFacilityFamilies: false;
    activeOfficePromotion: false;
  };
  activeOfficeEvidence: readonly {
    file: string;
    imported: false;
  }[];
  ownerDecision: {
    decision: "approved";
    decidedOn: "2026-07-30";
    approvedRevision: "r01-production-r01";
    scope: "exact-review-output-hashes";
    approvedReviewHashes: readonly {
      path: string;
      sha256: string;
    }[];
    notes: string;
  };
}

interface RefrigeratorPoseCase {
  caseId: string;
  actorId: string;
  frame: number;
  doorState: OfficeFacilityRefrigeratorDoorState;
  rootSocket: readonly [number, number];
  actorOrigin: readonly [number, number];
  worldRoot: readonly [number, number];
  resolvedRoot: readonly [number, number];
  rootAlignmentDelta: readonly [0, 0];
  pivotDelta: readonly [0, 0];
  routeValid: true;
  perCharacterOffset: false;
}

interface RefrigeratorPropOverlayCase {
  caseId: string;
  actorId: string;
  frame: 2 | 3 | 4;
  propId: OfficeFacilityRefrigeratorPropId;
  attachmentParent: "actor.hand.primary.grip";
  attachmentMode: "front-overlay";
  handSocketWorld: readonly [number, number];
  propOrigin: readonly [number, number];
  propVisualCenterSocket: readonly [number, number];
  resolvedVisualCenter: readonly [number, number];
  attachmentDelta: readonly [0, 0];
  foregroundMaskUsed: false;
  fullPropAlphaVisible: true;
  magicOffset: false;
  fallbackSocket: false;
}

interface RefrigeratorSelectionCase {
  actorId: string;
  instanceId: "refrigerator-01";
  visitIndex: number;
  propId: OfficeFacilityRefrigeratorPropId;
  selectedOnce: true;
  frameStable: true;
}

interface RefrigeratorReservationSample {
  second: number;
  heldBy: "actor-a" | "actor-b" | null;
  concurrentReservations: 0 | 1;
  doorState: OfficeFacilityRefrigeratorDoorState;
  attachmentParent:
    | null
    | "facility.output.primary"
    | "actor.hand.primary.grip";
  propId: OfficeFacilityRefrigeratorPropId | null;
  collisionCount: 0;
}

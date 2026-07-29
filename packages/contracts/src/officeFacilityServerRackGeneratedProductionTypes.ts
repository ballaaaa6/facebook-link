export const officeFacilityServerRackProductionOrientations = [
  "front",
  "left",
  "right",
  "back",
] as const;

export const officeFacilityServerRackProductionFrames = [
  "a",
  "b",
  "c",
  "d",
] as const;

export const officeFacilityServerRackProductionGates = [
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

export type OfficeFacilityServerRackProductionOrientation =
  (typeof officeFacilityServerRackProductionOrientations)[number];

export interface OfficeFacilityServerRackProductionAsset {
  file: string;
  sha256: string;
  size: readonly [number, number];
}

export interface OfficeFacilityServerRackGeneratedProductionManifest {
  schemaVersion: 1;
  id: "office.facility.server-rack.n02.production";
  familyId: "server.rack.generated-modern";
  revision: "n02-production-r01";
  status: "production-owner-review";
  productionStage: "f4-f7-complete";
  developmentOnly: true;
  activeOfficePromotion: false;
  preflightAuthority: {
    manifest: string;
    manifestSha256: string;
    id: "office.facility.server-rack.n02";
    revision: "n02-preflight-r01";
    status: "visual-preflight-owner-approved";
    approvedOn: "2026-07-30";
    approvedReviewHashCount: 11;
    hashMismatchCount: 0;
  };
  sourcePolicy: {
    approvedPreflightPixelsOnly: true;
    newImageGeneration: false;
    serverRackN01PixelReuse: false;
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
    orientations: readonly OfficeFacilityServerRackProductionOrientation[];
  };
  parts: {
    shells: readonly {
      orientation: OfficeFacilityServerRackProductionOrientation;
      authoring: OfficeFacilityServerRackProductionAsset;
      runtime: OfficeFacilityServerRackProductionAsset;
      approvedPreflightRuntimeSha256: string;
    }[];
    statusFrames: readonly {
      frameId: "a" | "b" | "c" | "d";
      authoring: OfficeFacilityServerRackProductionAsset;
      runtime: OfficeFacilityServerRackProductionAsset;
    }[];
    frontComposites: readonly {
      frameId: "a" | "b" | "c" | "d";
      runtime: OfficeFacilityServerRackProductionAsset;
      approvedPreflightCompositeSha256: string;
    }[];
  };
  animation: {
    compositionFormula: "immutableShell[front] + statusViewport[n]";
    animatedOrientation: "front";
    staticOrientations: readonly ["left", "right", "back"];
    frameIds: readonly ["a", "b", "c", "d"];
    transition: readonly ["a", "b", "c", "d", "a"];
    frameDurationMs: 220;
    cycleDurationMs: 880;
    viewportBoundsRuntime: readonly [32, 39, 64, 55];
    transitionChangedPixels: readonly [number, number, number, number];
    shellChangedPixels: 0;
    outsideViewportChangedPixels: 0;
    pivotDeltaPixels: readonly [0, 0];
    closureMismatchPixels: 0;
  };
  spatial: {
    authority: { file: string; sha256: string; status: "owner-approved" };
    coordinateFormula: "worldRoot - actorFrameRootSocket";
    perCharacterOffsets: false;
    magicOffsets: false;
    missingSocketFallback: false;
    fractionalCoordinates: false;
    orientations: readonly {
      orientation: OfficeFacilityServerRackProductionOrientation;
      footprintCells: readonly (readonly [number, number])[];
      stand: readonly [number, number];
      approach: readonly [number, number];
      exit: readonly [number, number];
      route: readonly (readonly [number, number])[];
      facing: OfficeFacilityServerRackProductionOrientation;
      machineLocalSockets: {
        base: readonly [48, 124];
        sort: readonly [48, 124];
        statusViewport: readonly [32, 39];
        inspectTarget: readonly [number, number];
        interactionRoot: readonly [number, number];
      };
      routeCollisionCount: 0;
    }[];
  };
  interaction: {
    semanticAction: "inspect-front";
    visualPose: "interact-front";
    instanceIds: readonly ["server-rack-01", "server-rack-02"];
    familyInstanceCount: 2;
    capacityPerInstance: 1;
    independentReservations: true;
    machineLocalTargetsRuntime: Record<
      OfficeFacilityServerRackProductionOrientation,
      readonly [number, number]
    >;
    heldProp: false;
    h01Dependency: false;
    handoff: false;
    reservationSlotContributionBeforeF8: 0;
    plannedReservationSlotContributionAfterF8: 2;
    facilityV1ReadySlotsBeforeServer: 15;
    facilityV1ReadySlotsAfterServerF8Target: 17;
  };
  rosterValidation: {
    authorityManifest: string;
    authoritySha256: string;
    pendingCommercialReview: true;
    characterCount: 18;
    activeFrames: 6;
    poseCaseCount: 108;
    orientationCaseCount: 432;
    rootAlignmentFailures: 0;
    pivotDriftFailures: 0;
    routeFailures: 0;
    heldPropCases: 0;
    handoffCases: 0;
    perCharacterOffsets: false;
    poseCases: readonly {
      caseId: string;
      actorId: string;
      frame: number;
      rootSocket: readonly [number, number];
      holdState: string;
      heldProp: false;
    }[];
    orientationCases: readonly {
      caseId: string;
      poseCaseId: string;
      orientation: OfficeFacilityServerRackProductionOrientation;
      actorOrigin: readonly [number, number];
      worldRoot: readonly [number, number];
      resolvedRoot: readonly [number, number];
      rootAlignmentDelta: readonly [0, 0];
      pivotDelta: readonly [0, 0];
      routeValid: true;
      heldProp: false;
      handoff: false;
    }[];
  };
  reservationValidation: {
    durationSeconds: 30;
    actorCount: 2;
    instanceIds: readonly ["server-rack-01", "server-rack-02"];
    capacityPerInstance: 1;
    maximumConcurrentReservations: 2;
    maximumPerInstanceReservations: 1;
    collisionCount: 0;
    blockedAttemptCount: 1;
    failureCount: 1;
    releaseCount: 3;
    retrySuccessCount: 1;
    independentInstanceSuccessCount: 1;
    releasedAtEnd: true;
    events: readonly {
      second: number;
      actorId: "actor-a" | "actor-b";
      instanceId: "server-rack-01" | "server-rack-02";
      event: string;
      result: string;
    }[];
    samples: readonly {
      second: number;
      heldBy: {
        "server-rack-01": "actor-a" | "actor-b" | null;
        "server-rack-02": "actor-a" | "actor-b" | null;
      };
      concurrentReservations: number;
      actorAState: string;
      actorBState: string;
    }[];
  };
  gates: Record<
    (typeof officeFacilityServerRackProductionGates)[number],
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
    ownerReview: true;
    reservationSlotActivation: false;
    furnitureOnlyRoom: false;
    otherFacilityFamilies: false;
    activeOfficePromotion: false;
  };
  activeOfficeEvidence: readonly {
    file: string;
    imported: false;
  }[];
  ownerDecision: null;
}

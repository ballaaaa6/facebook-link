export const officeFacilityServerRackGeneratedGates = [
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

export const officeFacilityServerRackGeneratedOrientations = [
  "front",
  "left",
  "right",
  "back",
] as const;

export const officeFacilityServerRackGeneratedFrames = [
  "a",
  "b",
  "c",
  "d",
] as const;

export type OfficeFacilityServerRackGeneratedGate =
  (typeof officeFacilityServerRackGeneratedGates)[number];
export type OfficeFacilityServerRackGeneratedOrientation =
  (typeof officeFacilityServerRackGeneratedOrientations)[number];
export type OfficeFacilityServerRackGeneratedFrame =
  (typeof officeFacilityServerRackGeneratedFrames)[number];

export interface OfficeFacilityServerRackGeneratedAsset {
  file: string;
  sha256: string;
  size: readonly [number, number];
}

export interface OfficeFacilityServerRackGeneratedSource {
  role: "front-anchor" | "turnaround" | "status-kit";
  file: string;
  sha256: string;
  size: readonly [number, number];
  inputImageCount: 0 | 1;
  identityReference: "front-anchor" | null;
  extractionMethod: "generated-source-chroma-key";
  sampledKeyRgb: readonly [number, number, number];
  chromaStats: {
    transparentPixels: number;
    partialAlphaPixels: number;
    visiblePixels: number;
  };
  keyedAsset: OfficeFacilityServerRackGeneratedAsset;
  ownership: readonly {
    partId: string;
    sourceCell: readonly [number, number, number, number];
    ownedBounds: readonly [number, number, number, number];
    visiblePixels: number;
    ownedComponentCount: number;
    cellBoundaryContact: false;
  }[];
}

export interface OfficeFacilityServerRackGeneratedPreflightManifest {
  schemaVersion: 1;
  id: "office.facility.server-rack.n02";
  familyId: "server.rack.generated-modern";
  revision: "n02-preflight-r01";
  status: "visual-preflight-owner-approved";
  productionStage: "visual-preflight-approved";
  developmentOnly: true;
  activeOfficePromotion: false;
  supersedes: {
    id: "office.facility.server-rack.n01";
    manifest: string;
    manifestSha256: string;
    reason: string;
  };
  sourcePolicy: {
    freshImageGeneration: true;
    originalMasterPixelReuse: false;
    processedCropDirectReuse: false;
    activeOfficePixelReuse: false;
    legacyOrRejectedPixelReuse: false;
    serverRackN01PixelReuse: false;
    generativeRepair: false;
    missingAssetFallback: false;
  };
  generation: {
    workflow: "built-in-imagegen";
    promptRecord: { file: string; sha256: string };
    sources: readonly OfficeFacilityServerRackGeneratedSource[];
  };
  render: {
    physicalScale: { width: 2; depth: 2; height: 4; unit: "tile" };
    footprint: { width: 2; depth: 2; unit: "tile" };
    renderBox: { width: 3; height: 4; unit: "tile" };
    authoringCanvas: readonly [384, 512];
    runtimeCanvas: readonly [96, 128];
    uniformIntegerDivisor: 4;
    nonUniformRuntimeScaling: false;
    anchor: "bottom-center";
    basePivotRuntime: readonly [48, 124];
    sortPivotRuntime: readonly [48, 124];
    requiredOrientations: readonly ["front", "left", "right", "back"];
    generatedTurns: false;
    orientations: readonly {
      orientation: OfficeFacilityServerRackGeneratedOrientation;
      authoring: OfficeFacilityServerRackGeneratedAsset;
      runtime: OfficeFacilityServerRackGeneratedAsset;
      runtimeAlphaBounds: readonly [number, number, number, number];
    }[];
  };
  parts: {
    frontAnchorSource: OfficeFacilityServerRackGeneratedAsset;
    turnaroundSources: Record<
      OfficeFacilityServerRackGeneratedOrientation,
      OfficeFacilityServerRackGeneratedAsset
    >;
    statusKitSources: Record<string, OfficeFacilityServerRackGeneratedAsset>;
    shell: {
      authoring: OfficeFacilityServerRackGeneratedAsset;
      runtime: OfficeFacilityServerRackGeneratedAsset;
    };
    statusRuntimeParts: Record<string, OfficeFacilityServerRackGeneratedAsset>;
    statusFrames: readonly {
      frameId: OfficeFacilityServerRackGeneratedFrame;
      status: OfficeFacilityServerRackGeneratedAsset;
      composite: OfficeFacilityServerRackGeneratedAsset;
    }[];
  };
  statusLoop: {
    compositionFormula:
      "immutableShell[orientation] + statusViewport[n]";
    animatedOrientation: "front";
    staticOrientations: readonly ["left", "right", "back"];
    frameIds: readonly ["a", "b", "c", "d"];
    transition: readonly ["a", "b", "c", "d", "a"];
    frameDurationMs: 220;
    cycleDurationMs: 880;
    viewportAuthoring: readonly [128, 156, 256, 220];
    viewportRuntime: readonly [32, 39, 64, 55];
    transitionChangedPixels: readonly [number, number, number, number];
    shellChangedPixels: 0;
    outsideViewportChangedPixels: 0;
    pivotDeltaPixels: readonly [0, 0];
    closureMismatchPixels: 0;
    gif: OfficeFacilityServerRackGeneratedAsset & {
      frameCount: 4;
      durationMs: 220;
    };
  };
  interactionPreview: {
    semanticAction: "inspect-front";
    visualPoseAuthority: "interact-front";
    heldProp: false;
    h01Dependency: false;
    handoff: false;
    machineLocalTargetRuntime: readonly [48, 52];
    actorId: "anna";
    actorAuthority: {
      file: string;
      sha256: string;
      sheetFile: string;
      sheetSha256: string;
      pendingCommercialReview: true;
    };
    spatialAuthority: { file: string; sha256: string };
    placement: {
      formula: "sceneRoot - actorRootSocket";
      perCharacterOffsets: false;
      magicOffset: false;
      missingSocketFallback: false;
    };
    timeline: readonly {
      phase: "approach" | "inspect" | "depart";
      animation: "walk-left" | "interact-front" | "walk-right";
      actorFrame: number;
      approachOffsetX: number;
      statusFrame: OfficeFacilityServerRackGeneratedFrame;
      heldPropVisible: false;
    }[];
    countsTowardRosterValidation: false;
    countsTowardOrientationValidation: false;
    countsTowardReservationValidation: false;
    gif: OfficeFacilityServerRackGeneratedAsset & {
      frameCount: 12;
      durationMs: 240;
    };
  };
  instancePreview: {
    familyInstanceCount: 2;
    instanceIds: readonly ["server-rack-01", "server-rack-02"];
    sharedFamilyPixels: true;
    capacityTargetPerInstance: 1;
    independentReservationTargets: true;
    reservationProductionBuilt: false;
    reservationSlotContribution: 0;
    plannedReservationSlotContributionAfterF8: 2;
    facilityV1ReadySlotsBeforeServer: 15;
    facilityV1ReadySlotsAfterServerF8Target: 17;
  };
  productionTargets: {
    characterCount: 18;
    activeFrames: 6;
    basePoseCases: 108;
    orientationCompositeCases: 432;
    builtPoseCases: 0;
    builtOrientationCompositeCases: 0;
    twoInstanceReservationSimulationBuilt: false;
  };
  gates: Record<
    OfficeFacilityServerRackGeneratedGate,
    { status: "passed" | "blocked"; evidence: readonly string[] }
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
    ownerReview: true;
    fullSystemBuild: true;
    furnitureOnlyRoom: false;
    otherFacilityFamilies: false;
    activeOfficePromotion: false;
  };
  activeOfficeEvidence: readonly {
    file: string;
    imported: false;
  }[];
  visualApproval: {
    status: "owner-approved";
    approvedOn: "2026-07-30";
    approvedRevision: "n02-preflight-r01";
    scope: "exact-review-output-hashes";
    decision: string;
    approvedReviewHashes: readonly {
      path: string;
      sha256: string;
    }[];
    unlocks: readonly ["F4", "F5", "F6", "F7", "F8"];
  };
  ownerDecision: null;
}

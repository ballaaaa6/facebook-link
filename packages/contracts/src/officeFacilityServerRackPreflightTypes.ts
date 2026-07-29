export const officeFacilityServerRackPreflightGates = [
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

export const officeFacilityServerRackStatusFrames = [
  "a",
  "b",
  "c",
  "d",
] as const;

export type OfficeFacilityServerRackPreflightGate =
  (typeof officeFacilityServerRackPreflightGates)[number];

export type OfficeFacilityServerRackStatusFrame =
  (typeof officeFacilityServerRackStatusFrames)[number];

export interface OfficeFacilityServerRackAsset {
  file: string;
  sha256: string;
  size: readonly [number, number];
}

export interface OfficeFacilityServerRackStatusAssetSet {
  frameId: OfficeFacilityServerRackStatusFrame;
  source: OfficeFacilityServerRackAsset;
  authoring: OfficeFacilityServerRackAsset;
  runtime: OfficeFacilityServerRackAsset;
  composite: OfficeFacilityServerRackAsset;
  sourceBox: readonly [number, number, number, number];
}

export interface OfficeFacilityServerRackPreflightManifest {
  schemaVersion: 1;
  id: "office.facility.server-rack.n01";
  familyId: "server.rack.noc";
  revision: "n01-preflight-r01";
  status: "visual-preflight-owner-review";
  productionStage: "visual-preflight";
  developmentOnly: true;
  activeOfficePromotion: false;
  sourcePolicy: {
    originalMasterPixelsOnly: true;
    processedCropDirectReuse: false;
    activeOfficePixelReuse: false;
    rejectedSidePixelReuse: false;
    newImageGeneration: false;
    generativeRepair: false;
    missingAssetFallback: false;
  };
  sourceAuthority: {
    audit: { file: string; sha256: string };
    front: {
      auditRecordId: string;
      sourceFile: string;
      sourceSha256: string;
      keyedAsset: OfficeFacilityServerRackAsset;
      ownershipMaskAsset: OfficeFacilityServerRackAsset;
      sourceBounds: readonly [number, number, number, number];
      componentBounds: readonly [number, number, number, number];
      componentPixels: number;
      componentCount: 1;
      cellBoundaryContact: false;
      auditDecision: "salvage-full-master-and-decompose";
      sampledKeyRgb: readonly [number, number, number];
      chromaStats: {
        transparentPixels: number;
        partialAlphaPixels: number;
        visiblePixels: number;
      };
    };
    status: {
      sourceFile: string;
      sourceSha256: string;
      keyedAsset: OfficeFacilityServerRackAsset;
      sampledKeyRgb: readonly [number, number, number];
      chromaStats: {
        transparentPixels: number;
        partialAlphaPixels: number;
        visiblePixels: number;
      };
      frames: readonly {
        frameId: OfficeFacilityServerRackStatusFrame;
        auditRecordId: string;
        sourceBounds: readonly [number, number, number, number];
        fullComponentBounds: readonly [number, number, number, number];
        fullComponentPixels: number;
        fullComponentCrossesNominalTop: true;
        selectedViewportSourceBox:
          readonly [number, number, number, number];
        selectedViewportTouchesCellBoundary: false;
        selectedViewportAlphaPixels: number;
        auditVisiblePixelsInsideCell: number;
      }[];
    };
    rejectedSides: readonly {
      auditRecordId: string;
      decision: "reject-regenerate-orientation-if-required";
      masterPixelsSalvageable: false;
      used: false;
    }[];
  };
  render: {
    physicalScale: { width: 2; depth: 1; height: 3; unit: "tile" };
    footprint: { width: 2; depth: 1; unit: "tile" };
    renderBox: { width: 2; height: 3; unit: "tile" };
    authoringCanvas: readonly [256, 384];
    runtimeCanvas: readonly [64, 96];
    uniformIntegerDivisor: 4;
    anchor: "bottom-center";
    basePivotRuntime: readonly [32, 92];
    sortPivotRuntime: readonly [32, 92];
    authoredOrientations: readonly ["front"];
    generatedTurns: false;
  };
  parts: {
    front: {
      sourceCutout: OfficeFacilityServerRackAsset;
      authoring: OfficeFacilityServerRackAsset;
      runtime: OfficeFacilityServerRackAsset;
    };
    shell: {
      authoring: OfficeFacilityServerRackAsset;
      runtime: OfficeFacilityServerRackAsset;
    };
    statusFrames: readonly OfficeFacilityServerRackStatusAssetSet[];
  };
  statusLoop: {
    compositionFormula: "immutableShell + statusViewport[n]";
    frameIds: readonly ["a", "b", "c", "d"];
    transition: readonly ["a", "b", "c", "d", "a"];
    frameDurationMs: 220;
    cycleDurationMs: 880;
    viewportAuthoring: readonly [32, 96, 196, 332];
    viewportRuntime: readonly [8, 24, 49, 83];
    transitionChangedPixels: readonly [number, number, number, number];
    shellChangedPixels: 0;
    outsideViewportChangedPixels: 0;
    pivotDeltaPixels: readonly [0, 0];
    closureMismatchPixels: 0;
    gif: OfficeFacilityServerRackAsset & { frameCount: 4 };
  };
  interactionPreview: {
    semanticAction: "inspect-front";
    visualPoseAuthority: "interact-front";
    actorId: "anna";
    actorAuthority: {
      file: string;
      sha256: string;
      pendingCommercialReview: true;
    };
    spatialAuthority: { file: string; sha256: string };
    heldProp: {
      id: "held.tablet";
      manifest: string;
      manifestSha256: string;
      runtimeFile: string;
      runtimeSha256: string;
      actorSocketRule: "midpoint-primary-secondary";
      attachmentMode: "front-overlay";
      heldFrames: readonly [2, 3, 4];
    };
    timeline: readonly {
      phase: "approach" | "inspect" | "depart";
      animation: "walk-left" | "interact-front" | "walk-right";
      actorFrame: number;
      approachOffsetX: number;
      statusFrame: OfficeFacilityServerRackStatusFrame;
      tabletVisible: boolean;
      attachmentDelta: readonly [0, 0] | null;
    }[];
    perCharacterOffsets: false;
    missingSocketFallback: false;
    countsTowardRosterValidation: false;
    countsTowardReservationValidation: false;
    gif: OfficeFacilityServerRackAsset & { frameCount: 12 };
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
  gates: Record<
    OfficeFacilityServerRackPreflightGate,
    { status: "passed" | "blocked"; evidence: readonly string[] }
  >;
  reviewOutputs: readonly string[];
  reviewEvidence: readonly OfficeFacilityServerRackAsset[];
  permissions: {
    ownerReview: true;
    fullSystemBuild: false;
    furnitureOnlyRoom: false;
    otherFacilityFamilies: false;
    activeOfficePromotion: false;
  };
  activeOfficeEvidence: readonly {
    file: string;
    imported: false;
  }[];
  visualApproval: null;
  ownerDecision: null;
}

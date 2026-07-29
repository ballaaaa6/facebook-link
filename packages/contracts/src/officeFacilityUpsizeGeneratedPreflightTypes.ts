export const officeFacilityUpsizeOrientations = [
  "front",
  "right",
  "back",
  "left",
] as const;

export const officeFacilityUpsizeFamilyGates = [
  "F0", "F1", "F2", "F3", "F4", "F5",
  "F6", "F7", "F8", "F9", "F10",
] as const;

export type OfficeFacilityUpsizeOrientation =
  (typeof officeFacilityUpsizeOrientations)[number];
export type OfficeFacilityUpsizeFamilyGate =
  (typeof officeFacilityUpsizeFamilyGates)[number];

export interface OfficeFacilityUpsizeAsset {
  file: string;
  sha256: string;
  size: readonly [number, number];
}

export interface OfficeFacilityUpsizeView {
  orientation: OfficeFacilityUpsizeOrientation;
  authoring: OfficeFacilityUpsizeAsset;
  runtime: OfficeFacilityUpsizeAsset;
  sourceOwnership: {
    orientation: OfficeFacilityUpsizeOrientation;
    sourceCell: readonly [number, number, number, number];
    alphaBoundsInCell: readonly [number, number, number, number];
    transparentGutters: readonly [number, number, number, number];
    touchesSourceCellBoundary: false;
    selectedComponentCount: number;
    selectedPixelCount: number;
    components: readonly {
      pixelCount: number;
      bounds: readonly [number, number, number, number];
    }[];
  };
}

export interface OfficeFacilityUpsizeGeneratedPreflightManifest {
  schemaVersion: 1;
  id: string;
  familyId: string;
  revision: "generated-2x2x4-visual-preflight-r01";
  status: "visual-preflight-owner-review";
  productionStage: "f0-f3-visual-preflight";
  createdOn: "2026-07-30";
  developmentOnly: true;
  activeOfficePromotion: false;
  supersedesAfterApproval: {
    manifest: string;
    manifestSha256: string;
    currentGeometry: string;
    oldPixelsUsed: false;
    slotTransferBeforeF8: false;
  };
  sourcePolicy: {
    newBuiltInImageGeneration: true;
    previousFamilyPixelReuse: false;
    activeOfficePixelReuse: false;
    processedForeignFamilyReuse: false;
    generativeRepairAfterExtraction: false;
    missingAssetFallback: false;
  };
  imageGeneration: {
    toolMode: "built-in-imagegen";
    useCase: "stylized-concept";
    generatedOn: "2026-07-30";
    chromaKeyRemoval: string;
    promptAuthority: string;
  };
  sources: {
    chromaMaster: OfficeFacilityUpsizeAsset;
    alphaMaster: OfficeFacilityUpsizeAsset & {
      transparentCorners: true;
      visibleMagentaFringePixels: 0;
    };
    cellLayout: {
      columns: 2;
      rows: 2;
      cellPixels: readonly [627, 627];
      orientationOrder: readonly OfficeFacilityUpsizeOrientation[];
    };
  };
  render: {
    physicalScale: { width: 2; depth: 2; height: 4; unit: "tile" };
    footprint: { width: 2; depth: 2; unit: "tile" };
    renderBox: { width: 3; height: 4; unit: "tile" };
    authoringCanvas: readonly [384, 512];
    runtimeCanvas: readonly [96, 128];
    uniformIntegerDivisor: 4;
    anchor: "bottom-center";
    basePivotAuthoring: readonly [192, 496];
    basePivotRuntime: readonly [48, 124];
    sortPivotRuntime: readonly [48, 124];
    visualOrientations: readonly OfficeFacilityUpsizeOrientation[];
    collisionChangesByOrientation: false;
  };
  views: readonly OfficeFacilityUpsizeView[];
  interactionPreflight: {
    capacityPerInstance: 1;
    action: string;
    visualPose: string;
    existingHeldProp: string | null;
    newCoordinateSystem: false;
    visualOrientationsCreated: readonly OfficeFacilityUpsizeOrientation[];
    productionEnabledOrientations: readonly [];
    sideInteractionRequiresProductionProof: true;
    sideSeatedPoseAvailable: false | null;
    plannedInstanceCount: number;
    reservationSlotContribution: 0;
    plannedReservationSlotsAfterF8: number;
  };
  modularMotionPlan: {
    parts: readonly string[];
    declaredLocalRegionsRuntime: Record<string, readonly number[]>;
    shellMustRemainImmutable: true;
    basePivotMustRemainFixed: true;
    sortPivotMustRemainFixed: true;
    footprintMustRemainFixed: true;
    seamLoopFramesBuilt: 0;
    productionCasesBuilt: 0;
    notes: string;
  };
  validation: Record<string, number>;
  reviewOutputs: readonly {
    path: string;
    sha256: string;
    size: readonly [1600, 1000];
  }[];
  gates: Record<
    OfficeFacilityUpsizeFamilyGate,
    { status: "passed" | "pending-owner-review" | "blocked"; note?: string }
  >;
  permissions: {
    visualOwnerReview: true;
    productionBuild: false;
    reservationSlotTransfer: false;
    f9Replacement: false;
    activeOfficePromotion: false;
  };
  ownerDecision: null;
}

export interface OfficeFacilityUpsizeBatchPreflightManifest {
  schemaVersion: 1;
  id: "office.facility-upsize.2x2x4.preflight.v1";
  status: "visual-preflight-owner-review";
  productionStage: "f0-f3-batch-visual-preflight";
  createdOn: "2026-07-30";
  developmentOnly: true;
  activeOfficePromotion: false;
  scope: {
    familyCount: 4;
    visualViewCount: 16;
    physicalScale: "2x2x4";
    floorFootprint: "2x2";
    renderBox: "3x4";
  };
  families: readonly {
    id: string;
    label: string;
    manifest: string;
    sha256: string;
    status: "visual-preflight-owner-review";
    visualViewCount: 4;
    plannedInstanceCount: number;
    plannedReservationSlotsAfterF8: number;
  }[];
  counterPolicy: {
    manifest: string;
    manifestSha256: string;
    status: "owner-approved-retained";
    deleteAsset: false;
    removeFromF9BeforeNewFamiliesPassF8: false;
    plannedF9V2Placement: "retained-not-placed";
  };
  slotPolicy: {
    facilityV1ReadySlotsCurrent: 20;
    newPreflightSlotContribution: 0;
    plannedTransferredSlotsAfterAllF8: 5;
    doubleCountOldAndNew: false;
  };
  f9Policy: {
    currentF9Manifest: string;
    currentF9ManifestSha256: string;
    currentF9Changed: false;
    plannedReplacement: "office.furniture-only-room.f9.v2";
    workstationAnchorToPreserve: "C12";
    workstationCountToPreserve: 10;
    routeQueriesToRebuild: 200;
  };
  reviewOutput: { path: string; sha256: string; size: readonly [1600, 1000] };
  gates: Record<
    "F3" | "F4" | "F8" | "F9" | "F10",
    { status: "pending-owner-review" | "blocked" }
  >;
  permissions: {
    visualOwnerReview: true;
    productionBuild: false;
    f9Replacement: false;
    activeOfficePromotion: false;
  };
  ownerDecision: null;
}

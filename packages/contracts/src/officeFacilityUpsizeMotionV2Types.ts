export interface OfficeFacilityUpsizeMotionV2Asset {
  file: string;
  sha256: string;
  size: [number, number];
}

export interface OfficeFacilityUpsizeMotionV2Part {
  role: string;
  phase: "a" | "b" | "c" | "d";
  sourceCutout: OfficeFacilityUpsizeMotionV2Asset;
  runtimeLayer: OfficeFacilityUpsizeMotionV2Asset;
  sourceRecord: {
    role: string;
    phase: "a" | "b" | "c" | "d";
    sourceBox: [number, number, number, number];
    sourceCellTouchesAtlasBoundary: false;
    size: [number, number];
  };
}

export interface OfficeFacilityUpsizeMotionV2Family {
  slug:
    | "coffee-machine-c02"
    | "water-dispenser-w02"
    | "vending-machine-u02"
    | "massage-chair-r03";
  label: string;
  kind: "coffee" | "water" | "vending" | "massage";
  approvedShell: OfficeFacilityUpsizeMotionV2Asset;
  derivedShell: OfficeFacilityUpsizeMotionV2Asset;
  atlas: {
    chroma: string;
    alpha: string;
    componentCount: 12 | 16;
    rows: string[];
    chromaSha256: string;
    alphaSha256: string;
    chromaSize: [1254, 1254];
    alphaSize: [1254, 1254];
  };
  regions: Record<string, [number, number, number, number]>;
  parts: OfficeFacilityUpsizeMotionV2Part[];
  seamLoop: {
    transition: ["a", "b", "c", "d", "a"];
    durationMs: 240;
    frames: Array<
      OfficeFacilityUpsizeMotionV2Asset & {
        phase: "a" | "b" | "c" | "d";
      }
    >;
    gif: OfficeFacilityUpsizeMotionV2Asset;
    outsideDeclaredChangedPixels: [0, 0, 0, 0];
    pivotDeltaPixels: [0, 0];
  };
  finiteUse: {
    states: [string, string, string, string, string, string];
    frames: Array<
      OfficeFacilityUpsizeMotionV2Asset & {
        index: number;
        state: string;
      }
    >;
    interactionGif: OfficeFacilityUpsizeMotionV2Asset;
  };
  reviewOutputs: Array<
    OfficeFacilityUpsizeMotionV2Asset & {
      kind: "png";
    }
  >;
}

export interface OfficeFacilityUpsizeMotionV2Manifest {
  schemaVersion: 1;
  id: "office.facility.upsize-motion.v2";
  revision: "motion-artwork-v2-visual-r01";
  status: "motion-artwork-owner-review";
  createdOn: string;
  developmentOnly: true;
  decisionBoundary: {
    productionV1: {
      manifest: string;
      manifestSha256: string;
      decision: "rejected-at-f8";
      systemBehavior: "accepted";
      visualIdentity: "accepted";
      motionArtwork: "rejected-procedural-effect-pixels";
    };
    replacementScope: "visual-motion-artwork-only";
    fullProductionRebuildBeforeVisualApproval: false;
  };
  sourcePolicy: {
    workflow: "built-in ImageGen";
    promptRecord: { file: string; sha256: string };
    approvedShellPixelReuse: true;
    freshMotionPixelGeneration: true;
    proceduralRuntimeEffectPixels: false;
    codeMayCrop: true;
    codeMayChromaRemove: true;
    codeMayNearestResize: true;
    codeMayIntegerTranslate: true;
    codeMayAlphaComposite: true;
    missingAssetFallback: false;
  };
  physicalContract: {
    physicalScaleTiles: [2, 2, 4];
    floorFootprintTiles: [2, 2];
    renderBoxTiles: [3, 4];
    runtimeCanvas: [96, 128];
    basePivotPixels: [48, 124];
  };
  families: OfficeFacilityUpsizeMotionV2Family[];
  batchReview: OfficeFacilityUpsizeMotionV2Asset & { kind: "png" };
  gates: Record<string, { status: string }>;
  roomIsolation: {
    f9Manifest: string;
    f9ManifestSha256: string;
    f9Changed: false;
    activeOfficeChanged: false;
    reservationSlotsActivated: 0;
  };
  permissions: {
    visualReview: true;
    fullProductionRebuild: false;
    reservationSlotTransfer: false;
    f9Composition: false;
    activeOfficePromotion: false;
  };
  ownerDecision: null;
}

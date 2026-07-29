export const officeFacilityArcadeGeneratedPreflightGates = [
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

export const officeFacilityArcadeGeneratedOrientations = [
  "front",
  "left",
  "right",
  "back",
] as const;

export const officeFacilityArcadeGeneratedGames = [
  "cosmic-drift",
  "neon-rally",
  "dungeon-pulse",
] as const;

export type OfficeFacilityArcadeGeneratedPreflightGate =
  (typeof officeFacilityArcadeGeneratedPreflightGates)[number];

export interface OfficeFacilityArcadeGeneratedPreflightManifest {
  schemaVersion: 1;
  id: "office.facility.arcade-machine.g02";
  familyId: "machine.game.arcade.generated-modern";
  revision: "g02-preflight-r01";
  status: "visual-preflight-owner-review";
  productionStage: "visual-preflight";
  developmentOnly: true;
  activeOfficePromotion: false;
  plannedInteractionMode: "machine-local-controls";
  plannedHeldProp: false;
  sourcePolicy: {
    freshImageGeneration: true;
    originalMasterPixelReuse: false;
    processedCropDirectReuse: false;
    activeOfficePixelReuse: false;
    legacyOrRejectedPixelReuse: false;
    previousArcadePixelReuse: false;
    generativeRepair: false;
    missingAssetFallback: false;
  };
  generation: {
    workflow: "built-in-imagegen";
    promptRecord: { file: string; sha256: string };
    sources: readonly OfficeFacilityArcadeGeneratedSource[];
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
    requiredOrientations: readonly ["front", "left", "right", "back"];
    basePivot: { x: 1; y: 2; unit: "tile" };
    sortPivot: { x: 1; y: 2; unit: "tile" };
    renderPivotRuntime: readonly [48, 124];
    orientations: readonly OfficeFacilityArcadeGeneratedOrientation[];
  };
  screenSystem: {
    viewportAuthoring: readonly [120, 108, 264, 252];
    viewportRuntime: readonly [30, 27, 66, 63];
    runtimeSize: readonly [36, 36];
    frameIds: readonly ["a", "b", "c", "d"];
    transition: readonly ["a", "b", "c", "d", "a"];
    frameDurationMs: 200;
    cycleDurationMs: 800;
    backgroundScrollPhases: readonly [0, 9, 18, 27, 36];
    shellChangedPixelsOutsideViewport: 0;
    controlsChangedPixels: 0;
    pivotDeltaPixels: readonly [0, 0];
    games: readonly OfficeFacilityArcadeGeneratedGame[];
  };
  interactionPreview: {
    capacity: 1;
    visualPose: "interact-front";
    action: "play-arcade-machine";
    frontApproachCells: 1;
    stand: { x: 1; y: 2 };
    approach: { x: 1; y: 3 };
    exit: { x: 0; y: 3 };
    heldController: false;
    reservationSimulationBuilt: false;
    rosterCasesBuilt: 0;
    orientationRouteCasesBuilt: 0;
  };
  gates: Record<
    OfficeFacilityArcadeGeneratedPreflightGate,
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
  visualApproval: null;
  permissions: {
    ownerReview: true;
    fullSystemBuild: false;
    furnitureOnlyRoom: false;
    activeOfficePromotion: false;
  };
  activeOfficeEvidence: readonly {
    file: string;
    sha256: string;
    importsCandidate: false;
  }[];
}

export interface OfficeFacilityArcadeGeneratedSource {
  role: string;
  file: string;
  sha256: string;
  size: readonly [number, number];
  inputImageCount: number;
  identityReference?: "front-anchor";
  extractionMethod: "generated-source-chroma-key";
  sampledKeyRgb: readonly [number, number, number];
  chromaStats: {
    transparentPixels: number;
    partialAlphaPixels: number;
    visiblePixels: number;
  };
  keyedFile: string;
  keyedSha256: string;
  ownership: readonly {
    partId?: string;
    sourceCell: readonly [number, number, number, number];
    ownedBounds: readonly [number, number, number, number];
    visiblePixels: number;
    cellBoundaryContact: false;
  }[];
}

export interface OfficeFacilityArcadeGeneratedOrientation {
  orientation: "front" | "left" | "right" | "back";
  authoringFile: string;
  authoringSha256: string;
  authoringSize: readonly [384, 512];
  runtimeFile: string;
  runtimeSha256: string;
  runtimeSize: readonly [96, 128];
  runtimeAlphaBounds: readonly [number, number, number, number];
}

export interface OfficeFacilityArcadeGeneratedGame {
  gameId: "cosmic-drift" | "neon-rally" | "dungeon-pulse";
  title: string;
  sourceRole: string;
  screenFrames: readonly OfficeFacilityArcadeGeneratedFrame[];
  compositeFrames: readonly OfficeFacilityArcadeGeneratedFrame[];
  transitionChangedPixels: readonly [number, number, number, number];
  closureMismatchPixels: 0;
  outsideViewportChangedPixels: 0;
  controlRegionChangedPixels: 0;
  gif: { file: string; sha256: string; size: readonly [384, 512] };
}

export interface OfficeFacilityArcadeGeneratedFrame {
  frameId: "a" | "b" | "c" | "d";
  file: string;
  sha256: string;
  size: readonly [number, number];
}

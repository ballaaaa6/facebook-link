export type OfficeFacilityPrinterPreflightGate =
  | "F0" | "F1" | "F2" | "F3" | "F4" | "F5"
  | "F6" | "F7" | "F8" | "F9" | "F10";

export interface OfficeFacilityPrinterGeneratedPreflightManifest {
  schemaVersion: 1;
  id: "office.facility.printer.p01";
  familyId: "printer.multifunction.floor";
  revision: "p01-generated-motion-preflight-r01";
  status: "visual-motion-preflight-owner-review";
  productionStage: "f2-complete-f3-owner-review";
  developmentOnly: true;
  activeOfficePromotion: false;
  sourcePolicy: {
    freshImageGeneration: true;
    identityAnchorTextOnly: true;
    motionAtlasReferenceInputs: readonly string[];
    originalMasterPixelReuse: false;
    processedPrinterPixelReuse: false;
    foreignFamilyPixelReuse: false;
    activeOfficePixelReuse: false;
    missingAssetFallback: false;
    sourceFiles: readonly {
      file: string;
      sha256: string;
      role: "identity-anchor" | "motion-parts-atlas";
    }[];
    promptRecord: {
      file: string;
      sha256: string;
      tool: "built-in image_gen";
    };
    chromaKey: "#ff00ff";
    localAlphaExtraction: true;
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
  assets: Record<string, PrinterAsset>;
  animation: {
    compositionFormula:
      "immutableShell + statusViewport[frame] + scannerLight[frame] + outputTray[state] + outputChild[state]";
    processingLoop: readonly ["A", "B", "C", "D", "A"];
    processingLoopKind: "invoked-seam-loop";
    finiteOutputSequence: readonly [
      "idle", "wake", "processing", "tray-half", "tray-open",
      "output-ready", "pickup", "tray-half", "tray-closed", "idle",
    ];
    screenRectRuntime: readonly [31, 22, 65, 42];
    scannerRectRuntime: readonly [18, 15, 78, 20];
    trayRectRuntime: readonly [22, 48, 74, 79];
    shellMoves: false;
    pivotDeltaPixels: readonly [0, 0];
    footprintDeltaTiles: readonly [0, 0];
    outputSelectionRandomPerFrame: false;
  };
  spatial: {
    authorityManifest: string;
    authoritySha256: string;
    coordinateFormula: "worldRoot - actorFrameRootSocket";
    footprintCells: readonly (readonly [number, number])[];
    stand: readonly [0, 2];
    approach: readonly [0, 3];
    exit: readonly [1, 3];
    route: readonly (readonly [number, number])[];
    routeCollisionCount: 0;
    machineLocalSockets: {
      base: readonly [48, 124];
      sort: readonly [48, 124];
      interactionRoot: readonly [48, 124];
      outputPrimary: readonly [48, 66];
    };
    perCharacterOffsets: false;
    magicOffsets: false;
    missingSocketFallback: false;
  };
  interaction: {
    semanticAction: "interact-use";
    visualPose: "interact-front";
    plannedInstanceIds: readonly ["printer-01", "printer-02"];
    plannedFamilyInstanceCount: 2;
    capacityPerInstance: 1;
    independentReservations: true;
    jobOutputMap: {
      "print-document": "held.paper-sheet";
      "prepare-mail": "held.envelope";
    };
    outputSelectionRule: "job-driven-once-per-visit";
    propSocketRule: "midpoint-primary-secondary";
    attachmentDelta: readonly [0, 0];
    newCoordinateSystem: false;
    reservationSlotContribution: 0;
    plannedReservationSlotContributionAfterF8: 2;
    facilityV1ReadySlotsBeforePrinterF8: 18;
    facilityV1ReadySlotsAfterPrinterF8Target: 20;
  };
  preflightValidation: {
    characterPreview: "anna";
    propIds: readonly ["held.paper-sheet", "held.envelope"];
    attachmentRule: "midpoint-primary-secondary";
    attachmentFailures: 0;
    foregroundMaskUses: 0;
    magicOffsetCases: 0;
    fallbackSocketCases: 0;
    productionRosterCasesBuilt: 0;
    reservationSimulationSecondsBuilt: 0;
  };
  gates: Record<
    OfficeFacilityPrinterPreflightGate,
    {
      status: "passed" | "pending-owner-review" | "blocked";
      evidence: readonly string[];
    }
  >;
  reviewOutputs: readonly string[];
  reviewEvidence: readonly PrinterReviewEvidence[];
  permissions: {
    visualMotionPreflight: true;
    ownerReview: true;
    fullSystemBuild: false;
    reservationSlotActivation: false;
    furnitureOnlyRoom: false;
    activeOfficePromotion: false;
  };
  activeOfficeEvidence: readonly { file: string; imported: false }[];
  ownerDecision: null;
}

interface PrinterAsset {
  file: string;
  sha256: string;
  size: readonly [96, 128];
}

interface PrinterReviewEvidence {
  path: string;
  sha256: string;
  kind: "png" | "gif";
  size: readonly [number, number];
  frameCount?: number;
  durationMs?: number;
}

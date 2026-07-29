type OfficeFacilityRefrigeratorPreflightGate =
  | "F0" | "F1" | "F2" | "F3" | "F4" | "F5"
  | "F6" | "F7" | "F8" | "F9" | "F10";

export interface OfficeFacilityRefrigeratorGeneratedPreflightManifest {
  schemaVersion: 1;
  id: "office.facility.refrigerator.r01";
  familyId: "refrigerator.modern";
  revision: "r01-generated-motion-preflight-r01";
  status: "visual-motion-preflight-owner-review";
  productionStage: "visual-motion-preflight";
  developmentOnly: true;
  activeOfficePromotion: false;
  ownerDirective: {
    recordedOn: "2026-07-30";
    physicalScale: "2x2x4";
    animatedDoor: true;
    randomHeldOutput: true;
    reuseExistingSpatialSystem: true;
    freshRefrigeratorIdentity: true;
  };
  sourcePolicy: {
    freshImageGeneration: true;
    originalMasterPixelReuse: false;
    processedCropDirectReuse: false;
    rejectedSideOrientationPixelReuse: false;
    activeOfficePixelReuse: false;
    otherFacilityPixelReuse: false;
    missingAssetFallback: false;
  };
  generation: {
    workflow: "built-in-imagegen";
    promptRecord: AssetReference;
    sources: readonly GeneratedSource[];
    keyedEvidence: Record<string, AssetReference>;
  };
  render: {
    physicalScale: TileSize3;
    footprint: TileSize2;
    renderBox: TileSize2;
    authoringCanvas: readonly [384, 512];
    runtimeCanvas: readonly [96, 128];
    uniformIntegerDivisor: 4;
    nonUniformScaling: false;
    anchor: "bottom-center";
    requiredOrientations: readonly ["front"];
    basePivotRuntime: readonly [48, 124];
    sortPivotRuntime: readonly [48, 124];
    interactionTargetRuntime: readonly [48, 124];
    outputSocketRuntime: readonly [49, 76];
    doorSwingRegionRuntime: readonly [14, 38, 89, 124];
    collisionChangesDuringMotion: false;
    footprintChangesDuringMotion: false;
  };
  parts: Record<
    "shell" | "door-closed" | "door-half" | "door-open",
    {
      authoring: AssetReference;
      runtime: AssetReference;
      localOriginRuntime: readonly [number, number];
      sourceResampling: "nearest";
    }
  >;
  states: Record<"closed" | "half" | "open", AssetReference>;
  finiteAnimation: {
    kind: "reversible-finite-state";
    repeatingAmbientLoop: false;
    compositionFormula: "immutableShell + lowerDoor[state]";
    immutableShell: "shell";
    movingChild: "lowerDoor";
    states: readonly ["closed", "half", "open"];
    forwardPath: readonly ["closed", "half", "open"];
    reversePath: readonly ["open", "half", "closed"];
    reviewTransition: readonly [
      "closed",
      "half",
      "open",
      "half",
      "closed",
    ];
    transitionChangedPixels: readonly number[];
    changedPixelsOutsideDoorSwingRegion: readonly [0, 0, 0, 0];
    shellChangedPixels: 0;
    pivotDeltaPixels: readonly [0, 0];
    footprintDeltaTiles: readonly [0, 0];
    closedEndpointMismatchPixels: 0;
    interruption: {
      beforePickup: string;
      afterPickup: string;
      reservationReleased: true;
    };
    gif: GifReference;
  };
  interactionPreview: {
    semanticAction: "interact-use";
    visualPoseAuthority: "interact-front";
    capacity: 1;
    frontApproachCells: 1;
    actorId: "anna";
    actionAuthority: AuthorityReference;
    spatialAuthority: AuthorityReference;
    heldPropAuthority: AuthorityReference & {
      pool: readonly {
        assetId: "held.water-bottle" | "held.yogurt-box";
        runtimeFile: string;
        runtimeSha256: string;
        visualCenterSocket: readonly [number, number];
        attachmentMode: "front-overlay";
      }[];
    };
    selection: {
      algorithm:
        "(stable-hash(actorId|slotId) + visitIndex) % pool.length";
      selectedOncePerVisit: true;
      frameStable: true;
      repeatAvoidance: "two-item pool alternates across visits";
      pool: readonly ["held.water-bottle", "held.yogurt-box"];
      examples: readonly {
        actorId: "anna";
        slotId: "refrigerator-r01-slot-0";
        visitIndex: number;
        assetId: "held.water-bottle" | "held.yogurt-box";
      }[];
      previewVisitIndex: 0;
      previewAssetId: "held.water-bottle" | "held.yogurt-box";
    };
    handoff: {
      facilityParent: "facility.output.primary";
      actorParent: "actor.hand.primary.grip";
      childSocket: "prop.visualCenterSocket";
      attachmentDelta: readonly [0, 0];
      magicOffset: false;
      missingSocketFallback: false;
      newCoordinateSystem: false;
      foregroundMaskUses: 0;
    };
    timeline: readonly InteractionStep[];
    gif: GifReference;
    reservationSimulationBuilt: false;
    rosterCasesBuilt: 0;
  };
  productionTargets: {
    basePoseCases: 108;
    propOverlayCasesPerTwoAssetPool: 108;
    builtPoseCases: 0;
    builtPropOverlayCases: 0;
    reservationDurationSeconds: 30;
    reservationActorCount: 2;
    reservationSlotContribution: 0;
    plannedReservationSlotContributionAfterF8: 1;
    facilityV1ReadySlotsBeforeRefrigeratorF8: 17;
    facilityV1ReadySlotsAfterRefrigeratorF8Target: 18;
  };
  gates: Record<
    OfficeFacilityRefrigeratorPreflightGate,
    { status: "passed" | "blocked"; evidence: readonly string[] }
  >;
  reviewOutputs: readonly string[];
  reviewEvidence: readonly (AssetReference & {
    kind: "png" | "gif";
    frameCount?: number;
    durationMs?: number;
  })[];
  visualApproval: null;
  permissions: {
    ownerReview: true;
    fullSystemBuild: false;
    reservationSlotActivation: false;
    furnitureOnlyRoom: false;
    activeOfficePromotion: false;
  };
  scopeExclusions: readonly string[];
}

interface AssetReference {
  file: string;
  sha256: string;
  size?: readonly [number, number];
}

interface GifReference extends AssetReference {
  size: readonly [number, number];
  frameCount: number;
  durationMs: number;
}

interface AuthorityReference {
  manifest: string;
  manifestSha256: string;
  status: "owner-approved";
}

interface GeneratedSource {
  role: "front-anchor" | "motion-parts";
  file: string;
  sha256: string;
  size: readonly [number, number];
  inputImageCount: 0 | 1;
  identityReference: null | "front-anchor";
  extractionMethod: "generated-source-chroma-key";
  ownership: readonly {
    role: string;
    sourceCell: readonly [number, number, number, number];
    ownedBounds: readonly [number, number, number, number];
    visiblePixels: number;
    cellBoundaryContact: false;
  }[];
}

interface TileSize2 {
  width: number;
  height?: number;
  depth?: number;
  unit: "tile";
}

interface TileSize3 {
  width: number;
  depth: number;
  height: number;
  unit: "tile";
}

interface InteractionStep {
  phase: string;
  animation: "walk-left" | "walk-right" | "interact-front";
  actorFrame: number;
  approachOffsetX: number;
  doorState: "closed" | "half" | "open";
  attachmentParent:
    | null
    | "facility.output.primary"
    | "actor.hand.primary.grip";
  propVisible: boolean;
  attachmentDelta: null | readonly [0, 0];
  magicOffset: false;
  fallbackSocket: false;
}

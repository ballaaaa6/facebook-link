export const officeFacilityArcadeProductionOrientations = [
  "front",
  "right",
  "back",
  "left",
] as const;

export const officeFacilityArcadeProductionGames = [
  "cosmic-drift",
  "neon-rally",
  "dungeon-pulse",
] as const;

export const officeFacilityArcadeProductionGates = [
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

export type OfficeFacilityArcadeProductionOrientation =
  (typeof officeFacilityArcadeProductionOrientations)[number];

export interface OfficeFacilityArcadeProductionAsset {
  file: string;
  sha256: string;
  size: readonly [number, number];
}

export interface OfficeFacilityArcadeProductionManifest {
  schemaVersion: 1;
  id: "office.facility.arcade-machine.g02.production";
  familyId: "machine.game.arcade.generated-modern";
  revision: "g02-production-r01";
  status: "owner-review-f8-pending";
  developmentOnly: true;
  activeOfficePromotion: false;
  preflightAuthority: {
    manifest: string;
    manifestSha256: string;
    id: "office.facility.arcade-machine.g02";
    revision: "g02-preflight-r02";
    status: "visual-preflight-owner-approved";
    approvedReviewHashCount: 14;
    hashMismatchCount: 0;
  };
  sourcePolicy: {
    approvedPreflightPixelsOnly: true;
    newImageGeneration: false;
    previousArcadePixelReuse: false;
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
    orientations: readonly OfficeFacilityArcadeProductionOrientation[];
  };
  parts: {
    shell: readonly {
      orientation: OfficeFacilityArcadeProductionOrientation;
      authoring: OfficeFacilityArcadeProductionAsset;
      runtime: OfficeFacilityArcadeProductionAsset;
    }[];
    controls: readonly {
      orientation: OfficeFacilityArcadeProductionOrientation;
      visible: boolean;
      boundsRuntime: readonly [number, number, number, number] | null;
      authoring: OfficeFacilityArcadeProductionAsset;
      runtime: OfficeFacilityArcadeProductionAsset;
    }[];
    viewports: readonly {
      gameId: "cosmic-drift" | "neon-rally" | "dungeon-pulse";
      frameId: "a" | "b" | "c" | "d";
      authoring: OfficeFacilityArcadeProductionAsset;
      runtime: OfficeFacilityArcadeProductionAsset;
    }[];
  };
  animation: {
    compositionFormula: "shell + viewport[n] + machineLocalControls";
    frameIds: readonly ["a", "b", "c", "d"];
    transition: readonly ["a", "b", "c", "d", "a"];
    frameDurationMs: 200;
    viewportBoundsRuntime: readonly [30, 27, 66, 63];
    shellChangedPixels: 0;
    controlsChangedPixels: 0;
    outsideViewportChangedPixels: 0;
    pivotDeltaPixels: readonly [0, 0];
    closureMismatchPixels: 0;
    games: readonly {
      gameId: "cosmic-drift" | "neon-rally" | "dungeon-pulse";
      frames: readonly OfficeFacilityArcadeProductionAsset[];
      transitionChangedPixels: readonly [number, number, number, number];
    }[];
  };
  spatial: {
    authority: { file: string; sha256: string; status: "owner-approved" };
    coordinateFormula: "worldRoot - actorFrameRootSocket";
    perSceneOffsets: false;
    missingSocketFallback: false;
    fractionalCoordinates: false;
    orientations: readonly {
      orientation: OfficeFacilityArcadeProductionOrientation;
      footprintCells: readonly (readonly [number, number])[];
      stand: readonly [number, number];
      approach: readonly [number, number];
      exit: readonly [number, number];
      route: readonly (readonly [number, number])[];
      facing: OfficeFacilityArcadeProductionOrientation;
      machineLocalSockets: {
        base: readonly [48, 124];
        sort: readonly [48, 124];
        viewport: readonly [number, number];
        interactionRoot: readonly [number, number];
        controlPrimary: readonly [number, number];
        controlSecondary: readonly [number, number];
      };
      routeCollisionCount: 0;
    }[];
  };
  interaction: {
    capacity: 1;
    action: "play-arcade-machine";
    visualPose: "interact-front";
    frontApproachCells: 1;
    machineLocalControls: true;
    heldController: false;
    heldPropManifest: null;
    reservationSlotContribution: 0;
    plannedReservationSlotContributionAfterF8: 1;
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
    heldControllerCases: 0;
    perCharacterOffsets: false;
    poseCases: readonly {
      caseId: string;
      actorId: string;
      frame: number;
      rootSocket: readonly [number, number];
      primaryGripSocket: readonly [number, number];
      holdState: string;
    }[];
    orientationCases: readonly {
      caseId: string;
      poseCaseId: string;
      orientation: OfficeFacilityArcadeProductionOrientation;
      actorOrigin: readonly [number, number];
      worldRoot: readonly [number, number];
      resolvedRoot: readonly [number, number];
      rootAlignmentDelta: readonly [0, 0];
      pivotDelta: readonly [0, 0];
      routeValid: true;
      heldController: false;
    }[];
  };
  reservationValidation: {
    durationSeconds: 30;
    actorCount: 2;
    maximumConcurrentReservations: 1;
    collisionCount: 0;
    blockedAttemptCount: 1;
    failureCount: 1;
    releaseCount: 2;
    retrySuccessCount: 1;
    releasedAtEnd: true;
    events: readonly {
      second: number;
      actorId: "actor-a" | "actor-b";
      event: string;
      result: string;
    }[];
    samples: readonly {
      second: number;
      heldBy: "actor-a" | "actor-b" | null;
      actorAState: string;
      actorBState: string;
    }[];
  };
  gates: Record<
    (typeof officeFacilityArcadeProductionGates)[number],
    {
      status: "passed" | "pending-owner-review" | "blocked";
      evidence: readonly string[];
    }
  >;
  reviewOutputs: readonly string[];
  reviewEvidence: readonly {
    path: string;
    sha256: string;
    size: readonly [number, number];
  }[];
  permissions: {
    familyLab: true;
    ownerReview: true;
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

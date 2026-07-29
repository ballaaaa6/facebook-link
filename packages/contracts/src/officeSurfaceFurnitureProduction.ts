import type { OfficeGeometryV3 } from "./officeGeometry.ts";
import type {
  OfficeFurnitureGateStatus,
  OfficeFurnitureProductionGate,
} from "./officeFurnitureProduction.ts";

export interface OfficeSurfaceFurnitureFileEvidence {
  file: string;
  sha256: string;
}

export interface OfficeSurfaceFurnitureGeneratedSource {
  kind: "generated-isolated-clean-source";
  path: string;
  sha256: string;
  prompt: string;
  generation: {
    workflow: "built-in-imagegen";
    inputImageCount: 0;
    conceptPixelsAsSource: false;
    geometryCorrectionCount: number;
  };
  extractionMethod: "generated-source-chroma-key";
  geometryNormalization?: {
    method: "orthographic-row-removal-without-resampling";
    sourceSurfaceBounds: readonly [number, number, number, number];
    removedRows: readonly [number, number];
    preservedFrontAssemblyFromRow: number;
    outputSurfaceBounds: readonly [number, number, number, number];
    pixelsResampled: false;
  };
  sampledKeyRgb: readonly [number, number, number];
  sourceSize: readonly [number, number];
  ownedBounds: readonly [number, number, number, number];
  connectedComponentCount: 1;
  selectedVisiblePixels: number;
  sourcePixelsResampled: false;
  canvasContact: false;
  chromaStats: {
    transparentPixels: number;
    partialAlphaPixels: number;
    visiblePixels: number;
  };
  keyedSource: OfficeSurfaceFurnitureFileEvidence;
  ownershipMask: OfficeSurfaceFurnitureFileEvidence;
  geometryNormalizedSource?: OfficeSurfaceFurnitureFileEvidence;
  normalizedCutout: OfficeSurfaceFurnitureFileEvidence;
  authoringPadding: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
}

export type OfficeSurfaceFurniturePartRole =
  | "base-shell"
  | "support-surface"
  | "foreground-occlusion";

export interface OfficeSurfaceFurniturePart {
  id: string;
  role: OfficeSurfaceFurniturePartRole;
  authoringFile: string;
  authoringSha256: string;
  runtimeFile: string;
  runtimeSha256: string;
}

export interface OfficeSurfaceFurnitureSlot {
  id: string;
  supportPlaneId: string;
  point: { x: number; y: number; unit: "tile" };
  localSocket: readonly [number, number];
  accepts: readonly ("equipment-1x1" | "prop-1x1")[];
  pairedUseLaneId: string;
}

export interface OfficeSurfaceFurnitureUseLane {
  id: string;
  surfaceSlotId?: string;
  surfaceSlotIds?: readonly string[];
  stand: { x: number; y: number };
  approach: { x: number; y: number };
  exit: { x: number; y: number };
  facing: "front";
}

export interface OfficeSurfaceFurnitureProductionManifest {
  schemaVersion: 1;
  id: string;
  familyId: string;
  revision: string;
  status: "owner-review-f8-pending" | "owner-approved" | "rejected";
  developmentOnly: true;
  activeOfficePromotion: false;
  sourcePolicy: {
    conceptSheetPixelReuse: false;
    processedCropDirectReuse: false;
    activeOfficePixelReuse: false;
    legacyOrRejectedPixelReuse: false;
    generativeRepair: false;
    missingAssetFallback: false;
  };
  source: OfficeSurfaceFurnitureGeneratedSource;
  render: {
    authoringCanvas: readonly [number, number];
    runtimeCanvas: readonly [number, number];
    uniformIntegerDivisor: number;
    nonUniformScaling: false;
    orientation: "front";
    anchor: "bottom-center";
    projection: {
      screenX: "worldX * 32";
      screenY: "worldY * 32 - worldZ * 32";
      perspective: false;
    };
  };
  geometry: OfficeGeometryV3;
  cleanAsset: OfficeSurfaceFurnitureFileEvidence;
  parts: readonly OfficeSurfaceFurniturePart[];
  spatial: {
    coordinateSpace: "counter-runtime-pixel";
    tilePixels: 32;
    rootSocketId: "root.floor";
    sortSocketId: "sort.floor";
    localSockets: Record<string, readonly [number, number]>;
    attachmentFormula: "parent-socket-minus-child-socket";
    perSceneAttachmentOffsets: false;
    centerFallback: false;
    missingSocketFallback: false;
    attachmentDeltaFailures: 0;
  };
  surfaceContract: {
    supportPlaneId: string;
    slots: readonly OfficeSurfaceFurnitureSlot[];
    adjacentSpanGroups: readonly {
      id: string;
      slotIds: readonly [string, string];
      accepts: readonly ["equipment-2x1"];
    }[];
    twoByTwoSpanGroups?: readonly {
      id: string;
      slotIds: readonly [string, string, string, string];
      accepts: readonly ["equipment-2x2"];
    }[];
    useLanes: readonly OfficeSurfaceFurnitureUseLane[];
    projectedSupportBounds?: readonly [number, number, number, number];
    visualTopBounds?: readonly [number, number, number, number];
    edgeSupportFailures?: 0;
    atomicOccupancy: true;
    rejectOverlap: true;
    rejectUnsupportedChild: true;
    childInteractionDelegated: true;
    coffeeC01Imported: false;
  };
  placementValidation: {
    oneByOneCases: number;
    twoByOneCases: number;
    twoByTwoCases?: number;
    configurationCount: number;
    overlapRejections: number;
    unsupportedChildRejections: number;
    routeObstructionCount: 0;
    attachmentDeltaFailures: 0;
    configurations: readonly {
      id: string;
      occupiedSlotIds: readonly string[];
      spanGroupIds: readonly string[];
      valid: boolean;
    }[];
  };
  movementValidation: {
    worldPositions: readonly [number, number][];
    childAttachmentCases: number;
    attachmentDeltaFailures: 0;
    propFollowFailures: 0;
  };
  reservationValidation: {
    durationSeconds: 30;
    contenderCount: 2;
    maximumConcurrentReservations: 1;
    blockedAttemptCount: number;
    failureCount: number;
    retrySuccessCount: number;
    releasedAtEnd: true;
    samples: readonly {
      second: number;
      heldBy: string | null;
      states: Record<string, string>;
    }[];
  };
  gates: Record<
    OfficeFurnitureProductionGate,
    { status: OfficeFurnitureGateStatus; evidence: readonly string[] }
  >;
  reviewOutputs: readonly OfficeSurfaceFurnitureFileEvidence[];
  permissions: {
    isolatedFamilyLab: boolean;
    ownerReview: boolean;
    attachedCoffeeProduction: false;
    furnitureOnlyRoom: false;
    activeOfficePromotion: false;
  };
  ownerDecision: null | {
    decision: "approved" | "rejected";
    decidedOn: string;
    notes: string;
  };
}

export {
  validateOfficeSurfaceFurnitureProductionManifest,
} from "./officeSurfaceFurnitureProductionValidation.ts";

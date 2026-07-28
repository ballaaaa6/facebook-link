import type {
  OfficeGeometryV3,
  OfficeOrientation,
} from "./officeGeometry.ts";

export const officeFurnitureProductionGates = [
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

export type OfficeFurnitureProductionGate =
  (typeof officeFurnitureProductionGates)[number];
export type OfficeFurnitureGateStatus =
  | "passed"
  | "pending-owner-review"
  | "blocked";

export interface OfficeFurnitureSourceEvidence {
  kind: "audited-original-master";
  path: string;
  sha256: string;
  auditManifest: string;
  auditRecordId: string;
  sourceBounds: readonly [number, number, number, number];
  ownedBounds: readonly [number, number, number, number];
  extraction: {
    method: "full-master-component-ownership";
    selectedComponentCount: number;
    selectedPixelCount: number;
    discardedComponentCount: number;
    touchesNominalCellBoundary: boolean;
    touchesMasterBoundary: boolean;
    sourcePixelsResampled: false;
  };
}

export interface OfficeFurniturePartEvidence {
  id: string;
  role: "shell" | "rear" | "foreground";
  authoringFile: string;
  authoringSha256: string;
  runtimeFile: string;
  runtimeSha256: string;
}

export interface OfficeFurnitureInteractionSlot {
  id: string;
  seat: { x: number; y: number };
  approach: { x: number; y: number };
  exit: { x: number; y: number };
  facing: Exclude<OfficeOrientation, "none">;
  /** Semantic runtime behavior, for example `use-massage-chair`. */
  action: string;
  /** Frozen visual pose used while the semantic action is active. */
  visualPose: string;
  reservationId: string;
}

export interface OfficeFurniturePoseAuthority {
  id: string;
  manifest: string;
  manifestSha256: string;
  status: "owner-approved";
  orientation: Exclude<OfficeOrientation, "none">;
  row: number;
}

export interface OfficeFurnitureFamilyManifest {
  schemaVersion: 1;
  id: string;
  familyId: string;
  revision: string;
  status: "owner-review-f8-pending" | "owner-approved" | "rejected";
  developmentOnly: true;
  activeOfficePromotion: false;
  sourcePolicy: {
    processedCropDirectReuse: false;
    activeOfficePixelReuse: false;
    legacyOrRejectedPixelReuse: false;
    generativeRepair: false;
    missingAssetFallback: false;
  };
  source: OfficeFurnitureSourceEvidence;
  render: {
    authoringCanvas: readonly [number, number];
    runtimeCanvas: readonly [number, number];
    uniformIntegerDivisor: number;
    nonUniformScaling: false;
    anchor: "bottom-center";
  };
  geometry: OfficeGeometryV3;
  parts: readonly OfficeFurniturePartEvidence[];
  interaction: {
    capacity: number;
    durationSeconds: number;
    atomicReservation: true;
    releaseOnFailure: true;
    states: readonly string[];
    slots: readonly OfficeFurnitureInteractionSlot[];
  };
  rosterValidation: {
    visualPose: string;
    poseAuthority: OfficeFurniturePoseAuthority;
    row: number;
    activeFrames: number;
    characterCount: number;
    perCharacterFurnitureScaling: false;
    perCharacterSeatOffsets: false;
    characters: readonly {
      id: string;
      sheet: string;
      sha256: string;
      frames: readonly {
        frame: number;
        frameBounds: readonly [number, number, number, number] | null;
        actorContactLocal: readonly [number, number];
        actorInsideReviewCard: boolean;
        foregroundOverlapPixels: number;
      }[];
    }[];
  };
  reservationValidation: {
    durationSeconds: number;
    actorCount: number;
    maximumConcurrentReservations: number;
    collisionCount: number;
    releasedAtEnd: boolean;
  };
  gates: Record<
    OfficeFurnitureProductionGate,
    { status: OfficeFurnitureGateStatus; evidence: readonly string[] }
  >;
  reviewOutputs: readonly string[];
  ownerDecision: null | {
    decision: "approved" | "rejected";
    decidedOn: string;
    notes: string;
  };
}

export {
  validateOfficeFurnitureFamilyManifest,
} from "./officeFurnitureProductionValidation.ts";

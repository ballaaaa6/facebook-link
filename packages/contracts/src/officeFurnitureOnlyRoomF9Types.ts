export interface OfficeFurnitureOnlyRoomF9Manifest {
  schemaVersion: 1;
  id: "office.furniture-only-room.f9.v1";
  revision: "f9-v1";
  status: "f9-owner-review";
  productionStage: "f9-candidate-owner-review";
  developmentOnly: true;
  activeOfficePromotion: false;
  sourcePolicy: Record<string, boolean>;
  authorityLedger: Array<{
    id: string;
    manifest: string;
    sha256: string;
    status: string;
    f8Status: string;
  }>;
  inventory: {
    workstationCount: number;
    facilityObjectCount: number;
    supportFurnitureCount: number;
    reservationSlotCount: number;
    decorCount: number;
    personCount: number;
  };
  interiorValidation: {
    workstationAnchorCell: string;
    workstationRows: number;
    workstationsPerRow: number;
    rightEdgeSideOrientedFacilityCount: number;
    frontOnlyFamilyOrientationViolations: number;
    footprintOverlapCount: number;
    blockedApproachCount: number;
    circulationDisconnectedCount: number;
  };
  map: {
    file: string;
    sha256: string;
    grid: [number, number];
    tilePixels: number;
  };
  layers: Array<{
    id: string;
    path: string;
    sha256: string;
    size: [number, number];
    visibleInClean: boolean;
  }>;
  routeValidation: {
    queryCount: number;
    reachableCount: number;
    unreachableCount: number;
    minimumRequired: number;
  };
  reservationValidation: Record<string, number>;
  people: {
    visible: boolean;
    placementCount: number;
    spriteReferenceCount: number;
  };
  reviewOutputs: Array<{
    path: string;
    sha256: string;
    size: [number, number];
  }>;
  gates: Record<string, { status: string; note?: string }>;
  permissions: {
    ownerReview: boolean;
    f10CharacterPopulation: boolean;
    activeOfficePromotion: boolean;
  };
  ownerDecision: null;
}

export interface OfficeFurnitureOnlyRoomF9Map {
  schemaVersion: 1;
  id: "office.furniture-only-room.f9.v1";
  status: "f9-owner-review";
  developmentOnly: true;
  activeOfficePromotion: false;
  coordinateSystem: {
    origin: "top-left";
    indexing: "zero-based";
    columns: number;
    rows: number;
    tilePixels: number;
    canvasPixels: [number, number];
  };
  interiorPlan: Record<string, unknown>;
  workstations: Array<Record<string, unknown>>;
  supportFurniture: Array<Record<string, unknown>>;
  facilities: Array<Record<string, unknown>>;
  reservationSlots: Array<Record<string, unknown>>;
  people: {
    visible: boolean;
    placements: unknown[];
    spriteReferences: unknown[];
  };
  decor: {
    placements: unknown[];
    approvedCount: number;
  };
  routeValidation: {
    queryCount: number;
    reachableCount: number;
    unreachableCount: number;
    queries: Array<Record<string, unknown>>;
  };
  reservationStress: {
    durationSeconds: number;
    syntheticActorCount: number;
    slotCount: number;
    events: Array<Record<string, unknown>>;
    concurrencySamples: Array<Record<string, unknown>>;
    summary: Record<string, number>;
  };
  layerOrder: string[];
}

export const officeSemanticGridV2ReviewOutputs = [
  "assets/art/backgrounds/office-c-background-modern-v4-candidate.png",
  "assets/art/layout-references/office-semantic-grid-v2/01-semantic-grid.png",
  "assets/art/layout-references/office-semantic-grid-v2/02-boundary-debug.png",
  "assets/art/layout-references/office-semantic-grid-v2/03-before-after.png",
] as const;

export type OfficeSemanticZoneId =
  | "office-wall"
  | "outside-window"
  | "relax-wall"
  | "office-floor"
  | "relax-floor"
  | "pillar-left"
  | "pillar-center"
  | "pillar-right";

export interface OfficeSemanticGridV2Map {
  schemaVersion: 1;
  id: "office-semantic-grid-v2";
  status: "owner-review";
  developmentOnly: true;
  activeOfficePromotion: false;
  sourceBackground: {
    file: string;
    sha256: string;
    mustRemainByteIdentical: true;
  };
  candidateBackground: {
    file: string;
    sha256: string;
    pixels: readonly [1672, 941];
  };
  activeOfficeBaseline: {
    file: string;
    sha256: string;
    mustRemainByteIdentical: true;
  };
  grid: {
    columns: 43;
    rows: 24;
    origin: "top-left";
    notation: "column-letter-row-number";
    cellCount: 1032;
  };
  zones: readonly {
    id: OfficeSemanticZoneId;
    kind: OfficeSemanticZoneId;
    label: string;
    ranges: readonly string[];
    color: string;
  }[];
  cellAssignments: Readonly<Record<string, OfficeSemanticZoneId>>;
  physicalEdits: {
    window: {
      oldCells: "N4-AA9";
      newCells: "N4-Z9";
      restoredOfficeWallCells: "AA4-AA9";
      sourcePixels: readonly [510, 119, 1050, 359];
      targetPixels: readonly [510, 119, 1011, 353];
      newRightGridBoundaryX: 1011;
    };
    floor: {
      recoveredRelaxationCells: "AB12-AB24";
      oldBoundaryX: 1065;
      newBoundaryX: 1050;
      gridBoundary: "AA|AB";
    };
  };
  rules: {
    allCellsClassified: true;
    pillarsExcludedFromFloor: true;
    activeOfficePromotion: false;
    newCharacterOrFurniture: false;
  };
}

export interface OfficeSemanticGridV2Manifest {
  version: 1;
  id: "office.semantic-grid.v2";
  status: "owner-review";
  updatedOn: string;
  map: { file: string; sha256: string };
  candidateBackground: { file: string; sha256: string };
  ownerEvidence: readonly { file: string; sha256: string }[];
  reviewOutputs: readonly { file: string; sha256: string }[];
  permissions: {
    isolatedBackgroundCandidate: true;
    semanticZoneReview: true;
    activeOfficePromotion: false;
    newCharacterOrFurniture: false;
  };
  activeOfficeBaseline: {
    file: string;
    sha256: string;
    mustRemainByteIdentical: true;
  };
}

const expectedZoneCounts: Readonly<Record<OfficeSemanticZoneId, number>> = {
  "office-wall": 172,
  "outside-window": 78,
  "relax-wall": 110,
  "office-floor": 376,
  "relax-floor": 219,
  "pillar-left": 22,
  "pillar-center": 33,
  "pillar-right": 22,
};

export function validateOfficeSemanticGridV2(
  manifest: OfficeSemanticGridV2Manifest,
  map: OfficeSemanticGridV2Map,
) {
  const issues: string[] = [];
  if (map.id !== "office-semantic-grid-v2" || map.status !== "owner-review"
    || manifest.id !== "office.semantic-grid.v2" || manifest.status !== "owner-review") {
    issues.push("invalid Office semantic-grid v2 identity");
  }
  if (!map.developmentOnly || map.activeOfficePromotion
    || manifest.permissions.activeOfficePromotion) {
    issues.push("semantic-grid v2 must remain isolated from Active Office");
  }
  if (map.grid.columns !== 43 || map.grid.rows !== 24 || map.grid.cellCount !== 1032
    || map.candidateBackground.pixels[0] !== 1672 || map.candidateBackground.pixels[1] !== 941) {
    issues.push("grid or candidate dimensions changed");
  }
  const assignments = Object.entries(map.cellAssignments);
  if (assignments.length !== 1032 || !map.rules.allCellsClassified) {
    issues.push("all 1,032 cells must have one semantic assignment");
  }
  for (const [zoneId, expectedCount] of Object.entries(expectedZoneCounts)) {
    if (assignments.filter(([, value]) => value === zoneId).length !== expectedCount) {
      issues.push(`${zoneId} cell count changed`);
    }
  }
  if (map.cellAssignments.AA4 !== "office-wall"
    || map.cellAssignments.Z9 !== "outside-window"
    || map.cellAssignments.AB12 !== "relax-floor") {
    issues.push("owner-restored wall or relaxation-floor cells changed");
  }
  if (map.physicalEdits.window.newCells !== "N4-Z9"
    || map.physicalEdits.window.restoredOfficeWallCells !== "AA4-AA9"
    || map.physicalEdits.window.newRightGridBoundaryX !== 1011) {
    issues.push("window shrink boundary changed");
  }
  if (map.physicalEdits.floor.recoveredRelaxationCells !== "AB12-AB24"
    || map.physicalEdits.floor.newBoundaryX !== 1050
    || map.physicalEdits.floor.gridBoundary !== "AA|AB") {
    issues.push("relaxation-floor boundary changed");
  }
  if (!map.rules.pillarsExcludedFromFloor || map.rules.newCharacterOrFurniture) {
    issues.push("pillars must remain outside floor and no new scene objects are allowed");
  }
  return issues;
}

export const officeFullGridReviewOutput =
  "assets/art/layout-references/office-full-grid-v1/01-office-full-grid-a1.png" as const;

export interface OfficeFullGridMap {
  schemaVersion: 1;
  id: "office-full-grid-v1";
  status: "owner-coordinate-review";
  developmentOnly: true;
  activeOfficePromotion: false;
  sourceBackground: {
    file: string;
    sha256: string;
    pixels: readonly [1672, 941];
    mustRemainByteIdentical: true;
  };
  activeOfficeBaseline: {
    file: string;
    sha256: string;
    mustRemainByteIdentical: true;
  };
  grid: {
    columns: 43;
    rows: 24;
    columnLabels: readonly string[];
    rowLabels: readonly number[];
    notation: "column-letter-row-number";
    origin: "top-left";
    xDirection: "right";
    yDirection: "down";
    coversEntireImage: true;
  };
  classifications: readonly [];
  rules: {
    ownerAssignsAllZones: true;
    inferredFloorOrWallZones: false;
    newCharacterOrPose: false;
    newFurnitureOrArt: false;
    activeOfficePromotion: false;
  };
}

export interface OfficeFullGridManifest {
  version: 1;
  id: "office.full-grid.v1";
  status: "owner-coordinate-review";
  updatedOn: string;
  map: { file: string; sha256: string };
  reviewOutput: { file: typeof officeFullGridReviewOutput; sha256: string };
  permissions: {
    deterministicFullImageGrid: true;
    zoneClassification: false;
    newCharacterOrPose: false;
    newFurnitureOrArt: false;
    activeOfficePromotion: false;
  };
  activeOfficeBaseline: {
    file: string;
    sha256: string;
    mustRemainByteIdentical: true;
  };
}

export function officeFullGridColumnLabel(index: number) {
  if (!Number.isInteger(index) || index < 0) return "";
  let value = index + 1;
  let label = "";
  while (value > 0) {
    value -= 1;
    label = String.fromCharCode(65 + (value % 26)) + label;
    value = Math.floor(value / 26);
  }
  return label;
}

export function officeFullGridCellLabel(column: number, row: number) {
  return `${officeFullGridColumnLabel(column)}${row + 1}`;
}

export function officeFullGridCellBounds(
  map: OfficeFullGridMap,
  column: number,
  row: number,
) {
  const [width, height] = map.sourceBackground.pixels;
  const left = Math.round((column * width) / map.grid.columns);
  const top = Math.round((row * height) / map.grid.rows);
  const right = Math.round(((column + 1) * width) / map.grid.columns);
  const bottom = Math.round(((row + 1) * height) / map.grid.rows);
  return { left, top, right, bottom, width: right - left, height: bottom - top };
}

function same(value: unknown, expected: unknown) {
  return JSON.stringify(value) === JSON.stringify(expected);
}

export function validateOfficeFullGrid(map: OfficeFullGridMap) {
  const issues: string[] = [];
  if (map.schemaVersion !== 1 || map.id !== "office-full-grid-v1"
    || map.status !== "owner-coordinate-review") issues.push("invalid Office full-grid identity");
  if (!map.developmentOnly || map.activeOfficePromotion) issues.push("Office full grid must remain development-only");
  if (!same(map.sourceBackground.pixels, [1672, 941])) issues.push("source background dimensions changed");
  if (map.grid.columns !== 43 || map.grid.rows !== 24 || !map.grid.coversEntireImage) {
    issues.push("full image grid must remain 43 columns by 24 rows");
  }
  const columns = Array.from({ length: 43 }, (_, index) => officeFullGridColumnLabel(index));
  const rows = Array.from({ length: 24 }, (_, index) => index + 1);
  if (!same(map.grid.columnLabels, columns) || !same(map.grid.rowLabels, rows)) {
    issues.push("grid coordinate labels changed");
  }
  if (map.grid.notation !== "column-letter-row-number" || map.grid.origin !== "top-left"
    || map.grid.xDirection !== "right" || map.grid.yDirection !== "down") {
    issues.push("grid coordinate directions changed");
  }
  if (map.classifications.length !== 0 || !map.rules.ownerAssignsAllZones
    || map.rules.inferredFloorOrWallZones || map.rules.newCharacterOrPose
    || map.rules.newFurnitureOrArt || map.rules.activeOfficePromotion) {
    issues.push("the full grid must not infer or add scene content");
  }
  return issues;
}

export const workstationV2Orientations = ["front", "back"] as const;
export const workstationV2PartRoles = ["rear", "surface", "base", "foreground"] as const;
export const workstationV2ReviewOutputs = [
  "assets/art/layout-references/office-workstation-v2/step4/01-desk-front-back-v2.png",
  "assets/art/layout-references/office-workstation-v2/step4/02-semantic-layers-v2.png",
  "assets/art/layout-references/office-workstation-v2/step4/03-adjacency-footprint-proof-v2.png",
  "assets/art/layout-references/office-workstation-v2/step4/00-step4-review-contact-sheet-v2.png",
] as const;

type WorkstationV2Orientation = (typeof workstationV2Orientations)[number];
type WorkstationV2PartRole = (typeof workstationV2PartRoles)[number];

export interface OfficeWorkstationBundleV2 {
  version: 2;
  geometrySchemaVersion: 3;
  id: "office.workstation.bundle.v2";
  status: "step4-artwork-review";
  updatedOn: string;
  permissions: {
    bareDeskArtwork: true;
    singleSeatAssembly: false;
    tenSeatSceneAssembly: false;
    rendererImplementation: false;
    activeOfficePromotion: false;
  };
  source: {
    generationMode: "built-in-imagegen";
    license: "project-authored-ai-assisted";
    commercialReviewRequired: true;
    promptFile: string;
    chromaFile: string;
    chromaSha256: string;
    alphaFile: string;
    alphaSha256: string;
    sheetPixels: { width: 1604; height: 981 };
    cells: Record<WorkstationV2Orientation, {
      sheetBounds: { x: number; y: number; width: number; height: number };
      contentBounds: { x: number; y: number; width: number; height: number };
    }>;
  };
  deskFamily: {
    id: "desk.workstation.modern.v2";
    contains: readonly ["bare-desk"];
    excludes: readonly ["monitor", "keyboard", "mouse", "chair", "character", "prop"];
    physicalScale: { width: 3; depth: 2; height: 2.4; unit: "tile" };
    footprint: { width: 3; depth: 2; unit: "tile" };
    supportPlane: { id: "desk-surface"; width: 3; depth: 2; height: 2.4; unit: "tile" };
    employeeEdge: null;
    generationRenderBox: { width: 3; height: 4; unit: "tile" };
    renderBounds: { width: 96; height: 128; unit: "authoring-pixel" };
    basePivot: { x: 1.5; y: 2; unit: "tile" };
    sortPivot: { x: 1.5; y: 2; unit: "tile" };
    normalization: {
      contentPixels: { width: 96; height: 72 };
      contentOrigin: { x: 0; y: 40 };
      baselineY: 112;
      resampling: "nearest";
      edgeRepair: "extend-nearest-active-pixel-across-full-tabletop-width";
      tabletopRows: { start: 40; endExclusive: 75 };
      tabletopHeightRatio: number;
    };
    semanticRows: Record<WorkstationV2PartRole, { start: number; endExclusive: number }>;
    orientations: Record<WorkstationV2Orientation, {
      compositeAssetId: string;
      compositeFile: string;
      parts: Record<WorkstationV2PartRole, string>;
    }>;
  };
  qa: {
    requiredChecks: readonly string[];
    reviewOutputs: typeof workstationV2ReviewOutputs;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function add(issues: string[], condition: boolean, path: string, message: string) {
  if (!condition) issues.push(`${path}: ${message}`);
}

function exact(value: unknown, expected: unknown) {
  return JSON.stringify(value) === JSON.stringify(expected);
}

function validatePermissions(value: Record<string, unknown>, issues: string[]) {
  const permissions = value.permissions;
  add(issues, isRecord(permissions), "permissions", "must be an object");
  if (!isRecord(permissions)) return;
  add(issues, permissions.bareDeskArtwork === true, "permissions.bareDeskArtwork", "must equal true");
  for (const key of ["singleSeatAssembly", "tenSeatSceneAssembly", "rendererImplementation", "activeOfficePromotion"] as const) {
    add(issues, permissions[key] === false, `permissions.${key}`, "must remain false during Step 4");
  }
}

function validateSource(value: Record<string, unknown>, issues: string[]) {
  const source = value.source;
  add(issues, isRecord(source), "source", "must be an object");
  if (!isRecord(source)) return;
  add(issues, source.generationMode === "built-in-imagegen", "source.generationMode", "must record built-in-imagegen");
  add(issues, source.license === "project-authored-ai-assisted", "source.license", "must record project authorship");
  add(issues, source.commercialReviewRequired === true, "source.commercialReviewRequired",
    "must block future commercial use until a separate review");
  for (const hashField of ["chromaSha256", "alphaSha256"] as const) {
    add(issues, typeof source[hashField] === "string" && /^[a-f0-9]{64}$/.test(source[hashField]),
      `source.${hashField}`, "must be a lowercase SHA-256");
  }
  add(issues, exact(source.sheetPixels, { width: 1604, height: 981 }), "source.sheetPixels", "must match the approved source");
  const cells = source.cells;
  add(issues, isRecord(cells) && exact(Object.keys(cells).sort(), [...workstationV2Orientations].sort()),
    "source.cells", "must contain exactly front and back");
}

function validateDesk(value: Record<string, unknown>, issues: string[]) {
  const desk = value.deskFamily;
  add(issues, isRecord(desk), "deskFamily", "must be an object");
  if (!isRecord(desk)) return;
  add(issues, desk.id === "desk.workstation.modern.v2", "deskFamily.id", "must use the v2 family");
  add(issues, exact(desk.contains, ["bare-desk"]), "deskFamily.contains", "must contain only the bare desk");
  add(issues, exact(desk.excludes, ["monitor", "keyboard", "mouse", "chair", "character", "prop"]),
    "deskFamily.excludes", "must exclude every Step 5 assembly child");
  add(issues, exact(desk.footprint, { width: 3, depth: 2, unit: "tile" }), "deskFamily.footprint", "must equal 3 x 2");
  add(issues, exact(desk.supportPlane, { id: "desk-surface", width: 3, depth: 2, height: 2.4, unit: "tile" }),
    "deskFamily.supportPlane", "must equal the complete 3 x 2 desk top");
  add(issues, desk.employeeEdge === null, "deskFamily.employeeEdge", "must remain null");
  add(issues, exact(desk.renderBounds, { width: 96, height: 128, unit: "authoring-pixel" }),
    "deskFamily.renderBounds", "must equal 96 x 128");

  const normalization = desk.normalization;
  add(issues, isRecord(normalization), "deskFamily.normalization", "must be an object");
  if (isRecord(normalization)) {
    add(issues, exact(normalization.contentPixels, { width: 96, height: 72 }),
      "deskFamily.normalization.contentPixels", "must equal 96 x 72");
    add(issues, exact(normalization.tabletopRows, { start: 40, endExclusive: 75 }),
      "deskFamily.normalization.tabletopRows", "must preserve 35 visible tabletop rows");
    add(issues, typeof normalization.tabletopHeightRatio === "number" && normalization.tabletopHeightRatio >= 0.4,
      "deskFamily.normalization.tabletopHeightRatio", "must be at least 0.4");
  }

  const rows = desk.semanticRows;
  const expectedRows: Record<WorkstationV2PartRole, { start: number; endExclusive: number }> = {
    rear: { start: 40, endExclusive: 42 },
    surface: { start: 42, endExclusive: 72 },
    base: { start: 75, endExclusive: 112 },
    foreground: { start: 72, endExclusive: 75 },
  };
  add(issues, isRecord(rows), "deskFamily.semanticRows", "must be an object");
  if (isRecord(rows)) {
    add(issues, exact(Object.keys(rows).sort(), [...workstationV2PartRoles].sort()),
      "deskFamily.semanticRows", "must contain exactly four semantic roles");
    for (const role of workstationV2PartRoles) {
      add(issues, exact(rows[role], expectedRows[role]), `deskFamily.semanticRows.${role}`,
        "must preserve the disjoint normalized row partition");
    }
  }
  const orientations = desk.orientations;
  add(issues, isRecord(orientations) && exact(Object.keys(orientations).sort(), [...workstationV2Orientations].sort()),
    "deskFamily.orientations", "must contain exactly front and back");
  if (isRecord(orientations)) {
    for (const orientation of workstationV2Orientations) {
      const record = orientations[orientation];
      add(issues, isRecord(record), `deskFamily.orientations.${orientation}`, "is required");
      if (!isRecord(record)) continue;
      const parts = record.parts;
      add(issues, isRecord(parts) && exact(Object.keys(parts).sort(), [...workstationV2PartRoles].sort()),
        `deskFamily.orientations.${orientation}.parts`, "must contain the four semantic layers");
    }
  }
}

export function validateOfficeWorkstationBundleV2(value: unknown): string[] {
  if (!isRecord(value)) return ["bundle: must be an object"];
  const issues: string[] = [];
  add(issues, value.version === 2, "version", "must equal 2");
  add(issues, value.geometrySchemaVersion === 3, "geometrySchemaVersion", "must equal 3");
  add(issues, value.id === "office.workstation.bundle.v2", "id", "must use the v2 bundle id");
  add(issues, value.status === "step4-artwork-review", "status", "must remain in Step 4 artwork review");
  validatePermissions(value, issues);
  validateSource(value, issues);
  validateDesk(value, issues);
  const qa = value.qa;
  add(issues, isRecord(qa) && exact(qa.reviewOutputs, workstationV2ReviewOutputs),
    "qa.reviewOutputs", "must list the exact Step 4 review boards");
  return issues;
}

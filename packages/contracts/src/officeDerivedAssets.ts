import { validateOfficeGeometryV3, type OfficeGeometryV3 } from "./officeGeometry.ts";

export const officeDerivationWaves = ["step-13", "step-14", "step-15", "step-16"] as const;
export type OfficeDerivationWave = (typeof officeDerivationWaves)[number];

export const officeDerivationOperations = [
  "clean-largest-component-bounds",
  "verified-noop-cleanup",
  "foreground-overlay-composite",
  "semantic-structural-composite",
] as const;
export type OfficeDerivationOperation = (typeof officeDerivationOperations)[number];

export interface OfficeDerivedOutput {
  role: "clean" | "base" | "foreground";
  file: string;
  sha256: string;
  width: number;
  height: number;
  alphaPixels: number;
}

export interface OfficeDerivationRecord {
  recordId: string;
  assetId: string;
  wave: OfficeDerivationWave;
  operation: OfficeDerivationOperation;
  status: "accepted-staging";
  source: {
    file: string;
    sha256: string;
    width: number;
    height: number;
    alphaPixels: number;
    licenseState: string;
  };
  recipe: {
    keepBox: [number, number, number, number] | null;
    foregroundRegions: ReadonlyArray<[number, number, number, number]>;
  };
  metrics: {
    retainedAlphaPixels: number;
    removedAlphaPixels: number;
  };
  outputs: OfficeDerivedOutput[];
  geometry: OfficeGeometryV3 | null;
}

export interface OfficeDerivedAssetManifest {
  version: 1;
  geometrySchemaVersion: 3;
  status: "accepted-staging";
  activeOfficePromotion: false;
  auditSource: string;
  sourcePolicy: string;
  counts: {
    total: number;
    byWave: Record<OfficeDerivationWave, number>;
    cleanup: number;
    composites: number;
    verifiedNoopCleanup: number;
  };
  records: OfficeDerivationRecord[];
  qa: Record<OfficeDerivationWave, string>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function add(issues: string[], condition: boolean, path: string, message: string) {
  if (!condition) issues.push(`${path}: ${message}`);
}

function validateOutput(value: unknown, path: string, issues: string[]) {
  add(issues, isRecord(value), path, "must be an object");
  if (!isRecord(value)) return;
  add(issues, ["clean", "base", "foreground"].includes(String(value.role)), `${path}.role`, "is unsupported");
  add(issues, typeof value.file === "string" && value.file.length > 0, `${path}.file`, "must be non-empty");
  add(issues, typeof value.sha256 === "string" && /^[a-f0-9]{64}$/.test(value.sha256), `${path}.sha256`, "must be SHA-256");
  add(issues, Number.isInteger(value.width) && Number(value.width) > 0, `${path}.width`, "must be positive integer");
  add(issues, Number.isInteger(value.height) && Number(value.height) > 0, `${path}.height`, "must be positive integer");
  add(issues, Number.isInteger(value.alphaPixels) && Number(value.alphaPixels) >= 0, `${path}.alphaPixels`, "must be non-negative integer");
}

function validateRecord(value: unknown, index: number, issues: string[]) {
  const path = `records[${index}]`;
  add(issues, isRecord(value), path, "must be an object");
  if (!isRecord(value)) return;
  add(issues, typeof value.recordId === "string" && value.recordId.length > 0, `${path}.recordId`, "must be non-empty");
  add(issues, officeDerivationWaves.includes(value.wave as OfficeDerivationWave), `${path}.wave`, "is unsupported");
  add(issues, officeDerivationOperations.includes(value.operation as OfficeDerivationOperation), `${path}.operation`, "is unsupported");
  add(issues, value.status === "accepted-staging", `${path}.status`, "must remain accepted-staging");
  add(issues, isRecord(value.source), `${path}.source`, "must be an object");
  add(issues, isRecord(value.metrics), `${path}.metrics`, "must be an object");
  add(issues, Array.isArray(value.outputs) && value.outputs.length > 0, `${path}.outputs`, "must be non-empty");
  if (Array.isArray(value.outputs)) {
    value.outputs.forEach((output, outputIndex) => validateOutput(output, `${path}.outputs[${outputIndex}]`, issues));
  }
  if (value.geometry !== null) {
    for (const issue of validateOfficeGeometryV3(value.geometry)) issues.push(`${path}.geometry.${issue}`);
  }
}

export function validateOfficeDerivedAssetManifest(value: unknown): string[] {
  if (!isRecord(value)) return ["manifest: must be an object"];
  const issues: string[] = [];
  add(issues, value.version === 1, "version", "must equal 1");
  add(issues, value.geometrySchemaVersion === 3, "geometrySchemaVersion", "must equal 3");
  add(issues, value.status === "accepted-staging", "status", "must remain accepted-staging");
  add(issues, value.activeOfficePromotion === false, "activeOfficePromotion", "must remain false");
  add(issues, Array.isArray(value.records), "records", "must be an array");
  const ids = new Set<string>();
  if (Array.isArray(value.records)) {
    for (const [index, record] of value.records.entries()) {
      validateRecord(record, index, issues);
      if (!isRecord(record) || typeof record.recordId !== "string") continue;
      add(issues, !ids.has(record.recordId), `records[${index}].recordId`, "must be unique");
      ids.add(record.recordId);
    }
  }
  return issues;
}

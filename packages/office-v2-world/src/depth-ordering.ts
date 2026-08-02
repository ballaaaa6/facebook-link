import type { RenderPartReference } from "@affiliate-ops/office-v2-contracts";
import { validateRenderPartDependencies } from "./reference-closure.ts";

export const DEPTH_ORDERING_VERSION = "office-depth-ordering-v1" as const;

export type DepthBand = "floor" | "ground" | "world" | "upper" | "effect" | "ui";

export interface ProjectedGroundContactPixels {
  readonly xPx: number;
  readonly yPx: number;
}

/** Renderer-neutral input. The explicit projected contact is authoritative; aliases ease fixture adapters only. */
export interface DepthStructuralRecord {
  readonly id: string;
  readonly groundContact?: ProjectedGroundContactPixels;
  readonly projectedGroundContact?: ProjectedGroundContactPixels;
  readonly projectedGroundContactPx?: ProjectedGroundContactPixels;
  readonly groundContactPx?: ProjectedGroundContactPixels;
  readonly groundX?: number;
  readonly groundY?: number;
  readonly elevation: number;
  readonly band: DepthBand;
  readonly semanticOwnerId?: string;
  readonly dependencies?: readonly string[];
  readonly [key: string]: unknown;
}

export interface NormalizedDepthRecord extends DepthStructuralRecord {
  readonly groundContact: ProjectedGroundContactPixels;
  readonly semanticOwnerId: string;
  readonly dependencies: readonly string[];
}

export interface DepthSortKey {
  readonly groundY: number;
  readonly groundX: number;
  readonly elevation: number;
  readonly bandRank: number;
  readonly band: DepthBand;
  readonly semanticOwnerId: string;
  readonly id: string;
}

export type DepthDiagnosticCode =
  | "world.depth-invalid"
  | "world.depth-duplicate"
  | "world.depth-dependency-missing"
  | "world.depth-owner-mismatch"
  | "world.render-attachment-cycle"
  | "world.reference-missing";

export interface DepthDiagnostic {
  readonly code: DepthDiagnosticCode;
  readonly owner: "world";
  readonly version: 1;
  readonly message: string;
  readonly context: Readonly<Record<string, unknown>>;
}

export interface DepthOrderingResult {
  readonly ok: boolean;
  readonly diagnostics: readonly DepthDiagnostic[];
  readonly ordered: readonly NormalizedDepthRecord[];
  readonly keys: readonly DepthSortKey[];
}

const BAND_RANK: Readonly<Record<DepthBand, number>> = {
  floor: 0,
  ground: 1,
  world: 2,
  upper: 3,
  effect: 4,
  ui: 5,
};

function compare(left: string, right: string): number {
  const length = Math.min(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const difference = left.charCodeAt(index) - right.charCodeAt(index);
    if (difference !== 0) return difference;
  }
  return left.length - right.length;
}

function diagnostic(code: DepthDiagnosticCode, message: string, context: Readonly<Record<string, unknown>> = {}): DepthDiagnostic {
  return { code, owner: "world", version: 1, message, context };
}

function sortDiagnostics(diagnostics: readonly DepthDiagnostic[]): readonly DepthDiagnostic[] {
  return diagnostics.slice().sort((left, right) => (
    compare(left.code, right.code)
    || compare(String(left.context.pointer ?? ""), String(right.context.pointer ?? ""))
    || compare(JSON.stringify(left.context), JSON.stringify(right.context))
  ));
}

function contactOf(record: DepthStructuralRecord): ProjectedGroundContactPixels | null {
  const candidate = record.groundContact ?? record.projectedGroundContact ?? record.projectedGroundContactPx ?? record.groundContactPx;
  if (candidate && Number.isFinite(candidate.xPx) && Number.isFinite(candidate.yPx)) return candidate;
  if (Number.isFinite(record.groundX) && Number.isFinite(record.groundY)) {
    return { xPx: record.groundX as number, yPx: record.groundY as number };
  }
  if (Number.isFinite(record.groundY)) return { xPx: 0, yPx: record.groundY as number };
  return null;
}

function keyFor(record: NormalizedDepthRecord): DepthSortKey {
  return {
    groundY: record.groundContact.yPx,
    groundX: record.groundContact.xPx,
    elevation: record.elevation,
    bandRank: BAND_RANK[record.band],
    band: record.band,
    semanticOwnerId: record.semanticOwnerId,
    id: record.id,
  };
}

function compareKeys(left: DepthSortKey, right: DepthSortKey): number {
  return left.bandRank - right.bandRank
    || left.groundY - right.groundY
    || left.groundX - right.groundX
    || left.elevation - right.elevation
    || compare(left.semanticOwnerId, right.semanticOwnerId)
    || compare(left.id, right.id);
}

function renderPartReference(id: string): RenderPartReference {
  return { id: { kind: "render-part", value: id }, version: 1 } as RenderPartReference;
}

function normalizeRecord(record: DepthStructuralRecord, diagnostics: DepthDiagnostic[]): NormalizedDepthRecord | null {
  const contact = contactOf(record);
  const owner = record.semanticOwnerId ?? record.id;
  const dependencies = record.dependencies ?? [];
  if (typeof record.id !== "string" || record.id.length === 0 || !contact
    || !Number.isFinite(record.elevation) || record.elevation < 0
    || !Object.hasOwn(BAND_RANK, record.band) || typeof owner !== "string" || owner.length === 0
    || dependencies.some((dependency) => typeof dependency !== "string" || dependency.length === 0)) {
    diagnostics.push(diagnostic("world.depth-invalid", "A depth record needs finite projected ground pixels, non-negative elevation, a declared band, and a stable ID.", { id: record.id ?? null }));
    return null;
  }
  return {
    ...record,
    groundContact: { xPx: contact.xPx, yPx: contact.yPx },
    semanticOwnerId: owner,
    dependencies: dependencies.slice().sort(compare),
  };
}

function validateDependencyOwners(records: readonly NormalizedDepthRecord[], diagnostics: DepthDiagnostic[]): void {
  const owners = new Map(records.map((record) => [record.id, record.semanticOwnerId]));
  for (const record of records) {
    for (const dependency of record.dependencies) {
      const dependencyOwner = owners.get(dependency);
      if (dependencyOwner === undefined) {
        diagnostics.push(diagnostic("world.depth-dependency-missing", "A multipart depth dependency has no record.", { id: record.id, dependency }));
      } else if (dependencyOwner !== record.semanticOwnerId) {
        diagnostics.push(diagnostic("world.depth-owner-mismatch", "Multipart depth records must retain one semantic owner.", { id: record.id, dependency, owner: record.semanticOwnerId, dependencyOwner }));
      }
    }
  }
}

function validateDependencies(records: readonly NormalizedDepthRecord[], diagnostics: DepthDiagnostic[]): void {
  const closure = validateRenderPartDependencies(records.map((record) => ({
    id: renderPartReference(record.id),
    dependencies: record.dependencies.map(renderPartReference),
  })));
  for (const entry of closure.diagnostics) {
    if (entry.code === "world.reference-missing") {
      diagnostics.push(diagnostic("world.depth-dependency-missing", "A multipart depth dependency has no record.", entry.context));
    } else if (entry.code === "world.render-attachment-cycle") {
      diagnostics.push(diagnostic("world.render-attachment-cycle", entry.message, entry.context));
    }
  }
}

function topologicalStableOrder(records: readonly NormalizedDepthRecord[], keys: readonly DepthSortKey[]): NormalizedDepthRecord[] {
  const byId = new Map(records.map((record) => [record.id, record]));
  const rank = new Map(records.map((record, index) => [record.id, index]));
  const indegree = new Map(records.map((record) => [record.id, 0]));
  const next = new Map<string, string[]>();
  for (const record of records) {
    for (const dependency of record.dependencies) {
      if (!byId.has(dependency)) continue;
      indegree.set(record.id, (indegree.get(record.id) ?? 0) + 1);
      next.set(dependency, [...(next.get(dependency) ?? []), record.id]);
    }
  }
  const ready = records.filter((record) => indegree.get(record.id) === 0).sort((left, right) => compareKeys(keys[rank.get(left.id) ?? 0]!, keys[rank.get(right.id) ?? 0]!));
  const output: NormalizedDepthRecord[] = [];
  while (ready.length > 0) {
    const record = ready.shift();
    if (!record) break;
    output.push(record);
    for (const dependent of (next.get(record.id) ?? []).slice().sort(compare)) {
      const remaining = (indegree.get(dependent) ?? 0) - 1;
      indegree.set(dependent, remaining);
      if (remaining === 0) {
        const resolved = byId.get(dependent);
        if (resolved) {
          ready.push(resolved);
          ready.sort((left, right) => compareKeys(keys[rank.get(left.id) ?? 0]!, keys[rank.get(right.id) ?? 0]!));
        }
      }
    }
  }
  return output.length === records.length ? output : records.slice();
}

/** Return the deterministic depth key for a normalized structural record. */
export function depthSortKey(record: NormalizedDepthRecord): DepthSortKey {
  return keyFor(record);
}

/** Validate multipart ownership/dependencies and return back-to-front depth order. */
export function orderDepthRecords(records: readonly DepthStructuralRecord[]): DepthOrderingResult {
  const diagnostics: DepthDiagnostic[] = [];
  const normalized: NormalizedDepthRecord[] = [];
  const ids = new Set<string>();
  for (const record of records) {
    const item = normalizeRecord(record, diagnostics);
    if (!item) continue;
    if (ids.has(item.id)) diagnostics.push(diagnostic("world.depth-duplicate", "Depth record IDs must be unique.", { id: item.id }));
    ids.add(item.id);
    normalized.push(item);
  }
  validateDependencyOwners(normalized, diagnostics);
  validateDependencies(normalized, diagnostics);
  const sortedDiagnostics = sortDiagnostics(diagnostics);
  if (sortedDiagnostics.length > 0) return { ok: false, diagnostics: sortedDiagnostics, ordered: [], keys: [] };
  const keyed = normalized.map((record) => ({ record, key: keyFor(record) })).sort((left, right) => compareKeys(left.key, right.key));
  const baseRecords = keyed.map(({ record }) => record);
  const baseKeys = keyed.map(({ key }) => key);
  const ordered = topologicalStableOrder(baseRecords, baseKeys);
  return { ok: true, diagnostics: [], ordered, keys: ordered.map(keyFor) };
}

export const validateDepthOrdering = orderDepthRecords;
export const sortDepthOrder = orderDepthRecords;

/** Convenience adapter for callers that only need the ordered records. */
export function sortDepthRecords(records: readonly DepthStructuralRecord[]): readonly NormalizedDepthRecord[] {
  const result = orderDepthRecords(records);
  return result.ok ? result.ordered : [];
}

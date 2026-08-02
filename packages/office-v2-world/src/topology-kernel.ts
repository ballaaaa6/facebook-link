import type {
  DefinitionBundleDocument,
  FloorLocalCellPosition,
  FloorReference,
  JsonValue,
} from "@affiliate-ops/office-v2-contracts";
import { canonicalHashHex, canonicalJsonBytes } from "@affiliate-ops/office-v2-contracts";
import { validateBuildingTopology, type BuildingTopologyDiagnostic, type BuildingTopologyDocument } from "./building-topology-validation.ts";
import { validateDefinitionBundle, validateRenderPartDependencies, type RenderPartDependency, type WorldReferenceDiagnostic } from "./reference-closure.ts";
import { hasSiteOccupancyLeak } from "./scene-plan-compiler-world.ts";

export const WORLD_KERNEL_VERSION = "office-world-v2-v1" as const;
export const WORLD_KERNEL_DOMAIN = "office-v2:world-kernel" as const;
export const TOPOLOGY_KERNEL_VERSION = "office-building-topology-v1" as const;
type AnyRecord = { [key: string]: unknown };

export type StructuralEdgeDirection = "north" | "east" | "south" | "west";
export interface StructuralEdgeInput { readonly floor: unknown; readonly ownerCell: unknown; readonly edge: StructuralEdgeDirection; readonly id?: string; readonly definitionId?: string; readonly state?: string; readonly [key: string]: unknown; }
export interface NormalizedStructuralEdge extends StructuralEdgeInput { readonly ownerCell: FloorLocalCellPosition; readonly edge: "north" | "west"; readonly identity: string; readonly key: string; }
export interface TopologyCollectionDeclaration { readonly pointer: string; readonly order: "ordered" | "unordered"; }
export type TopologyKernelDocument = BuildingTopologyDocument & { readonly structuralEdges?: readonly StructuralEdgeInput[]; readonly collectionDeclarations?: readonly TopologyCollectionDeclaration[] };
type StructuralDiagnostic = { readonly code: "world.structure-edge-invalid" | "world.structure-edge-duplicate"; readonly owner: "world"; readonly version: 1; readonly message: string; readonly context: Readonly<Record<string, unknown>>; };
export type TopologyKernelDiagnostic = BuildingTopologyDiagnostic | StructuralDiagnostic;
export interface StructuralEdgeNormalizationResult { readonly ok: boolean; readonly diagnostics: readonly TopologyKernelDiagnostic[]; readonly edge?: NormalizedStructuralEdge; }
export interface StructuralEdgesNormalizationResult { readonly ok: boolean; readonly diagnostics: readonly TopologyKernelDiagnostic[]; readonly edges: readonly NormalizedStructuralEdge[]; }
export interface TopologyNormalizationResult { readonly ok: boolean; readonly diagnostics: readonly TopologyKernelDiagnostic[]; readonly topology?: TopologyKernelDocument; readonly structuralEdges: readonly NormalizedStructuralEdge[]; }

export interface WorldKernelBounds { readonly width: number; readonly depth: number; readonly maxElevation: number; }
export interface WorldKernelEnvelope { readonly schemaVersion: typeof WORLD_KERNEL_VERSION; readonly building: unknown; readonly floor: unknown; readonly world: unknown; readonly bounds: unknown; readonly entities: readonly unknown[]; readonly portals: readonly unknown[]; readonly reservedCores: readonly unknown[]; readonly [key: string]: unknown; }
export type WorldKernelDiagnosticCode = "contract.hash-envelope-invalid" | "contract.reference-latest-forbidden" | "contract.reference-version-missing" | "contract.world-version-mismatch" | "world.bounds-invalid" | "world.cell-invalid" | "world.cell-out-of-bounds" | "world.floor-mismatch" | "world.reference-duplicate" | "world.reference-kind-mismatch" | "world.reference-missing" | "world.reference-version-mismatch" | "world.site-occupancy-leak" | "world.world-mismatch" | "world.entity-invalid" | "world.portal-invalid" | "world.reserved-core-invalid" | "world.occupancy-duplicate";
export interface WorldKernelDiagnostic { readonly code: WorldKernelDiagnosticCode | WorldReferenceDiagnostic["code"]; readonly owner: "world" | "contract"; readonly version: 1; readonly message: string; readonly context: Readonly<Record<string, unknown>>; }
export interface WorldKernelValidationOptions { readonly topology?: BuildingTopologyDocument; readonly definitionBundle?: DefinitionBundleDocument; readonly renderParts?: readonly RenderPartDependency[]; readonly orderedPointers?: readonly string[]; }
export interface WorldKernelValidationResult { readonly ok: boolean; readonly diagnostics: readonly WorldKernelDiagnostic[]; readonly normalized?: WorldKernelEnvelope; }
export interface CanonicalWorldKernelResult extends WorldKernelValidationResult { readonly bytes?: Uint8Array; readonly canonicalBytes?: Uint8Array; readonly hash?: string; readonly canonicalHash?: string; readonly domain: typeof WORLD_KERNEL_DOMAIN; readonly domainVersion: typeof WORLD_KERNEL_VERSION; }

function record(value: unknown): value is AnyRecord { return typeof value === "object" && value !== null && !Array.isArray(value); }
function compare(left: string, right: string): number { for (let i = 0; i < Math.min(left.length, right.length); i += 1) { const difference = left.charCodeAt(i) - right.charCodeAt(i); if (difference !== 0) return difference; } return left.length - right.length; }
function keyOf(value: unknown): string | null { if (!record(value)) return null; const id = value.id; const version = value.version; if (record(id) && typeof id.kind === "string" && typeof id.value === "string" && typeof version === "number") return `${id.kind}:${id.value}@${version}`; if (typeof id === "string" && typeof version === "number") return `${id}@${version}`; return null; }
function typedKey(value: unknown, kind: string): string | null { return record(value) && record(value.id) && value.id.kind === kind && typeof value.id.value === "string" && positive(value.version) ? keyOf(value) : null; }
function positive(value: unknown): value is number { return typeof value === "number" && Number.isSafeInteger(value) && value >= 1; }
function sorted<T extends { readonly code: string; readonly context: Readonly<Record<string, unknown>> }>(values: readonly T[]): readonly T[] { return values.slice().sort((a, b) => compare(a.code, b.code) || compare(String(a.context.pointer ?? ""), String(b.context.pointer ?? "")) || compare(JSON.stringify(a.context), JSON.stringify(b.context))); }
function worldDiagnostic(code: WorldKernelDiagnosticCode, message: string, context: Readonly<Record<string, unknown>> = {}): WorldKernelDiagnostic { return { code, owner: code.startsWith("contract.") ? "contract" : "world", version: 1, message, context }; }
function edgeDiagnostic(code: StructuralDiagnostic["code"], message: string, context: Readonly<Record<string, unknown>> = {}): StructuralDiagnostic { return { code, owner: "world", version: 1, message, context }; }
function cellParts(value: unknown): { x: number; y: number; elevation: number; floor?: unknown } | null { if (!record(value)) return null; if (record(value.coordinate)) { const c = value.coordinate; if (typeof c.x !== "number" || typeof c.y !== "number" || typeof c.elevation !== "number") return null; return { x: c.x, y: c.y, elevation: c.elevation, floor: value.floor }; } if (typeof value.x !== "number" || typeof value.y !== "number") return null; return { x: value.x, y: value.y, elevation: typeof value.elevation === "number" ? value.elevation : 0 }; }
function canonicalCell(floor: unknown, x: number, y: number, elevation: number): FloorLocalCellPosition { return { space: "floor-local-cell", floor: floor as FloorReference, coordinate: { space: "cell", x, y, elevation } } as FloorLocalCellPosition; }
function cellKey(floor: unknown, x: number, y: number, elevation: number): string { return `${keyOf(floor) ?? "floor:invalid"}:${x},${y},${elevation}`; }
function isOrdered(document: { readonly collectionDeclarations?: readonly TopologyCollectionDeclaration[] }, pointer: string): boolean { return document.collectionDeclarations?.some((entry) => entry.pointer === pointer && entry.order === "ordered") ?? false; }

/** Normalize south/east edges to the adjacent cell's north/west owner. */
export function structuralEdgeIdentity(floor: unknown, ownerCell: unknown, edge: StructuralEdgeDirection): string | null {
  const cell = cellParts(ownerCell); if (!cell || !typedKey(floor, "floor") || !["north", "east", "south", "west"].includes(edge)) return null;
  const x = cell.x + (edge === "east" ? 1 : 0); const y = cell.y + (edge === "south" ? 1 : 0); const side = edge === "west" || edge === "east" ? "west" : "north";
  return cellKey(floor, x, y, cell.elevation) + `:${side}`;
}

export function normalizeStructuralEdge(input: StructuralEdgeInput): StructuralEdgeNormalizationResult {
  const cell = cellParts(input.ownerCell); const floor = typedKey(input.floor, "floor") ? input.floor : null;
  if (!floor || !cell || !Number.isSafeInteger(cell.x) || !Number.isSafeInteger(cell.y) || !Number.isSafeInteger(cell.elevation) || cell.elevation < 0 || !["north", "east", "south", "west"].includes(input.edge)) return { ok: false, diagnostics: [edgeDiagnostic("world.structure-edge-invalid", "A structural edge needs an explicit versioned floor, integral owner cell, and cardinal edge.", { edge: input.edge })] };
  const x = cell.x + (input.edge === "east" ? 1 : 0); const y = cell.y + (input.edge === "south" ? 1 : 0); const edge: "north" | "west" = input.edge === "west" || input.edge === "east" ? "west" : "north";
  if (!Number.isSafeInteger(x) || !Number.isSafeInteger(y) || (cell.floor !== undefined && keyOf(cell.floor) !== keyOf(floor))) return { ok: false, diagnostics: [edgeDiagnostic("world.structure-edge-invalid", "Structural edge normalization exceeded its explicit floor or safe coordinate range.")] };
  const identity = cellKey(floor, x, y, cell.elevation) + `:${edge}`;
  return { ok: true, diagnostics: [], edge: { ...input, floor, ownerCell: canonicalCell(floor, x, y, cell.elevation), edge, identity, key: identity } };
}

export function normalizeStructuralEdges(inputs: readonly StructuralEdgeInput[], order: "ordered" | "unordered" = "unordered"): StructuralEdgesNormalizationResult {
  const diagnostics: TopologyKernelDiagnostic[] = []; const edges: NormalizedStructuralEdge[] = []; const seen = new Set<string>();
  for (const input of inputs) { const result = normalizeStructuralEdge(input); diagnostics.push(...result.diagnostics); if (!result.edge) continue; if (seen.has(result.edge.identity)) diagnostics.push(edgeDiagnostic("world.structure-edge-duplicate", "A physical structural edge was declared more than once.", { edge: result.edge.identity })); seen.add(result.edge.identity); edges.push(result.edge); }
  return { ok: diagnostics.length === 0, diagnostics: sorted(diagnostics), edges: order === "ordered" ? edges : edges.sort((a, b) => compare(a.identity, b.identity)) };
}

/** Validate existing topology, then return cloned, stable collections and edge identities. */
export function normalizeBuildingTopology(document: TopologyKernelDocument): TopologyNormalizationResult {
  const validation = validateBuildingTopology(document); const edges = normalizeStructuralEdges(document.structuralEdges ?? [], isOrdered(document, "/structuralEdges") ? "ordered" : "unordered"); const diagnostics: TopologyKernelDiagnostic[] = [...validation.diagnostics, ...edges.diagnostics];
  if (diagnostics.length > 0) return { ok: false, diagnostics: sorted(diagnostics), structuralEdges: [] };
  type MutableTopology = { [key: string]: unknown; floors: Array<TopologyKernelDocument["floors"][number]>; siteEnvelope: TopologyKernelDocument["siteEnvelope"] & { contextKinds: string[]; contextCells: Array<TopologyKernelDocument["siteEnvelope"]["contextCells"][number]> }; portals: Array<TopologyKernelDocument["portals"][number]>; structuralEdges?: Array<StructuralEdgeInput> };
  const copy = structuredClone(document) as unknown as MutableTopology;
  if (!isOrdered(document, "/floors")) copy.floors.sort((a, b) => compare(keyOf(a.floor) ?? "", keyOf(b.floor) ?? ""));
  copy.floors = copy.floors.map((floor, index) => ({ ...floor, siteFootprint: isOrdered(document, `/floors/${index}/siteFootprint`) ? floor.siteFootprint.slice() : floor.siteFootprint.slice().sort((a, b) => compare(`${a.x},${a.y}`, `${b.x},${b.y}`)) }));
  if (!isOrdered(document, "/siteEnvelope/contextKinds")) copy.siteEnvelope.contextKinds.sort(compare);
  if (!isOrdered(document, "/siteEnvelope/contextCells")) copy.siteEnvelope.contextCells.sort((a, b) => compare(`${a.kind}:${a.coordinate.x},${a.coordinate.y}`, `${b.kind}:${b.coordinate.x},${b.coordinate.y}`));
  if (!isOrdered(document, "/portals")) copy.portals.sort((a, b) => compare(`${a.id}@${a.version}`, `${b.id}@${b.version}`));
  if (document.structuralEdges) copy.structuralEdges = edges.edges.slice();
  return { ok: true, diagnostics: [], topology: copy as unknown as TopologyKernelDocument, structuralEdges: edges.edges };
}
export const normalizeTopology = normalizeBuildingTopology;

function arrays(value: unknown, field: string, diagnostics: WorldKernelDiagnostic[]): readonly unknown[] { if (Array.isArray(value)) return value; diagnostics.push(worldDiagnostic("world.reference-missing", `World envelope field ${field} must be an array.`, { pointer: `/${field}` })); return []; }
function checkReference(value: unknown, kind: string, pointer: string, diagnostics: WorldKernelDiagnostic[]): string | null {
  if (!record(value) || !record(value.id)) { diagnostics.push(worldDiagnostic("world.reference-missing", "A required typed world reference is missing.", { pointer, expectedKind: kind })); return null; }
  if (value.id.kind !== kind || typeof value.id.value !== "string") { diagnostics.push(worldDiagnostic("world.reference-kind-mismatch", "A world reference ID kind does not match its owner.", { pointer, expectedKind: kind, actualKind: value.id.kind ?? null })); return null; }
  if (value.version === "latest") { diagnostics.push(worldDiagnostic("contract.reference-latest-forbidden", "A world reference cannot use latest.", { pointer })); return null; }
  if (!positive(value.version)) { diagnostics.push(worldDiagnostic("contract.reference-version-missing", "A world reference needs a positive integer version.", { pointer })); return null; }
  return `${kind}:${value.id.value}@${value.version}`;
}
function checkWorldReference(value: unknown, diagnostics: WorldKernelDiagnostic[]): string | null {
  if (!record(value) || typeof value.id !== "string") { diagnostics.push(worldDiagnostic("world.reference-missing", "A world envelope needs an explicit versioned world reference.", { pointer: "/world" })); return null; }
  if (value.version === "latest") { diagnostics.push(worldDiagnostic("contract.reference-latest-forbidden", "A world reference cannot use latest.", { pointer: "/world" })); return null; }
  if (!positive(value.version)) { diagnostics.push(worldDiagnostic("contract.reference-version-missing", "A world reference needs a positive integer version.", { pointer: "/world" })); return null; }
  return `${value.id}@${value.version}`;
}
function checkBounds(value: unknown, diagnostics: WorldKernelDiagnostic[]): WorldKernelBounds | undefined {
  if (!record(value) || !positive(value.width) || !positive(value.depth) || !Number.isSafeInteger(value.maxElevation) || (value.maxElevation as number) < 0) { diagnostics.push(worldDiagnostic("world.bounds-invalid", "World bounds must be positive safe dimensions with non-negative elevation.", { pointer: "/bounds" })); return undefined; }
  return { width: value.width, depth: value.depth, maxElevation: value.maxElevation as number };
}
function checkCell(value: unknown, floor: string | null, bounds: WorldKernelBounds | undefined, pointer: string, diagnostics: WorldKernelDiagnostic[]): string | null {
  if (record(value) && value.space === "site-cell") { diagnostics.push(worldDiagnostic("world.site-occupancy-leak", "Site cells cannot enter floor-local occupancy.", { pointer })); return null; }
  if (!record(value) || value.space !== "floor-local-cell" || !record(value.floor) || !record(value.coordinate)) { diagnostics.push(worldDiagnostic("world.cell-invalid", "Occupancy cells must be explicit floor-local cell positions.", { pointer })); return null; }
  const cellFloor = checkReference(value.floor, "floor", `${pointer}/floor`, diagnostics); const coordinate = value.coordinate; const x = coordinate.x; const y = coordinate.y; const elevation = coordinate.elevation;
  if (cellFloor !== floor) diagnostics.push(worldDiagnostic("world.floor-mismatch", "A cell references a different versioned floor than its world envelope.", { pointer: `${pointer}/floor`, expectedFloor: floor, actualFloor: cellFloor }));
  if (coordinate.space !== "cell" || !Number.isSafeInteger(x) || !Number.isSafeInteger(y) || !Number.isSafeInteger(elevation) || (elevation as number) < 0) { diagnostics.push(worldDiagnostic("world.cell-invalid", "A floor-local cell has invalid coordinate semantics.", { pointer: `${pointer}/coordinate` })); return null; }
  if (bounds && ((x as number) < 0 || (y as number) < 0 || (x as number) >= bounds.width || (y as number) >= bounds.depth || (elevation as number) > bounds.maxElevation)) diagnostics.push(worldDiagnostic("world.cell-out-of-bounds", "A floor-local cell lies outside the world bounds.", { pointer, coordinate, bounds }));
  return `${cellFloor ?? "floor:invalid"}:${x},${y},${elevation}`;
}
function validateClaim(id: string, floor: string | null, cells: readonly unknown[], bounds: WorldKernelBounds | undefined, pointer: string, occupied: Map<string, string>, diagnostics: WorldKernelDiagnostic[]): void {
  for (const cell of cells) { const key = checkCell(cell, floor, bounds, `${pointer}/cells`, diagnostics); if (!key) continue; const previous = occupied.get(key); if (previous && previous !== id) diagnostics.push(worldDiagnostic("world.occupancy-duplicate", "Two world records claim the same occupied cell.", { cell: key, owners: [previous, id].sort(compare) })); occupied.set(key, id); }
}
function validateRecords(value: AnyRecord, floor: string | null, bounds: WorldKernelBounds | undefined, diagnostics: WorldKernelDiagnostic[]): void {
  const occupied = new Map<string, string>(); const ids = new Set<string>();
  for (const entity of arrays(value.entities, "entities", diagnostics)) { if (!record(entity) || typeof entity.id !== "string" || entity.id.length === 0) { diagnostics.push(worldDiagnostic("world.entity-invalid", "Every world entity needs a stable ID.", { pointer: "/entities" })); continue; } if (ids.has(entity.id)) diagnostics.push(worldDiagnostic("world.reference-duplicate", "A world entity ID occurs more than once.", { id: entity.id })); ids.add(entity.id); const ownerFloor = checkReference(entity.floor, "floor", "/entities/floor", diagnostics); if (ownerFloor !== floor) diagnostics.push(worldDiagnostic("world.floor-mismatch", "A world entity belongs to a different floor version.", { id: entity.id, expectedFloor: floor, actualFloor: ownerFloor })); const cells = arrays(entity.occupiedCells, "entities.occupiedCells", diagnostics); validateClaim(entity.id, floor, cells, bounds, "/entities", occupied, diagnostics); }
  const coreIds = new Set<string>(); for (const core of arrays(value.reservedCores, "reservedCores", diagnostics)) { if (!record(core) || typeof core.id !== "string" || core.id.length === 0) { diagnostics.push(worldDiagnostic("world.reserved-core-invalid", "Every reserved core needs a stable ID.", { pointer: "/reservedCores" })); continue; } if (coreIds.has(core.id)) diagnostics.push(worldDiagnostic("world.reference-duplicate", "A reserved core ID occurs more than once.", { id: core.id })); coreIds.add(core.id); const ownerFloor = checkReference(core.floor, "floor", "/reservedCores/floor", diagnostics); if (ownerFloor !== floor) diagnostics.push(worldDiagnostic("world.floor-mismatch", "A reserved core belongs to a different floor version.", { id: core.id, expectedFloor: floor, actualFloor: ownerFloor })); const cells = arrays(core.cells, "reservedCores.cells", diagnostics); validateClaim(core.id, floor, cells, bounds, "/reservedCores", occupied, diagnostics); }
  const portals = new Set<string>(); for (const portal of arrays(value.portals, "portals", diagnostics)) { if (!record(portal) || typeof portal.id !== "string" || !positive(portal.version) || (portal.kind !== "entrance" && portal.kind !== "vertical")) { diagnostics.push(worldDiagnostic("world.portal-invalid", "Every world portal needs a stable ID, positive version, and supported kind.", { pointer: "/portals" })); continue; } const key = `${portal.id}@${portal.version}`; if (portals.has(key)) diagnostics.push(worldDiagnostic("world.reference-duplicate", "A world portal reference occurs more than once.", { id: key })); portals.add(key); if (Object.hasOwn(portal, "ownerFloor")) { const owner = checkReference(portal.ownerFloor, "floor", "/portals/ownerFloor", diagnostics); if (owner !== floor) diagnostics.push(worldDiagnostic("world.floor-mismatch", "A portal owner floor is stale for this world.", { id: key, expectedFloor: floor, actualFloor: owner })); } }
}
function siteLeak(value: AnyRecord): boolean { return hasSiteOccupancyLeak(value) || Object.hasOwn(value, "site") || Object.hasOwn(value, "siteEnvelope") || Object.hasOwn(value, "siteCells"); }
function cellSortKey(value: unknown): string { const cell = cellParts(value); return cell ? `${keyOf(cell.floor) ?? ""}:${cell.x},${cell.y},${cell.elevation}` : ""; }
function normalizedWorld(value: AnyRecord, options: WorldKernelValidationOptions): WorldKernelEnvelope {
  const copy = structuredClone(value) as AnyRecord; const ordered = (pointer: string): boolean => options.orderedPointers?.includes(pointer) ?? false; const sort = (field: string, key: (entry: unknown) => string): void => { if (Array.isArray(copy[field]) && !ordered(`/${field}`)) copy[field] = (copy[field] as unknown[]).slice().sort((a, b) => compare(key(a), key(b))); };
  sort("rooms", (entry) => keyOf(entry) ?? ""); sort("actorSlots", (entry) => record(entry) ? String(entry.id ?? "") : ""); sort("entities", (entry) => record(entry) ? String(entry.id ?? "") : ""); sort("reservedCores", (entry) => record(entry) ? String(entry.id ?? "") : ""); sort("portals", (entry) => record(entry) ? `${String(entry.id ?? "")}@${String(entry.version ?? "")}` : "");
  for (const field of ["entities", "reservedCores"] as const) { const entries = copy[field]; if (!Array.isArray(entries) || ordered(`/${field}`)) continue; const child = field === "entities" ? "occupiedCells" : "cells"; copy[field] = entries.map((entry) => record(entry) && Array.isArray(entry[child]) && !ordered(`/${field}/${child}`) ? { ...entry, [child]: (entry[child] as unknown[]).slice().sort((a, b) => compare(cellSortKey(a), cellSortKey(b))) } : entry); }
  return copy as unknown as WorldKernelEnvelope;
}

/** Reject stale/wrong-kind/version/duplicate references and site occupancy before serialization. */
export function validateWorldKernelEnvelope(value: unknown, options: WorldKernelValidationOptions = {}): WorldKernelValidationResult {
  const diagnostics: WorldKernelDiagnostic[] = []; if (!record(value)) return { ok: false, diagnostics: [worldDiagnostic("world.reference-missing", "World kernel input must be an object.")] };
  if (value.schemaVersion !== WORLD_KERNEL_VERSION) diagnostics.push(worldDiagnostic("contract.world-version-mismatch", "World kernel input has an unsupported schema version.", { pointer: "/schemaVersion", expected: WORLD_KERNEL_VERSION, actual: value.schemaVersion ?? null }));
  if (siteLeak(value)) diagnostics.push(worldDiagnostic("world.site-occupancy-leak", "Site presentation context cannot enter floor-local world occupancy.", { pointer: "/site" }));
  const building = checkReference(value.building, "building", "/building", diagnostics); const floor = checkReference(value.floor, "floor", "/floor", diagnostics); const world = checkWorldReference(value.world, diagnostics); const bounds = checkBounds(value.bounds, diagnostics);
  arrays(value.entities, "entities", diagnostics); arrays(value.portals, "portals", diagnostics); arrays(value.reservedCores, "reservedCores", diagnostics); validateRecords(value, floor, bounds, diagnostics);
  if (options.topology) { const topology = validateBuildingTopology(options.topology); diagnostics.push(...topology.diagnostics.map((entry) => ({ ...entry, code: entry.code as WorldKernelDiagnostic["code"] }))); const selected = options.topology.floors.find((entry) => keyOf(entry.floor) === floor); if (!selected || keyOf(options.topology.building) !== building) diagnostics.push(worldDiagnostic("world.world-mismatch", "World references do not resolve to the supplied topology.", { building, floor, world })); else if (keyOf(selected.world) !== world) diagnostics.push(worldDiagnostic("world.world-mismatch", "World identity does not resolve to the selected topology floor.", { expected: keyOf(selected.world), actual: world })); const topologyPortals = new Map(options.topology.portals.filter((entry) => keyOf(entry.ownerFloor) === floor).map((entry) => [`${entry.id}@${entry.version}`, entry])); for (const portal of arrays(value.portals, "portals", diagnostics)) if (record(portal) && typeof portal.id === "string" && positive(portal.version)) { const target = topologyPortals.get(`${portal.id}@${portal.version}`); if (!target) diagnostics.push(worldDiagnostic("world.reference-missing", "A world portal reference is not declared by its topology.", { id: `${portal.id}@${portal.version}` })); else if (target.kind !== portal.kind) diagnostics.push(worldDiagnostic("world.reference-kind-mismatch", "A world portal reference kind disagrees with topology.", { id: `${portal.id}@${portal.version}`, expected: target.kind, actual: portal.kind })); } }
  if (options.definitionBundle) diagnostics.push(...validateDefinitionBundle(options.definitionBundle).diagnostics.map((entry) => ({ ...entry, code: entry.code as WorldKernelDiagnostic["code"] })));
  if (options.renderParts) diagnostics.push(...validateRenderPartDependencies(options.renderParts).diagnostics.map((entry) => ({ ...entry, code: entry.code as WorldKernelDiagnostic["code"] })));
  const result = sorted(diagnostics); return result.length > 0 ? { ok: false, diagnostics: result } : { ok: true, diagnostics: [], normalized: normalizedWorld(value, options) };
}

/** Return canonical payload bytes and a domain/version-separated world hash. */
export function canonicalizeWorldKernel(value: unknown, options: WorldKernelValidationOptions = {}): CanonicalWorldKernelResult {
  const validation = validateWorldKernelEnvelope(value, options); if (!validation.ok || !validation.normalized) return { ...validation, domain: WORLD_KERNEL_DOMAIN, domainVersion: WORLD_KERNEL_VERSION };
  try { const payload = validation.normalized as unknown as JsonValue; const bytes = canonicalJsonBytes(payload); const hash = canonicalHashHex({ domain: WORLD_KERNEL_DOMAIN, domainVersion: WORLD_KERNEL_VERSION, payload }); return { ...validation, bytes, canonicalBytes: bytes, hash, canonicalHash: hash, domain: WORLD_KERNEL_DOMAIN, domainVersion: WORLD_KERNEL_VERSION }; } catch (error) { return { ok: false, diagnostics: [worldDiagnostic("contract.hash-envelope-invalid", "World kernel input could not be represented as canonical JSON.", { reason: error instanceof Error ? error.message : String(error) })], domain: WORLD_KERNEL_DOMAIN, domainVersion: WORLD_KERNEL_VERSION }; }
}
export const canonicalWorldKernel = canonicalizeWorldKernel;
export const canonicalWorld = canonicalizeWorldKernel;

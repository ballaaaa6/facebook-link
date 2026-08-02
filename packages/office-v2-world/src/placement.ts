import type { EntityInstanceReference, FloorLocalCellPosition, FloorReference, GeometryDocument, GeometryReference, SocketId, UseSlotId, WorldFacing } from "@affiliate-ops/office-v2-contracts";
import { SUBCELL_UNITS_PER_CELL } from "./coordinate-semantics.ts";
import { transformGeometry, validateGeometry, type TransformedGeometry } from "./geometry-validation.ts";
import type { WorldReferenceDiagnosticCode } from "./reference-closure.ts";

export const PLACEMENT_SNAPSHOT_VERSION = "office-placement-snapshot-v1" as const;
export type PlacementSemanticKind = "structure" | "furniture" | "facility" | "prop" | "actor-anchor" | "decoration";
export type PlacementNavigationImpact = "blocking" | "none";
export type PlacementDiagnosticCode = WorldReferenceDiagnosticCode | "world.authority-invalid" | "world.floor-invalid" | "world.floor-mismatch" | "world.anchor-invalid" | "world.entity-invalid" | "world.entity-duplicate" | "world.entity-kind-missing" | "world.geometry-missing" | "world.geometry-version-mismatch" | "world.geometry-invalid" | "world.surface-duplicate" | "world.surface-missing" | "world.unsupported-surface" | "world.out-of-bounds" | "world.occupied" | "world.clearance" | "world.unreachable" | "world.socket-missing" | "world.use-slot-missing" | "world.decoration-navigation-conflict";
export interface PlacementDiagnostic { readonly code: PlacementDiagnosticCode; readonly owner: "world"; readonly version: 1; readonly message: string; readonly context: Readonly<Record<string, unknown>>; }
export interface PlacementCell { readonly x: number; readonly y: number; readonly elevation: number; }
export type PlacementAnchor = PlacementCell | FloorLocalCellPosition;
export interface PlacementBounds { readonly width: number; readonly depth: number; readonly minElevation?: number; readonly maxElevation?: number; }
export interface PlacementSurfaceCell { readonly coordinate?: PlacementCell; readonly cell?: PlacementCell; readonly kind: string; readonly traversable?: boolean; readonly supportedKinds?: readonly PlacementSemanticKind[]; readonly allowedKinds?: readonly PlacementSemanticKind[]; }
export interface PlacementSurfacePolicy { readonly allowedKinds?: Readonly<Record<string, readonly string[]>>; readonly supportedSurfaces?: Readonly<Record<string, readonly string[]>>; readonly walkableKinds?: readonly string[]; readonly nonWalkableKinds?: readonly string[]; }
export interface PlacementNavigationPolicy { readonly starts?: readonly PlacementCell[]; readonly entryCells?: readonly PlacementCell[]; readonly walkableCells?: readonly PlacementCell[]; }
export interface PlacementFloor { readonly floor: FloorReference; readonly bounds: PlacementBounds; readonly surfaces: readonly PlacementSurfaceCell[]; readonly surfacePolicy: PlacementSurfacePolicy; readonly navigation?: PlacementNavigationPolicy; }
export interface VersionedGeometryAuthority { readonly authority?: "office-geometry-authority-v1"; readonly version?: number; readonly geometries: readonly GeometryDocument[]; }
export type GeometryAuthorityInput = VersionedGeometryAuthority | readonly GeometryDocument[] | ReadonlyMap<string, GeometryDocument>;
export interface PlacementContext { readonly floor: PlacementFloor; readonly geometryAuthority: GeometryAuthorityInput; }
export interface PlacedEntityIdentity { readonly id: string | EntityInstanceReference; readonly kind?: PlacementSemanticKind; readonly semanticKind?: PlacementSemanticKind; readonly tags?: readonly string[]; }
export interface PlacementRequest { readonly entity: PlacedEntityIdentity; readonly geometry: GeometryReference; readonly floor: FloorReference; readonly anchor: PlacementAnchor; readonly orientation: WorldFacing; readonly navigationImpact?: PlacementNavigationImpact; readonly useSlot?: UseSlotId | string; readonly requiredUseSlot?: UseSlotId | string; readonly requiredApproach?: UseSlotId | string | boolean; readonly requireApproach?: boolean; }
export interface ResolvedSocket { readonly id: SocketId; readonly role: "actor" | "held-prop" | "effect"; readonly position: PlacementCell; }
export interface ResolvedUseSlot { readonly id: UseSlotId; readonly approach: readonly PlacementCell[]; readonly waiting: readonly PlacementCell[]; readonly facing: WorldFacing; readonly actorSocket: ResolvedSocket; readonly heldPropSocket?: ResolvedSocket; }
export interface ResolvedPlacementGeometry { readonly anchor: PlacementCell; readonly orientation: WorldFacing; readonly footprint: readonly PlacementCell[]; readonly blocking: readonly PlacementCell[]; readonly clearance: readonly PlacementCell[]; readonly sockets: readonly ResolvedSocket[]; readonly useSlots: readonly ResolvedUseSlot[]; }
export interface PlacementGeometryResult { readonly ok: boolean; readonly diagnostics: readonly PlacementDiagnostic[]; readonly geometry?: ResolvedPlacementGeometry; }
export interface PlacedEntitySnapshot { readonly identity: { readonly id: string | EntityInstanceReference; readonly kind: PlacementSemanticKind; readonly tags?: readonly string[] }; readonly geometry: GeometryReference; readonly floor: FloorReference; readonly anchor: PlacementCell; readonly orientation: WorldFacing; readonly footprint: readonly PlacementCell[]; readonly blocking: readonly PlacementCell[]; readonly clearance: readonly PlacementCell[]; readonly sockets: readonly ResolvedSocket[]; readonly useSlots: readonly ResolvedUseSlot[]; readonly navigationImpact: PlacementNavigationImpact; }
export interface OccupancyCell { readonly cell: PlacementCell; readonly entityId: string; }
export interface OccupancyIndex { readonly blocking: ReadonlyMap<string, string>; readonly clearance: ReadonlyMap<string, string>; readonly ownership: ReadonlyMap<string, string>; readonly blockingCells: readonly OccupancyCell[]; readonly clearanceCells: readonly OccupancyCell[]; readonly navigationCells: readonly PlacementCell[]; readonly ownerOf: (cell: PlacementCell | string) => string | undefined; readonly getOwner: (cell: PlacementCell | string) => string | undefined; }
export interface PlacementSnapshot { readonly schemaVersion: typeof PLACEMENT_SNAPSHOT_VERSION; readonly floor: FloorReference; readonly revision: number; readonly entities: readonly PlacedEntitySnapshot[]; readonly occupancy: OccupancyIndex; }
export interface PlacementAccepted { readonly ok: true; readonly snapshot: PlacementSnapshot; readonly entity: PlacedEntitySnapshot; readonly placed: PlacedEntitySnapshot; readonly diagnostics: readonly []; }
export interface PlacementRejected { readonly ok: false; readonly snapshot: PlacementSnapshot; readonly diagnostics: readonly PlacementDiagnostic[]; }
export type PlacementResult = PlacementAccepted | PlacementRejected;

const facings: readonly WorldFacing[] = ["north", "east", "south", "west"];
const directions: readonly PlacementCell[] = [{ x: 0, y: -1, elevation: 0 }, { x: 1, y: 0, elevation: 0 }, { x: 0, y: 1, elevation: 0 }, { x: -1, y: 0, elevation: 0 }];
const freeze = <T>(value: T): T => { if (value !== null && typeof value === "object" && !Object.isFrozen(value)) { for (const child of Object.values(value as Record<string, unknown>)) freeze(child); Object.freeze(value); } return value; };
const textCompare = (a: string, b: string): number => { for (let i = 0; i < Math.min(a.length, b.length); i += 1) { const d = a.charCodeAt(i) - b.charCodeAt(i); if (d) return d; } return a.length - b.length; };
const cellKey = (cell: PlacementCell): string => `${cell.x},${cell.y},${cell.elevation}`;
const cellCompare = (a: PlacementCell, b: PlacementCell): number => a.elevation - b.elevation || a.y - b.y || a.x - b.x;
const cells = (value: readonly PlacementCell[]): readonly PlacementCell[] => value.slice().sort(cellCompare).map(({ x, y, elevation }) => ({ x, y, elevation }));
const refKey = (ref: { readonly id: { readonly kind: string; readonly value: string }; readonly version: number }): string => `${ref.id.kind}:${ref.id.value}@${ref.version}`;
const sameRef = (a: { readonly id: { readonly kind: string; readonly value: string }; readonly version: number }, b: { readonly id: { readonly kind: string; readonly value: string }; readonly version: number }): boolean => refKey(a) === refKey(b);
const entityKey = (entity: { readonly id: string | EntityInstanceReference }): string => typeof entity.id === "string" ? entity.id : refKey(entity.id);
const diagnostic = (code: PlacementDiagnosticCode, message: string, context: Readonly<Record<string, unknown>> = {}): PlacementDiagnostic => ({ code, owner: "world", version: 1, message, context });
const sortedDiagnostics = (items: readonly PlacementDiagnostic[]): readonly PlacementDiagnostic[] => items.slice().sort((a, b) => textCompare(a.code, b.code) || textCompare(String(a.context.entity ?? ""), String(b.context.entity ?? "")) || textCompare(String(a.context.cell ?? ""), String(b.context.cell ?? "")) || textCompare(String(a.context.useSlot ?? ""), String(b.context.useSlot ?? "")));
const cloneRef = <T extends { readonly id: { readonly kind: string; readonly value: string }; readonly version: number }>(ref: T): T => ({ id: { kind: ref.id.kind, value: ref.id.value }, version: ref.version } as T);
const cloneId = (id: string | EntityInstanceReference): string | EntityInstanceReference => typeof id === "string" ? id : cloneRef(id);
const safeCell = (cell: PlacementCell): boolean => Number.isSafeInteger(cell.x) && Number.isSafeInteger(cell.y) && Number.isSafeInteger(cell.elevation) && cell.elevation >= 0;
const inside = (cell: PlacementCell, bounds: PlacementBounds): boolean => { const min = bounds.minElevation ?? 0; const max = bounds.maxElevation ?? min; return Number.isSafeInteger(bounds.width) && Number.isSafeInteger(bounds.depth) && bounds.width > 0 && bounds.depth > 0 && cell.x >= 0 && cell.y >= 0 && cell.x < bounds.width && cell.y < bounds.depth && cell.elevation >= min && cell.elevation <= max; };

class ImmutableMap<K, V> implements ReadonlyMap<K, V> {
  readonly [Symbol.toStringTag] = "Map";
  private readonly data: readonly (readonly [K, V])[];
  constructor(entries: readonly (readonly [K, V])[]) { this.data = Object.freeze(entries.map(([key, value]) => Object.freeze([key, value] as const))); Object.freeze(this); }
  get size(): number { return this.data.length; }
  get(key: K): V | undefined { return this.data.find(([entry]) => entry === key)?.[1]; }
  has(key: K): boolean { return this.data.some(([entry]) => entry === key); }
  *[Symbol.iterator](): IterableIterator<[K, V]> { yield* this.entries(); }
  *entries(): IterableIterator<[K, V]> { for (const [key, value] of this.data) yield [key, value]; }
  *keys(): IterableIterator<K> { for (const [key] of this.data) yield key; }
  *values(): IterableIterator<V> { for (const [, value] of this.data) yield value; }
  forEach(callback: (value: V, key: K, map: ReadonlyMap<K, V>) => void, thisArg?: unknown): void { for (const [key, value] of this.data) callback.call(thisArg, value, key, this); }
}

function anchorInfo(anchor: PlacementAnchor): { readonly cell?: PlacementCell; readonly floor?: FloorReference; readonly error?: PlacementDiagnostic } {
  const value = anchor as unknown as Record<string, unknown>;
  if (value.space !== undefined) {
    const coordinate = value.coordinate as Record<string, unknown> | undefined;
    if (value.space !== "floor-local-cell" || !coordinate || coordinate.space !== "cell") return { error: diagnostic("world.anchor-invalid", "A placement anchor must use floor-local cell space.", { space: value.space, coordinateSpace: coordinate?.space ?? null }) };
    const cell = { x: coordinate.x, y: coordinate.y, elevation: coordinate.elevation } as PlacementCell;
    return safeCell(cell) ? { cell, floor: value.floor as FloorReference } : { error: diagnostic("world.anchor-invalid", "A placement anchor must contain safe non-negative coordinates.", { cell }) };
  }
  const cell = { x: value.x, y: value.y, elevation: value.elevation } as PlacementCell;
  return safeCell(cell) ? { cell } : { error: diagnostic("world.anchor-invalid", "A placement anchor must contain safe non-negative coordinates.", { cell }) };
}

function surfaceMap(floor: PlacementFloor): { readonly map: ReadonlyMap<string, PlacementSurfaceCell>; readonly diagnostics: readonly PlacementDiagnostic[] } {
  const errors: PlacementDiagnostic[] = []; const entries: Array<readonly [string, PlacementSurfaceCell]> = []; const seen = new Set<string>();
  for (const [index, surface] of floor.surfaces.entries()) {
    const coordinate = surface.coordinate ?? surface.cell;
    if (!coordinate || !safeCell(coordinate)) { errors.push(diagnostic("world.floor-invalid", "A floor surface must identify a safe cell.", { pointer: `/surfaces/${index}` })); continue; }
    const key = cellKey(coordinate); if (seen.has(key)) errors.push(diagnostic("world.surface-duplicate", "A floor surface cell occurs more than once.", { cell: key })); seen.add(key); entries.push([key, { ...surface, coordinate: { ...coordinate } }]);
  }
  entries.sort((a, b) => textCompare(a[0], b[0])); return { map: new ImmutableMap(entries), diagnostics: sortedDiagnostics(errors) };
}

function authorityEntries(authority: GeometryAuthorityInput): { readonly geometries: readonly GeometryDocument[]; readonly diagnostics: readonly PlacementDiagnostic[] } {
  if (Array.isArray(authority)) return { geometries: authority, diagnostics: [] };
  if (typeof authority === "object" && authority !== null && "values" in authority && typeof authority.values === "function") return { geometries: [...authority.values()], diagnostics: [] };
  if (!(typeof authority === "object" && authority !== null && "geometries" in authority && Array.isArray(authority.geometries))) return { geometries: [], diagnostics: [diagnostic("world.authority-invalid", "A geometry authority must contain geometry records.")] };
  if (authority.authority && authority.authority !== "office-geometry-authority-v1") return { geometries: [], diagnostics: [diagnostic("world.authority-invalid", "The geometry authority version is unsupported.", { authority: authority.authority })] };
  return { geometries: authority.geometries, diagnostics: [] };
}

function findGeometry(authority: GeometryAuthorityInput, reference: GeometryReference): { readonly geometry?: GeometryDocument; readonly diagnostics: readonly PlacementDiagnostic[] } {
  const source = authorityEntries(authority); const errors = [...source.diagnostics]; if (errors.length) return { diagnostics: errors };
  const requested = reference as unknown as { readonly id?: { readonly kind?: unknown; readonly value?: unknown }; readonly version?: unknown };
  if (requested.id?.kind !== "geometry" || typeof requested.id.value !== "string" || !Number.isSafeInteger(requested.version) || Number(requested.version) < 1) return { diagnostics: [diagnostic("world.geometry-missing", "A placement requires a positive versioned geometry reference.", { reference })] };
  const requestedKey = `geometry:${requested.id.value}@${requested.version}`; const ids = new Set<string>(); const keys = new Set<string>(); let result: GeometryDocument | undefined;
  for (const [index, geometry] of source.geometries.entries()) {
    const ref = geometry.geometry as unknown as { readonly id?: { readonly kind?: unknown; readonly value?: unknown }; readonly version?: unknown };
    if (ref.id?.kind !== "geometry" || typeof ref.id.value !== "string" || !Number.isSafeInteger(ref.version)) { errors.push(diagnostic("world.geometry-invalid", "The geometry authority contains an invalid geometry reference.", { pointer: `/geometries/${index}` })); continue; }
    const key = `geometry:${ref.id.value}@${ref.version}`; if (keys.has(key)) errors.push(diagnostic("world.reference-duplicate", "The geometry authority repeats a versioned geometry key.", { key })); keys.add(key); if (ref.id.value === requested.id.value) ids.add(key); if (key === requestedKey) result = geometry;
  }
  if (errors.length) return { diagnostics: sortedDiagnostics(errors) };
  if (!result) { const code: PlacementDiagnosticCode = ids.size ? "world.geometry-version-mismatch" : "world.geometry-missing"; return { diagnostics: [diagnostic(code, code === "world.geometry-missing" ? "The requested geometry is not present in the authority." : "The requested geometry version is not present in the authority.", { reference, available: [...ids].sort(textCompare) })] }; }
  return { geometry: result, diagnostics: [] };
}

const translate = (anchor: PlacementCell, offset: { readonly x: number; readonly y: number; readonly elevation: number }): PlacementCell => ({ x: anchor.x + offset.x, y: anchor.y + offset.y, elevation: anchor.elevation + offset.elevation });
const translateSub = (anchor: PlacementCell, offset: { readonly x: number; readonly y: number; readonly elevation: number }): PlacementCell => { const x = anchor.x * SUBCELL_UNITS_PER_CELL + offset.x; const y = anchor.y * SUBCELL_UNITS_PER_CELL + offset.y; if (!Number.isSafeInteger(x) || !Number.isSafeInteger(y)) throw new RangeError("world.out-of-bounds"); return { x, y, elevation: anchor.elevation + offset.elevation }; };
const rotateFacing = (facing: unknown, orientation: WorldFacing): WorldFacing | undefined => { const a = facings.indexOf(facing as WorldFacing); const b = facings.indexOf(orientation); return a < 0 || b < 0 ? undefined : facings[(a + b) % 4]; };
const subCellToCell = (position: PlacementCell): PlacementCell => ({ x: Math.floor(position.x / SUBCELL_UNITS_PER_CELL), y: Math.floor(position.y / SUBCELL_UNITS_PER_CELL), elevation: position.elevation });

function derive(geometry: GeometryDocument, request: PlacementRequest, anchor: PlacementCell, impact: PlacementNavigationImpact): PlacementGeometryResult {
  const checked = validateGeometry(geometry, request.orientation); const errors: PlacementDiagnostic[] = checked.diagnostics.map((entry) => ({ code: entry.code, owner: "world", version: 1, message: entry.message, context: entry.context })); if (!checked.ok || !checked.transformed) return { ok: false, diagnostics: sortedDiagnostics(errors) };
  let transformed: TransformedGeometry; try { transformed = transformGeometry(geometry, request.orientation); } catch { errors.push(diagnostic("world.orientation-unsupported", "The requested geometry orientation is unsupported.", { orientation: request.orientation })); return { ok: false, diagnostics: sortedDiagnostics(errors) }; }
  const footprint = transformed.footprint.map((offset) => translate(anchor, offset)); const blocking = impact === "blocking" ? transformed.blocking.cells.map((offset) => translate(anchor, offset)) : []; const clearance = impact === "blocking" ? transformed.clearance.map((offset) => translate(anchor, offset)) : [];
  const sockets: ResolvedSocket[] = []; const bySocket = new Map<string, ResolvedSocket>();
  for (const socket of transformed.sockets) { try { const resolved = { id: { kind: socket.id.kind, value: socket.id.value } as SocketId, role: socket.role, position: translateSub(anchor, socket.position) }; sockets.push(resolved); bySocket.set(socket.id.value, resolved); } catch { errors.push(diagnostic("world.out-of-bounds", "A transformed socket exceeds safe sub-cell range.", { socket: socket.id.value })); } }
  const useSlots: ResolvedUseSlot[] = [];
  for (const slot of transformed.useSlots) { const actorSocket = bySocket.get(slot.actorSocket.value); const facing = rotateFacing(slot.facing, request.orientation); const heldPropSocket = slot.heldPropSocket ? bySocket.get(slot.heldPropSocket.value) : undefined; if (!actorSocket) errors.push(diagnostic("world.socket-missing", "A use slot actor socket does not resolve.", { useSlot: slot.id.value, socket: slot.actorSocket.value })); if (slot.heldPropSocket && !heldPropSocket) errors.push(diagnostic("world.socket-missing", "A use slot held-prop socket does not resolve.", { useSlot: slot.id.value, socket: slot.heldPropSocket.value })); if (!facing) errors.push(diagnostic("world.orientation-unsupported", "A use slot facing is unsupported.", { useSlot: slot.id.value, facing: slot.facing })); if (!actorSocket || !facing || (slot.heldPropSocket && !heldPropSocket)) continue; useSlots.push({ id: { kind: slot.id.kind, value: slot.id.value } as UseSlotId, approach: cells(slot.approach.map((offset) => translate(anchor, offset))), waiting: cells(slot.waiting.map((offset) => translate(anchor, offset))), facing, actorSocket, ...(heldPropSocket ? { heldPropSocket } : {}) }); }
  const blockSeen = new Set<string>(); const clearSeen = new Set<string>(); const footSeen = new Set<string>();
  for (const cell of footprint) { const key = cellKey(cell); if (footSeen.has(key)) errors.push(diagnostic("world.geometry-invalid", "A geometry transform repeats a footprint cell.", { cell: key })); footSeen.add(key); }
  for (const cell of blocking) { const key = cellKey(cell); if (blockSeen.has(key)) errors.push(diagnostic("world.occupied", "A geometry transform repeats a blocking cell.", { cell: key })); blockSeen.add(key); }
  for (const cell of clearance) { const key = cellKey(cell); if (clearSeen.has(key) || blockSeen.has(key)) errors.push(diagnostic("world.clearance", "A transformed clearance cell repeats or overlaps blocking occupancy.", { cell: key })); clearSeen.add(key); }
  for (const cell of [...footprint, ...blocking, ...clearance, ...useSlots.flatMap((slot) => [...slot.approach, ...slot.waiting])]) if (!safeCell(cell)) errors.push(diagnostic("world.out-of-bounds", "A transformed placement cell is not safe.", { cell: cellKey(cell) }));
  sockets.sort((a, b) => textCompare(a.id.value, b.id.value)); useSlots.sort((a, b) => textCompare(a.id.value, b.id.value));
  return { ok: errors.length === 0, diagnostics: sortedDiagnostics(errors), geometry: { anchor: { ...anchor }, orientation: request.orientation, footprint: cells(footprint), blocking: cells(blocking), clearance: cells(clearance), sockets, useSlots } };
}

export function derivePlacementGeometry(geometry: GeometryDocument, request: PlacementRequest, impact: PlacementNavigationImpact = "blocking"): PlacementGeometryResult { const anchor = anchorInfo(request.anchor); if (anchor.error || !anchor.cell) return { ok: false, diagnostics: anchor.error ? [anchor.error] : [diagnostic("world.anchor-invalid", "A placement anchor is missing.")] }; return derive(geometry, request, anchor.cell, impact); }

function occupancy(entities: readonly PlacedEntitySnapshot[]): OccupancyIndex {
  const blockingCells: OccupancyCell[] = []; const clearanceCells: OccupancyCell[] = [];
  for (const entity of entities) { const id = entityKey(entity.identity); for (const cell of entity.blocking) blockingCells.push({ cell: { ...cell }, entityId: id }); for (const cell of entity.clearance) clearanceCells.push({ cell: { ...cell }, entityId: id }); }
  const order = (a: OccupancyCell, b: OccupancyCell): number => cellCompare(a.cell, b.cell) || textCompare(a.entityId, b.entityId); blockingCells.sort(order); clearanceCells.sort(order);
  const blocking = new ImmutableMap(blockingCells.map((entry) => [cellKey(entry.cell), entry.entityId] as const)); const clearance = new ImmutableMap(clearanceCells.map((entry) => [cellKey(entry.cell), entry.entityId] as const)); const ownerOf = (cell: PlacementCell | string): string | undefined => blocking.get(typeof cell === "string" ? cell : cellKey(cell));
  return freeze({ blocking, clearance, ownership: blocking, blockingCells, clearanceCells, navigationCells: blockingCells.map((entry) => ({ ...entry.cell })), ownerOf, getOwner: ownerOf });
}

export function createEmptyPlacementSnapshot(floor: PlacementFloor): PlacementSnapshot { return freeze({ schemaVersion: PLACEMENT_SNAPSHOT_VERSION, floor: cloneRef(floor.floor), revision: 0, entities: [], occupancy: occupancy([]) }); }
export const createEmptyWorldSnapshot = createEmptyPlacementSnapshot;
export const applyPlacement = placeEntity;
export const placeIntoSnapshot = placeEntity;

function walkable(floor: PlacementFloor, surfaces: ReadonlyMap<string, PlacementSurfaceCell>): ReadonlySet<string> {
  if (floor.navigation?.walkableCells) return new Set(floor.navigation.walkableCells.filter((cell) => inside(cell, floor.bounds)).map(cellKey));
  const result = new Set<string>(); for (const [key, surface] of surfaces.entries()) { const allowed = surface.traversable !== false && !floor.surfacePolicy.nonWalkableKinds?.includes(surface.kind) && (!floor.surfacePolicy.walkableKinds || floor.surfacePolicy.walkableKinds.includes(surface.kind)); if (allowed) result.add(key); } return result;
}

function reachable(starts: readonly PlacementCell[], targets: readonly PlacementCell[], traversable: ReadonlySet<string>, blocked: ReadonlySet<string>): boolean {
  const targetKeys = new Set(targets.map(cellKey)); if (!targetKeys.size) return false; const queue = starts.slice().sort(cellCompare).map((cell) => ({ ...cell })); const visited = new Set<string>();
  for (const start of queue) { const key = cellKey(start); if (traversable.has(key) && !blocked.has(key)) visited.add(key); }
  for (let index = 0; index < queue.length; index += 1) { const current = queue[index]; if (!current || !visited.has(cellKey(current))) continue; if (targetKeys.has(cellKey(current))) return true; for (const direction of directions) { const next = { x: current.x + direction.x, y: current.y + direction.y, elevation: current.elevation }; const key = cellKey(next); if (!visited.has(key) && traversable.has(key) && !blocked.has(key)) { visited.add(key); queue.push(next); } } }
  return false;
}

function requiredSlots(request: PlacementRequest, slots: readonly ResolvedUseSlot[]): readonly string[] { const requested = request.requiredUseSlot ?? request.useSlot ?? request.requiredApproach; if (requested === false || request.requireApproach === false) return []; if (typeof requested === "string") return [requested]; if (requested && typeof requested === "object") return [requested.value]; return slots.map((slot) => slot.id.value); }

function placedEntity(request: PlacementRequest, floor: FloorReference, impact: PlacementNavigationImpact, geometry: ResolvedPlacementGeometry, kind: PlacementSemanticKind): PlacedEntitySnapshot {
  const identity = { id: cloneId(request.entity.id), kind, ...(request.entity.tags ? { tags: request.entity.tags.slice() } : {}) }; return { identity, geometry: cloneRef(request.geometry), floor: cloneRef(floor), anchor: { ...geometry.anchor }, orientation: geometry.orientation, footprint: cells(geometry.footprint), blocking: cells(geometry.blocking), clearance: cells(geometry.clearance), sockets: geometry.sockets, useSlots: geometry.useSlots, navigationImpact: impact };
}

export function placeEntity(snapshot: PlacementSnapshot, request: PlacementRequest, context: PlacementContext): PlacementResult {
  const errors: PlacementDiagnostic[] = []; const anchor = anchorInfo(request.anchor); const kind = request.entity.kind ?? request.entity.semanticKind; const id = entityKey(request.entity);
  if (!sameRef(snapshot.floor, context.floor.floor) || !sameRef(request.floor, context.floor.floor) || (anchor.floor && !sameRef(anchor.floor, context.floor.floor))) errors.push(diagnostic("world.floor-mismatch", "Placement, snapshot, anchor, and floor context must identify the same floor version.", { entity: id, snapshotFloor: refKey(snapshot.floor), requestFloor: refKey(request.floor), contextFloor: refKey(context.floor.floor) }));
  if (anchor.error) errors.push(anchor.error); if (!kind) errors.push(diagnostic("world.entity-kind-missing", "A placed entity must declare a semantic kind.", { entity: id })); if (snapshot.entities.some((entity) => entityKey(entity.identity) === id)) errors.push(diagnostic("world.entity-duplicate", "A placement cannot repeat an entity identity.", { entity: id }));
  if (!inside({ x: 0, y: 0, elevation: context.floor.bounds.minElevation ?? 0 }, context.floor.bounds)) errors.push(diagnostic("world.floor-invalid", "A placement floor must have positive safe bounds.", { bounds: context.floor.bounds }));
  const surfaceSource = surfaceMap(context.floor); errors.push(...surfaceSource.diagnostics); const geometrySource = findGeometry(context.geometryAuthority, request.geometry); errors.push(...geometrySource.diagnostics); if (errors.length || !kind || !anchor.cell || !geometrySource.geometry) return { ok: false, snapshot, diagnostics: sortedDiagnostics(errors) };
  const impact: PlacementNavigationImpact = kind === "decoration" ? "none" : request.navigationImpact ?? "blocking"; if (kind === "decoration" && request.navigationImpact === "blocking") errors.push(diagnostic("world.decoration-navigation-conflict", "A decoration cannot request blocking navigation impact.", { entity: id }));
  const derived = derive(geometrySource.geometry, request, anchor.cell, impact); errors.push(...derived.diagnostics); if (!derived.geometry) return { ok: false, snapshot, diagnostics: sortedDiagnostics(errors) };
  const geometry = derived.geometry; const allCells = [...geometry.footprint, ...geometry.blocking, ...geometry.clearance, ...geometry.useSlots.flatMap((slot) => [...slot.approach, ...slot.waiting])];
  for (const cell of allCells) if (!inside(cell, context.floor.bounds)) errors.push(diagnostic("world.out-of-bounds", "A transformed placement cell is outside floor bounds.", { entity: id, cell: cellKey(cell) }));
  for (const socket of geometry.sockets) if (!inside(subCellToCell(socket.position), context.floor.bounds)) errors.push(diagnostic("world.out-of-bounds", "A transformed socket is outside floor bounds.", { entity: id, socket: socket.id.value }));
  for (const cell of geometry.footprint) { const surface = surfaceSource.map.get(cellKey(cell)); if (!surface) errors.push(diagnostic("world.surface-missing", "A footprint cell has no supporting surface.", { entity: id, cell: cellKey(cell) })); else if (!surfacePolicyAllows(surface, context.floor.surfacePolicy, kind)) errors.push(diagnostic("world.unsupported-surface", "The supporting surface does not allow this entity kind.", { entity: id, cell: cellKey(cell), surface: surface.kind, kind })); }
  const blocking = new Set(geometry.blocking.map(cellKey)); const clearance = new Set(geometry.clearance.map(cellKey)); for (const key of blocking) { if (snapshot.occupancy.blocking.has(key)) errors.push(diagnostic("world.occupied", "A blocking cell is already owned.", { entity: id, cell: key, owner: snapshot.occupancy.blocking.get(key) })); if (snapshot.occupancy.clearance.has(key)) errors.push(diagnostic("world.clearance", "A blocking cell overlaps clearance.", { entity: id, cell: key, owner: snapshot.occupancy.clearance.get(key) })); if (clearance.has(key)) errors.push(diagnostic("world.clearance", "Blocking and clearance cells overlap.", { entity: id, cell: key })); }
  for (const key of clearance) { if (snapshot.occupancy.blocking.has(key)) errors.push(diagnostic("world.clearance", "A clearance cell overlaps blocking occupancy.", { entity: id, cell: key, owner: snapshot.occupancy.blocking.get(key) })); if (snapshot.occupancy.clearance.has(key)) errors.push(diagnostic("world.clearance", "A clearance cell overlaps existing clearance.", { entity: id, cell: key, owner: snapshot.occupancy.clearance.get(key) })); }
  const slotMap = new Map(geometry.useSlots.map((slot) => [slot.id.value, slot] as const)); const blocked = new Set<string>([...snapshot.occupancy.blocking.keys(), ...snapshot.occupancy.clearance.keys(), ...blocking, ...clearance]); const starts = context.floor.navigation?.starts ?? context.floor.navigation?.entryCells ?? []; for (const useSlot of requiredSlots(request, geometry.useSlots)) { const slot = slotMap.get(useSlot); if (!slot) errors.push(diagnostic("world.use-slot-missing", "The required use slot does not resolve.", { entity: id, useSlot })); else if (!reachable(starts, slot.approach, walkable(context.floor, surfaceSource.map), blocked)) errors.push(diagnostic("world.unreachable", "No required approach candidate is reachable by four-direction traversal.", { entity: id, useSlot })); }
  if (errors.length) return { ok: false, snapshot, diagnostics: sortedDiagnostics(errors) };
  const entity = freeze(placedEntity(request, context.floor.floor, impact, geometry, kind)); const entities = snapshot.entities.concat(entity).sort((a, b) => textCompare(entityKey(a.identity), entityKey(b.identity))); const next = freeze({ schemaVersion: PLACEMENT_SNAPSHOT_VERSION, floor: cloneRef(context.floor.floor), revision: snapshot.revision + 1, entities, occupancy: occupancy(entities) }); return { ok: true, snapshot: next, entity, placed: entity, diagnostics: [] };
}

function surfacePolicyAllows(surface: PlacementSurfaceCell, policy: PlacementSurfacePolicy, kind: PlacementSemanticKind): boolean { const local = surface.supportedKinds ?? surface.allowedKinds; if (local && !local.includes(kind)) return false; const allowed = policy.allowedKinds?.[kind] ?? policy.supportedSurfaces?.[kind] ?? policy.allowedKinds?.["*"] ?? policy.supportedSurfaces?.["*"]; return !allowed || allowed.includes(surface.kind); }

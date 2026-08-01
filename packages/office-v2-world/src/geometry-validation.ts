import type {
  DefinitionLocalCellOffset,
  DefinitionLocalSubCellOffset,
  GeometryDocument,
  GeometryReference,
  WorldFacing,
} from "@affiliate-ops/office-v2-contracts";
import type { WorldReferenceDiagnostic } from "./reference-closure.ts";

type CellOffset = DefinitionLocalCellOffset;
type SubCellOffset = DefinitionLocalSubCellOffset;
type SocketDefinition = GeometryDocument["sockets"][number];
type UseSlotDefinition = GeometryDocument["useSlots"][number];

const quarterTurns: Readonly<Record<WorldFacing, number>> = {
  north: 0,
  east: 1,
  south: 2,
  west: 3,
};

export interface TransformedGeometry {
  readonly orientation: WorldFacing;
  readonly quarterTurnsClockwise: number;
  readonly anchorBasis: {
    readonly origin: CellOffset;
    readonly groundContact: SubCellOffset;
  };
  readonly footprint: readonly CellOffset[];
  readonly blocking: {
    readonly cells: readonly CellOffset[];
    readonly mode: "solid";
  };
  readonly clearance: readonly CellOffset[];
  readonly sockets: readonly SocketDefinition[];
  readonly useSlots: readonly UseSlotDefinition[];
}

export interface GeometryValidationResult {
  readonly ok: boolean;
  readonly diagnostics: readonly WorldReferenceDiagnostic[];
  readonly transformed?: TransformedGeometry;
}

export interface DerivedGeometryProjection {
  readonly geometry: GeometryReference;
  readonly orientation: WorldFacing;
  readonly owner?: "derived" | "asset" | "presentation";
  readonly geometryDigest?: string;
  readonly footprint?: readonly CellOffset[];
  readonly clearance?: readonly CellOffset[];
  readonly sockets?: readonly SocketDefinition[];
  readonly useSlots?: readonly UseSlotDefinition[];
  readonly blocking?: unknown;
  readonly occupancy?: unknown;
}

function diagnostic(
  code: WorldReferenceDiagnostic["code"],
  message: string,
  context: Readonly<Record<string, unknown>>,
): WorldReferenceDiagnostic {
  return {
    code,
    owner: "world",
    version: 1,
    message,
    context,
  };
}

function offsetKey(offset: { readonly x: number; readonly y: number; readonly elevation: number }): string {
  return `${offset.x},${offset.y},${offset.elevation}`;
}

function compareOffsets(left: { readonly x: number; readonly y: number; readonly elevation: number }, right: typeof left): number {
  return left.elevation - right.elevation || left.y - right.y || left.x - right.x;
}

function rotateOffset<T extends CellOffset | SubCellOffset>(offset: T, orientation: WorldFacing): T {
  const turns = quarterTurns[orientation];
  if (turns === undefined) throw new RangeError(`world.orientation-unsupported: ${String(orientation)}`);
  let x = offset.x;
  let y = offset.y;
  for (let turn = 0; turn < turns; turn += 1) {
    [x, y] = [-y, x];
  }
  return { ...offset, x, y } as T;
}

/** Apply the definition-local cardinal transform around the anchor basis. */
export function rotateDefinitionLocalCell(offset: CellOffset, orientation: WorldFacing): CellOffset {
  return rotateOffset(offset, orientation);
}

/** Apply the same cardinal transform in four-units-per-cell sub-cell space. */
export function rotateDefinitionLocalSubCell(offset: SubCellOffset, orientation: WorldFacing): SubCellOffset {
  return rotateOffset(offset, orientation);
}

export function inverseWorldOrientation(orientation: WorldFacing): WorldFacing {
  if (orientation === "north") return "north";
  if (orientation === "east") return "west";
  if (orientation === "south") return "south";
  if (orientation === "west") return "east";
  throw new RangeError(`world.orientation-unsupported: ${String(orientation)}`);
}

function sortedOffsets(offsets: readonly (CellOffset | SubCellOffset)[]): readonly (CellOffset | SubCellOffset)[] {
  return offsets.slice().sort(compareOffsets);
}

function sortedSockets(sockets: readonly SocketDefinition[]): readonly SocketDefinition[] {
  return sockets.slice().sort((left, right) => left.id.value.localeCompare(right.id.value));
}

function sortedUseSlots(slots: readonly UseSlotDefinition[]): readonly UseSlotDefinition[] {
  return slots.slice().sort((left, right) => left.id.value.localeCompare(right.id.value));
}

/** Produce a deterministic, non-canonical geometry evidence string. */
export function geometryFingerprint(geometry: TransformedGeometry): string {
  return JSON.stringify({
    anchorBasis: geometry.anchorBasis,
    blocking: sortedOffsets(geometry.blocking.cells),
    clearance: sortedOffsets(geometry.clearance),
    footprint: sortedOffsets(geometry.footprint),
    orientation: geometry.orientation,
    quarterTurnsClockwise: geometry.quarterTurnsClockwise,
    sockets: sortedSockets(geometry.sockets),
    useSlots: sortedUseSlots(geometry.useSlots),
  });
}

function orientationDiagnostics(geometry: GeometryDocument): WorldReferenceDiagnostic[] {
  const diagnostics: WorldReferenceDiagnostic[] = [];
  const supported = new Set<string>();
  for (const [index, orientation] of geometry.supportedOrientations.entries()) {
    if (supported.has(orientation)) diagnostics.push(diagnostic("world.geometry-rotation-invalid", "A geometry orientation is repeated.", { pointer: `/supportedOrientations/${index}`, orientation }));
    supported.add(orientation);
  }
  const transforms = new Map<string, number>();
  for (const [index, transform] of geometry.orientationTransforms.entries()) {
    if (transforms.has(transform.orientation)) diagnostics.push(diagnostic("world.geometry-rotation-invalid", "A geometry orientation transform is repeated.", { pointer: `/orientationTransforms/${index}`, orientation: transform.orientation }));
    transforms.set(transform.orientation, transform.quarterTurnsClockwise);
    if (quarterTurns[transform.orientation] !== transform.quarterTurnsClockwise) {
      diagnostics.push(diagnostic("world.geometry-rotation-invalid", "A geometry transform is not the declared cardinal quarter-turn.", { pointer: `/orientationTransforms/${index}`, orientation: transform.orientation, quarterTurnsClockwise: transform.quarterTurnsClockwise }));
    }
  }
  for (const orientation of supported) {
    if (!transforms.has(orientation)) diagnostics.push(diagnostic("world.geometry-rotation-invalid", "A supported orientation has no transform.", { orientation }));
  }
  for (const orientation of transforms.keys()) {
    if (!supported.has(orientation)) diagnostics.push(diagnostic("world.geometry-rotation-invalid", "An orientation transform is not supported by geometry.", { orientation }));
  }
  return diagnostics;
}

function duplicateMemberDiagnostics(geometry: GeometryDocument): WorldReferenceDiagnostic[] {
  const diagnostics: WorldReferenceDiagnostic[] = [];
  const sockets = new Set<string>();
  for (const [index, socket] of geometry.sockets.entries()) {
    if (sockets.has(socket.id.value)) diagnostics.push(diagnostic("world.socket-duplicate", "A geometry record repeats a socket ID.", { pointer: `/sockets/${index}/id`, value: socket.id.value }));
    sockets.add(socket.id.value);
  }
  const slots = new Set<string>();
  for (const [index, slot] of geometry.useSlots.entries()) {
    if (slots.has(slot.id.value)) diagnostics.push(diagnostic("world.use-slot-duplicate", "A geometry record repeats a use-slot ID.", { pointer: `/useSlots/${index}/id`, value: slot.id.value }));
    slots.add(slot.id.value);
  }
  return diagnostics;
}

function transformedFor(geometry: GeometryDocument, orientation: WorldFacing): TransformedGeometry {
  const turns = quarterTurns[orientation];
  if (turns === undefined || !geometry.supportedOrientations.includes(orientation)) {
    throw new RangeError(`world.orientation-unsupported: ${String(orientation)}`);
  }
  return {
    orientation,
    quarterTurnsClockwise: turns,
    anchorBasis: {
      origin: rotateDefinitionLocalCell(geometry.anchorBasis.origin, orientation),
      groundContact: rotateDefinitionLocalSubCell(geometry.anchorBasis.groundContact, orientation),
    },
    footprint: geometry.footprint.map((offset) => rotateDefinitionLocalCell(offset, orientation)),
    blocking: {
      mode: geometry.blocking.mode,
      cells: geometry.blocking.cells.map((offset) => rotateDefinitionLocalCell(offset, orientation)),
    },
    clearance: geometry.clearance.map((offset) => rotateDefinitionLocalCell(offset, orientation)),
    sockets: geometry.sockets.map((socket) => ({
      ...socket,
      position: rotateDefinitionLocalSubCell(socket.position, orientation),
    })),
    useSlots: geometry.useSlots.map((slot) => ({
      ...slot,
      approach: slot.approach.map((offset) => rotateDefinitionLocalCell(offset, orientation)),
      waiting: slot.waiting.map((offset) => rotateDefinitionLocalCell(offset, orientation)),
    })),
  };
}

/** Transform every geometry-owned offset while retaining semantic IDs. */
export function transformGeometry(geometry: GeometryDocument, orientation: WorldFacing): TransformedGeometry {
  return transformedFor(geometry, orientation);
}

function geometryShapeDiagnostics(transformed: TransformedGeometry, orientation: WorldFacing): WorldReferenceDiagnostic[] {
  const diagnostics: WorldReferenceDiagnostic[] = [];
  const blocking = new Set(transformed.blocking.cells.map(offsetKey));
  const clearance = new Set<string>();
  for (const [index, offset] of transformed.clearance.entries()) {
    const key = offsetKey(offset);
    if (clearance.has(key) || blocking.has(key)) diagnostics.push(diagnostic("world.geometry-rotation-invalid", "Rotated clearance overlaps or repeats a blocking cell.", { orientation, pointer: `/clearance/${index}`, cell: key }));
    clearance.add(key);
  }
  const footprint = new Set<string>();
  for (const [index, offset] of transformed.footprint.entries()) {
    const key = offsetKey(offset);
    if (footprint.has(key)) diagnostics.push(diagnostic("world.geometry-rotation-invalid", "Rotated footprint repeats a cell.", { orientation, pointer: `/footprint/${index}`, cell: key }));
    footprint.add(key);
  }
  return diagnostics;
}

/** Validate cardinal transforms, member uniqueness, and rotated clearance agreement. */
export function validateGeometry(geometry: GeometryDocument, orientation?: WorldFacing): GeometryValidationResult {
  const diagnostics = [...orientationDiagnostics(geometry), ...duplicateMemberDiagnostics(geometry)];
  const orientations = orientation ? [orientation] : geometry.supportedOrientations.slice();
  let transformed: TransformedGeometry | undefined;
  for (const requested of orientations) {
    try {
      const current = transformedFor(geometry, requested);
      if (requested === orientation) transformed = current;
      diagnostics.push(...geometryShapeDiagnostics(current, requested));
    } catch {
      diagnostics.push(diagnostic("world.orientation-unsupported", "An instance or projection requests an undeclared orientation.", { orientation: requested }));
    }
  }
  return transformed
    ? { ok: diagnostics.length === 0, diagnostics, transformed }
    : { ok: false, diagnostics };
}

function sameReference(left: GeometryReference, right: GeometryReference): boolean {
  return left.id.kind === right.id.kind
    && left.id.value === right.id.value
    && left.version === right.version;
}

function projectionHasForbiddenAssetGeometry(projection: DerivedGeometryProjection): boolean {
  return projection.owner === "asset"
    && (projection.footprint !== undefined
      || projection.clearance !== undefined
      || projection.sockets !== undefined
      || projection.useSlots !== undefined
      || projection.blocking !== undefined
      || projection.occupancy !== undefined);
}

/** Compare an allowed derived projection with authoritative transformed geometry. */
export function validateGeometryAgreement(
  geometry: GeometryDocument,
  projection: DerivedGeometryProjection,
): GeometryValidationResult {
  const base = validateGeometry(geometry, projection.orientation);
  const diagnostics = [...base.diagnostics];
  const transformed = base.transformed;
  if (!sameReference(geometry.geometry, projection.geometry)) {
    diagnostics.push(diagnostic("world.geometry-conflict", "A derived projection references a different geometry version.", { expected: geometry.geometry, actual: projection.geometry }));
  }
  if (projectionHasForbiddenAssetGeometry(projection)) {
    diagnostics.push(diagnostic("world.asset-occupancy-forbidden", "An asset or presentation record cannot author simulation geometry.", { owner: projection.owner }));
  }
  if (projection.blocking !== undefined || projection.occupancy !== undefined) {
    diagnostics.push(diagnostic("world.geometry-authority-violation", "A derived projection cannot add blocking or occupancy facts.", { owner: projection.owner ?? "derived" }));
  }
  if (!transformed) return { ok: false, diagnostics };
  const expectedDigest = geometryFingerprint(transformed);
  if (projection.geometryDigest !== undefined && projection.geometryDigest !== expectedDigest) {
    diagnostics.push(diagnostic("world.geometry-conflict", "A derived geometry digest disagrees with authority.", { expectedDigest, actualDigest: projection.geometryDigest }));
  }
  if (projection.footprint && JSON.stringify(sortedOffsets(projection.footprint)) !== JSON.stringify(sortedOffsets(transformed.footprint))) {
    diagnostics.push(diagnostic("world.geometry-conflict", "A derived footprint disagrees with authoritative geometry.", { field: "footprint" }));
  }
  if (projection.clearance && JSON.stringify(sortedOffsets(projection.clearance)) !== JSON.stringify(sortedOffsets(transformed.clearance))) {
    diagnostics.push(diagnostic("world.geometry-conflict", "A derived clearance set disagrees with authoritative geometry.", { field: "clearance" }));
  }
  if (projection.sockets && JSON.stringify(sortedSockets(projection.sockets)) !== JSON.stringify(sortedSockets(transformed.sockets))) {
    diagnostics.push(diagnostic("world.geometry-conflict", "A derived socket projection disagrees with authoritative geometry.", { field: "sockets" }));
  }
  if (projection.useSlots && JSON.stringify(sortedUseSlots(projection.useSlots)) !== JSON.stringify(sortedUseSlots(transformed.useSlots))) {
    diagnostics.push(diagnostic("world.geometry-conflict", "A derived use-slot projection disagrees with authoritative geometry.", { field: "useSlots" }));
  }
  return { ok: diagnostics.length === 0, diagnostics, transformed };
}

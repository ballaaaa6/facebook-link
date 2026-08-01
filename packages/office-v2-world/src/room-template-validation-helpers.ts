import type {
  FacilityGroup,
  FacilitySlot,
  FloorCell,
  PlacementSlot,
  RoomTemplateDocument,
} from "@affiliate-ops/office-v2-contracts";

export type RoomTemplateDiagnosticCode =
  | "room.adjacency-illegal"
  | "room.capacity-insufficient"
  | "room.capacity-overflow"
  | "room.circulation-too-narrow"
  | "room.decoration-navigation-conflict"
  | "room.duplicate-id"
  | "room.entrance-blocked"
  | "room.focal-point-out-of-bounds"
  | "room.floor-mismatch"
  | "room.placement-slot-invalid"
  | "room.prop-slot-overlap"
  | "room.required-facility-unreachable";

export interface RoomTemplateDiagnostic {
  readonly code: RoomTemplateDiagnosticCode;
  readonly owner: "world";
  readonly version: 1;
  readonly message: string;
  readonly context: Readonly<Record<string, unknown>>;
}

export interface RoomNavigationProjection {
  readonly blockingCells: readonly string[];
  readonly reachableCells: readonly string[];
  readonly fingerprint: string;
}

export interface RoomTemplateValidationResult {
  readonly ok: boolean;
  readonly diagnostics: readonly RoomTemplateDiagnostic[];
  readonly navigation: RoomNavigationProjection;
  readonly counts: {
    readonly assignedActors: number;
    readonly reservedActorSlots: number;
    readonly totalActorSlots: number;
    readonly facilities: number;
  };
}

export interface Coordinate {
  readonly x: number;
  readonly y: number;
  readonly elevation: number;
}

export interface FacilityEntry {
  readonly group: FacilityGroup;
  readonly facility: FacilitySlot;
}

export interface SlotOwner {
  readonly kind: "facility" | "prop";
  readonly id: string;
  readonly slot: PlacementSlot;
}

export function diagnostic(
  code: RoomTemplateDiagnosticCode,
  message: string,
  context: Readonly<Record<string, unknown>>,
): RoomTemplateDiagnostic {
  return { code, owner: "world", version: 1, message, context };
}

export function coordinateOf(cell: FloorCell): Coordinate {
  return cell.coordinate;
}

export function coordinateKey(coordinate: Coordinate): string {
  return `${coordinate.x},${coordinate.y},${coordinate.elevation}`;
}

export function cellKey(cell: FloorCell): string {
  return coordinateKey(coordinateOf(cell));
}

export function floorKey(cell: FloorCell): string {
  return `${cell.floor.id.value}@${cell.floor.version}`;
}

export function referenceKey(reference: { readonly id: { readonly value: string }; readonly version: number }): string {
  return `${reference.id.value}@${reference.version}`;
}

export function stableString(value: unknown): string {
  return JSON.stringify(value, (_key, entry) => {
    if (Array.isArray(entry)) return entry;
    if (entry && typeof entry === "object") {
      return Object.fromEntries(Object.entries(entry).sort(([left], [right]) => left.localeCompare(right)));
    }
    return entry;
  });
}

export function sortedStrings(values: Iterable<string>): readonly string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function sameFloor(left: FloorCell, floor: RoomTemplateDocument["floor"]): boolean {
  return referenceKey(left.floor) === referenceKey(floor);
}

export function inBounds(document: RoomTemplateDocument, cell: FloorCell): boolean {
  if (!sameFloor(cell, document.floor)) return false;
  const coordinate = coordinateOf(cell);
  const origin = coordinateOf(document.bounds.origin);
  return coordinate.elevation === origin.elevation
    && coordinate.x >= origin.x
    && coordinate.x < origin.x + document.bounds.width
    && coordinate.y >= origin.y
    && coordinate.y < origin.y + document.bounds.depth;
}

export function addSlotDiagnostics(
  diagnostics: RoomTemplateDiagnostic[],
  document: RoomTemplateDocument,
  owner: SlotOwner,
): void {
  const slot = owner.slot;
  const cells = [slot.anchor, ...slot.occupiedCells, ...slot.clearanceCells, ...slot.approachCells];
  for (const [index, cell] of cells.entries()) {
    if (!sameFloor(cell, document.floor)) {
      diagnostics.push(diagnostic("room.floor-mismatch", "A room placement cell references a different floor.", {
        owner: owner.kind,
        ownerId: owner.id,
        pointer: `/placementSlots/${owner.id}/cells/${index}`,
        expectedFloor: referenceKey(document.floor),
        actualFloor: floorKey(cell),
      }));
    } else if (!inBounds(document, cell)) {
      diagnostics.push(diagnostic("room.placement-slot-invalid", "A placement slot cell is outside room bounds.", {
        owner: owner.kind,
        ownerId: owner.id,
        pointer: `/placementSlots/${owner.id}/cells/${index}`,
        cell: cellKey(cell),
      }));
    }
  }
  const occupied = new Set(slot.occupiedCells.map(cellKey));
  const clearance = new Set(slot.clearanceCells.map(cellKey));
  if ([...clearance].some((key) => occupied.has(key))) diagnostics.push(diagnostic(
    "room.placement-slot-invalid",
    "A placement slot clearance cell overlaps its occupied envelope.",
    { owner: owner.kind, ownerId: owner.id },
  ));
}

export function collectFacilityEntries(document: RoomTemplateDocument): readonly FacilityEntry[] {
  return document.facilityGroups
    .slice().sort((left, right) => left.id.localeCompare(right.id))
    .flatMap((group) => group.facilities
      .slice().sort((left, right) => left.id.localeCompare(right.id))
      .map((facility) => ({ group, facility })));
}

export function collectSlotOwners(document: RoomTemplateDocument): readonly SlotOwner[] {
  const facilities = collectFacilityEntries(document).map(({ facility }) => ({
    kind: "facility" as const,
    id: facility.id,
    slot: facility.placementSlot,
  }));
  const props = document.propSlots
    .slice().sort((left, right) => left.id.localeCompare(right.id))
    .map((prop) => ({ kind: "prop" as const, id: prop.id, slot: prop.placementSlot }));
  return [...facilities, ...props].sort((left, right) => (
    left.kind.localeCompare(right.kind) || left.id.localeCompare(right.id)
  ));
}

export function facilityLookup(document: RoomTemplateDocument): ReadonlyMap<string, FacilityEntry> {
  return new Map(collectFacilityEntries(document).map((entry) => [entry.facility.id, entry]));
}

export function placementLookup(document: RoomTemplateDocument): ReadonlyMap<string, SlotOwner> {
  return new Map(collectSlotOwners(document).map((owner) => [owner.slot.id, owner]));
}

export function checkDuplicateIds(
  diagnostics: RoomTemplateDiagnostic[],
  document: RoomTemplateDocument,
): void {
  const seen = new Map<string, string>();
  const check = (namespace: string, id: string): void => {
    const key = `${namespace}:${id}`;
    if (seen.has(key)) diagnostics.push(diagnostic("room.duplicate-id", "A room template repeats an identifier.", {
      namespace,
      id,
    }));
    seen.set(key, id);
  };
  for (const group of document.facilityGroups) {
    check("facility-group", group.id);
    for (const facility of group.facilities) {
      check("facility", facility.id);
      check("placement-slot", facility.placementSlot.id);
    }
  }
  for (const entrance of document.entrances) check("entrance", entrance.id);
  for (const actor of document.actorSlots) check("actor-slot", actor.id);
  for (const prop of document.propSlots) {
    check("prop-slot", prop.id);
    check("placement-slot", prop.placementSlot.id);
  }
  for (const aisle of document.circulation.aisles) check("aisle", aisle.id);
  for (const constraint of document.adjacencyConstraints) check("adjacency", constraint.id);
  for (const focalPoint of document.focalPoints) check("focal-point", focalPoint.id);
  for (const band of document.densityBands) check("density-band", band.id);
  for (const decoration of document.decorationSlots) {
    check("decoration-slot", decoration.id);
    check("placement-slot", decoration.placementSlot.id);
  }
}

function blockingCells(document: RoomTemplateDocument): ReadonlySet<string> {
  const cells = new Set(document.circulation.blockedCells.map(cellKey));
  for (const owner of collectSlotOwners(document)) {
    if (owner.slot.navigationImpact !== "blocking") continue;
    for (const cell of owner.slot.occupiedCells) cells.add(cellKey(cell));
    for (const cell of owner.slot.clearanceCells) cells.add(cellKey(cell));
  }
  return cells;
}

function roomCellKeys(document: RoomTemplateDocument): readonly string[] {
  const origin = coordinateOf(document.bounds.origin);
  const cells: string[] = [];
  for (let y = origin.y; y < origin.y + document.bounds.depth; y += 1) {
    for (let x = origin.x; x < origin.x + document.bounds.width; x += 1) {
      cells.push(coordinateKey({ x, y, elevation: origin.elevation }));
    }
  }
  return cells;
}

function neighbors(key: string): readonly string[] {
  const [xValue, yValue, elevationValue] = key.split(",").map(Number);
  const x = xValue ?? 0;
  const y = yValue ?? 0;
  const elevation = elevationValue ?? 0;
  return [
    coordinateKey({ x, y: y - 1, elevation }),
    coordinateKey({ x: x + 1, y, elevation }),
    coordinateKey({ x, y: y + 1, elevation }),
    coordinateKey({ x: x - 1, y, elevation }),
  ];
}

function reachableCells(document: RoomTemplateDocument, blocked: ReadonlySet<string>): readonly string[] {
  const roomCells = new Set(roomCellKeys(document));
  const starts = document.entrances.flatMap((entrance) => [entrance.cell, ...entrance.approachCells])
    .map(cellKey)
    .filter((key) => roomCells.has(key) && !blocked.has(key));
  const queue = [...new Set(starts)].sort((left, right) => left.localeCompare(right));
  const visited = new Set(queue);
  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    if (!current) continue;
    for (const next of neighbors(current)) {
      if (!roomCells.has(next) || blocked.has(next) || visited.has(next)) continue;
      visited.add(next);
      queue.push(next);
    }
  }
  return sortedStrings(visited);
}

/** Derive navigation occupancy without reading decoration slots. */
export function deriveRoomNavigation(document: RoomTemplateDocument): RoomNavigationProjection {
  const blocking = sortedStrings(blockingCells(document));
  const reachable = reachableCells(document, new Set(blocking));
  const fingerprint = stableString({
    bounds: document.bounds,
    blockingCells: blocking,
    floor: document.floor,
    reachableCells: reachable,
  });
  return { blockingCells: blocking, reachableCells: reachable, fingerprint };
}

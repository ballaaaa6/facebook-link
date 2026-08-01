import type {
  BuildingReference,
  FloorLocalCellPosition,
  FloorReference,
  JsonValue,
  RoomReference,
} from "@affiliate-ops/office-v2-contracts";
import {
  canonicalHashHex,
  normalizeDeclaredCollections,
} from "@affiliate-ops/office-v2-contracts";
import type {
  CompilationDiagnostic,
  ReferenceEdge,
  ReferenceGraph,
  ReferenceNode,
} from "@affiliate-ops/office-v2-contracts";
import type { RoomTemplateDocument } from "@affiliate-ops/office-v2-contracts";
import type {
  BuildingTopologyDocument,
  FloorTopologyDocument,
  PortalDocument,
  VersionedSlugReference,
} from "./building-topology-validation.ts";
import type {
  CompilationDiagnosticReport,
  SceneCollectionDeclaration,
  SceneCompilerDependencies,
  SceneCompilerDiagnostic,
  SceneCompilerDiagnosticCode,
  SceneFloorPlan,
  ScenePlanDocument,
  SceneReservedCore,
} from "./scene-plan-compiler.ts";

interface MutableRecord {
  [key: string]: unknown;
}

interface GraphState {
  readonly nodes: Map<string, ReferenceNode>;
  readonly edges: Map<string, ReferenceEdge>;
}

export function isRecord(value: unknown): value is MutableRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function asJson(value: unknown): JsonValue {
  return value as JsonValue;
}

export function compareStrings(left: string, right: string): number {
  const length = Math.min(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const difference = left.charCodeAt(index) - right.charCodeAt(index);
    if (difference !== 0) return difference;
  }
  return left.length - right.length;
}

function sortStrings(values: readonly string[]): string[] {
  return values.slice().sort(compareStrings);
}

export function sortByKey<T>(values: readonly T[], key: (value: T) => string): T[] {
  return values.slice().sort((left, right) => compareStrings(key(left), key(right)));
}

export function commonReferenceKey(reference: unknown): string | null {
  if (!isRecord(reference) || !isRecord(reference.id)) return null;
  const kind = reference.id.kind;
  const value = reference.id.value;
  const version = reference.version;
  if (typeof kind !== "string" || typeof value !== "string" || typeof version !== "number") return null;
  return `${kind}:${value}@${version}`;
}

function slugReferenceKey(reference: unknown, kind: string): string | null {
  if (!isRecord(reference)) return null;
  const id = reference.id;
  const version = reference.version;
  if (typeof id !== "string" || typeof version !== "number") return null;
  return `${kind}:${id}@${version}`;
}

export function floorKey(reference: FloorReference): string {
  return commonReferenceKey(reference) ?? "floor:invalid@0";
}

export function roomKey(reference: RoomReference): string {
  return commonReferenceKey(reference) ?? "room:invalid@0";
}

function topologyWorldKey(reference: VersionedSlugReference): string {
  return slugReferenceKey(reference, "world") ?? "world:invalid@0";
}

function siteKey(reference: VersionedSlugReference): string {
  return slugReferenceKey(reference, "site") ?? "site:invalid@0";
}

export function coordinateKey(position: FloorLocalCellPosition): string {
  return `${floorKey(position.floor)}:${position.coordinate.x},${position.coordinate.y},${position.coordinate.elevation}`;
}

export function sortCells(values: readonly FloorLocalCellPosition[]): FloorLocalCellPosition[] {
  return sortByKey(values, coordinateKey);
}

export function diagnostic(
  code: SceneCompilerDiagnosticCode,
  message: string,
  context: { readonly pointer?: string; readonly relatedKeys?: readonly string[] } = {},
): SceneCompilerDiagnostic {
  return {
    code,
    owner: code.startsWith("contract.") ? "contract" : "world",
    version: 1,
    message,
    relatedKeys: context.relatedKeys ?? [],
    ...(context.pointer === undefined ? {} : { pointer: context.pointer }),
  };
}

export function sortDiagnostics(diagnostics: readonly SceneCompilerDiagnostic[]): SceneCompilerDiagnostic[] {
  return diagnostics.slice().sort((left, right) => (
    compareStrings(left.code, right.code)
    || compareStrings(left.pointer ?? "", right.pointer ?? "")
    || compareStrings(left.relatedKeys.join("|"), right.relatedKeys.join("|"))
  ));
}

function normalizePlacement(value: MutableRecord): void {
  for (const field of ["occupiedCells", "clearanceCells", "approachCells"] as const) {
    const cells = value[field];
    if (Array.isArray(cells)) value[field] = sortCells(cells as FloorLocalCellPosition[]);
  }
}

function normalizeRoomTemplate(document: RoomTemplateDocument): RoomTemplateDocument {
  const copy = structuredClone(document) as unknown as MutableRecord;
  if (Array.isArray(copy.entrances)) copy.entrances = sortByKey(copy.entrances as MutableRecord[], (entry) => String(entry.id));
  if (Array.isArray(copy.facilityGroups)) {
    copy.facilityGroups = sortByKey(copy.facilityGroups as MutableRecord[], (entry) => String(entry.id));
    for (const group of copy.facilityGroups as MutableRecord[]) {
      if (Array.isArray(group.facilities)) {
        group.facilities = sortByKey(group.facilities as MutableRecord[], (entry) => String(entry.id));
        for (const facility of group.facilities as MutableRecord[]) {
          if (isRecord(facility.placementSlot)) normalizePlacement(facility.placementSlot);
        }
      }
    }
  }
  for (const field of ["actorSlots", "propSlots", "decorationSlots", "densityBands", "focalPoints", "adjacencyConstraints"] as const) {
    if (Array.isArray(copy[field])) copy[field] = sortByKey(copy[field] as MutableRecord[], (entry) => String(entry.id));
  }
  for (const field of ["propSlots", "decorationSlots"] as const) {
    for (const entry of (copy[field] as MutableRecord[] | undefined) ?? []) {
      if (isRecord(entry.placementSlot)) normalizePlacement(entry.placementSlot);
    }
  }
  if (isRecord(copy.circulation) && Array.isArray(copy.circulation.aisles)) {
    copy.circulation.aisles = sortByKey(copy.circulation.aisles as MutableRecord[], (entry) => String(entry.id));
    for (const aisle of copy.circulation.aisles as MutableRecord[]) {
      if (Array.isArray(aisle.cells)) aisle.cells = sortCells(aisle.cells as FloorLocalCellPosition[]);
    }
    if (Array.isArray(copy.circulation.blockedCells)) {
      copy.circulation.blockedCells = sortCells(copy.circulation.blockedCells as FloorLocalCellPosition[]);
    }
  }
  return copy as unknown as RoomTemplateDocument;
}

function normalizeTopology(document: BuildingTopologyDocument): BuildingTopologyDocument {
  const copy = structuredClone(document);
  const floors = sortByKey(copy.floors, (entry) => floorKey(entry.floor)).map((floor) => ({
    ...floor,
    siteFootprint: sortByKey(floor.siteFootprint, (cell) => `${cell.x},${cell.y}`),
  }));
  const siteEnvelope = {
    ...copy.siteEnvelope,
    contextCells: sortByKey(
      copy.siteEnvelope.contextCells,
      (entry) => `${entry.kind}:${entry.coordinate.x},${entry.coordinate.y}`,
    ),
    contextKinds: sortStrings(copy.siteEnvelope.contextKinds),
  };
  return {
    ...copy,
    floors,
    portals: sortByKey(copy.portals, (entry) => `${entry.id}@${entry.version}`),
    siteEnvelope,
  };
}

export function normalizeDependencies(dependencies: SceneCompilerDependencies): SceneCompilerDependencies {
  return {
    topology: normalizeTopology(dependencies.topology),
    roomTemplates: sortByKey(
      dependencies.roomTemplates.map(normalizeRoomTemplate),
      (entry) => roomKey(entry.room),
    ),
  };
}

function fieldValue(entry: JsonValue, path: string): string {
  let current: unknown = entry;
  for (const segment of path.split(".")) {
    if (!isRecord(current)) throw new Error(`collection key path ${path} does not resolve`);
    current = current[segment];
  }
  if (typeof current !== "string") throw new Error(`collection key path ${path} is not a string`);
  return current;
}

export function normalizePlan(plan: ScenePlanDocument): ScenePlanDocument {
  const declarations = plan.collectionDeclarations.map((entry: SceneCollectionDeclaration) => ({
    pointer: entry.pointer,
    order: entry.order,
    key: (value: JsonValue) => fieldValue(value, entry.keyField),
  }));
  return normalizeDeclaredCollections(asJson(plan), declarations) as unknown as ScenePlanDocument;
}

export function detectIndexDerivedIds(value: unknown, pointer: string, diagnostics: SceneCompilerDiagnostic[]): void {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => detectIndexDerivedIds(entry, `${pointer}/${index}`, diagnostics));
    return;
  }
  if (!isRecord(value)) return;
  for (const [key, child] of Object.entries(value)) {
    const childPointer = `${pointer}/${key}`;
    if ((key === "id" || key === "value") && typeof child === "string" && /-\d+$/u.test(child)) {
      diagnostics.push(diagnostic(
        "contract.array-index-derived-id",
        "Stable identity cannot be derived from an array index.",
        { pointer: childPointer, relatedKeys: [child] },
      ));
    }
    detectIndexDerivedIds(child, childPointer, diagnostics);
  }
}

function addNode(graph: GraphState, key: string, kind: string): void {
  const existing = graph.nodes.get(key);
  if (existing && existing.kind !== kind) return;
  graph.nodes.set(key, { key, kind });
}

function addEdge(graph: GraphState, from: string, to: string, relation: string): void {
  if (!graph.nodes.has(from) || !graph.nodes.has(to)) return;
  const key = `${from}|${relation}|${to}`;
  graph.edges.set(key, { from, to, relation });
}

function endpointGraphKey(id: string, version: number): string {
  return `endpoint:${id}@${version}`;
}

function portalGraphKey(portal: PortalDocument): string {
  return `portal:${portal.id}@${portal.version}`;
}

function addTopologyGraph(graph: GraphState, topology: BuildingTopologyDocument): void {
  const building = commonReferenceKey(topology.building) ?? "building:invalid@0";
  const site = siteKey(topology.siteEnvelope);
  addNode(graph, building, "building");
  addNode(graph, site, "site-envelope");
  addEdge(graph, building, site, "owns-site-envelope");
  for (const floor of topology.floors) {
    const floorNode = floorKey(floor.floor);
    const worldNode = topologyWorldKey(floor.world);
    addNode(graph, floorNode, "floor");
    addNode(graph, worldNode, "world");
    addEdge(graph, building, floorNode, "owns-floor");
    addEdge(graph, floorNode, worldNode, "owns-world");
  }
  for (const portal of topology.portals) {
    const portalNode = portalGraphKey(portal);
    const ownerFloor = floorKey(portal.ownerFloor);
    addNode(graph, portalNode, "portal");
    addEdge(graph, ownerFloor, portalNode, "owns-portal");
    for (const endpoint of [portal.endpoint, portal.landing]) {
      if (!endpoint) continue;
      const endpointNode = endpointGraphKey(endpoint.id, endpoint.version);
      addNode(graph, endpointNode, "portal-endpoint");
      addEdge(graph, portalNode, endpointNode, "has-endpoint");
    }
  }
}

export function buildReferenceGraph(
  plan: ScenePlanDocument,
  topology: BuildingTopologyDocument,
  rooms: readonly RoomTemplateDocument[],
): ReferenceGraph {
  const graph: GraphState = { nodes: new Map(), edges: new Map() };
  const scene = `scene:${plan.scene.id}@${plan.scene.version}`;
  const building = commonReferenceKey(plan.building) ?? "building:invalid@0";
  addNode(graph, scene, "scene");
  addNode(graph, building, "building");
  addEdge(graph, scene, building, "targets-building");
  addTopologyGraph(graph, topology);
  for (const floorPlan of plan.floorPlans) {
    const floor = floorKey(floorPlan.floor);
    const room = roomKey(floorPlan.room);
    addNode(graph, room, "room");
    addEdge(graph, floor, room, "contains-room");
  }
  for (const room of rooms) {
    const roomNode = roomKey(room.room);
    addNode(graph, roomNode, "room");
    for (const group of room.facilityGroups) {
      for (const facility of group.facilities) {
        const facilityNode = `facility:${facility.id}`;
        addNode(graph, facilityNode, "facility");
        addEdge(graph, roomNode, facilityNode, "contains-facility");
      }
    }
    for (const actor of room.actorSlots) {
      const actorNode = `actor-slot:${actor.id}`;
      addNode(graph, actorNode, "actor-slot");
      addEdge(graph, roomNode, actorNode, "declares-actor-slot");
    }
  }
  for (const core of plan.reservedCores) {
    const coreNode = `reserved-core:${core.id}`;
    const floor = floorKey(core.floor);
    addNode(graph, coreNode, "reserved-core");
    addEdge(graph, floor, coreNode, "reserves-core");
  }
  return {
    nodes: [...graph.nodes.values()].sort((left, right) => compareStrings(left.key, right.key)),
    edges: [...graph.edges.values()].sort((left, right) => (
      compareStrings(left.from, right.from)
      || compareStrings(left.relation, right.relation)
      || compareStrings(left.to, right.to)
    )),
  };
}

export function floorInBounds(position: FloorLocalCellPosition, floor: FloorTopologyDocument): boolean {
  return floorKey(position.floor) === floorKey(floor.floor)
    && position.coordinate.x >= 0
    && position.coordinate.y >= 0
    && position.coordinate.x < floor.bounds.width
    && position.coordinate.y < floor.bounds.depth
    && position.coordinate.elevation >= 0
    && position.coordinate.elevation <= floor.bounds.maxElevation;
}

export function sourceHash(plan: ScenePlanDocument, dependencies: SceneCompilerDependencies): string {
  return canonicalHashHex({
    domain: "office-v2:scene-plan",
    domainVersion: "office-scene-plan-v1",
    payload: asJson({ plan, topology: dependencies.topology, roomTemplates: dependencies.roomTemplates }),
  });
}

function reportDiagnostics(diagnostics: readonly SceneCompilerDiagnostic[]): CompilationDiagnostic[] {
  return diagnostics.map((entry) => ({
    code: entry.code,
    owner: entry.owner,
    version: 1,
    message: entry.message,
    relatedKeys: entry.relatedKeys,
    ...(entry.pointer === undefined ? {} : { pointer: entry.pointer }),
  }));
}

export function makeReport(
  status: "accepted" | "rejected",
  sourcePlanHashValue: string,
  canonicalWorldHashValue: string,
  graph: ReferenceGraph,
  diagnostics: readonly SceneCompilerDiagnostic[],
): CompilationDiagnosticReport {
  return {
    schemaVersion: "office-compilation-report-v1",
    compilerVersion: "office-scene-compiler-v1",
    status,
    sourcePlanHash: sourcePlanHashValue,
    canonicalWorldHash: canonicalWorldHashValue,
    referenceGraph: graph,
    diagnostics: reportDiagnostics(diagnostics),
  };
}

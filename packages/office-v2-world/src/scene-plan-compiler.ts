import type {
  BuildingReference,
  FloorLocalCellPosition,
  FloorReference,
  JsonValue,
  RoomReference,
} from "@affiliate-ops/office-v2-contracts";
import {
  canonicalHashHex,
  canonicalJson,
} from "@affiliate-ops/office-v2-contracts";
import type {
  CompilationDiagnostic,
  ReferenceGraph,
} from "@affiliate-ops/office-v2-contracts";
import type { RoomTemplateDocument } from "@affiliate-ops/office-v2-contracts";
import type {
  BuildingTopologyDocument,
  FloorTopologyDocument,
  VersionedSlugReference,
} from "./building-topology-validation.ts";
import { validateBuildingTopology } from "./building-topology-validation.ts";
import { validateRoomTemplate } from "./room-template-validation.ts";
import {
  asJson,
  buildReferenceGraph,
  commonReferenceKey,
  coordinateKey,
  detectIndexDerivedIds,
  diagnostic,
  floorInBounds,
  floorKey,
  isRecord,
  makeReport,
  normalizeDependencies,
  normalizePlan,
  sortDiagnostics,
  sourceHash,
} from "./scene-plan-compiler-support.ts";
import { compileWorld, hasSiteOccupancyLeak } from "./scene-plan-compiler-world.ts";

export const SCENE_COMPILER_VERSION = "office-scene-compiler-v1";
export const SCENE_PLAN_VERSION = "office-scene-plan-v1";
export const WORLD_V2_VERSION = "office-world-v2-v1";
export const COMPILED_BUILDING_VERSION = "office-compiled-building-v1";
export const COMPILATION_REPORT_VERSION = "office-compilation-report-v1";

export interface SceneReference {
  readonly id: string;
  readonly version: number;
}

export interface SceneFloorPlan {
  readonly floor: FloorReference;
  readonly room: RoomReference;
}

export interface SceneReservedCore {
  readonly id: string;
  readonly kind: "stair" | "lift";
  readonly floor: FloorReference;
  readonly cells: readonly FloorLocalCellPosition[];
}

export interface SceneCollectionDeclaration {
  readonly pointer: "/floorPlans" | "/reservedCores";
  readonly order: "unordered";
  readonly keyField: "floor.id.value" | "room.id.value" | "id";
}

export interface ScenePlanDocument {
  readonly schemaVersion: typeof SCENE_PLAN_VERSION;
  readonly scene: SceneReference;
  readonly building: BuildingReference;
  readonly floorPlans: readonly SceneFloorPlan[];
  readonly reservedCores: readonly SceneReservedCore[];
  readonly collectionDeclarations: readonly SceneCollectionDeclaration[];
  readonly semanticVariant: "ground-floor-office-v1";
  readonly compositionProfile: "operations" | "review";
}

export type SceneCompilerDiagnosticCode =
  | "contract.scene-plan-invalid"
  | "contract.v1-world-rejected"
  | "contract.reference-unresolved"
  | "contract.reference-duplicate"
  | "contract.array-index-derived-id"
  | "contract.collection-normalization-failed"
  | "world.semantic-variant-unsupported"
  | "world.site-occupancy-leak"
  | "world.topology-invalid"
  | "world.room-invalid"
  | "world.floor-mismatch"
  | "world.core-out-of-bounds"
  | "world.core-occupied";

export interface SceneCompilerDiagnostic {
  readonly code: SceneCompilerDiagnosticCode;
  readonly owner: "contract" | "world";
  readonly version: 1;
  readonly message: string;
  readonly pointer?: string;
  readonly relatedKeys: readonly string[];
}

export interface SceneCompilerDependencies {
  readonly topology: BuildingTopologyDocument;
  readonly roomTemplates: readonly RoomTemplateDocument[];
}

export interface WorldV2Document {
  readonly schemaVersion: typeof WORLD_V2_VERSION;
  readonly building: BuildingReference;
  readonly floor: FloorReference;
  readonly world: VersionedSlugReference;
  readonly bounds: Readonly<{ width: number; depth: number; maxElevation: number }>;
  readonly compositionProfile: "operations" | "review";
  readonly rooms: readonly RoomReference[];
  readonly actorCapacity: Readonly<{ assigned: number; reserved: number; maximum: number }>;
  readonly actorSlots: readonly Record<string, unknown>[];
  readonly entities: readonly Record<string, unknown>[];
  readonly reservedCores: readonly Record<string, unknown>[];
  readonly portals: readonly Record<string, unknown>[];
}

export interface CompiledBuildingDocument {
  readonly schemaVersion: typeof COMPILED_BUILDING_VERSION;
  readonly building: BuildingReference;
  readonly sourcePlan: SceneReference;
  readonly siteEnvelope: BuildingTopologyDocument["siteEnvelope"];
  readonly floors: readonly Readonly<{ floor: FloorReference; world: WorldV2Document; worldHash: string }>[];
}

export interface CompilationDiagnosticReport {
  readonly schemaVersion: typeof COMPILATION_REPORT_VERSION;
  readonly compilerVersion: typeof SCENE_COMPILER_VERSION;
  readonly status: "accepted" | "rejected";
  readonly sourcePlanHash: string;
  readonly canonicalWorldHash: string;
  readonly referenceGraph: ReferenceGraph;
  readonly diagnostics: readonly CompilationDiagnostic[];
}

export interface SceneCompilationResult {
  readonly ok: boolean;
  readonly sourcePlanHash: string;
  readonly canonicalWorldHash: string;
  readonly compiledBuilding?: CompiledBuildingDocument;
  readonly report: CompilationDiagnosticReport;
  readonly diagnostics: readonly SceneCompilerDiagnostic[];
}

function asReportHashPayload(value: unknown): JsonValue {
  return value as JsonValue;
}

function compileUnknown(document: unknown, dependencies: SceneCompilerDependencies): SceneCompilationResult {
  const diagnostics: SceneCompilerDiagnostic[] = [];
  if (!isRecord(document)) {
    diagnostics.push(diagnostic("contract.scene-plan-invalid", "Scene compiler input must be an object."));
  }
  if (isRecord(document) && (document.schemaVersion === "office-world-v1" || Object.hasOwn(document, "worldId"))) {
    diagnostics.push(diagnostic(
      "contract.v1-world-rejected",
      "The V1 world shape is historical evidence and is not accepted as V2 scene input.",
      { pointer: "/schemaVersion" },
    ));
  }
  if (diagnostics.length > 0) {
    const source = canonicalHashHex({ domain: "office-v2:scene-plan", domainVersion: SCENE_PLAN_VERSION, payload: asJson(document ?? null) });
    const graph: ReferenceGraph = { nodes: [], edges: [] };
    const sorted = sortDiagnostics(diagnostics);
    return {
      ok: false,
      sourcePlanHash: source,
      canonicalWorldHash: "0".repeat(64),
      report: makeReport("rejected", source, "0".repeat(64), graph, sorted),
      diagnostics: sorted,
    };
  }
  const plan = document as unknown as ScenePlanDocument;
  if (plan.schemaVersion !== SCENE_PLAN_VERSION || !isRecord(plan.scene) || !isRecord(plan.building)) {
    diagnostics.push(diagnostic("contract.scene-plan-invalid", "Scene plan schema version or identity is invalid.", { pointer: "/schemaVersion" }));
  }
  if (hasSiteOccupancyLeak(document)) {
    diagnostics.push(diagnostic(
      "world.site-occupancy-leak",
      "Presentation-only site context cannot be authored as floor occupancy.",
      { pointer: "/siteOccupancy" },
    ));
  }
  detectIndexDerivedIds(document, "", diagnostics);
  if (plan.semanticVariant !== "ground-floor-office-v1") {
    diagnostics.push(diagnostic(
      "world.semantic-variant-unsupported",
      "The scene compiler only admits the bounded ground-floor semantic variant.",
      { pointer: "/semanticVariant", relatedKeys: [String(plan.semanticVariant)] },
    ));
  }
  let normalizedPlan = plan;
  try {
    normalizedPlan = normalizePlan(plan);
  } catch (error) {
    diagnostics.push(diagnostic(
      "contract.collection-normalization-failed",
      "Declared scene collections could not be normalized.",
      { pointer: "/collectionDeclarations", relatedKeys: [error instanceof Error ? error.message : String(error)] },
    ));
  }
  const normalizedDependencies = normalizeDependencies(dependencies);
  const graph = buildReferenceGraph(normalizedPlan, normalizedDependencies.topology, normalizedDependencies.roomTemplates);
  const topologyResult = validateBuildingTopology(normalizedDependencies.topology);
  if (!topologyResult.ok) {
    diagnostics.push(diagnostic(
      "world.topology-invalid",
      "Building topology must validate before scene compilation.",
      { pointer: "/topology", relatedKeys: topologyResult.diagnostics.map(({ code }) => code) },
    ));
  }
  const expectedBuilding = commonReferenceKey(normalizedPlan.building);
  const actualBuilding = commonReferenceKey(normalizedDependencies.topology.building);
  if (expectedBuilding === null || actualBuilding === null || expectedBuilding !== actualBuilding) {
    diagnostics.push(diagnostic(
      "contract.reference-unresolved",
      "Scene plan building reference does not resolve to the topology building.",
      { pointer: "/building", relatedKeys: [expectedBuilding ?? "invalid", actualBuilding ?? "invalid"] },
    ));
  }
  const floors = new Map(normalizedDependencies.topology.floors.map((entry) => [floorKey(entry.floor), entry]));
  const rooms = new Map(normalizedDependencies.roomTemplates.map((entry) => [commonReferenceKey(entry.room) ?? "room:invalid@0", entry]));
  const seenFloors = new Set<string>();
  const selectedRooms: RoomTemplateDocument[] = [];
  const selectedFloors: Array<{ floor: FloorTopologyDocument; room: RoomTemplateDocument }> = [];
  for (const [index, floorPlan] of (normalizedPlan.floorPlans ?? []).entries()) {
    const selectedFloor = floors.get(floorKey(floorPlan.floor));
    const selectedRoom = rooms.get(commonReferenceKey(floorPlan.room) ?? "room:invalid@0");
    if (!selectedFloor || !selectedRoom) {
      diagnostics.push(diagnostic(
        "contract.reference-unresolved",
        "Scene floor plan contains a floor or room reference that is not declared.",
        { pointer: `/floorPlans/${index}`, relatedKeys: [floorKey(floorPlan.floor), commonReferenceKey(floorPlan.room) ?? "room:invalid@0"] },
      ));
      continue;
    }
    if (seenFloors.has(floorKey(floorPlan.floor))) {
      diagnostics.push(diagnostic(
        "contract.reference-duplicate",
        "A scene plan cannot compile one floor more than once.",
        { pointer: `/floorPlans/${index}/floor`, relatedKeys: [floorKey(floorPlan.floor)] },
      ));
    }
    seenFloors.add(floorKey(floorPlan.floor));
    if (floorKey(selectedRoom.floor) !== floorKey(selectedFloor.floor)) {
      diagnostics.push(diagnostic(
        "world.floor-mismatch",
        "A room template must belong to the floor selected by the scene plan.",
        { pointer: `/floorPlans/${index}/room`, relatedKeys: [commonReferenceKey(selectedRoom.room) ?? "room:invalid@0", floorKey(selectedFloor.floor)] },
      ));
    }
    const roomResult = validateRoomTemplate(selectedRoom);
    if (!roomResult.ok) {
      diagnostics.push(diagnostic(
        "world.room-invalid",
        "A room template must pass its pure capacity and circulation validator.",
        { pointer: `/floorPlans/${index}/room`, relatedKeys: roomResult.diagnostics.map(({ code }) => code) },
      ));
    }
    selectedRooms.push(selectedRoom);
    selectedFloors.push({ floor: selectedFloor, room: selectedRoom });
  }
  const coreIds = new Set<string>();
  const coresByFloor = new Map<string, SceneReservedCore[]>();
  for (const [index, core] of (normalizedPlan.reservedCores ?? []).entries()) {
    if (coreIds.has(core.id)) {
      diagnostics.push(diagnostic("contract.reference-duplicate", "Reserved core IDs must be unique.", { pointer: `/reservedCores/${index}/id`, relatedKeys: [core.id] }));
    }
    coreIds.add(core.id);
    const floor = floors.get(floorKey(core.floor));
    if (!floor) {
      diagnostics.push(diagnostic("contract.reference-unresolved", "Reserved core floor reference is not declared.", { pointer: `/reservedCores/${index}/floor`, relatedKeys: [floorKey(core.floor)] }));
      continue;
    }
    for (const [cellIndex, cell] of core.cells.entries()) {
      if (!floorInBounds(cell, floor)) {
        diagnostics.push(diagnostic("world.core-out-of-bounds", "Reserved core cells must remain inside the floor-local bounds.", { pointer: `/reservedCores/${index}/cells/${cellIndex}`, relatedKeys: [core.id] }));
      }
    }
    const existing = coresByFloor.get(floorKey(core.floor)) ?? [];
    existing.push(core);
    coresByFloor.set(floorKey(core.floor), existing);
  }
  const occupiedByFloor = new Map<string, Set<string>>();
  for (const entry of selectedFloors) {
    const occupied = occupiedByFloor.get(floorKey(entry.floor.floor)) ?? new Set<string>();
    for (const group of entry.room.facilityGroups) {
      for (const facility of group.facilities) {
        for (const cell of facility.placementSlot.occupiedCells) occupied.add(coordinateKey(cell));
      }
    }
    occupiedByFloor.set(floorKey(entry.floor.floor), occupied);
  }
  for (const [floor, cores] of coresByFloor) {
    const occupied = occupiedByFloor.get(floor) ?? new Set<string>();
    for (const core of cores) {
      for (const cell of core.cells) {
        if (occupied.has(coordinateKey(cell))) {
          diagnostics.push(diagnostic("world.core-occupied", "A reserved core cannot overlap a facility occupancy cell.", { pointer: `/reservedCores/${core.id}/cells`, relatedKeys: [core.id, coordinateKey(cell)] }));
        }
      }
    }
  }
  const source = sourceHash(normalizedPlan, normalizedDependencies);
  const sorted = sortDiagnostics(diagnostics);
  if (sorted.length > 0) {
    return {
      ok: false,
      sourcePlanHash: source,
      canonicalWorldHash: "0".repeat(64),
      report: makeReport("rejected", source, "0".repeat(64), graph, sorted),
      diagnostics: sorted,
    };
  }
  const floorsOutput = selectedFloors.map(({ floor, room }) => {
    const world = compileWorld(
      normalizedPlan,
      normalizedDependencies.topology,
      room,
      floor,
      coresByFloor.get(floorKey(floor.floor)) ?? [],
    );
    const worldHash = canonicalHashHex({ domain: "office-v2:world", domainVersion: WORLD_V2_VERSION, payload: asReportHashPayload(world) });
    return { floor: floor.floor, world, worldHash };
  });
  const compiled = {
    schemaVersion: COMPILED_BUILDING_VERSION,
    building: normalizedPlan.building,
    sourcePlan: normalizedPlan.scene,
    siteEnvelope: normalizedDependencies.topology.siteEnvelope,
    floors: floorsOutput,
  } as unknown as CompiledBuildingDocument;
  const canonicalWorld = canonicalHashHex({ domain: "office-v2:compiled-building", domainVersion: COMPILED_BUILDING_VERSION, payload: asReportHashPayload(compiled) });
  const report = makeReport("accepted", source, canonicalWorld, graph, []);
  return {
    ok: true,
    sourcePlanHash: source,
    canonicalWorldHash: canonicalWorld,
    compiledBuilding: compiled,
    report,
    diagnostics: [],
  };
}

/** Compile a scene plan into deterministic floor-local V2 worlds and a report. */
export function compileScenePlan(document: unknown, dependencies: SceneCompilerDependencies): SceneCompilationResult {
  return compileUnknown(document, dependencies);
}

/** Expose the report as canonical bytes for clean-directory evidence. */
export function compilationReportCanonicalJson(result: SceneCompilationResult): string {
  return canonicalJson(asJson(result.report));
}

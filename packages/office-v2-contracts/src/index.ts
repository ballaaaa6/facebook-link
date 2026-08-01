export * from "./generated/common-v2.ts";
export * from "./generated/definition-bundle.ts";
export * from "./generated/entity-definition-v2.ts";
export * from "./generated/entity-instance.ts";
export * from "./generated/geometry.ts";
export * from "./canonical-json.ts";
export * from "./canonical-hash.ts";
export type {
  ActorSlot,
  AdjacencyConstraint,
  Aisle,
  Capacity,
  Circulation,
  DecorationSlot,
  DensityBand,
  Entrance,
  FacilityGroup,
  FacilitySlot,
  FloorCell,
  FocalPoint,
  NonNegativeInteger,
  PlacementSlot,
  PositiveInteger,
  PropSlot,
  Region,
  RoomBounds,
  RoomTemplateDocument,
} from "./generated/room-template.ts";
export type {
  Bounds as BuildingTopologyBounds,
  BuildingReference as BuildingTopologyReference,
  EndpointReference,
  Floor as BuildingTopologyFloor,
  FloorReference as BuildingTopologyFloorReference,
  Portal as BuildingTopologyPortal,
  SiteCell,
  SiteContextCell,
  SiteEnvelope,
  SiteReference,
  WorldReference as BuildingTopologyWorldReference,
} from "./generated/building.ts";
export type {
  CollectionDeclaration as SceneCollectionDeclaration,
  FloorPlan as SceneFloorPlan,
  ReservedCore as SceneReservedCore,
  SceneReference as ScenePlanReference,
} from "./generated/scene-plan.ts";
export type {
  ActorCapacity as WorldActorCapacity,
  ActorSlot as WorldActorSlot,
  Bounds as WorldBounds,
  PortalReference as WorldPortalReference,
  ReservedCore as WorldReservedCore,
  WorldEntity,
  WorldReference,
  WorldDocument as GeneratedWorldV2Document,
} from "./generated/world-v2.ts";
export type {
  CompiledFloor,
} from "./generated/compiled-building.ts";
export type {
  Diagnostic as CompilationDiagnostic,
  ReferenceEdge,
  ReferenceGraph,
  ReferenceNode,
} from "./generated/compilation-report.ts";

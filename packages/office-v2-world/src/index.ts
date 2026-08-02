export {
  SUBCELL_UNITS_PER_CELL,
  cellOriginToSubCell,
  screenFacingToWorldFacing,
  splitSubCellPosition,
  worldFacingToScreenFacing,
} from "./coordinate-semantics.ts";
export type { SubCellDecomposition, SubCellOffset } from "./coordinate-semantics.ts";
export {
  validateDefinitionBundle,
  validateRenderPartDependencies,
} from "./reference-closure.ts";
export type {
  ReferenceClosureResult,
  ReferenceGraphEdge,
  ReferenceGraphNode,
  RenderPartDependency,
  WorldReferenceDiagnostic,
  WorldReferenceDiagnosticCode,
} from "./reference-closure.ts";
export {
  geometryFingerprint,
  inverseWorldOrientation,
  rotateDefinitionLocalCell,
  rotateDefinitionLocalSubCell,
  transformGeometry,
  validateGeometry,
  validateGeometryAgreement,
} from "./geometry-validation.ts";
export type {
  DerivedGeometryProjection,
  GeometryValidationResult,
  TransformedGeometry,
} from "./geometry-validation.ts";
export { floorLocalCoordinateKey, validateBuildingTopology } from "./building-topology-validation.ts";
export type {
  BuildingMigrationDocument,
  BuildingTopologyDiagnostic,
  BuildingTopologyDiagnosticCode,
  BuildingTopologyDocument,
  BuildingTopologyResult,
  FloorTopologyDocument,
  PortalDocument,
  PortalEndpointDocument,
  SiteCell,
  SiteEnvelopeDocument,
  TopologyBounds,
  VersionedSlugReference,
} from "./building-topology-validation.ts";
export {
  deriveRoomNavigation,
  roomTemplateFingerprint,
  validateRoomTemplate,
} from "./room-template-validation.ts";
export type {
  RoomNavigationProjection,
  RoomTemplateDiagnostic,
  RoomTemplateDiagnosticCode,
  RoomTemplateValidationResult,
} from "./room-template-validation.ts";
export {
  COMPILED_BUILDING_VERSION,
  COMPILATION_REPORT_VERSION,
  SCENE_COMPILER_VERSION,
  SCENE_PLAN_VERSION,
  WORLD_V2_VERSION,
  compileScenePlan,
  compilationReportCanonicalJson,
} from "./scene-plan-compiler.ts";
export type {
  CompilationDiagnosticReport,
  SceneCollectionDeclaration,
  SceneCompilerDependencies,
  SceneCompilerDiagnostic,
  SceneCompilerDiagnosticCode,
  SceneCompilationResult,
  SceneFloorPlan,
  ScenePlanDocument,
  SceneReference,
  SceneReservedCore,
  WorldV2Document,
  CompiledBuildingDocument,
} from "./scene-plan-compiler.ts";

export {
  ELEVATION_HEIGHT_PX,
  HALF_TILE_HEIGHT_PX,
  HALF_TILE_WIDTH_PX,
  OFFICE_PROJECTION_ID,
  OFFICE_PROJECTION_V1,
  TILE_HEIGHT_PX,
  TILE_WIDTH_PX,
  ProjectionError,
  project,
  projectGround,
  projectGroundContact,
  unproject,
  unprojectGround,
} from "./projection.ts";
export type {
  FloorLocalCoordinate,
  ProjectedGroundContact,
  ProjectedPosition,
  ProjectionBounds,
  ProjectionDiagnosticCode,
  ProjectionOptions,
  ProjectionOrigin,
} from "./projection.ts";
export {
  PLACEMENT_SNAPSHOT_VERSION,
  applyPlacement,
  createEmptyPlacementSnapshot,
  createEmptyWorldSnapshot,
  derivePlacementGeometry,
  placeEntity,
  placeIntoSnapshot,
} from "./placement.ts";
export type {
  GeometryAuthorityInput,
  OccupancyCell,
  OccupancyIndex,
  PlacementAccepted,
  PlacementAnchor,
  PlacementBounds,
  PlacementCell,
  PlacementContext,
  PlacementDiagnostic,
  PlacementDiagnosticCode,
  PlacementFloor,
  PlacementGeometryResult,
  PlacementNavigationImpact,
  PlacementNavigationPolicy,
  PlacementRequest,
  PlacementRejected,
  PlacementResult,
  PlacementSemanticKind,
  PlacementSnapshot,
  PlacementSurfaceCell,
  PlacementSurfacePolicy,
  PlacedEntityIdentity,
  PlacedEntitySnapshot,
  ResolvedPlacementGeometry,
  ResolvedSocket,
  ResolvedUseSlot,
  VersionedGeometryAuthority,
} from "./placement.ts";
export {
  DEPTH_ORDERING_VERSION,
  depthSortKey,
  orderDepthRecords,
  sortDepthOrder,
  sortDepthRecords,
  validateDepthOrdering,
} from "./depth-ordering.ts";
export type {
  DepthBand,
  DepthDiagnostic,
  DepthDiagnosticCode,
  DepthOrderingResult,
  DepthSortKey,
  DepthStructuralRecord,
  NormalizedDepthRecord,
  ProjectedGroundContactPixels,
} from "./depth-ordering.ts";
export {
  WORLD_KERNEL_DOMAIN,
  WORLD_KERNEL_VERSION,
  TOPOLOGY_KERNEL_VERSION,
  canonicalWorld,
  canonicalWorldKernel,
  canonicalizeWorldKernel,
  normalizeBuildingTopology,
  normalizeStructuralEdge,
  normalizeStructuralEdges,
  normalizeTopology,
  structuralEdgeIdentity,
  validateWorldKernelEnvelope,
} from "./topology-kernel.ts";
export type {
  CanonicalWorldKernelResult,
  NormalizedStructuralEdge,
  StructuralEdgeDirection,
  StructuralEdgeInput,
  StructuralEdgesNormalizationResult,
  StructuralEdgeNormalizationResult,
  TopologyCollectionDeclaration,
  TopologyKernelDiagnostic,
  TopologyKernelDocument,
  TopologyNormalizationResult,
  WorldKernelBounds,
  WorldKernelDiagnostic,
  WorldKernelDiagnosticCode,
  WorldKernelEnvelope,
  WorldKernelValidationOptions,
  WorldKernelValidationResult,
} from "./topology-kernel.ts";

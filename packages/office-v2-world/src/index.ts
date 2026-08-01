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

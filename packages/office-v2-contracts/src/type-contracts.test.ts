import type {
  BuildingId,
  BuildingReference,
  CellPosition,
  Coordinate,
  DefinitionLocalPixelPosition,
  DefinitionLocalCellOffset,
  DefinitionLocalSubCellOffset,
  DefinitionBundleReference,
  EntityDefinitionId,
  EntityInstanceId,
  EntityInstanceReference,
  FloorId,
  FloorReference,
  GeometryId,
  GeometryReference,
  ScreenPixelPosition,
  SpritePixelPosition,
  SocketId,
  SubCellPosition,
  UseSlotId,
  UseSlotReference,
} from "./index.ts";

declare const buildingId: BuildingId;
declare const floorId: FloorId;
declare const entityDefinitionId: EntityDefinitionId;
declare const entityInstanceId: EntityInstanceId;
declare const buildingReference: BuildingReference;
declare const floorReference: FloorReference;
declare const entityInstanceReference: EntityInstanceReference;
declare const definitionBundleReference: DefinitionBundleReference;
declare const geometryId: GeometryId;
declare const geometryReference: GeometryReference;
declare const useSlotId: UseSlotId;
declare const useSlotReference: UseSlotReference;
declare const socketId: SocketId;
declare const cellPosition: CellPosition;
declare const subCellPosition: SubCellPosition;
declare const definitionLocalCellOffset: DefinitionLocalCellOffset;
declare const definitionLocalSubCellOffset: DefinitionLocalSubCellOffset;
declare const definitionLocalPixelPosition: DefinitionLocalPixelPosition;
declare const spritePixelPosition: SpritePixelPosition;
declare const screenPixelPosition: ScreenPixelPosition;

const buildingIdRoundTrip: BuildingId = buildingId;
const floorIdRoundTrip: FloorId = floorId;
const entityDefinitionIdRoundTrip: EntityDefinitionId = entityDefinitionId;
const entityInstanceIdRoundTrip: EntityInstanceId = entityInstanceId;
const buildingReferenceRoundTrip: BuildingReference = buildingReference;
const floorReferenceRoundTrip: FloorReference = floorReference;
const entityInstanceReferenceRoundTrip: EntityInstanceReference = entityInstanceReference;
const definitionBundleReferenceRoundTrip: DefinitionBundleReference = definitionBundleReference;
const geometryIdRoundTrip: GeometryId = geometryId;
const geometryReferenceRoundTrip: GeometryReference = geometryReference;
const useSlotIdRoundTrip: UseSlotId = useSlotId;
const useSlotReferenceRoundTrip: UseSlotReference = useSlotReference;
const socketIdRoundTrip: SocketId = socketId;
const coordinateUnion: readonly Coordinate[] = [
  cellPosition,
  subCellPosition,
  definitionLocalCellOffset,
  definitionLocalSubCellOffset,
  definitionLocalPixelPosition,
  spritePixelPosition,
  screenPixelPosition,
];

// @ts-expect-error Identity namespaces are intentionally not interchangeable.
const buildingAsFloor: FloorId = buildingId;
// @ts-expect-error Entity definition and instance identities are intentionally distinct.
const entityDefinitionAsInstance: EntityInstanceId = entityDefinitionId;
// @ts-expect-error Reference namespaces are intentionally not interchangeable.
const buildingReferenceAsFloor: FloorReference = buildingReference;
// @ts-expect-error Cell and sub-cell coordinates are intentionally distinct.
const cellAsSubCell: SubCellPosition = cellPosition;
// @ts-expect-error Definition-local pixels are not sprite pixels.
const definitionPixelsAsSprite: SpritePixelPosition = definitionLocalPixelPosition;
// @ts-expect-error Sprite pixels are not screen pixels.
const spritePixelsAsScreen: ScreenPixelPosition = spritePixelPosition;
// @ts-expect-error Geometry and entity-definition namespaces are intentionally distinct.
const geometryAsEntityDefinition: EntityDefinitionId = geometryId;
// @ts-expect-error Geometry references cannot be used as definition-bundle references.
const geometryAsBundle: DefinitionBundleReference = geometryReference;
// @ts-expect-error Cell and definition-local sub-cell offsets are distinct spaces.
const definitionCellAsSubCell: DefinitionLocalSubCellOffset = definitionLocalCellOffset;

void buildingIdRoundTrip;
void floorIdRoundTrip;
void entityDefinitionIdRoundTrip;
void entityInstanceIdRoundTrip;
void buildingReferenceRoundTrip;
void floorReferenceRoundTrip;
void entityInstanceReferenceRoundTrip;
void definitionBundleReferenceRoundTrip;
void geometryIdRoundTrip;
void geometryReferenceRoundTrip;
void useSlotIdRoundTrip;
void useSlotReferenceRoundTrip;
void socketIdRoundTrip;
void coordinateUnion;

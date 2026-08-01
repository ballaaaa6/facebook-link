import type {
  BuildingId,
  BuildingReference,
  CellPosition,
  Coordinate,
  DefinitionLocalPixelPosition,
  EntityDefinitionId,
  EntityInstanceId,
  EntityInstanceReference,
  FloorId,
  FloorReference,
  ScreenPixelPosition,
  SpritePixelPosition,
  SubCellPosition,
} from "./index.ts";

declare const buildingId: BuildingId;
declare const floorId: FloorId;
declare const entityDefinitionId: EntityDefinitionId;
declare const entityInstanceId: EntityInstanceId;
declare const buildingReference: BuildingReference;
declare const floorReference: FloorReference;
declare const entityInstanceReference: EntityInstanceReference;
declare const cellPosition: CellPosition;
declare const subCellPosition: SubCellPosition;
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
const coordinateUnion: readonly Coordinate[] = [
  cellPosition,
  subCellPosition,
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

void buildingIdRoundTrip;
void floorIdRoundTrip;
void entityDefinitionIdRoundTrip;
void entityInstanceIdRoundTrip;
void buildingReferenceRoundTrip;
void floorReferenceRoundTrip;
void entityInstanceReferenceRoundTrip;
void coordinateUnion;

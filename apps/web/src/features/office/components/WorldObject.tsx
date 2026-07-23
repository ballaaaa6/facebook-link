import { officeAssetRegistry, type OfficeAnchor, type OfficeLayer } from "./officeAssetRegistry";

export interface OfficeMapObject {
  id: string;
  asset: string;
  x?: number;
  y?: number;
  parentId?: string;
  slot?: string;
  layer: OfficeLayer;
  anchor: OfficeAnchor;
}

export interface ResolvedOfficeObject extends OfficeMapObject {
  x: number;
  y: number;
}

const layerOffset: Record<OfficeLayer, number> = { wall: 0, furniture: 0, equipment: 6, decor: 8 };

export function WorldObject({ object, worldWidth, percentX, percentY, className = "" }: { object: ResolvedOfficeObject; worldWidth: number; percentX: (value: number) => string; percentY: (value: number) => string; className?: string }) {
  const asset = officeAssetRegistry[object.asset];
  if (!asset) return null;

  const anchor = object.anchor ?? asset.anchor;
  const surfaceObject = asset.support === "desk-surface" || asset.support === "table-surface";
  const zIndex = object.layer === "wall"
    ? 40
    : 100 + Math.round(object.y * 20) + layerOffset[object.layer] + (surfaceObject ? 6 : 0);
  return (
    <img
      className={`world-object world-object-${anchor} world-layer-${object.layer} world-support-${asset.support} ${className}`.trim()}
      src={asset.file}
      alt=""
      aria-hidden="true"
      style={{
        left: percentX(object.x),
        top: percentY(object.y),
        width: `${(asset.widthTiles / worldWidth) * 100}%`,
        zIndex,
      }}
    />
  );
}

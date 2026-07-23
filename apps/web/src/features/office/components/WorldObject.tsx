import { officeAssetRegistry, type OfficeAnchor, type OfficeLayer } from "./officeAssetRegistry";

export interface OfficeMapObject {
  id: string;
  asset: string;
  x: number;
  y: number;
  layer: OfficeLayer;
  anchor: OfficeAnchor;
}

const layerDepth: Record<OfficeLayer, number> = {
  wall: 40,
  furniture: 220,
  equipment: 380,
  decor: 440,
};

export function WorldObject({ object, worldWidth, percentX, percentY, className = "" }: { object: OfficeMapObject; worldWidth: number; percentX: (value: number) => string; percentY: (value: number) => string; className?: string }) {
  const asset = officeAssetRegistry[object.asset];
  if (!asset) return null;

  const anchor = object.anchor ?? asset.anchor;
  return (
    <img
      className={`world-object world-object-${anchor} world-layer-${object.layer} ${className}`.trim()}
      src={asset.file}
      alt=""
      aria-hidden="true"
      style={{
        left: percentX(object.x),
        top: percentY(object.y),
        width: `${(asset.widthTiles / worldWidth) * 100}%`,
        zIndex: layerDepth[object.layer] + Math.round(object.y * 10),
      }}
    />
  );
}

import type { ResolvedOfficeObject } from "../layout/officeLayout";
import type { OfficeLayer } from "../officeTypes";
import { officeAssetRegistry } from "./officeAssetRegistry";

const layerOffset: Record<OfficeLayer, number> = { wall: 0, furniture: 0, equipment: 6, decor: 8 };

export function WorldObject({ object, worldWidth, percentX, percentY, className = "" }: { object: ResolvedOfficeObject; worldWidth: number; percentX: (value: number) => string; percentY: (value: number) => string; className?: string }) {
  const asset = officeAssetRegistry[object.asset];
  if (!asset) return null;

  const anchor = object.anchor ?? asset.anchor;
  const zIndex = object.layer === "wall"
    ? 40
    : 100 + Math.round(object.depthY * 20) + layerOffset[object.layer] + (object.support === "floor" ? 0 : 6);
  return (
    <img
      className={`world-object world-object-${anchor} world-layer-${object.layer} world-support-${object.support} ${className}`.trim()}
      src={asset.file}
      alt=""
      aria-hidden="true"
      style={{
        left: percentX(object.x),
        top: percentY(object.y),
        width: `${(asset.renderWidthTiles / worldWidth) * 100}%`,
        zIndex,
      }}
    />
  );
}

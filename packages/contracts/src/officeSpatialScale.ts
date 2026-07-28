export const officeCharacterScaleStandard = {
  id: "office.character.scale.v1",
  floorFootprint: { width: 1, depth: 1 },
  logicalVolume: { width: 1, depth: 1, height: 3 },
  sourceFramePixels: { width: 96, height: 104 },
  renderEnvelopeTiles: { width: 3, height: 3.25 },
  seatedHipAnchorPixels: { x: 48, y: 72 },
} as const;

export interface OfficeCharacterScaleManifestV1 {
  version: 1;
  id: "office.character.scale.v1";
  status: "owner-approved-current-office-baseline";
  updatedOn: string;
  standard: typeof officeCharacterScaleStandard;
  renderPolicy: {
    visualOverflowAllowed: true;
    clipToFootprint: false;
    collisionUsesFloorFootprintOnly: true;
    depthSortAnchor: "floor-pivot-bottom-center";
    perCharacterScaleOverrides: false;
  };
  runtimeAuthority: {
    file: "apps/web/src/features/office/motion/pixelGeometry.ts";
    function: "pixelAlignedCharacterFrame";
    minimumFrameWidthPixels: 36;
    maximumFrameWidthPixels: 96;
  };
}

export function officeCharacterFrameForTile(tileSize: number, devicePixelRatio = 1) {
  const physicalScale = Math.max(1, devicePixelRatio);
  const targetWidth = Math.max(36, Math.min(96, tileSize * officeCharacterScaleStandard.renderEnvelopeTiles.width));
  const width = (Math.round((targetWidth * physicalScale) / 2) * 2) / physicalScale;
  const height = Math.round(
    width
      * (officeCharacterScaleStandard.sourceFramePixels.height / officeCharacterScaleStandard.sourceFramePixels.width)
      * physicalScale,
  ) / physicalScale;
  return { width, height };
}

export function validateOfficeCharacterScaleManifest(value: unknown): string[] {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return ["characterScale: must be an object"];
  const manifest = value as Record<string, unknown>;
  const issues: string[] = [];
  const exact = (actual: unknown, expected: unknown) => JSON.stringify(actual) === JSON.stringify(expected);
  if (manifest.version !== 1 || manifest.id !== officeCharacterScaleStandard.id) issues.push("characterScale: wrong identity");
  if (manifest.status !== "owner-approved-current-office-baseline") issues.push("characterScale.status: must record owner approval");
  if (!exact(manifest.standard, officeCharacterScaleStandard)) issues.push("characterScale.standard: must equal the current Office 1 x 1 x 3 standard");
  const policy = manifest.renderPolicy as Record<string, unknown> | undefined;
  if (!policy || policy.visualOverflowAllowed !== true || policy.clipToFootprint !== false
    || policy.collisionUsesFloorFootprintOnly !== true || policy.perCharacterScaleOverrides !== false) {
    issues.push("characterScale.renderPolicy: visual overflow must not enlarge the 1 x 1 footprint");
  }
  const authority = manifest.runtimeAuthority as Record<string, unknown> | undefined;
  if (!authority || authority.file !== "apps/web/src/features/office/motion/pixelGeometry.ts"
    || authority.function !== "pixelAlignedCharacterFrame") {
    issues.push("characterScale.runtimeAuthority: must reuse the current Office scale function");
  }
  return issues;
}

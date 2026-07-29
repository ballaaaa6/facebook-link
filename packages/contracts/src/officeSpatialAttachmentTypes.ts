import type { OfficeScreenPoint } from "./officeSpatialProjection.ts";
import type {
  OfficeAttachmentLayerRole,
  OfficePixelPoint,
  OfficeResolvedAttachment,
  OfficeWorldTransform,
} from "./officeSpatialProduction.ts";

export interface OfficeLocalAttachmentRequest {
  parentOrigin: OfficeScreenPoint;
  parentSocket: OfficePixelPoint;
  childSocket: OfficePixelPoint;
  layerRole: OfficeAttachmentLayerRole;
}

export type {
  OfficeAttachmentLayerRole,
  OfficePixelPoint,
  OfficeResolvedAttachment,
  OfficeWorldTransform,
};

import {
  officeAttachmentRenderOrder,
  resolveOfficeAttachment,
  resolveOfficeEntityOrigin,
  type OfficeAttachmentLayerRole,
  type OfficePixelPoint,
  type OfficeWorldTransform,
} from "@affiliate-ops/contracts";

export interface HeldPropAttachmentInput {
  actorTransform: OfficeWorldTransform;
  actorRootSocket: OfficePixelPoint;
  actorHandTargetSocket: OfficePixelPoint;
  propVisualCenterSocket: OfficePixelPoint;
}

export interface HeldPropAttachmentPresentation {
  actorOrigin: { x: number; y: number };
  propOrigin: { x: number; y: number };
  attachmentDelta: { x: number; y: number };
  renderOrder: readonly ["actor-body", "held-prop"];
}

export function resolveHeldPropAttachment({
  actorTransform,
  actorRootSocket,
  actorHandTargetSocket,
  propVisualCenterSocket,
}: HeldPropAttachmentInput): HeldPropAttachmentPresentation {
  const actorOrigin = resolveOfficeEntityOrigin(actorTransform, actorRootSocket);
  const resolved = resolveOfficeAttachment({
    parentOrigin: actorOrigin,
    parentSocket: actorHandTargetSocket,
    childSocket: propVisualCenterSocket,
    layerRole: "front-overlay",
  });
  return {
    actorOrigin,
    propOrigin: resolved.childOrigin,
    attachmentDelta: resolved.attachmentDelta,
    renderOrder: officeAttachmentRenderOrder(
      "front-overlay",
    ) as HeldPropAttachmentPresentation["renderOrder"],
  };
}

export function resolveSocketChildAttachment(input: {
  parentOrigin: { x: number; y: number };
  parentSocket: OfficePixelPoint;
  childSocket: OfficePixelPoint;
  layerRole: OfficeAttachmentLayerRole;
}) {
  return resolveOfficeAttachment(input);
}

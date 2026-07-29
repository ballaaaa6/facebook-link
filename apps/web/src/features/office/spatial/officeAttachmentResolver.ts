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
  actorGripSocket: OfficePixelPoint;
  propGripSocket: OfficePixelPoint;
  foregroundMask: string;
}

export interface HeldPropAttachmentPresentation {
  actorOrigin: { x: number; y: number };
  propOrigin: { x: number; y: number };
  attachmentDelta: { x: number; y: number };
  foregroundMask: string;
  renderOrder: readonly ["actor-body", "held-prop", "hand-foreground"];
}

export function resolveHeldPropAttachment({
  actorTransform,
  actorRootSocket,
  actorGripSocket,
  propGripSocket,
  foregroundMask,
}: HeldPropAttachmentInput): HeldPropAttachmentPresentation {
  if (!foregroundMask) {
    throw new Error("held prop attachment requires a hand foreground mask");
  }
  const actorOrigin = resolveOfficeEntityOrigin(actorTransform, actorRootSocket);
  const resolved = resolveOfficeAttachment({
    parentOrigin: actorOrigin,
    parentSocket: actorGripSocket,
    childSocket: propGripSocket,
    layerRole: "between-actor-and-hand",
  });
  return {
    actorOrigin,
    propOrigin: resolved.childOrigin,
    attachmentDelta: resolved.attachmentDelta,
    foregroundMask,
    renderOrder: officeAttachmentRenderOrder(
      "between-actor-and-hand",
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

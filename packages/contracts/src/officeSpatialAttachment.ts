import {
  projectOfficeWorldPoint,
  type OfficeScreenPoint,
} from "./officeSpatialProjection.ts";
import type {
  OfficeAttachmentLayerRole,
  OfficeLocalAttachmentRequest,
  OfficePixelPoint,
  OfficeResolvedAttachment,
  OfficeWorldTransform,
} from "./officeSpatialAttachmentTypes.ts";

function point(
  value: OfficePixelPoint,
): OfficeScreenPoint {
  return { x: value[0], y: value[1] };
}

function add(
  left: OfficeScreenPoint,
  right: OfficeScreenPoint,
): OfficeScreenPoint {
  return { x: left.x + right.x, y: left.y + right.y };
}

function subtract(
  left: OfficeScreenPoint,
  right: OfficeScreenPoint,
): OfficeScreenPoint {
  return { x: left.x - right.x, y: left.y - right.y };
}

function assertIntegerPoint(value: OfficeScreenPoint, label: string) {
  if (!Number.isInteger(value.x) || !Number.isInteger(value.y)) {
    throw new Error(`${label} must resolve to integer runtime pixels`);
  }
}

export function resolveOfficeEntityOrigin(
  transform: OfficeWorldTransform,
  rootSocket: OfficePixelPoint,
): OfficeScreenPoint {
  const projected = projectOfficeWorldPoint(transform.position);
  const origin = subtract(projected, point(rootSocket));
  assertIntegerPoint(origin, "entity origin");
  return origin;
}

export function resolveOfficeAttachment({
  parentOrigin,
  parentSocket,
  childSocket,
  layerRole,
}: OfficeLocalAttachmentRequest): OfficeResolvedAttachment {
  const parentSocketWorld = add(parentOrigin, point(parentSocket));
  const childOrigin = subtract(parentSocketWorld, point(childSocket));
  const resolvedChildSocket = add(childOrigin, point(childSocket));
  const attachmentDelta = subtract(resolvedChildSocket, parentSocketWorld);
  assertIntegerPoint(parentSocketWorld, "parent socket");
  assertIntegerPoint(childOrigin, "child origin");
  return {
    parentOrigin,
    parentSocketWorld,
    childOrigin,
    attachmentDelta,
    layerRole,
  };
}

export function officeAttachmentRenderOrder(
  role: OfficeAttachmentLayerRole,
): readonly ["actor-body", "held-prop", "hand-foreground"] | readonly [
  "facility-base",
  "front-effect",
] {
  return role === "front-effect"
    ? ["facility-base", "front-effect"]
    : ["actor-body", "held-prop", "hand-foreground"];
}

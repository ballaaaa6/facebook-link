import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveHeldPropAttachment,
  resolveSocketChildAttachment,
} from "../src/features/office/spatial/officeAttachmentResolver.ts";

test("held prop resolver follows the actor root and keeps the prop on top", () => {
  const resolved = resolveHeldPropAttachment({
    actorTransform: {
      position: { x: 6, y: 4, z: 0 },
      orientation: "front",
    },
    actorRootSocket: [48, 101],
    actorHandTargetSocket: [43, 64],
    propVisualCenterSocket: [7, 13],
  });
  assert.deepEqual(resolved.actorOrigin, { x: 144, y: 27 });
  assert.deepEqual(resolved.propOrigin, { x: 180, y: 78 });
  assert.deepEqual(resolved.attachmentDelta, { x: 0, y: 0 });
  assert.deepEqual(
    resolved.renderOrder,
    ["actor-body", "held-prop"],
  );
});

test("generic child resolver supports furniture and facility sockets", () => {
  const resolved = resolveSocketChildAttachment({
    parentOrigin: { x: 64, y: 40 },
    parentSocket: [32, 78],
    childSocket: [7, 13],
    layerRole: "front-effect",
  });
  assert.deepEqual(resolved.parentSocketWorld, { x: 96, y: 118 });
  assert.deepEqual(resolved.childOrigin, { x: 89, y: 105 });
  assert.deepEqual(resolved.attachmentDelta, { x: 0, y: 0 });
});

test("held prop resolver rejects fractional runtime sockets", () => {
  assert.throws(
    () => resolveHeldPropAttachment({
      actorTransform: {
        position: { x: 0, y: 0, z: 0 },
        orientation: "front",
      },
      actorRootSocket: [48, 101],
      actorHandTargetSocket: [43.5, 64],
      propVisualCenterSocket: [7, 13],
    }),
    /integer runtime pixels/,
  );
});

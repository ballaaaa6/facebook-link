import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveHeldPropAttachment,
  resolveSocketChildAttachment,
} from "../src/features/office/spatial/officeAttachmentResolver.ts";

test("held prop resolver follows the actor root and preserves hand occlusion order", () => {
  const resolved = resolveHeldPropAttachment({
    actorTransform: {
      position: { x: 6, y: 4, z: 0 },
      orientation: "front",
    },
    actorRootSocket: [48, 101],
    actorGripSocket: [43, 64],
    propGripSocket: [7, 13],
    foregroundMask: "hand-mask.png",
  });
  assert.deepEqual(resolved.actorOrigin, { x: 144, y: 27 });
  assert.deepEqual(resolved.propOrigin, { x: 180, y: 78 });
  assert.deepEqual(resolved.attachmentDelta, { x: 0, y: 0 });
  assert.deepEqual(
    resolved.renderOrder,
    ["actor-body", "held-prop", "hand-foreground"],
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

test("held prop resolver fails closed without a foreground hand mask", () => {
  assert.throws(
    () => resolveHeldPropAttachment({
      actorTransform: {
        position: { x: 0, y: 0, z: 0 },
        orientation: "front",
      },
      actorRootSocket: [48, 101],
      actorGripSocket: [43, 64],
      propGripSocket: [7, 13],
      foregroundMask: "",
    }),
    /requires a hand foreground mask/,
  );
});

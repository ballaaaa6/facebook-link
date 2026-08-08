import test from "node:test";
import assert from "node:assert/strict";
import { buildExecOptions } from "../src/game-observer/gds-adb-observer.mjs";
import {
  buildFrameRecord,
  hasReadyDeviceLine,
  parseResumedActivity,
  parseScreenSize,
  sanitizeSerial,
} from "../src/game-observer/observation-model.mjs";

test("parseResumedActivity extracts the active package and activity", () => {
  const output = "mResumedActivity: ActivityRecord{c124fb2 u0 net.kairosoft.android.gamedev3en/main.Main t44}";

  assert.deepEqual(parseResumedActivity(output), {
    packageName: "net.kairosoft.android.gamedev3en",
    activityName: "main.Main",
  });
});

test("parseScreenSize extracts the physical screen dimensions", () => {
  assert.deepEqual(parseScreenSize("Physical size: 1600x900\nPhysical density: 240"), {
    width: 1600,
    height: 900,
  });
});

test("buildFrameRecord preserves evidence metadata and relative artifact paths", () => {
  const record = buildFrameRecord({
    capturedAt: "2026-08-08T04:15:00.000Z",
    serial: "127.0.0.1:5555",
    framePath: "frames/frame-000001.png",
    sha256: "abc123",
    activity: { packageName: "net.kairosoft.android.gamedev3en", activityName: "main.Main" },
    screen: { width: 1600, height: 900 },
  });

  assert.deepEqual(record, {
    schemaVersion: "gds-runtime-observation-v1",
    kind: "frame",
    capturedAt: "2026-08-08T04:15:00.000Z",
    serial: "127.0.0.1:5555",
    framePath: "frames/frame-000001.png",
    sha256: "abc123",
    activity: { packageName: "net.kairosoft.android.gamedev3en", activityName: "main.Main" },
    screen: { width: 1600, height: 900 },
  });
});

test("sanitizeSerial produces filesystem-safe session identifiers", () => {
  assert.equal(sanitizeSerial("127.0.0.1:5555"), "127.0.0.1_5555");
});

test("hasReadyDeviceLine accepts only a ready target device", () => {
  const devices = "List of devices attached\n127.0.0.1:5555         device product:b0qxxx\nemulator-5554\tdevice product:b0qxxx";

  assert.equal(hasReadyDeviceLine(devices, "127.0.0.1:5555"), true);
  assert.equal(hasReadyDeviceLine(devices, "127.0.0.1:5556"), false);
});

test("buildExecOptions keeps binary output as a Buffer when requested", () => {
  assert.equal(buildExecOptions(null).encoding, null);
});

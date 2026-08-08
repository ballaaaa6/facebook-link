const ACTIVITY_PATTERN = /(?:mResumedActivity|ResumedActivity):\s+ActivityRecord\{[^}]*?\s([\w.]+)\/([\w.$-]+)/;
const SCREEN_PATTERN = /Physical size:\s*(\d+)x(\d+)/;

export function parseResumedActivity(output) {
  const match = output.match(ACTIVITY_PATTERN);
  if (!match) return null;
  return Object.freeze({ packageName: match[1], activityName: match[2] });
}

export function parseScreenSize(output) {
  const match = output.match(SCREEN_PATTERN);
  if (!match) return null;
  return Object.freeze({ width: Number(match[1]), height: Number(match[2]) });
}

export function sanitizeSerial(serial) {
  return serial.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function hasReadyDeviceLine(output, serial) {
  const escapedSerial = serial.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const readyPattern = new RegExp(`^${escapedSerial}\\s+device(?:\\s|$)`);
  return String(output)
    .split(/\r?\n/)
    .some((value) => readyPattern.test(value));
}

export function buildFrameRecord(input) {
  return Object.freeze({
    schemaVersion: "gds-runtime-observation-v1",
    kind: "frame",
    capturedAt: input.capturedAt,
    serial: input.serial,
    framePath: input.framePath,
    sha256: input.sha256,
    activity: input.activity,
    screen: input.screen,
  });
}

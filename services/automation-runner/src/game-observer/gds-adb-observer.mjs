import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildFrameRecord,
  hasReadyDeviceLine,
  parseResumedActivity,
  parseScreenSize,
  sanitizeSerial,
} from "./observation-model.mjs";

const ADB = process.env.ADB_PATH ?? "adb";
const OBSERVER_SCHEMA_VERSION = "gds-runtime-observation-v1";
const DEFAULT_SERIAL = "127.0.0.1:5555";
const DEFAULT_INTERVAL_MS = 1000;
const DEFAULT_UI_INTERVAL_MS = 5000;

export function buildExecOptions(encoding = "utf8") {
  return { encoding, maxBuffer: 8 * 1024 * 1024 };
}

function execAdb(args, options = {}) {
  return new Promise((resolve, reject) => {
    execFile(ADB, args, buildExecOptions(options.encoding), (error, stdout, stderr) => {
      if (error) {
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

function parseArgs(argv) {
  const values = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const value = argv[index + 1];
    if (value !== undefined && !value.startsWith("--")) {
      values.set(key, value);
      index += 1;
    } else {
      values.set(key, "true");
    }
  }
  return {
    serial: values.get("serial") ?? DEFAULT_SERIAL,
    intervalMs: Math.max(250, Number(values.get("interval-ms") ?? DEFAULT_INTERVAL_MS)),
    uiIntervalMs: Math.max(1000, Number(values.get("ui-interval-ms") ?? DEFAULT_UI_INTERVAL_MS)),
    outputRoot: values.get("out") ?? path.join(os.tmpdir(), "gds-runtime-observations"),
  };
}

function isoNow() {
  return new Date().toISOString();
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function ensureConnected(serial) {
  await execAdb(["connect", serial]);
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const devices = await execAdb(["devices", "-l"]);
    if (hasReadyDeviceLine(devices.stdout, serial)) return;
    await sleep(250);
  }
  throw new Error(`adb device is not ready: ${serial}`);
}

async function readActivity(serial) {
  const result = await execAdb(["-s", serial, "shell", "dumpsys", "activity", "activities"]);
  return parseResumedActivity(String(result.stdout));
}

async function readScreen(serial) {
  const result = await execAdb(["-s", serial, "shell", "wm", "size"]);
  return parseScreenSize(String(result.stdout));
}

async function captureScreenshot(serial) {
  const result = await execAdb(["-s", serial, "exec-out", "screencap", "-p"], { encoding: null });
  return result.stdout;
}

async function captureUiDump(serial) {
  await execAdb(["-s", serial, "shell", "uiautomator", "dump", "/sdcard/gds-window.xml"]);
  const result = await execAdb(["-s", serial, "exec-out", "cat", "/sdcard/gds-window.xml"]);
  return String(result.stdout);
}

async function writeJson(filePath, value) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function sessionId() {
  return `gds-session-${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}`;
}

async function appendEvent(handle, value) {
  await handle.write(`${JSON.stringify(value)}\n`, "utf8");
}

async function runObserver(options) {
  await ensureConnected(options.serial);
  const id = sessionId();
  const sessionRoot = path.join(options.outputRoot, id);
  const frameRoot = path.join(sessionRoot, "frames");
  const uiRoot = path.join(sessionRoot, "ui");
  await fs.mkdir(frameRoot, { recursive: true });
  await fs.mkdir(uiRoot, { recursive: true });

  const screen = await readScreen(options.serial);
  const initialActivity = await readActivity(options.serial);
  const session = {
    schemaVersion: OBSERVER_SCHEMA_VERSION,
    sessionId: id,
    serial: options.serial,
    startedAt: isoNow(),
    status: "running",
    capture: { intervalMs: options.intervalMs, uiIntervalMs: options.uiIntervalMs },
    screen,
    initialActivity,
    frameCount: 0,
    uiDumpCount: 0,
    errorCount: 0,
  };
  await writeJson(path.join(sessionRoot, "session.json"), session);
  const eventHandle = await fs.open(path.join(sessionRoot, "events.jsonl"), "a");

  let stopping = false;
  let frameNumber = 0;
  let uiNumber = 0;
  let lastUiAt = 0;
  const stop = () => { stopping = true; };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  process.stdout.write(`GDS observer started: ${sessionRoot}\n`);

  try {
    while (!stopping) {
      const cycleStarted = Date.now();
      try {
        const image = await captureScreenshot(options.serial);
        frameNumber += 1;
        const frameName = `frame-${String(frameNumber).padStart(8, "0")}.png`;
        const framePath = path.join(frameRoot, frameName);
        await fs.writeFile(framePath, image);
        const activity = await readActivity(options.serial);
        const record = buildFrameRecord({
          capturedAt: isoNow(),
          serial: options.serial,
          framePath: path.join("frames", frameName),
          sha256: sha256(image),
          activity,
          screen,
        });
        await appendEvent(eventHandle, record);
        session.frameCount = frameNumber;

        if (Date.now() - lastUiAt >= options.uiIntervalMs) {
          lastUiAt = Date.now();
          try {
            const ui = await captureUiDump(options.serial);
            uiNumber += 1;
            const uiName = `ui-${String(uiNumber).padStart(6, "0")}.xml`;
            await fs.writeFile(path.join(uiRoot, uiName), ui, "utf8");
            session.uiDumpCount = uiNumber;
            await appendEvent(eventHandle, {
              schemaVersion: OBSERVER_SCHEMA_VERSION,
              kind: "ui-dump",
              capturedAt: isoNow(),
              serial: options.serial,
              uiPath: path.join("ui", uiName),
            });
          } catch (error) {
            session.errorCount += 1;
            await appendEvent(eventHandle, {
              schemaVersion: OBSERVER_SCHEMA_VERSION,
              kind: "capture-error",
              capturedAt: isoNow(),
              source: "uiautomator",
              message: error instanceof Error ? error.message : String(error),
            });
          }
        }
      } catch (error) {
        session.errorCount += 1;
        await appendEvent(eventHandle, {
          schemaVersion: OBSERVER_SCHEMA_VERSION,
          kind: "capture-error",
          capturedAt: isoNow(),
          source: "adb-screencap",
          message: error instanceof Error ? error.message : String(error),
        });
      }
      const waitMs = Math.max(0, options.intervalMs - (Date.now() - cycleStarted));
      if (waitMs > 0) await sleep(waitMs);
    }
  } finally {
    session.status = "stopped";
    session.stoppedAt = isoNow();
    await eventHandle.close();
    await writeJson(path.join(sessionRoot, "session.json"), session);
    process.stdout.write(`GDS observer stopped: ${sessionRoot}\n`);
  }
  return sessionRoot;
}

const isMain = process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  runObserver(parseArgs(process.argv.slice(2))).catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}

export { parseArgs, runObserver };

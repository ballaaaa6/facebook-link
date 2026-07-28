import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { officeSceneTimeAt } from "../src/features/office/components/officeSceneTime.ts";

const runtimeSource = readFileSync(
  join(import.meta.dirname, "../src/features/office/components/officeSceneRuntime.ts"),
  "utf8",
);

test("uses the completed semantic-grid v5 background and aligned overlays", () => {
  assert.match(runtimeSource, /office-c-background-modern-v7-current\.png/);
  assert.match(runtimeSource, /window: \{ x: 527, y: 133, width: 470, height: 204 \}/);
  assert.match(runtimeSource, /clock: \{ x: 1069, y: 90, width: 80, height: 80 \}/);
  assert.match(runtimeSource, /whiteboard: \{ x: 1205, y: 136, width: 350, height: 195 \}/);
  assert.match(runtimeSource, /whiteboardContent: \{ x: 1244, y: 157, width: 272, height: 157 \}/);
});

test("calculates live clock hand angles in the configured timezone", () => {
  const time = officeSceneTimeAt(new Date("2026-07-26T03:15:00.000Z"), "Asia/Bangkok");

  assert.equal(time.hour, 10);
  assert.equal(time.minute, 15);
  assert.equal(time.season, "summer");
  assert.equal(time.timeOfDay, "day");
  assert.equal(time.hourAngle, 307.5);
  assert.equal(time.minuteAngle, 90);
});

test("maps the four daily window periods at their boundaries", () => {
  const at = (iso: string) => officeSceneTimeAt(new Date(iso), "Asia/Bangkok").timeOfDay;

  assert.equal(at("2026-07-25T22:00:00.000Z"), "dawn");
  assert.equal(at("2026-07-26T02:00:00.000Z"), "day");
  assert.equal(at("2026-07-26T10:00:00.000Z"), "evening");
  assert.equal(at("2026-07-26T13:00:00.000Z"), "night");
});

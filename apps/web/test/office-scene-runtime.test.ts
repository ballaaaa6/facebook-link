import test from "node:test";
import assert from "node:assert/strict";
import { officeSceneTimeAt } from "../src/features/office/components/officeSceneTime.ts";

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

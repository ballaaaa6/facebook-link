import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const main = readFileSync(new URL("../src/main.tsx", import.meta.url), "utf8");
const page = readFileSync(new URL("../src/features/office/lab/workstation-v3-step5/OfficeWorkstationStep5R04LabPage.tsx", import.meta.url), "utf8");
const station = readFileSync(new URL("../src/features/office/lab/workstation-v3-step5/R04Station.tsx", import.meta.url), "utf8");

test("R04 browser lab is a development-only one-seat review surface", () => {
  assert.match(main, /import\.meta\.env\.DEV/);
  assert.match(main, /requestedLab === "office-workstation-v3-step5"/);
  assert.match(page, /data-active-office-promotion="false"/);
  assert.match(page, /Promoted seats: 0\/10/);
});

test("R04 browser lab consumes one manifest for clean, overlay, and context views", () => {
  assert.match(page, /office-workstation-step5-single-seat-v4\.json/);
  assert.match(page, /"review" \| "overlay" \| "office"/);
  assert.match(station, /manifest\.layerOrder\[orientation\]/);
  assert.match(station, /geometry\.seatAnchor/);
  assert.match(station, /desk support 96×64/);
});

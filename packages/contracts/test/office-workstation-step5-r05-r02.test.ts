import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  validateOfficeCharacterSeatSockets,
  validateOfficeWorkstationStep5R05R02,
  workstationStep5R05R02ReviewOutputs,
} from "../src/index.ts";

const root = new URL("../../../", import.meta.url);
const readJson = (path: string) => JSON.parse(readFileSync(new URL(path, root), "utf8"));
const digest = (path: string) => createHash("sha256").update(readFileSync(new URL(path, root))).digest("hex");
const manifest = readJson("assets/game/manifests/office-workstation-step5-r05-r02.json");
const sockets = readJson("assets/game/manifests/office-character-seat-sockets-v1.json");
const pair = readJson("assets/game/maps/office-workstation-pair-r05-r02.json");

test("R05-r02 records per-character, per-frame seat sockets without creating poses", () => {
  assert.deepEqual(validateOfficeCharacterSeatSockets(sockets), []);
  assert.equal(sockets.status, "owner-approved");
  assert.equal(sockets.entries.length, 19);
  assert.equal(sockets.entries.filter((entry: { seatCapability: string }) => entry.seatCapability === "working-seated").length, 18);
  assert.equal(sockets.entries.find((entry: { slug: string }) => entry.slug === "boba").seatCapability, "not-applicable-companion-atlas");
  for (const entry of sockets.entries.filter((item: { seatCapability: string }) => item.seatCapability === "working-seated")) {
    assert.equal(digest(entry.source.file), entry.source.sha256);
    assert.equal(entry.orientations.front.frames.length, 6);
    assert.equal(entry.orientations.back.frames.length, 6);
    assert.equal(entry.orientations.front.frames.every((frame: { seatContactLocal: [number, number] }) => frame.seatContactLocal[1] === 80), true);
    assert.equal(entry.orientations.back.frames.every((frame: { seatContactLocal: [number, number] }) => frame.seatContactLocal[1] >= 85), true);
  }
  assert.equal(sockets.rules.newCharacterOrPose, false);
  assert.equal(sockets.rules.handSocketsInScope, false);
});

test("R05-r02 uses footprint depth and correct far equipment order", () => {
  assert.deepEqual(validateOfficeWorkstationStep5R05R02(manifest), []);
  assert.deepEqual(pair.deskPair.originDeltaTiles, [0, 2, 0]);
  assert.deepEqual(pair.deskPair.originDeltaPixels, [0, 64]);
  assert.equal(pair.deskPair.topGapPixels, 0);
  assert.equal(pair.deskPair.rearBaseVisibleBehindNearTopPixels, 0);
  assert.equal(manifest.components.monitor.farLayerOrder, "keyboard-before-monitor");
  assert.deepEqual(manifest.station.layerOrder.far.slice(5, 7), ["keyboard", "monitor-back"]);
});

test("R05-r02 stops after the isolated paired proof and preserves Active Office", () => {
  assert.equal(manifest.status, "owner-approved-p0-p3");
  assert.equal(manifest.stopGate, "approved-awaiting-ten-seat-plan-execution");
  assert.equal(manifest.ownerDecision.decision, "approved");
  assert.equal(manifest.supersedesForPlacementAuthority, "office.workstation.step5.r05.final");
  assert.equal(digest(manifest.activeOfficeBaseline.file), manifest.activeOfficeBaseline.sha256);
  assert.equal(digest(manifest.rosterSockets.file), manifest.rosterSockets.sha256);
  assert.equal(digest(manifest.pairMap.file), manifest.pairMap.sha256);
  assert.deepEqual(manifest.reviewOutputs, workstationStep5R05R02ReviewOutputs);
  for (const path of manifest.reviewOutputs) assert.doesNotThrow(() => readFileSync(new URL(path, root)));
  assert.equal(manifest.permissions.tenSeatExpansion, false);
  assert.equal(manifest.permissions.activeOfficePromotion, false);
  assert.equal(manifest.permissions.handSockets, false);
});

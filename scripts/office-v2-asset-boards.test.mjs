import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { AssetBoardError, BOARD_KINDS, buildReviewBoards } from "./office-v2-asset-boards.mjs";

function input() {
  return {
    schemaVersion: "office-asset-board-input-v1",
    familyId: "workstation-basic",
    familyVersion: 1,
    sourceSha256: "1".repeat(64),
    recipeSha256: "2".repeat(64),
    styleProfile: { id: "office-pixel", version: 1, palettePolicy: "bounded" },
    geometry: { id: "workstation-geometry", version: 1, footprint: { widthCells: 2, depthCells: 1 } },
    alphaPolicy: { border: "transparent", filter: "nearest" },
    nativeScale: { pixelsPerCell: 16, filter: "nearest" },
    palette: { colors: [[0, 0, 0, 255], [255, 255, 255, 255], [32, 64, 96, 255]] },
    connectivity: { supportedMasks: [10, 0, 8, 2], seamPolicy: "exact" },
    review: { state: "pending-owner-review", reviewer: "unassigned" },
    frames: [
      { frameId: "mask-0", widthPx: 2, heightPx: 2, rgba: [255, 0, 0, 255, 0, 255, 0, 128, 0, 0, 255, 0, 255, 255, 255, 255], contacts: [{ id: "seat", xPx: 0, yPx: 0 }], masks: [0] },
      { frameId: "mask-2", widthPx: 2, heightPx: 2, rgba: [0, 0, 0, 255, 64, 64, 64, 255, 128, 128, 128, 255, 255, 255, 255, 255], contacts: [{ id: "seat", xPx: 1, yPx: 1 }], masks: [2] },
    ],
  };
}

function root() { return mkdtempSync(join(tmpdir(), "office-v2-boards-")); }
function codes(callback) {
  try { callback(); assert.fail("expected AssetBoardError"); } catch (error) { assert.ok(error instanceof AssetBoardError); return error.code; }
}

test("generates all five board classes with deterministic bytes and metadata", () => {
  const firstRoot = root();
  const secondRoot = root();
  try {
    const first = buildReviewBoards({ input: input(), outputRoot: firstRoot });
    const second = buildReviewBoards({ input: input(), outputRoot: secondRoot });
    assert.deepEqual(first.report, second.report);
    assert.equal(first.report.boards.length, 10);
    assert.deepEqual(first.report.boardKinds, BOARD_KINDS);
    assert.deepEqual(first.outputBytes.map(({ path, sha256 }) => [path, sha256]), second.outputBytes.map(({ path, sha256 }) => [path, sha256]));
    assert.equal(readFileSync(join(firstRoot, "office-v2/review-boards/workstation-basic/v1/alpha/mask-0.json"), "utf8"), readFileSync(join(secondRoot, "office-v2/review-boards/workstation-basic/v1/alpha/mask-0.json"), "utf8"));
  } finally { rmSync(firstRoot, { recursive: true, force: true }); rmSync(secondRoot, { recursive: true, force: true }); }
});

test("board pixels and report digest react to declared semantic changes", () => {
  const original = input();
  const changed = input();
  changed.geometry.footprint.widthCells = 3;
  changed.frames[0].rgba[0] = 1;
  const first = buildReviewBoards({ input: original });
  const second = buildReviewBoards({ input: changed });
  assert.notEqual(first.report.reportSha256, second.report.reportSha256);
  assert.notEqual(first.report.boards[0].pixelSha256, second.report.boards[0].pixelSha256);
});

test("preserves pending review state without inferring approval", () => {
  const result = buildReviewBoards({ input: input() });
  assert.equal(result.report.review.state, "pending-owner-review");
  assert.ok(result.report.boards.every((board) => board.review.state === "pending-owner-review"));
});

test("fails closed for missing style, geometry, palette, contacts, masks, and review", () => {
  for (const [field, expected] of [["styleProfile", "asset.boards.style-missing"], ["geometry", "asset.boards.geometry-missing"], ["palette", "asset.boards.palette-missing"], ["review", "asset.boards.review-missing"]]) {
    const candidate = input(); delete candidate[field]; assert.equal(codes(() => buildReviewBoards({ input: candidate })), expected);
  }
  const noContacts = input(); delete noContacts.frames[0].contacts;
  assert.equal(codes(() => buildReviewBoards({ input: noContacts })), "asset.boards.contact-missing");
  const noMasks = input(); delete noMasks.frames[0].masks;
  assert.equal(codes(() => buildReviewBoards({ input: noMasks })), "asset.boards.mask-missing");
  const noColors = input(); noColors.palette.colors = [];
  assert.equal(codes(() => buildReviewBoards({ input: noColors })), "asset.boards.palette-invalid");
});

test("rejects unsafe identities, invalid coordinates, and invalid review states", () => {
  const badFamily = input(); badFamily.familyId = "../escape";
  assert.equal(codes(() => buildReviewBoards({ input: badFamily })), "asset.boards.family-id-invalid");
  const badContact = input(); badContact.frames[0].contacts[0].xPx = 9;
  assert.equal(codes(() => buildReviewBoards({ input: badContact })), "asset.boards.contact-invalid");
  const badReview = input(); badReview.review.state = "approved-by-image";
  assert.equal(codes(() => buildReviewBoards({ input: badReview })), "asset.boards.review-state-invalid");
});

test("clean output is fail-closed and input remains immutable", () => {
  const candidate = input();
  const snapshot = structuredClone(candidate);
  const output = root();
  try {
    buildReviewBoards({ input: candidate, outputRoot: output });
    assert.deepEqual(candidate, snapshot);
    assert.equal(codes(() => buildReviewBoards({ input: candidate, outputRoot: output })), "asset.boards.overwrite");
  } finally { rmSync(output, { recursive: true, force: true }); }
});

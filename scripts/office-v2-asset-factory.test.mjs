import assert from "node:assert/strict";
import { inflateSync } from "node:zlib";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import {
  AssetFactoryError,
  buildAssetExport,
  encodeRgbaPng,
  hashBytes,
} from "./office-v2-asset-factory.mjs";
import {
  assertOutputRoot,
  writeOutputs,
} from "./office-v2-asset-factory-paths.mjs";

const factoryPath = resolve("scripts/office-v2-asset-factory.mjs");

function tempDirectory(label) {
  return mkdtempSync(join(tmpdir(), `office-v2-${label}-`));
}

function fixture() {
  return {
    source: {
      schemaVersion: "office-source-pixels-v1",
      familyId: "proof-workstation",
      familyVersion: 1,
      sourceId: "proof-workstation-source",
      metadata: { authoring: "source-neutral-test", license: "project-owned" },
      frames: [
        {
          frameId: "idle",
          widthPx: 2,
          heightPx: 1,
          rgba: [255, 0, 0, 255, 0, 128, 255, 64],
          metadata: { state: "idle" },
        },
        {
          frameId: "active",
          widthPx: 1,
          heightPx: 2,
          rgba: [0, 255, 0, 255, 0, 0, 255, 255],
          metadata: { state: "active" },
        },
      ],
    },
    recipe: {
      schemaVersion: "office-export-recipe-v1",
      recipeId: "proof-workstation-export",
      recipeVersion: 1,
      familyId: "proof-workstation",
      familyVersion: 1,
      metadata: { projection: "office-projection-v1", filtering: "nearest" },
      outputs: [
        { path: "office-v2/metadata/proof-workstation/v1/frames.json", kind: "metadata" },
        { path: "office-v2/runtime/proof-workstation/v1/idle.png", kind: "png", frameId: "idle" },
        { path: "office-v2/runtime/proof-workstation/v1/active.png", kind: "png", frameId: "active" },
      ],
      overwritePolicy: "fail",
      determinism: {
        twoCleanBuilds: "required",
        byteEquality: "required",
        stableInputOrder: "declared",
      },
    },
  };
}

function cloneFixture() {
  return structuredClone(fixture());
}

function buildInTemporaryDirectory(input = fixture()) {
  const root = tempDirectory("build");
  try {
    return { root, report: buildAssetExport({ ...input, outputRoot: root }) };
  } catch (error) {
    rmSync(root, { recursive: true, force: true });
    throw error;
  }
}

function expectFactoryError(action, code) {
  assert.throws(action, (error) => {
    assert.ok(error instanceof AssetFactoryError);
    assert.equal(error.code, code);
    assert.match(error.message, new RegExp(`^\\[${code.replaceAll(".", "\\.")}\\]`));
    return true;
  });
}

function crc32(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) {
    value ^= byte;
    for (let bit = 0; bit < 8; bit += 1) value = (value & 1) === 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return (value ^ 0xffffffff) >>> 0;
}

function parsePng(bytes) {
  const buffer = Buffer.from(bytes);
  assert.deepEqual([...buffer.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const chunks = [];
  for (let offset = 8; offset < buffer.length;) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    const expectedCrc = buffer.readUInt32BE(offset + 8 + length);
    const actualCrc = crc32(Buffer.concat([buffer.subarray(offset + 4, offset + 8), data]));
    assert.equal(actualCrc, expectedCrc, `${type} CRC`);
    chunks.push({ type, data });
    offset += length + 12;
  }
  assert.equal(chunks.at(-1)?.type, "IEND");
  return chunks;
}

function fileBytes(root, report, path) {
  const output = report.outputs.find((entry) => entry.path === path);
  assert.ok(output, `missing output ${path}`);
  return readFileSync(join(root, ...path.split("/")));
}

test("encodeRgbaPng emits stable RGBA PNG chunks, dimensions, pixels, and CRCs", () => {
  const rgba = new Uint8Array([255, 0, 0, 255, 0, 128, 255, 64]);
  const encoded = encodeRgbaPng({ widthPx: 2, heightPx: 1, rgba });
  assert.ok(encoded instanceof Uint8Array);
  const chunks = parsePng(encoded);
  assert.deepEqual(chunks.map(({ type }) => type), ["IHDR", "IDAT", "IEND"]);
  assert.equal(chunks[0].data.readUInt32BE(0), 2);
  assert.equal(chunks[0].data.readUInt32BE(4), 1);
  assert.equal(chunks[0].data[8], 8);
  assert.equal(chunks[0].data[9], 6);
  assert.equal(chunks[0].data[10], 0);
  assert.equal(chunks[0].data[11], 0);
  assert.equal(chunks[0].data[12], 0);
  const scanlines = inflateSync(chunks[1].data);
  assert.deepEqual([...scanlines], [0, ...rgba]);
  assert.equal(hashBytes(encoded), hashBytes(encodeRgbaPng({ widthPx: 2, heightPx: 1, rgba })));
});

test("two clean builds are byte-identical and preserve immutable inputs", () => {
  const input = cloneFixture();
  const before = structuredClone(input);
  const first = buildInTemporaryDirectory(input);
  const second = buildInTemporaryDirectory(input);
  try {
    assert.deepEqual(input, before);
    assert.deepEqual(first.report, second.report);
    assert.equal(first.report.reportSha256, second.report.reportSha256);
    for (const output of first.report.outputs) {
      const firstBytes = fileBytes(first.root, first.report, output.path);
      const secondBytes = fileBytes(second.root, second.report, output.path);
      assert.deepEqual(firstBytes, secondBytes, output.path);
      assert.equal(hashBytes(firstBytes), output.sha256);
    }
  } finally {
    rmSync(first.root, { recursive: true, force: true });
    rmSync(second.root, { recursive: true, force: true });
  }
});

test("changed pixels change source, output, result, and report hashes", () => {
  const first = buildInTemporaryDirectory();
  const changedInput = cloneFixture();
  changedInput.source.frames[0].rgba[0] = 254;
  const second = buildInTemporaryDirectory(changedInput);
  try {
    assert.notEqual(first.report.sourceSha256, second.report.sourceSha256);
    assert.notEqual(first.report.resultSha256, second.report.resultSha256);
    assert.notEqual(first.report.reportSha256, second.report.reportSha256);
    assert.notEqual(first.report.outputs[1].sha256, second.report.outputs[1].sha256);
  } finally {
    rmSync(first.root, { recursive: true, force: true });
    rmSync(second.root, { recursive: true, force: true });
  }
});

test("changed output order changes the recipe and declared result", () => {
  const first = buildInTemporaryDirectory();
  const changedInput = cloneFixture();
  changedInput.recipe.outputs = [changedInput.recipe.outputs[2], changedInput.recipe.outputs[1], changedInput.recipe.outputs[0]];
  const second = buildInTemporaryDirectory(changedInput);
  try {
    assert.notEqual(first.report.recipeSha256, second.report.recipeSha256);
    assert.notEqual(first.report.resultSha256, second.report.resultSha256);
    assert.notEqual(first.report.reportSha256, second.report.reportSha256);
    assert.deepEqual(second.report.outputs.map(({ path }) => path), [
      "office-v2/runtime/proof-workstation/v1/active.png",
      "office-v2/runtime/proof-workstation/v1/idle.png",
      "office-v2/metadata/proof-workstation/v1/frames.json",
    ]);
  } finally {
    rmSync(first.root, { recursive: true, force: true });
    rmSync(second.root, { recursive: true, force: true });
  }
});

test("path traversal and absolute output paths fail before creating output", () => {
  for (const [path, code] of [
    ["../escape.png", "asset.factory.output-path-escape"],
    ["..\\escape.png", "asset.factory.output-path-escape"],
    ["/absolute.png", "asset.factory.output-path-absolute"],
    ["C:\\absolute.png", "asset.factory.output-path-absolute"],
  ]) {
    const root = join(tempDirectory("path"), "clean-output");
    const input = cloneFixture();
    input.recipe.outputs = [{ path, kind: "png", frameId: "idle" }];
    try {
      expectFactoryError(() => buildAssetExport({ ...input, outputRoot: root }), code);
      assert.equal(existsSync(root), false);
    } finally {
      rmSync(dirname(root), { recursive: true, force: true });
    }
  }
});

test("duplicate output paths fail before any output is written", () => {
  const root = join(tempDirectory("duplicate"), "clean-output");
  const input = cloneFixture();
  input.recipe.outputs = [
    { path: "office-v2/runtime/proof-workstation/v1/idle.png", kind: "png", frameId: "idle" },
    { path: "office-v2/runtime/proof-workstation/v1/idle.png", kind: "png", frameId: "active" },
  ];
  try {
    expectFactoryError(() => buildAssetExport({ ...input, outputRoot: root }), "asset.factory.output-duplicate");
    assert.equal(existsSync(root), false);
  } finally {
    rmSync(dirname(root), { recursive: true, force: true });
  }
});

test("malformed RGBA length and recipe determinism fail with exact diagnostics", () => {
  const root = join(tempDirectory("malformed"), "clean-output");
  const input = cloneFixture();
  input.source.frames[0].rgba.pop();
  try {
    expectFactoryError(() => buildAssetExport({ ...input, outputRoot: root }), "asset.factory.rgba-invalid");
    assert.equal(existsSync(root), false);
  } finally {
    rmSync(dirname(root), { recursive: true, force: true });
  }

  const recipeRoot = join(tempDirectory("recipe"), "clean-output");
  const recipeInput = cloneFixture();
  delete recipeInput.recipe.determinism;
  try {
    expectFactoryError(() => buildAssetExport({ ...recipeInput, outputRoot: recipeRoot }), "asset.factory.determinism-invalid");
    assert.equal(existsSync(recipeRoot), false);
  } finally {
    rmSync(dirname(recipeRoot), { recursive: true, force: true });
  }
});

test("overwrite is rejected after a successful build and leaves original bytes intact", () => {
  const root = tempDirectory("overwrite");
  const input = cloneFixture();
  try {
    const report = buildAssetExport({ ...input, outputRoot: root });
    const before = fileBytes(root, report, report.outputs[1].path);
    expectFactoryError(() => buildAssetExport({ ...input, outputRoot: root }), "asset.factory.overwrite");
    const after = fileBytes(root, report, report.outputs[1].path);
    assert.deepEqual(after, before);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("partial output transactions remove files and directories after a later path failure", () => {
  const parent = tempDirectory("partial");
  const root = join(parent, "clean-output");
  try {
    const rootInfo = assertOutputRoot(root);
    assert.throws(() => writeOutputs(rootInfo, [
      { path: "office-v2/runtime/first.png", bytes: Uint8Array.of(1), index: 0 },
      { path: "../escape.png", bytes: Uint8Array.of(2), index: 1 },
    ]), (error) => {
      assert.equal(error.code, "asset.factory.output-path-escape");
      return true;
    });
    assert.equal(existsSync(root), false);
    assert.equal(existsSync(join(parent, "escape.png")), false);
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});

test("CLI reads one JSON input, writes a declared report path, and emits the same deterministic report", () => {
  const directory = tempDirectory("cli");
  const inputPath = join(directory, "input.json");
  const outputRoot = join(directory, "output");
  const reportPath = "office-v2/reports/export.json";
  const input = fixture();
  writeFileSync(inputPath, JSON.stringify(input));
  const expectedRoot = join(directory, "expected");
  const expected = buildAssetExport({ ...input, outputRoot: expectedRoot });
  const result = spawnSync(process.execPath, [factoryPath, inputPath, outputRoot, "--report", reportPath], {
    encoding: "utf8",
  });
  try {
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), expected);
    assert.deepEqual(JSON.parse(readFileSync(join(outputRoot, ...reportPath.split("/")), "utf8")), expected);
    assert.deepEqual(readdirSync(join(outputRoot, "office-v2", "reports")), ["export.json"]);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("CLI report path collision fails before writing any output", () => {
  const directory = tempDirectory("cli-collision");
  const inputPath = join(directory, "input.json");
  const outputRoot = join(directory, "output");
  const collisionPath = fixture().recipe.outputs[1].path;
  writeFileSync(inputPath, JSON.stringify(fixture()));
  const result = spawnSync(process.execPath, [factoryPath, inputPath, outputRoot, "--report", collisionPath], {
    encoding: "utf8",
  });
  try {
    assert.equal(result.status, 1);
    assert.match(result.stderr, /^\[asset\.factory\.output-duplicate\]/u);
    assert.equal(existsSync(outputRoot), false);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

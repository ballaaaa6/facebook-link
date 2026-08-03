import { extname } from "node:path";
import { bytesFrom, hashBytes } from "./office-v2-asset-factory-format.mjs";
import { fail } from "./office-v2-asset-factory-errors.mjs";
import {
  normalizeRelativePath,
  outputKindFromPath,
  outputPathKey,
} from "./office-v2-asset-factory-paths.mjs";

const ID_PATTERN = /^[a-z0-9]+(?:[a-z0-9_-]*[a-z0-9])?$/u;

export function assertDimensions(widthPx, heightPx) {
  if (!Number.isSafeInteger(widthPx) || !Number.isSafeInteger(heightPx)
    || widthPx < 1 || heightPx < 1 || widthPx > 0xffffffff || heightPx > 0xffffffff) {
    fail("asset.factory.dimensions-invalid", "Frame dimensions must be positive 32-bit integers.", { widthPx, heightPx });
  }
  const rowBytes = widthPx * 4;
  const scanlineBytes = rowBytes + 1;
  if (!Number.isSafeInteger(rowBytes) || !Number.isSafeInteger(scanlineBytes)
    || scanlineBytes > 0x7fffffff || heightPx > Math.floor(0x7fffffff / scanlineBytes)) {
    fail("asset.factory.dimensions-invalid", "Frame dimensions exceed the supported PNG buffer size.", { widthPx, heightPx });
  }
  return { rowBytes, scanlineBytes, byteLength: rowBytes * heightPx };
}

function assertObject(value, code, message, context = {}) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) fail(code, message, context);
  return value;
}

function assertId(value, field) {
  if (typeof value !== "string" || !ID_PATTERN.test(value)) {
    fail(`asset.factory.${field}-invalid`, `${field} must be a lower-case stable identifier.`, { field, value: value ?? null });
  }
  return value;
}

function assertVersion(value, field) {
  if (!Number.isSafeInteger(value) || value < 1) {
    fail(`asset.factory.${field}-invalid`, `${field} must be a positive integer.`, { field, value: value ?? null });
  }
  return value;
}

function assertSchemaVersion(value, field, expected) {
  if (value !== expected) {
    fail("asset.factory.schema-version-invalid", `${field} must equal the supported version-1 Office schema.`, { field, expected, value: value ?? null });
  }
  return value;
}

function referenceId(value) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    if (typeof value.id === "string") return value.id;
    if (value.id && typeof value.id.value === "string") return value.id.value;
    if (typeof value.value === "string") return value.value;
  }
  return null;
}

function referenceVersion(value) {
  return value && typeof value === "object" && Number.isSafeInteger(value.version) ? value.version : null;
}

function normalizedReferenceId(value, field) {
  if (value === undefined) return null;
  return assertId(referenceId(value), field);
}

function cloneFrameForDigest(frame, frameId, widthPx, heightPx, outputPath, pixels) {
  const { rgba: ignoredRgba, id: ignoredId, frameId: ignoredFrameId, outputPath: ignoredPath, ...rest } = frame;
  return {
    ...rest,
    frameId,
    widthPx,
    heightPx,
    ...(outputPath === null ? {} : { outputPath }),
    rgba: Array.from(pixels),
  };
}

export function normalizeSource(source) {
  assertObject(source, "asset.factory.source-invalid", "Source must be a JSON object.");
  assertSchemaVersion(source.schemaVersion, "source.schemaVersion", "office-source-pixels-v1");
  const familyId = assertId(referenceId(source.familyId) ?? referenceId(source.familyRef), "family-id");
  const familyVersion = assertVersion(source.familyVersion ?? referenceVersion(source.familyRef) ?? 1, "family-version");
  const sourceId = source.sourceId === undefined ? null : assertId(source.sourceId, "source-id");
  if (!Array.isArray(source.frames) || source.frames.length === 0) {
    fail("asset.factory.frames-invalid", "Source must declare at least one ordered frame.");
  }

  const frameIds = new Set();
  const frameOutputPaths = new Set();
  const frames = source.frames.map((frame, index) => {
    assertObject(frame, "asset.factory.frame-invalid", "Each source frame must be an object.", { index });
    const frameId = assertId(frame.frameId ?? frame.id, "frame-id");
    if (frameIds.has(frameId)) fail("asset.factory.frame-duplicate", "Source frame IDs must be unique.", { frameId, index });
    frameIds.add(frameId);
    const dimensions = assertDimensions(frame.widthPx, frame.heightPx);
    const rgba = bytesFrom(frame.rgba, "asset.factory.rgba-invalid", { frameId, index });
    if (rgba.length !== dimensions.byteLength) {
      fail("asset.factory.rgba-invalid", "RGBA byte length must equal widthPx * heightPx * 4.", {
        frameId,
        index,
        widthPx: frame.widthPx,
        heightPx: frame.heightPx,
        expectedBytes: dimensions.byteLength,
        actualBytes: rgba.length,
      });
    }
    const outputPath = frame.outputPath === undefined
      ? null
      : normalizeRelativePath(frame.outputPath, `source.frames[${index}].outputPath`, index);
    if (outputPath !== null) {
      const key = outputPathKey(outputPath);
      if (frameOutputPaths.has(key)) fail("asset.factory.frame-output-duplicate", "Source frame output paths must be unique.", { outputPath, index });
      frameOutputPaths.add(key);
    }
    return {
      ...frame,
      frameId,
      widthPx: frame.widthPx,
      heightPx: frame.heightPx,
      rgba,
      outputPath,
      pixelSha256: hashBytes(rgba),
      digestFrame: cloneFrameForDigest(frame, frameId, frame.widthPx, frame.heightPx, outputPath, rgba),
    };
  });

  const digestSource = { ...source, familyId, familyVersion, frames: frames.map(({ digestFrame }) => digestFrame) };
  if (sourceId === null) delete digestSource.sourceId;
  else digestSource.sourceId = sourceId;
  return { source, sourceId, familyId, familyVersion, frames, digestSource };
}

export function normalizeRecipe(recipe, sourceInfo) {
  assertObject(recipe, "asset.factory.recipe-invalid", "Recipe must be a JSON object.");
  assertSchemaVersion(recipe.schemaVersion, "recipe.schemaVersion", "office-export-recipe-v1");
  const recipeId = assertId(recipe.recipeId, "recipe-id");
  const recipeVersion = assertVersion(recipe.recipeVersion, "recipe-version");
  const recipeFamilyId = normalizedReferenceId(recipe.familyId ?? recipe.familyRef, "recipe-family-id");
  if (recipeFamilyId !== null && recipeFamilyId !== sourceInfo.familyId) {
    fail("asset.factory.family-mismatch", "Recipe family ID must match the source family ID.", {
      sourceFamilyId: sourceInfo.familyId,
      recipeFamilyId,
    });
  }
  const recipeFamilyVersion = recipe.familyVersion ?? referenceVersion(recipe.familyRef);
  if (recipeFamilyVersion !== undefined && recipeFamilyVersion !== null) {
    assertVersion(recipeFamilyVersion, "recipe-family-version");
    if (recipeFamilyVersion !== sourceInfo.familyVersion) {
      fail("asset.factory.family-mismatch", "Recipe family version must match the source family version.", {
        sourceFamilyVersion: sourceInfo.familyVersion,
        recipeFamilyVersion,
      });
    }
  }
  if (recipe.overwritePolicy !== "fail") {
    fail("asset.factory.overwrite-policy-invalid", "The export recipe must use overwritePolicy=fail.", { overwritePolicy: recipe.overwritePolicy ?? null });
  }
  const determinism = recipe.determinism;
  if (!determinism || determinism.twoCleanBuilds !== "required"
    || determinism.byteEquality !== "required" || determinism.stableInputOrder !== "declared") {
    fail("asset.factory.determinism-invalid", "The recipe must require two clean byte-identical builds with declared input order.", { determinism: determinism ?? null });
  }
  const cleanOutputDirectory = recipe.cleanOutputDirectory === undefined
    ? undefined
    : normalizeRelativePath(recipe.cleanOutputDirectory, "recipe.cleanOutputDirectory");
  if (!Array.isArray(recipe.outputs) || recipe.outputs.length === 0) {
    fail("asset.factory.outputs-invalid", "The export recipe must declare at least one output.");
  }

  const outputPaths = new Set();
  const outputs = recipe.outputs.map((rawOutput, index) => {
    const output = typeof rawOutput === "string" ? { path: rawOutput } : rawOutput;
    assertObject(output, "asset.factory.output-invalid", "Each declared output must be an object or path string.", { index });
    const outputPath = normalizeRelativePath(output.path ?? output.outputPath, `recipe.outputs[${index}].path`, index);
    const key = outputPathKey(outputPath);
    if (outputPaths.has(key)) fail("asset.factory.output-duplicate", "Declared output paths must be unique.", { path: outputPath, index });
    outputPaths.add(key);
    const kind = output.kind ?? outputKindFromPath(outputPath);
    if (kind !== "png" && kind !== "metadata") {
      fail("asset.factory.output-kind-invalid", "Output kind must be png or metadata.", { path: outputPath, kind: kind ?? null, index });
    }
    const extension = extname(outputPath).toLowerCase();
    if ((kind === "png" && extension !== ".png") || (kind === "metadata" && extension !== ".json")) {
      fail("asset.factory.output-kind-invalid", "Output kind must agree with the declared file extension.", { path: outputPath, kind, index });
    }
    const frameIdValue = output.frameId ?? output.sourceFrameId ?? referenceId(output.frameRef);
    const frameId = frameIdValue == null ? null : assertId(frameIdValue, "frame-id");
    if (kind === "metadata" && frameId !== null) {
      fail("asset.factory.output-frame-invalid", "Metadata outputs may not select a source frame.", { path: outputPath, frameId, index });
    }
    return { ...output, path: outputPath, kind, frameId, index };
  });
  const digestRecipe = {
    ...recipe,
    ...(cleanOutputDirectory === undefined ? {} : { cleanOutputDirectory }),
    outputs: outputs.map(({ index, ...output }) => output),
  };
  return { recipe, recipeId, recipeVersion, outputs, digestRecipe };
}

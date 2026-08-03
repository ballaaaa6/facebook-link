import {
  canonicalBytes,
  canonicalJsonText,
  encodeRgbaPng,
  hashBytes,
} from "./office-v2-asset-factory-format.mjs";
import { fail } from "./office-v2-asset-factory-errors.mjs";
import { assertOutputRoot, writeOutputs } from "./office-v2-asset-factory-paths.mjs";
import { assertDimensions, normalizeRecipe, normalizeSource } from "./office-v2-asset-factory-validation.mjs";

function frameForOutput(output, sourceInfo, pngIndex, pngCount) {
  if (output.frameId !== null) {
    const frame = sourceInfo.frames.find((candidate) => candidate.frameId === output.frameId);
    if (!frame) fail("asset.factory.output-frame-missing", "PNG output references an unknown source frame.", { path: output.path, frameId: output.frameId });
    return frame;
  }
  const byPath = sourceInfo.frames.find((frame) => frame.outputPath === output.path);
  if (byPath) return byPath;
  if (pngCount === sourceInfo.frames.length) return sourceInfo.frames[pngIndex];
  if (pngCount === 1 && sourceInfo.frames.length === 1) return sourceInfo.frames[0];
  fail("asset.factory.output-frame-missing", "Every PNG output must identify a source frame.", { path: output.path });
}

function metadataBytes(output, sourceInfo, recipeInfo, sourceSha256, recipeSha256, frameOutputs) {
  const metadata = output.metadata ?? recipeInfo.recipe.metadata ?? sourceInfo.source.metadata ?? null;
  const document = {
    schemaVersion: "office-asset-metadata-v1",
    familyId: sourceInfo.familyId,
    familyVersion: sourceInfo.familyVersion,
    recipeId: recipeInfo.recipeId,
    recipeVersion: recipeInfo.recipeVersion,
    sourceId: sourceInfo.sourceId,
    sourceSha256,
    recipeSha256,
    metadata,
    frames: sourceInfo.frames.map((frame) => ({
      frameId: frame.frameId,
      widthPx: frame.widthPx,
      heightPx: frame.heightPx,
      pixelSha256: frame.pixelSha256,
      outputs: frameOutputs.filter(({ frameId }) => frameId === frame.frameId).map(({ path }) => path),
      metadata: frame.metadata ?? null,
    })),
  };
  return Buffer.from(canonicalJsonText(document), "utf8");
}

function unsignedReport(sourceInfo, recipeInfo, sourceSha256, recipeSha256, outputs, resultSha256) {
  const outputHashes = Object.fromEntries(outputs.map(({ path, sha256 }) => [path, sha256]));
  return {
    schemaVersion: "office-asset-export-report-v1",
    familyId: sourceInfo.familyId,
    familyVersion: sourceInfo.familyVersion,
    recipeId: recipeInfo.recipeId,
    recipeVersion: recipeInfo.recipeVersion,
    sourceSha256,
    recipeSha256,
    outputs,
    outputHashes,
    resultSha256,
  };
}

export function prepareAssetExport({ source, recipe } = {}) {
  const sourceInfo = normalizeSource(source);
  const recipeInfo = normalizeRecipe(recipe, sourceInfo);
  const sourceSha256 = hashBytes(canonicalBytes(sourceInfo.digestSource));
  const recipeSha256 = hashBytes(canonicalBytes(recipeInfo.digestRecipe));
  const pngOutputs = recipeInfo.outputs.filter(({ kind }) => kind === "png");
  const frameOutputs = [];
  const pngBytesByOutput = new Map();
  for (const output of pngOutputs) {
    const frame = frameForOutput(output, sourceInfo, pngOutputs.indexOf(output), pngOutputs.length);
    const bytes = Buffer.from(encodeRgbaPng(frame, assertDimensions));
    const descriptor = { path: output.path, kind: output.kind, frameId: frame.frameId, sha256: hashBytes(bytes), byteLength: bytes.length };
    frameOutputs.push(descriptor);
    pngBytesByOutput.set(output, { ...output, ...descriptor, bytes });
  }
  const outputBytes = recipeInfo.outputs.map((output) => {
    if (output.kind === "png") return pngBytesByOutput.get(output);
    const bytes = metadataBytes(output, sourceInfo, recipeInfo, sourceSha256, recipeSha256, frameOutputs);
    return { ...output, path: output.path, kind: output.kind, sha256: hashBytes(bytes), byteLength: bytes.length, bytes };
  });
  const outputDescriptors = outputBytes.map(({ path, kind, frameId, sha256, byteLength }) => ({
    path,
    kind,
    ...(frameId == null ? {} : { frameId }),
    sha256,
    byteLength,
  }));
  const resultPayload = {
    familyId: sourceInfo.familyId,
    familyVersion: sourceInfo.familyVersion,
    recipeId: recipeInfo.recipeId,
    recipeVersion: recipeInfo.recipeVersion,
    sourceSha256,
    recipeSha256,
    outputs: outputDescriptors,
  };
  const resultSha256 = hashBytes(canonicalBytes(resultPayload));
  const reportWithoutHash = unsignedReport(sourceInfo, recipeInfo, sourceSha256, recipeSha256, outputDescriptors, resultSha256);
  const reportSha256 = hashBytes(canonicalBytes(reportWithoutHash));
  return { report: { ...reportWithoutHash, reportSha256 }, outputBytes };
}

export function reportText(report) {
  return canonicalJsonText(report);
}

/** Build all declared PNG/metadata bytes under a clean output root. */
export function buildAssetExport({ source, recipe, outputRoot } = {}) {
  const prepared = prepareAssetExport({ source, recipe });
  const rootInfo = assertOutputRoot(outputRoot);
  writeOutputs(rootInfo, prepared.outputBytes);
  return prepared.report;
}

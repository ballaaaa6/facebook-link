import {
  dirname,
  extname,
  isAbsolute,
  relative,
  resolve,
  win32,
} from "node:path";
import {
  lstatSync,
  mkdirSync,
  readdirSync,
  rmdirSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { bytesFrom } from "./office-v2-asset-factory-format.mjs";
import { AssetFactoryError, fail } from "./office-v2-asset-factory-errors.mjs";

const WINDOWS_DEVICE_NAME = /^(?:con|prn|aux|nul|com[0-9]|lpt[0-9])(?:\..*)?$/iu;

export function normalizeRelativePath(value, field, index = null) {
  if (typeof value !== "string" || value.length === 0 || value.includes("\0") || /[\u0000-\u001f]/u.test(value)) {
    fail("asset.factory.output-path-invalid", "Output paths must be non-empty strings without control characters.", { field, index, value: value ?? null });
  }
  const portable = value.replaceAll("\\", "/");
  if (isAbsolute(value) || /^[a-z]:/iu.test(value) || portable.startsWith("/") || win32.isAbsolute(value) || win32.parse(value).root !== "") {
    fail("asset.factory.output-path-absolute", "Output paths must be relative to the clean output root.", { field, index, value });
  }
  const segments = portable.split("/");
  if (segments.some((segment) => segment === "..")) {
    fail("asset.factory.output-path-escape", "Output paths must remain inside the clean output root.", { field, index, value });
  }
  if (segments.some((segment) => segment === "" || segment === "." || segment.includes(":")
    || /[<>"|?*]/u.test(segment) || segment.endsWith(".") || segment.endsWith(" ")
    || WINDOWS_DEVICE_NAME.test(segment))) {
    fail("asset.factory.output-path-invalid", "Output paths may contain only safe relative path segments.", { field, index, value });
  }
  return segments.join("/");
}

export function outputPathKey(value) {
  return value.toLocaleLowerCase("en-US");
}

export function assertOutputPathInside(root, outputPath, field, index) {
  const target = resolve(root, ...outputPath.split("/"));
  const rootRelative = relative(root, target);
  if (rootRelative === "" || rootRelative.startsWith("..") || isAbsolute(rootRelative)) {
    fail("asset.factory.output-path-escape", "Output paths must remain inside the clean output root.", { field, index, value: outputPath });
  }
  return target;
}

function rootStats(root) {
  try {
    return lstatSync(root);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    fail("asset.factory.output-root-invalid", "The output root could not be inspected.", { outputRoot: "unreadable" });
  }
}

export function assertOutputRoot(rootValue) {
  if (typeof rootValue !== "string" || rootValue.length === 0) {
    fail("asset.factory.output-root-invalid", "outputRoot must be a non-empty directory path.");
  }
  const root = resolve(rootValue);
  const stats = rootStats(root);
  if (stats?.isSymbolicLink() || (stats && !stats.isDirectory())) {
    fail("asset.factory.output-root-invalid", "outputRoot must name a non-symbolic-link directory.", { outputRoot: stats?.isSymbolicLink() ? "symlink" : "file" });
  }
  if (stats) {
    try {
      if (readdirSync(root).length > 0) {
        fail("asset.factory.overwrite", "The output root must be clean when overwritePolicy=fail.", { outputRoot: "not-clean" });
      }
    } catch (error) {
      if (error instanceof AssetFactoryError) throw error;
      fail("asset.factory.output-root-invalid", "The output root could not be read.", { outputRoot: "unreadable" });
    }
  }
  return { root, existed: Boolean(stats) };
}

function ensureDirectory(directory, createdDirectories) {
  const missing = [];
  let current = directory;
  while (true) {
    const stats = rootStats(current);
    if (stats) {
      if (stats.isSymbolicLink() || !stats.isDirectory()) {
        fail("asset.factory.write-failed", "An output directory path is not a directory.", { path: current });
      }
      break;
    }
    missing.push(current);
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  for (const path of missing.reverse()) {
    try {
      mkdirSync(path);
      createdDirectories.push(path);
    } catch (error) {
      if (error?.code === "EEXIST" && rootStats(path)?.isDirectory()) continue;
      throw error;
    }
  }
}

function cleanup(createdFiles, createdDirectories) {
  for (const file of createdFiles.reverse()) {
    try { unlinkSync(file); } catch { /* Preserve the original diagnostic. */ }
  }
  for (const directory of createdDirectories.reverse()) {
    try { rmdirSync(directory); } catch { /* Keep pre-existing or raced content safe. */ }
  }
}

export function assertNoOutputPathCollision(path, outputs) {
  const key = outputPathKey(path);
  if (outputs.some((output) => outputPathKey(output.path) === key)) {
    fail("asset.factory.output-duplicate", "Declared output paths must be unique.", { path, index: "cli.report" });
  }
}

export function writeOutputs(rootInfo, outputBytes) {
  const createdFiles = [];
  const createdDirectories = [];
  const seen = new Set();
  let activeOutput = null;
  try {
    for (const output of outputBytes) {
      const key = outputPathKey(output.path);
      if (seen.has(key)) fail("asset.factory.output-duplicate", "Declared output paths must be unique.", { path: output.path, index: output.index ?? null });
      seen.add(key);
    }
    ensureDirectory(rootInfo.root, createdDirectories);
    for (const output of outputBytes) {
      activeOutput = output;
      const target = assertOutputPathInside(rootInfo.root, output.path, "output.path", output.index ?? null);
      ensureDirectory(dirname(target), createdDirectories);
      createdFiles.push(target);
      writeFileSync(target, bytesFrom(output.bytes), { flag: "wx" });
    }
  } catch (error) {
    cleanup(createdFiles, createdDirectories);
    if (error instanceof AssetFactoryError) throw error;
    if (error?.code === "EEXIST") {
      fail("asset.factory.overwrite", "An output file already exists under the clean output root.", { path: activeOutput?.path ?? null });
    }
    fail("asset.factory.write-failed", "The deterministic output could not be written.", { path: activeOutput?.path ?? null });
  }
}

export function outputKindFromPath(outputPath) {
  const extension = extname(outputPath).toLowerCase();
  if (extension === ".png") return "png";
  if (extension === ".json") return "metadata";
  return null;
}

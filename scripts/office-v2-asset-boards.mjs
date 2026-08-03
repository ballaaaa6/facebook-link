import { existsSync, lstatSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { encodeRgbaPng, hashBytes } from "./office-v2-asset-factory.mjs";

const BOARD_KINDS = Object.freeze(["geometry", "alpha", "palette", "connectivity", "native-scale"]);
const SLUG = /^[a-z0-9]+(?:[a-z0-9_-]*[a-z0-9])?$/u;
const SHA256 = /^[a-f0-9]{64}$/u;

export class AssetBoardError extends Error {
  constructor(code, message, context = {}) {
    super(`[${code}] ${message}${Object.keys(context).length ? ` ${JSON.stringify(context)}` : ""}`);
    this.name = "AssetBoardError";
    this.code = code;
    this.context = Object.freeze({ ...context });
  }
}

function fail(code, message, context = {}) {
  throw new AssetBoardError(code, message, context);
}

function object(value, code, message, context = {}) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) fail(code, message, context);
  return value;
}

function slug(value, field) {
  if (typeof value !== "string" || !SLUG.test(value) || value === "latest") fail(`asset.boards.${field}-invalid`, `${field} must be a stable lower-case identifier.`, { field, value: value ?? null });
  return value;
}

function version(value, field) {
  if (!Number.isSafeInteger(value) || value < 1) fail(`asset.boards.${field}-invalid`, `${field} must be a positive integer.`, { field, value: value ?? null });
  return value;
}

function sha(value, field) {
  if (typeof value !== "string" || !SHA256.test(value)) fail(`asset.boards.${field}-invalid`, `${field} must be a lower-case SHA-256 digest.`, { field });
  return value;
}

function rgba(value, field) {
  if (!(value instanceof Uint8Array) && !Array.isArray(value)) fail("asset.boards.rgba-invalid", `${field} must contain RGBA byte values.`, { field });
  const bytes = Uint8Array.from(value);
  if (bytes.some((byte, index) => !Number.isInteger(value[index]) || value[index] < 0 || value[index] > 255)) fail("asset.boards.rgba-invalid", `${field} contains a value outside 0 through 255.`, { field });
  return bytes;
}

function dimensions(widthPx, heightPx, field) {
  if (!Number.isSafeInteger(widthPx) || !Number.isSafeInteger(heightPx) || widthPx < 1 || heightPx < 1) fail("asset.boards.dimensions-invalid", `${field} dimensions must be positive integers.`, { field, widthPx, heightPx });
  const pixelBytes = widthPx * heightPx * 4;
  if (!Number.isSafeInteger(pixelBytes)) fail("asset.boards.dimensions-invalid", `${field} dimensions exceed the supported pixel buffer.`, { field, widthPx, heightPx });
  return pixelBytes;
}

function color(value, field) {
  const bytes = rgba(value, field);
  if (bytes.length !== 4) fail("asset.boards.palette-invalid", `${field} must be one RGBA color.`, { field });
  return [...bytes];
}

function canonical(value, path = "$") {
  if (value instanceof Uint8Array) return `[${[...value].join(",")}]`;
  if (value === null || typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail("asset.boards.metadata-invalid", "Board metadata numbers must be finite.", { path });
    return Object.is(value, -0) ? "0" : JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map((entry, index) => canonical(entry, `${path}[${index}]`)).join(",")}]`;
  if (typeof value !== "object" || Object.getPrototypeOf(value) !== Object.prototype) fail("asset.boards.metadata-invalid", "Board metadata must be JSON-compatible.", { path });
  return `{${Object.keys(value).sort().map((key) => {
    if (value[key] === undefined) fail("asset.boards.metadata-invalid", "Board metadata cannot contain undefined values.", { path: `${path}.${key}` });
    return `${JSON.stringify(key)}:${canonical(value[key], `${path}.${key}`)}`;
  }).join(",")}}`;
}

function contact(value, index, widthPx, heightPx) {
  object(value, "asset.boards.contact-invalid", "Each contact must be an object.", { index });
  const xPx = value.xPx ?? value.x;
  const yPx = value.yPx ?? value.y;
  if (!SLUG.test(value.id ?? "contact") || !Number.isInteger(xPx) || !Number.isInteger(yPx) || xPx < 0 || yPx < 0 || xPx >= widthPx || yPx >= heightPx) fail("asset.boards.contact-invalid", "Contact coordinates must be stable pixels inside the frame.", { index, id: value.id ?? null, xPx, yPx });
  return { id: value.id ?? `contact-${index}`, xPx, yPx, requiredAlpha: value.requiredAlpha ?? "visible" };
}

function normalizeInput(input) {
  object(input, "asset.boards.input-invalid", "Board input must be an object.");
  if (input.schemaVersion !== "office-asset-board-input-v1") fail("asset.boards.schema-version-invalid", "Board input must use office-asset-board-input-v1.");
  const familyId = slug(input.familyId, "family-id");
  const familyVersion = version(input.familyVersion, "family-version");
  const sourceSha256 = sha(input.sourceSha256, "source-sha256");
  const recipeSha256 = sha(input.recipeSha256, "recipe-sha256");
  object(input.styleProfile, "asset.boards.style-missing", "Board input must declare a style profile.");
  const styleProfile = { id: slug(input.styleProfile.id, "style-profile-id"), version: version(input.styleProfile.version, "style-profile-version"), ...input.styleProfile };
  object(input.geometry, "asset.boards.geometry-missing", "Board input must declare neutral geometry.");
  const geometry = { id: slug(input.geometry.id, "geometry-id"), version: version(input.geometry.version, "geometry-version"), ...input.geometry };
  object(input.alphaPolicy, "asset.boards.alpha-missing", "Board input must declare an alpha policy.");
  object(input.nativeScale, "asset.boards.native-scale-missing", "Board input must declare a native-scale policy.");
  object(input.palette, "asset.boards.palette-missing", "Board input must declare a palette.");
  if (!Array.isArray(input.palette.colors) || input.palette.colors.length === 0) fail("asset.boards.palette-invalid", "Board input must declare at least one palette color.");
  const palette = { ...input.palette, colors: input.palette.colors.map((value, index) => color(value, `palette.colors[${index}]`)) };
  object(input.connectivity, "asset.boards.connectivity-missing", "Board input must declare connectivity metadata.");
  if (!Array.isArray(input.connectivity.supportedMasks) || input.connectivity.supportedMasks.length === 0 || input.connectivity.supportedMasks.some((mask) => !Number.isInteger(mask) || mask < 0 || mask > 15)) fail("asset.boards.mask-invalid", "Connectivity must declare supported masks from 0 through 15.");
  object(input.review, "asset.boards.review-missing", "Board input must declare review state.");
  if (!["pending-owner-review", "approved", "rejected"].includes(input.review.state)) fail("asset.boards.review-state-invalid", "Board review state must be explicit.", { state: input.review.state ?? null });
  if (!Array.isArray(input.frames) || input.frames.length === 0) fail("asset.boards.frames-missing", "Board input must declare at least one source frame.");
  const frameIds = new Set();
  const frames = input.frames.map((rawFrame, index) => {
    object(rawFrame, "asset.boards.frame-invalid", "Each board frame must be an object.", { index });
    const frameId = slug(rawFrame.frameId ?? rawFrame.id, "frame-id");
    if (frameIds.has(frameId)) fail("asset.boards.frame-duplicate", "Frame IDs must be unique.", { frameId });
    frameIds.add(frameId);
    const byteLength = dimensions(rawFrame.widthPx, rawFrame.heightPx, `frames[${index}]`);
    const pixels = rgba(rawFrame.rgba, `frames[${index}].rgba`);
    if (pixels.length !== byteLength) fail("asset.boards.rgba-invalid", "Frame RGBA length does not match dimensions.", { frameId, expected: byteLength, actual: pixels.length });
    if (!Array.isArray(rawFrame.contacts) || rawFrame.contacts.length === 0) fail("asset.boards.contact-missing", "Every frame must declare at least one contact.", { frameId });
    if (!Array.isArray(rawFrame.masks) || rawFrame.masks.length === 0) fail("asset.boards.mask-missing", "Every frame must declare at least one connectivity mask.", { frameId });
    const contacts = rawFrame.contacts.map((value, contactIndex) => contact(value, contactIndex, rawFrame.widthPx, rawFrame.heightPx));
    const masks = [...new Set(rawFrame.masks)].sort((left, right) => left - right);
    if (masks.some((mask) => !Number.isInteger(mask) || mask < 0 || mask > 15)) fail("asset.boards.mask-invalid", "Frame masks must be integers from 0 through 15.", { frameId });
    return { ...rawFrame, frameId, pixels, contacts, masks, pixelSha256: hashBytes(pixels) };
  });
  return { ...input, familyId, familyVersion, sourceSha256, recipeSha256, styleProfile, geometry, palette, frames, connectivity: { ...input.connectivity, supportedMasks: [...new Set(input.connectivity.supportedMasks)].sort((left, right) => left - right) } };
}

function boardPixels(kind, frame, palette) {
  const pixels = Uint8Array.from(frame.pixels);
  if (kind === "alpha") {
    for (let index = 0; index < pixels.length; index += 4) pixels[index] = pixels[index + 1] = pixels[index + 2] = pixels[index + 3], pixels[index + 3] = 255;
  } else if (kind === "palette") {
    for (let index = 0; index < pixels.length; index += 4) {
      let nearest = palette[0];
      let distance = Number.POSITIVE_INFINITY;
      for (const candidate of palette) {
        const delta = (pixels[index] - candidate[0]) ** 2 + (pixels[index + 1] - candidate[1]) ** 2 + (pixels[index + 2] - candidate[2]) ** 2;
        if (delta < distance) { distance = delta; nearest = candidate; }
      }
      pixels.set(nearest, index);
    }
  } else if (kind === "connectivity") {
    for (const point of frame.contacts) {
      const offset = (point.yPx * frame.widthPx + point.xPx) * 4;
      pixels.set([255, 0, 255, 255], offset);
    }
  }
  return pixels;
}

function boardMetadata(input, frame, kind, pixels) {
  return {
    schemaVersion: "office-asset-review-board-v1",
    boardId: `${input.familyId}-${kind}-${frame.frameId}`,
    kind,
    familyRef: { id: input.familyId, version: input.familyVersion },
    frameRef: { id: frame.frameId, version: frame.version ?? 1 },
    sourceSha256: input.sourceSha256,
    recipeSha256: input.recipeSha256,
    styleProfile: input.styleProfile,
    geometry: input.geometry,
    alphaPolicy: input.alphaPolicy,
    palette: input.palette,
    connectivity: input.connectivity,
    contacts: frame.contacts,
    masks: frame.masks,
    nativeScale: input.nativeScale,
    review: input.review,
    dimensions: { widthPx: frame.widthPx, heightPx: frame.heightPx },
    pixelSha256: hashBytes(pixels),
  };
}

function prepare(input) {
  const normalized = normalizeInput(input);
  const outputBytes = [];
  const boards = [];
  for (const frame of normalized.frames) for (const kind of BOARD_KINDS) {
    const pixels = boardPixels(kind, frame, normalized.palette.colors);
    const metadata = boardMetadata(normalized, frame, kind, pixels);
    const base = `office-v2/review-boards/${normalized.familyId}/v${normalized.familyVersion}/${kind}/${frame.frameId}`;
    const png = Buffer.from(encodeRgbaPng({ widthPx: frame.widthPx, heightPx: frame.heightPx, rgba: pixels }));
    const json = Buffer.from(canonical(metadata), "utf8");
    const board = { ...metadata, pngPath: `${base}.png`, metadataPath: `${base}.json`, pngSha256: hashBytes(png), metadataSha256: hashBytes(json) };
    boards.push(board);
    outputBytes.push({ path: board.pngPath, kind: "png", bytes: png, sha256: board.pngSha256 }, { path: board.metadataPath, kind: "metadata", bytes: json, sha256: board.metadataSha256 });
  }
  const unsignedReport = { schemaVersion: "office-asset-review-boards-report-v1", familyRef: { id: normalized.familyId, version: normalized.familyVersion }, sourceSha256: normalized.sourceSha256, recipeSha256: normalized.recipeSha256, review: normalized.review, boardKinds: BOARD_KINDS, boards };
  const reportSha256 = hashBytes(Buffer.from(canonical(unsignedReport), "utf8"));
  return { report: { ...unsignedReport, reportSha256 }, outputBytes };
}

function outputRoot(rootValue) {
  if (typeof rootValue !== "string" || !rootValue) fail("asset.boards.output-root-invalid", "outputRoot must be a non-empty path.");
  const root = resolve(rootValue);
  if (existsSync(root)) {
    const stats = lstatSync(root);
    if (stats.isSymbolicLink() || !stats.isDirectory()) fail("asset.boards.output-root-invalid", "outputRoot must be a non-symbolic-link directory.");
    if (readdirSync(root).length) fail("asset.boards.overwrite", "Review-board output root must be clean.");
  }
  return root;
}

function writeOutputs(rootValue, outputs) {
  const root = outputRoot(rootValue);
  const created = [];
  try {
    for (const output of outputs) {
      if (isAbsolute(output.path) || output.path.includes("\\") || output.path.split("/").some((part) => !part || part === "." || part === "..")) fail("asset.boards.path-invalid", "Board output paths must be safe relative paths.", { path: output.path });
      const target = resolve(root, ...output.path.split("/"));
      const check = relative(root, target);
      if (!check || check.startsWith("..") || isAbsolute(check)) fail("asset.boards.path-invalid", "Board output escaped the clean root.", { path: output.path });
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, output.bytes, { flag: "wx" });
      created.push(target);
    }
  } catch (error) {
    for (const file of created.reverse()) rmSync(file, { force: true });
    if (error instanceof AssetBoardError) throw error;
    if (error?.code === "EEXIST") fail("asset.boards.overwrite", "Board output already exists.");
    throw error;
  }
  return root;
}

export function prepareReviewBoards(input) { return prepare(input); }
export function buildReviewBoards({ input, outputRoot: root } = {}) {
  const prepared = prepare(input);
  if (root !== undefined) writeOutputs(root, prepared.outputBytes);
  return prepared;
}
export function reportText(report) { return canonical(report); }
export { BOARD_KINDS };

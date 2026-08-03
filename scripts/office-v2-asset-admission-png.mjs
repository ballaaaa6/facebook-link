import { createHash } from "node:crypto";
import { inflateSync } from "node:zlib";

export const ASSET_DIAGNOSTIC_VERSION = 1;

const PNG_SIGNATURE = Buffer.from("89504e470d0a1a0a", "hex");
const KNOWN_CHUNKS = new Set([
  "IHDR", "IDAT", "IEND", "PLTE", "tRNS", "cHRM", "gAMA", "iCCP",
  "sRGB", "tEXt", "zTXt", "iTXt", "bKGD", "pHYs", "sBIT", "tIME", "sPLT",
]);
const CRC_TABLE = new Uint32Array(256);
for (let index = 0; index < CRC_TABLE.length; index += 1) {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = (value & 1) ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  CRC_TABLE[index] = value >>> 0;
}

function freezeContext(value) {
  const clone = structuredClone(value);
  const seen = new WeakSet();
  const freeze = (entry) => {
    if (!entry || typeof entry !== "object" || seen.has(entry)) return entry;
    seen.add(entry);
    for (const child of Object.values(entry)) freeze(child);
    return Object.freeze(entry);
  };
  return freeze(clone);
}

export function assetDiagnostic(code, message, context = {}) {
  return Object.freeze({
    code,
    owner: "asset",
    version: ASSET_DIAGNOSTIC_VERSION,
    message,
    context: freezeContext(context),
  });
}

export function formatAssetDiagnostic(diagnostic) {
  const serialized = JSON.stringify(diagnostic.context ?? {});
  return `[${diagnostic.code}] ${diagnostic.message}${serialized && serialized !== "{}" ? ` ${serialized}` : ""}`;
}

export class AssetAdmissionError extends Error {
  constructor(diagnostic) {
    const diagnostics = Object.freeze([...(Array.isArray(diagnostic) ? diagnostic : [diagnostic])]);
    super(diagnostics.map(formatAssetDiagnostic).join("\n"));
    this.name = "AssetAdmissionError";
    this.code = diagnostics[0]?.code ?? "asset.admission-failed";
    this.diagnostic = diagnostics[0] ?? assetDiagnostic(this.code, "Asset admission failed.");
    this.diagnostics = diagnostics;
  }
}

function reject(code, message, context = {}) {
  throw new AssetAdmissionError(assetDiagnostic(code, message, context));
}

function toBuffer(input) {
  if (Buffer.isBuffer(input)) return Buffer.from(input);
  if (input instanceof Uint8Array) return Buffer.from(input);
  if (input instanceof ArrayBuffer) return Buffer.from(new Uint8Array(input));
  reject("asset.png-input-invalid", "PNG input must be a byte buffer.");
}

function crc32(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) value = CRC_TABLE[(value ^ byte) & 0xff] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}

function isCriticalChunk(type) {
  const code = type.charCodeAt(0);
  return code >= 65 && code <= 90;
}

function paeth(left, above, upperLeft) {
  const estimate = left + above - upperLeft;
  const leftDistance = Math.abs(estimate - left);
  const aboveDistance = Math.abs(estimate - above);
  const upperLeftDistance = Math.abs(estimate - upperLeft);
  return leftDistance <= aboveDistance && leftDistance <= upperLeftDistance ? left : aboveDistance <= upperLeftDistance ? above : upperLeft;
}

export function hashBytes(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function contentHash(widthPx, heightPx, rgba) {
  const dimensions = Buffer.allocUnsafe(8);
  dimensions.writeUInt32BE(widthPx, 0);
  dimensions.writeUInt32BE(heightPx, 4);
  return hashBytes(Buffer.concat([dimensions, Buffer.from(rgba)]));
}

export function decodePng(input, { maxDecodedBytes = 64 * 1024 * 1024 } = {}) {
  const bytes = toBuffer(input);
  if (bytes.length < PNG_SIGNATURE.length || !bytes.subarray(0, 8).equals(PNG_SIGNATURE)) {
    reject("asset.png-signature-invalid", "PNG signature is missing or invalid.");
  }
  if (!Number.isSafeInteger(maxDecodedBytes) || maxDecodedBytes < 1) {
    reject("asset.png-limit-invalid", "PNG decoded-byte limit is invalid.");
  }

  let offset = PNG_SIGNATURE.length;
  let chunkIndex = 0;
  let header = null;
  let ended = false;
  let idatEnded = false;
  const idat = [];
  while (offset < bytes.length) {
    if (ended) reject("asset.png-trailing-data", "PNG contains data after IEND.", { offset });
    if (bytes.length - offset < 12) reject("asset.png-truncated", "PNG chunk header or CRC is truncated.", { offset });
    const chunkOffset = offset;
    const length = bytes.readUInt32BE(offset);
    offset += 4;
    if (length > bytes.length - offset - 8) {
      reject("asset.png-truncated", "PNG chunk data or CRC is truncated.", { chunkIndex, chunkOffset, length });
    }
    const typeBytes = bytes.subarray(offset, offset + 4);
    const type = typeBytes.toString("ascii");
    offset += 4;
    if (!/^[A-Za-z]{4}$/.test(type) || type.charCodeAt(2) >= 97) {
      reject("asset.png-chunk-type-invalid", "PNG chunk type is invalid.", { chunkIndex, type });
    }
    const data = bytes.subarray(offset, offset + length);
    offset += length;
    const expectedCrc = bytes.readUInt32BE(offset);
    offset += 4;
    if (crc32(Buffer.concat([typeBytes, data])) !== expectedCrc) {
      reject("asset.png-crc-mismatch", "PNG chunk CRC does not match its data.", { chunkIndex, type });
    }
    if (chunkIndex === 0 && type !== "IHDR") reject("asset.png-ihdr-missing", "PNG must begin with IHDR.", { type });
    if (type === "IHDR") {
      if (header || length !== 13) reject("asset.png-ihdr-invalid", "PNG IHDR is duplicated or malformed.", { length });
      header = {
        widthPx: data.readUInt32BE(0),
        heightPx: data.readUInt32BE(4),
        bitDepth: data[8],
        colorType: data[9],
        compressionMethod: data[10],
        filterMethod: data[11],
        interlaceMethod: data[12],
      };
      if (!header.widthPx || !header.heightPx || header.widthPx > 0x7fffffff || header.heightPx > 0x7fffffff) {
        reject("asset.png-dimensions-invalid", "PNG dimensions are outside the supported range.", { widthPx: header.widthPx, heightPx: header.heightPx });
      }
      if (header.bitDepth !== 8) reject("asset.png-unsupported-bit-depth", "Only 8-bit PNG samples are supported.", { bitDepth: header.bitDepth });
      if (header.colorType !== 6) reject("asset.png-unsupported-color-type", "Only RGBA PNG color type 6 is supported.", { colorType: header.colorType });
      if (header.compressionMethod !== 0 || header.filterMethod !== 0) {
        reject("asset.png-unsupported-method", "PNG compression and filter methods are unsupported.", { compressionMethod: header.compressionMethod, filterMethod: header.filterMethod });
      }
      if (header.interlaceMethod !== 0) reject("asset.png-unsupported-interlace", "Interlaced PNGs are not supported.", { interlaceMethod: header.interlaceMethod });
    } else if (type === "IDAT") {
      if (!header) reject("asset.png-ihdr-missing", "PNG IDAT appears before IHDR.");
      if (idatEnded) reject("asset.png-idat-order-invalid", "PNG IDAT chunks must be consecutive.");
      idat.push(data);
    } else if (type === "IEND") {
      if (!header || length !== 0) reject("asset.png-iend-invalid", "PNG IEND is missing, duplicated, or malformed.", { length });
      ended = true;
    } else {
      if (idat.length) idatEnded = true;
      if (isCriticalChunk(type) && !KNOWN_CHUNKS.has(type)) reject("asset.png-unsupported-chunk", "PNG contains an unsupported critical chunk.", { type });
    }
    chunkIndex += 1;
  }
  if (!header) reject("asset.png-ihdr-missing", "PNG IHDR is missing.");
  if (!idat.length) reject("asset.png-idat-missing", "PNG contains no IDAT data.");
  if (!ended) reject("asset.png-iend-missing", "PNG IEND is missing.");

  const rowBytes = header.widthPx * 4;
  const rowWithFilter = rowBytes + 1;
  const decodedBytes = rowWithFilter * header.heightPx;
  if (!Number.isSafeInteger(decodedBytes) || decodedBytes > maxDecodedBytes) {
    reject("asset.png-size-limit", "PNG decoded pixel data exceeds the admission limit.", { widthPx: header.widthPx, heightPx: header.heightPx, maxDecodedBytes });
  }
  let filtered;
  try {
    filtered = inflateSync(Buffer.concat(idat), { maxOutputLength: maxDecodedBytes });
  } catch (error) {
    if (error?.code === "ERR_BUFFER_TOO_LARGE") reject("asset.png-size-limit", "PNG decoded pixel data exceeds the admission limit.", { maxDecodedBytes });
    reject("asset.png-decompression-failed", "PNG IDAT data could not be decompressed.");
  }
  if (filtered.length !== decodedBytes) {
    reject("asset.png-scanline-length", "PNG decompressed scanlines do not match IHDR dimensions.", { expectedBytes: decodedBytes, actualBytes: filtered.length });
  }
  const rgba = Buffer.alloc(rowBytes * header.heightPx);
  let sourceOffset = 0;
  let outputOffset = 0;
  let previous = Buffer.alloc(rowBytes);
  for (let row = 0; row < header.heightPx; row += 1) {
    const filter = filtered[sourceOffset++];
    if (filter > 4) reject("asset.png-filter-unsupported", "PNG scanline uses an unsupported filter method.", { row, filter });
    const current = Buffer.alloc(rowBytes);
    for (let index = 0; index < rowBytes; index += 1) {
      const left = index >= 4 ? current[index - 4] : 0;
      const above = previous[index];
      const upperLeft = index >= 4 ? previous[index - 4] : 0;
      const value = filtered[sourceOffset++];
      const predictor = filter === 0 ? 0 : filter === 1 ? left : filter === 2 ? above : filter === 3 ? Math.floor((left + above) / 2) : paeth(left, above, upperLeft);
      current[index] = (value + predictor) & 0xff;
    }
    current.copy(rgba, outputOffset);
    outputOffset += rowBytes;
    previous = current;
  }
  const pixels = Uint8Array.from(rgba);
  return {
    widthPx: header.widthPx,
    heightPx: header.heightPx,
    width: header.widthPx,
    height: header.heightPx,
    bitDepth: header.bitDepth,
    colorType: header.colorType,
    interlaceMethod: header.interlaceMethod,
    rgba: pixels,
    rgbaBytes: pixels,
    pixels,
    pngSha256: hashBytes(bytes),
    pixelSha256: hashBytes(pixels),
    contentSha256: contentHash(header.widthPx, header.heightPx, pixels),
  };
}

function decodedInput(input) {
  if (input && Number.isSafeInteger(input.widthPx) && input.widthPx > 0 && Number.isSafeInteger(input.heightPx) && input.heightPx > 0 && input.rgba instanceof Uint8Array) {
    const expected = input.widthPx * input.heightPx * 4;
    if (Number.isSafeInteger(expected) && expected === input.rgba.length) return input;
  }
  if (input && input.widthPx !== undefined) reject("asset.pixel-buffer-invalid", "Decoded RGBA byte length does not match dimensions.", { widthPx: input.widthPx, heightPx: input.heightPx });
  return decodePng(input);
}

export function pixelAt(input, x, y) {
  const decoded = decodedInput(input);
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= decoded.widthPx || y >= decoded.heightPx) {
    reject("asset.pixel-coordinate-invalid", "Pixel coordinate is outside the decoded canvas.", { x, y, widthPx: decoded.widthPx, heightPx: decoded.heightPx });
  }
  const offset = (y * decoded.widthPx + x) * 4;
  return [decoded.rgba[offset], decoded.rgba[offset + 1], decoded.rgba[offset + 2], decoded.rgba[offset + 3]];
}

export function inspectPixels(input) {
  const decoded = decodedInput(input);
  let transparentPixels = 0;
  let translucentPixels = 0;
  let opaquePixels = 0;
  let minAlpha = 255;
  let maxAlpha = 0;
  let minX = decoded.widthPx;
  let minY = decoded.heightPx;
  let maxX = -1;
  let maxY = -1;
  const colors = new Set();
  for (let index = 0; index < decoded.rgba.length; index += 4) {
    const alpha = decoded.rgba[index + 3];
    const pixelIndex = index / 4;
    const x = pixelIndex % decoded.widthPx;
    const y = Math.floor(pixelIndex / decoded.widthPx);
    colors.add(`${decoded.rgba[index]},${decoded.rgba[index + 1]},${decoded.rgba[index + 2]},${alpha}`);
    minAlpha = Math.min(minAlpha, alpha);
    maxAlpha = Math.max(maxAlpha, alpha);
    if (alpha === 0) transparentPixels += 1;
    else {
      if (alpha === 255) opaquePixels += 1;
      else translucentPixels += 1;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  const alpha = { transparentPixels, translucentPixels, opaquePixels, minAlpha, maxAlpha, hasTransparency: transparentPixels > 0, hasTranslucency: translucentPixels > 0 };
  return {
    widthPx: decoded.widthPx,
    heightPx: decoded.heightPx,
    pixelCount: decoded.widthPx * decoded.heightPx,
    rgba: Uint8Array.from(decoded.rgba),
    alpha,
    transparentPixels,
    translucentPixels,
    opaquePixels,
    minAlpha,
    maxAlpha,
    uniqueColorCount: colors.size,
    visibleBounds: maxX < 0 ? null : { xPx: minX, yPx: minY, widthPx: maxX - minX + 1, heightPx: maxY - minY + 1 },
    pixelSha256: decoded.pixelSha256 ?? hashBytes(decoded.rgba),
    contentSha256: decoded.contentSha256 ?? contentHash(decoded.widthPx, decoded.heightPx, decoded.rgba),
  };
}

function rgbaValue(value) {
  if (Array.isArray(value) && value.length === 4 && value.every((part) => Number.isInteger(part) && part >= 0 && part <= 255)) return [...value];
  if (typeof value === "string" && /^#[0-9a-f]{8}$/i.test(value)) return [...value.slice(1).matchAll(/../g)].map((match) => Number.parseInt(match[0], 16));
  return null;
}

function contextPixel(decoded, x, y) {
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= decoded.widthPx || y >= decoded.heightPx) return null;
  const offset = (y * decoded.widthPx + x) * 4;
  return [decoded.rgba[offset], decoded.rgba[offset + 1], decoded.rgba[offset + 2], decoded.rgba[offset + 3]];
}

export function validatePixelContext(input, context = {}) {
  const decoded = decodedInput(input);
  if (!context || typeof context !== "object" || Array.isArray(context)) reject("asset.pixel-context-invalid", "Pixel validation context must be an object.");
  const inspection = inspectPixels(decoded);
  const diagnostics = [];
  const add = (code, message, details) => diagnostics.push(assetDiagnostic(code, message, details));
  const dimensions = context.dimensions ?? context.expectedDimensions;
  if (dimensions && (dimensions.widthPx !== inspection.widthPx || dimensions.heightPx !== inspection.heightPx)) add("asset.pixel-dimensions-mismatch", "Pixel context dimensions do not match decoded PNG.", { expected: dimensions, actual: { widthPx: inspection.widthPx, heightPx: inspection.heightPx } });
  const frame = context.frame ?? context.frameBounds;
  if (frame) {
    const valid = [frame.xPx ?? frame.x, frame.yPx ?? frame.y, frame.widthPx, frame.heightPx].every(Number.isInteger)
      && (frame.xPx ?? frame.x) >= 0 && (frame.yPx ?? frame.y) >= 0 && frame.widthPx > 0 && frame.heightPx > 0
      && (frame.xPx ?? frame.x) + frame.widthPx <= inspection.widthPx && (frame.yPx ?? frame.y) + frame.heightPx <= inspection.heightPx;
    if (!valid) add("asset.frame-invalid", "Declared pixel frame is outside the decoded canvas.", { frame });
  }
  const alphaRules = context.alpha ?? context.alphaPolicy ?? {};
  if (alphaRules.requireOpaque && inspection.alpha.opaquePixels !== inspection.pixelCount) add("asset.alpha-invalid", "Pixel context requires every pixel to be opaque.", { rule: "require-opaque" });
  if (alphaRules.requireTransparentBorder || alphaRules.border === "transparent") {
    const edgeX = [...new Set([0, inspection.widthPx - 1])];
    const edgeY = [...new Set([0, inspection.heightPx - 1])];
    for (const x of edgeX) for (const y of edgeY) if (contextPixel(decoded, x, y)[3] !== 0) add("asset.alpha-invalid", "Pixel context requires a transparent canvas border.", { rule: "transparent-border", x, y });
    for (let x = 1; x < inspection.widthPx - 1; x += 1) for (const y of edgeY) if (contextPixel(decoded, x, y)[3] !== 0) add("asset.alpha-invalid", "Pixel context requires a transparent canvas border.", { rule: "transparent-border", x, y });
    for (let y = 1; y < inspection.heightPx - 1; y += 1) for (const x of edgeX) if (contextPixel(decoded, x, y)[3] !== 0) add("asset.alpha-invalid", "Pixel context requires a transparent canvas border.", { rule: "transparent-border", x, y });
  }
  if (Number.isInteger(alphaRules.minOpaquePixels) && inspection.opaquePixels < alphaRules.minOpaquePixels) add("asset.alpha-invalid", "Pixel context has too few opaque pixels.", { minimum: alphaRules.minOpaquePixels, actual: inspection.opaquePixels });
  if (Number.isInteger(alphaRules.maxTranslucentPixels) && inspection.translucentPixels > alphaRules.maxTranslucentPixels) add("asset.alpha-invalid", "Pixel context has too many translucent pixels.", { maximum: alphaRules.maxTranslucentPixels, actual: inspection.translucentPixels });
  const pixelRules = context.pixels ?? {};
  for (const rule of pixelRules.required ?? context.requiredPixels ?? []) {
    const x = rule.xPx ?? rule.x;
    const y = rule.yPx ?? rule.y;
    const actual = contextPixel(decoded, x, y);
    const expected = rgbaValue(rule.rgba ?? rule.value);
    if (!actual || !expected || actual.some((value, index) => value !== expected[index])) add("asset.pixel-mismatch", "Required pixel does not match decoded RGBA data.", { x, y, expected, actual });
  }
  for (const rule of pixelRules.forbidden ?? context.forbiddenPixels ?? []) {
    const actual = contextPixel(decoded, rule.xPx ?? rule.x, rule.yPx ?? rule.y);
    const forbidden = rgbaValue(rule.rgba ?? rule.value);
    if (actual && forbidden && actual.every((value, index) => value === forbidden[index])) add("asset.pixel-forbidden", "Forbidden pixel is present in decoded RGBA data.", { x: rule.xPx ?? rule.x, y: rule.yPx ?? rule.y, value: forbidden });
  }
  const palette = context.palette;
  if (palette?.maxColors !== undefined && inspection.uniqueColorCount > palette.maxColors) add("asset.palette-invalid", "Decoded PNG contains more colors than the pixel context permits.", { maximum: palette.maxColors, actual: inspection.uniqueColorCount });
  if (Array.isArray(palette?.allowed)) {
    const allowed = new Set(palette.allowed.map(rgbaValue).filter(Boolean).map((value) => value.join(",")));
    for (let index = 0; index < decoded.rgba.length; index += 4) {
      const value = [...decoded.rgba.slice(index, index + 4)];
      if (!allowed.has(value.join(","))) { add("asset.palette-invalid", "Decoded PNG contains a color outside the pixel context palette.", { value }); break; }
    }
  }
  for (const contact of context.contacts ?? context.pixelContacts ?? []) {
    const x = contact.xPx ?? contact.x;
    const y = contact.yPx ?? contact.y;
    const actual = contextPixel(decoded, x, y);
    const required = contact.requiredAlpha ?? "visible";
    const valid = actual && (required === "opaque" ? actual[3] === 255 : required === "transparent" ? actual[3] === 0 : actual[3] > 0);
    if (!valid) add("asset.contact-mismatch", "Declared pixel contact is not satisfied by decoded alpha.", { id: contact.id ?? null, x, y, requiredAlpha: required, actualAlpha: actual?.[3] ?? null });
  }
  const seams = Array.isArray(context.seams) ? context.seams : context.seams?.pairs ?? [];
  for (const seam of seams) {
    const first = contextPixel(decoded, seam.first?.xPx ?? seam.first?.x, seam.first?.yPx ?? seam.first?.y);
    const second = contextPixel(decoded, seam.second?.xPx ?? seam.second?.x, seam.second?.yPx ?? seam.second?.y);
    if (!first || !second || first.some((value, index) => value !== second[index])) add("asset.seam-mismatch", "Declared seam pixels do not match.", { id: seam.id ?? null });
  }
  return { ok: diagnostics.length === 0, diagnostics, inspection };
}

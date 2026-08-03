import { createHash } from "node:crypto";
import { constants as zlibConstants, deflateSync } from "node:zlib";
import { fail } from "./office-v2-asset-factory-errors.mjs";

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const CRC_TABLE = createCrcTable();

export function bytesFrom(value, code = "asset.factory.bytes-invalid", context = {}) {
  if (value instanceof Uint8Array) return Buffer.from(value);
  if (value instanceof ArrayBuffer) return Buffer.from(new Uint8Array(value));
  if (Array.isArray(value)) {
    if (value.some((byte) => !Number.isInteger(byte) || byte < 0 || byte > 255)) {
      fail(code, "Byte values must be integers from 0 through 255.", context);
    }
    return Buffer.from(value);
  }
  fail(code, "Expected a Uint8Array or an array of byte values.", context);
}

function createCrcTable() {
  const table = new Uint32Array(256);
  for (let index = 0; index < table.length; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) === 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
}

function crc32(typeBytes, data) {
  let value = 0xffffffff;
  for (const byte of typeBytes) value = CRC_TABLE[(value ^ byte) & 0xff] ^ (value >>> 8);
  for (const byte of data) value = CRC_TABLE[(value ^ byte) & 0xff] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  typeBytes.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(typeBytes, data), data.length + 8);
  return chunk;
}

function canonicalJson(value, path = "$") {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail("asset.factory.input-json-invalid", "JSON values must be finite numbers.", { path });
    return Object.is(value, -0) ? "0" : JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map((entry, index) => canonicalJson(entry, `${path}[${index}]`)).join(",")}]`;
  if (typeof value !== "object" || Object.getPrototypeOf(value) !== Object.prototype) {
    fail("asset.factory.input-json-invalid", "Source and recipe values must be JSON-compatible.", { path });
  }
  const entries = Object.keys(value).sort((left, right) => (left < right ? -1 : left > right ? 1 : 0)).map((key) => {
    if (value[key] === undefined) fail("asset.factory.input-json-invalid", "Undefined values are not valid JSON input.", { path: `${path}.${key}` });
    return `${JSON.stringify(key)}:${canonicalJson(value[key], `${path}.${key}`)}`;
  });
  return `{${entries.join(",")}}`;
}

export function canonicalBytes(value) {
  return Buffer.from(canonicalJson(value), "utf8");
}

export function canonicalJsonText(value) {
  return canonicalJson(value);
}

/** Encode one deterministic, non-interlaced 8-bit RGBA PNG. */
export function encodeRgbaPng({ widthPx, heightPx, rgba } = {}, assertDimensions) {
  const sizes = assertDimensions(widthPx, heightPx);
  const pixels = bytesFrom(rgba, "asset.factory.rgba-invalid", { widthPx, heightPx });
  if (pixels.length !== sizes.byteLength) {
    fail("asset.factory.rgba-invalid", "RGBA byte length must equal widthPx * heightPx * 4.", {
      widthPx,
      heightPx,
      expectedBytes: sizes.byteLength,
      actualBytes: pixels.length,
    });
  }

  const scanlines = Buffer.alloc(sizes.scanlineBytes * heightPx);
  for (let row = 0; row < heightPx; row += 1) {
    const sourceStart = row * sizes.rowBytes;
    const targetStart = row * sizes.scanlineBytes;
    scanlines[targetStart] = 0;
    pixels.copy(scanlines, targetStart + 1, sourceStart, sourceStart + sizes.rowBytes);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(widthPx, 0);
  ihdr.writeUInt32BE(heightPx, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  const compressed = deflateSync(scanlines, {
    level: 9,
    memLevel: 8,
    strategy: zlibConstants.Z_DEFAULT_STRATEGY,
    windowBits: 15,
  });
  return new Uint8Array(Buffer.concat([
    PNG_SIGNATURE,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", compressed),
    pngChunk("IEND", Buffer.alloc(0)),
  ]));
}

/** Return the lower-case SHA-256 digest of a byte sequence. */
export function hashBytes(bytes) {
  return createHash("sha256").update(bytesFrom(bytes)).digest("hex");
}

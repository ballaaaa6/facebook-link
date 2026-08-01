import { canonicalJsonBytes, type JsonObject, type JsonValue } from "./canonical-json.ts";

export const CANONICAL_JSON_VERSION = "office-canonical-json-v1";
export const SHA256_ENVELOPE_VERSION = "office-sha256-envelope-v1";

export interface CanonicalHashOptions {
  readonly domain: string;
  readonly domainVersion: string;
  readonly payload: JsonValue;
  readonly envelopeVersion?: string;
  readonly canonicalizationVersion?: string;
}

export interface CanonicalHashEnvelope extends JsonObject {
  readonly envelopeVersion: string;
  readonly canonicalizationVersion: string;
  readonly domain: string;
  readonly domainVersion: string;
  readonly payload: JsonValue;
}

const SHA256_CONSTANTS = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

function rightRotate(value: number, amount: number): number {
  return ((value >>> amount) | (value << (32 - amount))) >>> 0;
}

export function sha256Digest(input: Uint8Array): Uint8Array {
  const bitLength = input.length * 8;
  const paddedLength = Math.ceil((input.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(input);
  padded[input.length] = 0x80;
  const highLength = Math.floor(bitLength / 0x100000000);
  const lowLength = bitLength >>> 0;
  padded[paddedLength - 8] = (highLength >>> 24) & 0xff;
  padded[paddedLength - 7] = (highLength >>> 16) & 0xff;
  padded[paddedLength - 6] = (highLength >>> 8) & 0xff;
  padded[paddedLength - 5] = highLength & 0xff;
  padded[paddedLength - 4] = (lowLength >>> 24) & 0xff;
  padded[paddedLength - 3] = (lowLength >>> 16) & 0xff;
  padded[paddedLength - 2] = (lowLength >>> 8) & 0xff;
  padded[paddedLength - 1] = lowLength & 0xff;

  const hash = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]);
  const words = new Uint32Array(64);
  for (let offset = 0; offset < padded.length; offset += 64) {
    for (let index = 0; index < 16; index += 1) {
      const position = offset + index * 4;
      words[index] = (
        ((padded[position] ?? 0) << 24)
        | ((padded[position + 1] ?? 0) << 16)
        | ((padded[position + 2] ?? 0) << 8)
        | (padded[position + 3] ?? 0)
      ) >>> 0;
    }
    for (let index = 16; index < 64; index += 1) {
      const first = words[index - 15] ?? 0;
      const second = words[index - 2] ?? 0;
      const smallSigma0 = rightRotate(first, 7) ^ rightRotate(first, 18) ^ (first >>> 3);
      const smallSigma1 = rightRotate(second, 17) ^ rightRotate(second, 19) ^ (second >>> 10);
      words[index] = ((words[index - 16] ?? 0) + smallSigma0 + (words[index - 7] ?? 0) + smallSigma1) >>> 0;
    }

    let a = hash[0] ?? 0;
    let b = hash[1] ?? 0;
    let c = hash[2] ?? 0;
    let d = hash[3] ?? 0;
    let e = hash[4] ?? 0;
    let f = hash[5] ?? 0;
    let g = hash[6] ?? 0;
    let h = hash[7] ?? 0;
    for (let index = 0; index < 64; index += 1) {
      const bigSigma1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const choice = (e & f) ^ (~e & g);
      const temporary1 = (h + bigSigma1 + choice + (SHA256_CONSTANTS[index] ?? 0) + (words[index] ?? 0)) >>> 0;
      const bigSigma0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const majority = (a & b) ^ (a & c) ^ (b & c);
      const temporary2 = (bigSigma0 + majority) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + temporary1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temporary1 + temporary2) >>> 0;
    }
    hash[0] = ((hash[0] ?? 0) + a) >>> 0;
    hash[1] = ((hash[1] ?? 0) + b) >>> 0;
    hash[2] = ((hash[2] ?? 0) + c) >>> 0;
    hash[3] = ((hash[3] ?? 0) + d) >>> 0;
    hash[4] = ((hash[4] ?? 0) + e) >>> 0;
    hash[5] = ((hash[5] ?? 0) + f) >>> 0;
    hash[6] = ((hash[6] ?? 0) + g) >>> 0;
    hash[7] = ((hash[7] ?? 0) + h) >>> 0;
  }

  const output = new Uint8Array(32);
  for (let index = 0; index < hash.length; index += 1) {
    const word = hash[index] ?? 0;
    output[index * 4] = word >>> 24;
    output[index * 4 + 1] = word >>> 16;
    output[index * 4 + 2] = word >>> 8;
    output[index * 4 + 3] = word;
  }
  return output;
}

export function sha256Hex(input: Uint8Array): string {
  return [...sha256Digest(input)].map((value) => value.toString(16).padStart(2, "0")).join("");
}

function requireEnvelopeString(value: string, name: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new TypeError("contract.hash-envelope-invalid: " + name + " must be a non-empty string");
  }
  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index);
    const isHigh = codeUnit >= 0xd800 && codeUnit <= 0xdbff;
    const isLow = codeUnit >= 0xdc00 && codeUnit <= 0xdfff;
    if (isLow || (isHigh && !(
      index + 1 < value.length
      && value.charCodeAt(index + 1) >= 0xdc00
      && value.charCodeAt(index + 1) <= 0xdfff
    ))) {
      throw new TypeError("contract.hash-envelope-invalid: " + name + " contains a lone surrogate");
    }
    if (isHigh) index += 1;
  }
  return value;
}

export function createCanonicalHashEnvelope(options: CanonicalHashOptions): CanonicalHashEnvelope {
  const envelopeVersion = requireEnvelopeString(options.envelopeVersion ?? SHA256_ENVELOPE_VERSION, "envelopeVersion");
  const canonicalizationVersion = requireEnvelopeString(
    options.canonicalizationVersion ?? CANONICAL_JSON_VERSION,
    "canonicalizationVersion",
  );
  const domain = requireEnvelopeString(options.domain, "domain");
  const domainVersion = requireEnvelopeString(options.domainVersion, "domainVersion");
  return {
    envelopeVersion,
    canonicalizationVersion,
    domain,
    domainVersion,
    payload: options.payload,
  };
}

export function canonicalHashBytes(options: CanonicalHashOptions): Uint8Array {
  return canonicalJsonBytes(createCanonicalHashEnvelope(options));
}

export function canonicalHashHex(options: CanonicalHashOptions): string {
  return sha256Hex(canonicalHashBytes(options));
}

export const hashCanonicalJson = canonicalHashHex;

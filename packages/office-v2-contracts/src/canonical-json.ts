export type JsonPrimitive = null | boolean | number | string;
export type JsonArray = ReadonlyArray<JsonValue>;
export type JsonObject = { readonly [key: string]: JsonValue };
export type JsonValue = JsonPrimitive | JsonArray | JsonObject;

export type CanonicalJsonErrorCode =
  | "contract.json-utf8-invalid"
  | "contract.json-duplicate-key"
  | "contract.json-surrogate"
  | "contract.json-number-invalid"
  | "contract.json-number-unsafe"
  | "contract.json-value-invalid"
  | "contract.collection-declaration-invalid"
  | "contract.collection-key-invalid";

export class CanonicalJsonError extends Error {
  readonly code: CanonicalJsonErrorCode;
  readonly path: string;
  readonly offset: number | null;

  constructor(code: CanonicalJsonErrorCode, message: string, path = "", offset: number | null = null) {
    super(message);
    this.name = "CanonicalJsonError";
    this.code = code;
    this.path = path;
    this.offset = offset;
  }
}

const MAX_SAFE_JSON_NUMBER = Number.MAX_SAFE_INTEGER;

function pointerEscape(value: string): string {
  return value.replaceAll("~", "~0").replaceAll("/", "~1");
}

function pointerJoin(pointer: string, segment: string): string {
  return pointer + "/" + pointerEscape(segment);
}

function fail(
  code: CanonicalJsonErrorCode,
  message: string,
  path = "",
  offset: number | null = null,
): never {
  throw new CanonicalJsonError(code, message, path, offset);
}

function assertWellFormedString(value: string, path = "", offset: number | null = null): void {
  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index);
    const isHighSurrogate = codeUnit >= 0xd800 && codeUnit <= 0xdbff;
    const isLowSurrogate = codeUnit >= 0xdc00 && codeUnit <= 0xdfff;
    if (isLowSurrogate || (isHighSurrogate && !(
      index + 1 < value.length
      && value.charCodeAt(index + 1) >= 0xdc00
      && value.charCodeAt(index + 1) <= 0xdfff
    ))) {
      fail("contract.json-surrogate", "String contains a lone UTF-16 surrogate.", path, offset);
    }
    if (isHighSurrogate) index += 1;
  }
}

function isPlainObject(value: object): boolean {
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function assertNumber(value: number, path: string): void {
  if (!Number.isFinite(value) || Math.abs(value) > MAX_SAFE_JSON_NUMBER) {
    fail("contract.json-number-unsafe", "Number is non-finite or outside the safe JSON range.", path);
  }
}

function assertJsonValue(value: unknown, path = ""): asserts value is JsonValue {
  if (value === null || typeof value === "boolean") return;
  if (typeof value === "number") {
    assertNumber(value, path);
    return;
  }
  if (typeof value === "string") {
    assertWellFormedString(value, path);
    return;
  }
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      if (!Object.hasOwn(value, index)) fail("contract.json-value-invalid", "Sparse arrays are not canonical JSON values.", path);
      assertJsonValue(value[index], pointerJoin(path, String(index)));
    }
    return;
  }
  if (typeof value !== "object" || !isPlainObject(value)) {
    fail("contract.json-value-invalid", "Value is not a JSON primitive, array, or plain object.", path);
  }
  if (Reflect.ownKeys(value).some((key) => typeof key !== "string")) {
    fail("contract.json-value-invalid", "Symbol properties are not canonical JSON values.", path);
  }
  const objectValue = value as JsonObject;
  for (const key of Object.keys(objectValue)) {
    assertWellFormedString(key, pointerJoin(path, key));
    assertJsonValue(objectValue[key], pointerJoin(path, key));
  }
}

function compareUtf16(left: string, right: string): number {
  const length = Math.min(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const difference = left.charCodeAt(index) - right.charCodeAt(index);
    if (difference !== 0) return difference;
  }
  return left.length - right.length;
}

function serializeString(value: string): string {
  const serialized = JSON.stringify(value);
  if (typeof serialized !== "string") fail("contract.json-value-invalid", "String could not be serialized.");
  return serialized;
}

function serializeNumber(value: number, path: string): string {
  assertNumber(value, path);
  const normalized = Object.is(value, -0) ? 0 : value;
  const serialized = JSON.stringify(normalized);
  if (typeof serialized !== "string") fail("contract.json-number-invalid", "Number could not be serialized.", path);
  return serialized;
}

function serializeJson(value: JsonValue, path: string): string {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return serializeNumber(value, path);
  if (typeof value === "string") {
    assertWellFormedString(value, path);
    return serializeString(value);
  }
  if (Array.isArray(value)) {
    return "[" + value.map((entry, index) => serializeJson(entry, pointerJoin(path, String(index)))).join(",") + "]";
  }
  if (!isPlainObject(value)) fail("contract.json-value-invalid", "Value is not a plain object.", path);
  const objectValue = value as JsonObject;
  const keys = Object.keys(objectValue).sort(compareUtf16);
  const members = keys.map((key) => {
    const child = objectValue[key];
    if (child === undefined) fail("contract.json-value-invalid", "Object property is undefined.", pointerJoin(path, key));
    return serializeString(key) + ":" + serializeJson(child, pointerJoin(path, key));
  });
  return "{" + members.join(",") + "}";
}

class JsonParser {
  private cursor = 0;
  private readonly text: string;

  constructor(text: string) {
    this.text = text;
  }

  parse(): JsonValue {
    this.skipWhitespace();
    const value = this.parseValue("");
    this.skipWhitespace();
    if (this.cursor !== this.text.length) this.error("contract.json-value-invalid", "Unexpected trailing JSON input.");
    return value;
  }

  private error(code: CanonicalJsonErrorCode, message: string, path = ""): never {
    return fail(code, message, path, this.cursor);
  }

  private skipWhitespace(): void {
    while (this.cursor < this.text.length && /[\u0020\u0009\u000a\u000d]/u.test(this.text[this.cursor] ?? "")) {
      this.cursor += 1;
    }
  }

  private parseValue(path: string): JsonValue {
    const character = this.text[this.cursor];
    if (character === "{") return this.parseObject(path);
    if (character === "[") return this.parseArray(path);
    if (character === '"') return this.parseString(path);
    if (character === "t") return this.parseLiteral("true", true, path);
    if (character === "f") return this.parseLiteral("false", false, path);
    if (character === "n") return this.parseLiteral("null", null, path);
    if (character === "-" || (character !== undefined && /\d/u.test(character))) {
      return this.parseNumber(path);
    }
    return this.error("contract.json-value-invalid", "Unexpected JSON token.", path);
  }

  private parseLiteral<T extends JsonPrimitive>(literal: string, value: T, path: string): T {
    if (!this.text.startsWith(literal, this.cursor)) {
      return this.error("contract.json-value-invalid", "Invalid JSON literal.", path);
    }
    this.cursor += literal.length;
    return value;
  }

  private parseString(path: string): string {
    const start = this.cursor;
    this.cursor += 1;
    while (this.cursor < this.text.length) {
      const codeUnit = this.text.charCodeAt(this.cursor);
      if (codeUnit === 0x22) {
        this.cursor += 1;
        const token = this.text.slice(start, this.cursor);
        try {
          const value = JSON.parse(token);
          if (typeof value !== "string") return this.error("contract.json-value-invalid", "JSON string token was not a string.", path);
          assertWellFormedString(value, path, start);
          return value;
        } catch (error) {
          if (error instanceof CanonicalJsonError) throw error;
          return this.error("contract.json-value-invalid", "Invalid JSON string escape.", path);
        }
      }
      if (codeUnit < 0x20) return this.error("contract.json-value-invalid", "JSON strings cannot contain control characters.", path);
      if (codeUnit === 0x5c) {
        this.cursor += 1;
        if (this.cursor >= this.text.length) return this.error("contract.json-value-invalid", "Unterminated JSON string.", path);
        if (this.text[this.cursor] === "u") this.cursor += 5;
        else this.cursor += 1;
      } else {
        this.cursor += 1;
      }
    }
    return this.error("contract.json-value-invalid", "Unterminated JSON string.", path);
  }

  private parseNumber(path: string): number {
    const match = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/u.exec(this.text.slice(this.cursor));
    if (!match) return this.error("contract.json-number-invalid", "Invalid JSON number.", path);
    const token = match[0];
    const value = Number(token);
    if (!Number.isFinite(value) || Math.abs(value) > MAX_SAFE_JSON_NUMBER) {
      return this.error("contract.json-number-unsafe", "JSON number is non-finite or outside the safe range.", path);
    }
    this.cursor += token.length;
    return Object.is(value, -0) ? 0 : value;
  }

  private parseObject(path: string): JsonObject {
    const result = Object.create(null) as Record<string, JsonValue>;
    this.cursor += 1;
    this.skipWhitespace();
    if (this.text[this.cursor] === "}") {
      this.cursor += 1;
      return result;
    }
    while (this.cursor < this.text.length) {
      if (this.text[this.cursor] !== '"') return this.error("contract.json-value-invalid", "Object keys must be JSON strings.", path);
      const key = this.parseString(path);
      if (Object.hasOwn(result, key)) {
        return this.error("contract.json-duplicate-key", "Duplicate object key " + JSON.stringify(key) + ".", pointerJoin(path, key));
      }
      this.skipWhitespace();
      if (this.text[this.cursor] !== ":") return this.error("contract.json-value-invalid", "Object member is missing a colon.", pointerJoin(path, key));
      this.cursor += 1;
      this.skipWhitespace();
      result[key] = this.parseValue(pointerJoin(path, key));
      this.skipWhitespace();
      if (this.text[this.cursor] === "}") {
        this.cursor += 1;
        return result;
      }
      if (this.text[this.cursor] !== ",") return this.error("contract.json-value-invalid", "Object member is missing a comma.", path);
      this.cursor += 1;
      this.skipWhitespace();
    }
    return this.error("contract.json-value-invalid", "Unterminated JSON object.", path);
  }

  private parseArray(path: string): JsonArray {
    const result: JsonValue[] = [];
    this.cursor += 1;
    this.skipWhitespace();
    if (this.text[this.cursor] === "]") {
      this.cursor += 1;
      return result;
    }
    while (this.cursor < this.text.length) {
      result.push(this.parseValue(pointerJoin(path, String(result.length))));
      this.skipWhitespace();
      if (this.text[this.cursor] === "]") {
        this.cursor += 1;
        return result;
      }
      if (this.text[this.cursor] !== ",") return this.error("contract.json-value-invalid", "Array value is missing a comma.", path);
      this.cursor += 1;
      this.skipWhitespace();
    }
    return this.error("contract.json-value-invalid", "Unterminated JSON array.", path);
  }
}

export function parseJsonText(text: string): JsonValue {
  assertWellFormedString(text);
  return new JsonParser(text).parse();
}

export function parseJsonBytes(input: Uint8Array | ArrayBuffer): JsonValue {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    fail("contract.json-utf8-invalid", "Input is not valid UTF-8.");
  }
  return parseJsonText(text);
}

export const loadJsonRejectingDuplicates = parseJsonBytes;

export function canonicalJson(value: JsonValue): string {
  assertJsonValue(value);
  return serializeJson(value, "");
}

export function canonicalJsonBytes(value: JsonValue): Uint8Array {
  return new TextEncoder().encode(canonicalJson(value));
}

export type JsonCollectionOrder = "ordered" | "unordered";

export interface JsonCollectionDeclaration {
  readonly pointer: string;
  readonly order: JsonCollectionOrder;
  readonly key?: (entry: JsonValue) => string;
}

function parsePointer(pointer: string): string[] {
  if (pointer === "") return [];
  if (!pointer.startsWith("/")) {
    fail("contract.collection-declaration-invalid", "Collection pointer must be an RFC 6901 JSON pointer.", pointer);
  }
  return pointer.slice(1).split("/").map((segment) => {
    if (/~(?![01])/u.test(segment)) {
      fail("contract.collection-declaration-invalid", "Collection pointer contains an invalid escape.", pointer);
    }
    return segment.replaceAll("~1", "/").replaceAll("~0", "~");
  });
}

function validateDeclarations(declarations: ReadonlyArray<JsonCollectionDeclaration>): Map<string, JsonCollectionDeclaration> {
  const result = new Map<string, JsonCollectionDeclaration>();
  for (const declaration of declarations) {
    if (!declaration || typeof declaration.pointer !== "string" || !["ordered", "unordered"].includes(declaration.order)) {
      fail("contract.collection-declaration-invalid", "Collection declaration has an invalid pointer or order.");
    }
    parsePointer(declaration.pointer);
    if (result.has(declaration.pointer)) {
      fail("contract.collection-declaration-invalid", "Collection pointer " + declaration.pointer + " is declared more than once.", declaration.pointer);
    }
    if (declaration.order === "unordered" && typeof declaration.key !== "function") {
      fail("contract.collection-declaration-invalid", "Unordered collections require a total key function.", declaration.pointer);
    }
    if (declaration.order === "ordered" && declaration.key !== undefined) {
      fail("contract.collection-declaration-invalid", "Ordered collections must not provide an unordered key function.", declaration.pointer);
    }
    result.set(declaration.pointer, declaration);
  }
  return result;
}

export function normalizeDeclaredCollections(
  value: JsonValue,
  declarations: ReadonlyArray<JsonCollectionDeclaration>,
): JsonValue {
  assertJsonValue(value);
  const byPointer = validateDeclarations(declarations);
  const visited = new Set<string>();

  const visit = (current: JsonValue, pointer: string): JsonValue => {
    const declaration = byPointer.get(pointer);
    if (declaration) visited.add(pointer);
    if (Array.isArray(current)) {
      const entries = current.map((entry, index) => visit(entry, pointerJoin(pointer, String(index))));
      if (!declaration) return entries;
      if (declaration.order === "ordered") return entries;
      const keyed = entries.map((entry) => {
        const key = declaration.key?.(entry);
        if (typeof key !== "string") {
          fail("contract.collection-key-invalid", "Collection key must be a string.", pointer);
        }
        assertWellFormedString(key, pointer);
        return { entry, key };
      });
      keyed.sort((left, right) => compareUtf16(left.key, right.key));
      for (let index = 1; index < keyed.length; index += 1) {
        if (keyed[index - 1]?.key === keyed[index]?.key) {
          fail("contract.collection-key-invalid", "Collection key " + JSON.stringify(keyed[index]?.key) + " is not unique.", pointer);
        }
      }
      return keyed.map(({ entry }) => entry);
    }
    if (declaration) {
      fail("contract.collection-declaration-invalid", "Collection declaration must target an array.", pointer);
    }
    if (typeof current !== "object" || current === null) return current;
    const result = Object.create(null) as Record<string, JsonValue>;
    const objectValue = current as JsonObject;
    for (const key of Object.keys(objectValue)) {
      const child = objectValue[key];
      if (child === undefined) fail("contract.json-value-invalid", "Object property is undefined.", pointerJoin(pointer, key));
      result[key] = visit(child, pointerJoin(pointer, key));
    }
    return result;
  };

  const normalized = visit(value, "");
  for (const pointer of byPointer.keys()) {
    if (!visited.has(pointer)) {
      fail("contract.collection-declaration-invalid", "Collection pointer " + pointer + " does not resolve to a value.", pointer);
    }
  }
  return normalized;
}

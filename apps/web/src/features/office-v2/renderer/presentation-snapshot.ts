import type { PresentationSnapshotDocument } from "@affiliate-ops/office-v2-contracts";

export type PresentationSnapshotDiagnosticCode =
  | "presentation.snapshot-invalid"
  | "presentation.snapshot-owned-state-forbidden"
  | "presentation.snapshot-duplicate-entity";

export class PresentationSnapshotError extends TypeError {
  readonly code: PresentationSnapshotDiagnosticCode;
  readonly path: string;

  constructor(code: PresentationSnapshotDiagnosticCode, message: string, path = "$") {
    super(`${code}: ${message}`);
    this.name = "PresentationSnapshotError";
    this.code = code;
    this.path = path;
  }
}

const FORBIDDEN_KEYS = new Set([
  "browserClock",
  "browserTime",
  "canvas",
  "date",
  "domNode",
  "element",
  "mutableState",
  "operationsPayload",
  "pixiObject",
  "reducerMethod",
  "renderer",
  "simulationState",
  "texture",
  "window",
]);

const SEMANTIC_STATES = new Set(["working", "waiting", "review", "blocked", "unavailable", "idle"]);
const FRESHNESS = new Set(["live", "stale", "reconnecting", "unavailable"]);

function invalid(message: string, path: string): never {
  throw new PresentationSnapshotError("presentation.snapshot-invalid", message, path);
}

function forbidden(message: string, path: string): never {
  throw new PresentationSnapshotError("presentation.snapshot-owned-state-forbidden", message, path);
}

function record(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) invalid("expected an object", path);
  return value as Record<string, unknown>;
}

function stringValue(value: unknown, path: string): string {
  if (typeof value !== "string" || value.length === 0) invalid("expected a non-empty string", path);
  return value;
}

function slugValue(value: unknown, path: string): string {
  const text = stringValue(value, path);
  if (!/^[a-z][a-z0-9-]{1,63}$/.test(text)) invalid("expected a lower-case slug", path);
  return text;
}

function worldIdValue(value: unknown, path: string): string {
  const text = stringValue(value, path);
  if (!/^[a-z][a-z0-9.-]{2,127}$/.test(text)) invalid("expected a world identifier", path);
  return text;
}

function exactKeys(value: Record<string, unknown>, allowed: readonly string[], path: string): void {
  const accepted = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!accepted.has(key)) invalid(`unknown field '${key}'`, `${path}.${key}`);
  }
}

function positiveVersion(value: unknown, path: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 1) invalid("expected a positive safe integer", path);
  return value as number;
}

function nonNegativeInteger(value: unknown, path: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) invalid("expected a non-negative safe integer", path);
  return value as number;
}

function identity(value: unknown, kind: string, path: string): void {
  const item = record(value, path);
  exactKeys(item, ["kind", "value"], path);
  if (item.kind !== kind) invalid(`expected ${kind} identity`, `${path}.kind`);
  slugValue(item.value, `${path}.value`);
}

function sha256(value: unknown, path: string): void {
  const text = stringValue(value, path);
  if (!/^[0-9a-f]{64}$/i.test(text)) invalid("expected a SHA-256 hex digest", path);
}

function validateSnapshotShape(value: unknown): void {
  const root = record(value, "$");
  exactKeys(root, ["schemaVersion", "snapshotId", "world", "tick", "worldHash", "entities", "migration"], "$");
  if (root.schemaVersion !== "office-presentation-snapshot-v1") invalid("unsupported schema version", "$.schemaVersion");
  identity(root.snapshotId, "snapshot", "$.snapshotId");
  nonNegativeInteger(root.tick, "$.tick");
  const world = record(root.world, "$.world");
  exactKeys(world, ["id", "version"], "$.world");
  worldIdValue(world.id, "$.world.id");
  positiveVersion(world.version, "$.world.version");
  sha256(root.worldHash, "$.worldHash");
  const migration = record(root.migration, "$.migration");
  exactKeys(migration, ["fromVersion", "effect"], "$.migration");
  if (migration.fromVersion !== "office-presentation-snapshot-v0" || migration.effect !== "reject-and-rehash") {
    invalid("snapshot migration must reject and rehash the previous version", "$.migration");
  }
  if (!Array.isArray(root.entities)) invalid("expected an entity array", "$.entities");

  const ids = new Set<string>();
  root.entities.forEach((rawEntity, index) => {
    const path = `$.entities[${index}]`;
    const entity = record(rawEntity, path);
    exactKeys(entity, ["entityId", "transform", "semanticState", "renderParts", "label", "selection", "freshness"], path);
    const entityId = record(entity.entityId, `${path}.entityId`);
    identity(entity.entityId, "entity-instance", `${path}.entityId`);
    const entityKey = `${entityId.kind}:${entityId.value}`;
    if (ids.has(entityKey)) throw new PresentationSnapshotError("presentation.snapshot-duplicate-entity", "entity IDs must be unique", `${path}.entityId`);
    ids.add(entityKey);
    exactKeys(entityId, ["kind", "value"], `${path}.entityId`);
    const label = stringValue(entity.label, `${path}.label`);
    if (label.length > 240) invalid("label must be at most 240 characters", `${path}.label`);
    if (typeof entity.semanticState !== "string" || !SEMANTIC_STATES.has(entity.semanticState)) invalid("unknown semantic state", `${path}.semanticState`);
    if (typeof entity.freshness !== "string" || !FRESHNESS.has(entity.freshness)) invalid("unknown freshness state", `${path}.freshness`);
    if (!Array.isArray(entity.renderParts) || entity.renderParts.length < 1 || entity.renderParts.some((part) => {
      try {
        slugValue(part, `${path}.renderParts`);
        return false;
      } catch {
        return true;
      }
    }) || new Set(entity.renderParts).size !== entity.renderParts.length) invalid("renderParts must contain unique stable references", `${path}.renderParts`);
    const selection = record(entity.selection, `${path}.selection`);
    exactKeys(selection, ["selected", "focused"], `${path}.selection`);
    if (typeof selection.selected !== "boolean" || typeof selection.focused !== "boolean") invalid("selection flags must be boolean", `${path}.selection`);
    const transform = record(entity.transform, `${path}.transform`);
    exactKeys(transform, ["floor", "position"], `${path}.transform`);
    const floor = record(transform.floor, `${path}.transform.floor`);
    exactKeys(floor, ["id", "version"], `${path}.transform.floor`);
    const floorId = record(floor.id, `${path}.transform.floor.id`);
    identity(floor.id, "floor", `${path}.transform.floor.id`);
    positiveVersion(floor.version, `${path}.transform.floor.version`);
    const position = record(transform.position, `${path}.transform.position`);
    exactKeys(position, ["space", "floor", "coordinate"], `${path}.transform.position`);
    if (position.space !== "floor-local-sub-cell") invalid("presentation positions must be floor-local sub-cell values", `${path}.transform.position.space`);
    const positionFloor = record(position.floor, `${path}.transform.position.floor`);
    exactKeys(positionFloor, ["id", "version"], `${path}.transform.position.floor`);
    const positionFloorId = record(positionFloor.id, `${path}.transform.position.floor.id`);
    identity(positionFloor.id, "floor", `${path}.transform.position.floor.id`);
    positiveVersion(positionFloor.version, `${path}.transform.position.floor.version`);
    if (positionFloorId.value !== floorId.value || positionFloor.version !== floor.version) invalid("transform floor references must agree", `${path}.transform`);
    const coordinate = record(position.coordinate, `${path}.transform.position.coordinate`);
    exactKeys(coordinate, ["space", "x", "y", "elevation"], `${path}.transform.position.coordinate`);
    if (coordinate.space !== "sub-cell") invalid("position coordinate must be sub-cell", `${path}.transform.position.coordinate.space`);
    nonNegativeInteger(coordinate.elevation, `${path}.transform.position.coordinate.elevation`);
    if (!Number.isSafeInteger(coordinate.x) || !Number.isSafeInteger(coordinate.y)) invalid("sub-cell coordinates must be safe integers", `${path}.transform.position.coordinate`);
  });
}

function cloneAndFreeze(value: unknown, path: string, ancestors: Set<object>): unknown {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) invalid("numbers must be finite", path);
    return Object.is(value, -0) ? 0 : value;
  }
  if (typeof value !== "object") forbidden("functions, symbols, bigint, and undefined are not snapshot data", path);
  if (ancestors.has(value)) forbidden("cyclic object graphs are not snapshot data", path);
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null && prototype !== Array.prototype) forbidden("DOM, renderer, class, and collection objects are not snapshot data", path);
  const nextAncestors = new Set(ancestors);
  nextAncestors.add(value);
  if (Array.isArray(value)) {
    const copy = value.map((item, index) => cloneAndFreeze(item, `${path}[${index}]`, nextAncestors));
    return Object.freeze(copy);
  }
  const copy: Record<string, unknown> = {};
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== "string") forbidden("symbol properties are not snapshot data", `${path}.[symbol]`);
    if (FORBIDDEN_KEYS.has(key)) forbidden(`field '${key}' belongs to a mutable presentation owner`, `${path}.${key}`);
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !("value" in descriptor)) forbidden("getters and setters are not snapshot data", `${path}.${key}`);
    copy[key] = cloneAndFreeze(descriptor.value, `${path}.${key}`, nextAncestors);
  }
  return Object.freeze(copy);
}

/** Validate and clone a derived snapshot so renderers never receive caller-owned mutable data. */
export function createPresentationSnapshot(input: PresentationSnapshotDocument): Readonly<PresentationSnapshotDocument> {
  const copy = cloneAndFreeze(input, "$", new Set()) as PresentationSnapshotDocument;
  validateSnapshotShape(copy);
  return copy;
}

/** Validate an unknown boundary value without exposing a mutable caller object. */
export function parsePresentationSnapshot(input: unknown): Readonly<PresentationSnapshotDocument> {
  const copy = cloneAndFreeze(input, "$", new Set()) as PresentationSnapshotDocument;
  validateSnapshotShape(copy);
  return copy;
}

export function presentationSnapshotKey(snapshot: Pick<PresentationSnapshotDocument, "snapshotId" | "tick" | "worldHash">): string {
  return `${snapshot.snapshotId.value}@${snapshot.tick}:${snapshot.worldHash}`;
}

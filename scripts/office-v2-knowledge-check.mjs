import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = resolve(import.meta.dirname, "..");
const knowledgeRoot = join(root, "docs", "office-v2");

const expectedKnowledge = {
  documents: [
    "ACTORS_NAVIGATION_INTERACTIONS.md", "ART_DIRECTION_PIXEL_SPEC.md",
    "ASSET_PIPELINE_PROVENANCE_VALIDATION.md", "CHARACTERS_ANIMATION_HELD_PROPS.md",
    "CHARACTER_PRODUCTION_BIBLE.md", "CONNECTIVITY_AUTO_TILING.md", "DEPENDENCY_LEDGER.md",
    "FAILURE_DIAGNOSTICS.md", "FIRST_FLOOR_BRIEF.md", "FOUNDATIONS.md", "FURNITURE_PRODUCTION_BIBLE.md",
    "GLOSSARY_AND_INVARIANTS.md", "IMPLEMENTATION_PLAN.md", "INPUT_PICKING_AND_DEBUG_OVERLAYS.md",
    "MAP_AUTHORING_AND_IMPORT.md", "OPERATIONS_ADAPTER_UI_SAFETY.md",
    "PILOT_DEVICE_AND_PERFORMANCE_MATRIX.md", "PRODUCT_AND_GAME_LOOP.md", "READINESS_MATRIX.md",
    "README.md", "RENDERING_DEPTH_OCCLUSION.md", "RESEARCH.md",
    "ROOMS_SURFACES_STRUCTURES_ZONES.md", "SAVE_SNAPSHOT_MIGRATION.md",
    "SIMULATION_TIME_RANDOMNESS_REPLAY.md", "TESTING_ACCEPTANCE_BUDGETS.md",
    "WORLD_COORDINATES_PROJECTION_CAMERA.md", "WORLD_MODEL_OCCUPANCY_PLACEMENT.md",
  ],
  decisions: [
    "decisions/0001-projection-grid.md", "decisions/0002-renderer.md",
    "decisions/0003-map-authoring.md", "decisions/0004-navigation-movement.md",
    "decisions/0005-simulation-state-machine.md", "decisions/0006-asset-authoring-export.md",
    "decisions/TEMPLATE.md",
  ],
  schemas: [
    "schemas/animation.schema.json", "schemas/asset.schema.json", "schemas/common.schema.json",
    "schemas/connectivity.schema.json", "schemas/entity-definition.schema.json",
    "schemas/interaction.schema.json", "schemas/operations-snapshot.schema.json",
    "schemas/provenance.schema.json", "schemas/simulation-snapshot.schema.json",
    "schemas/simulation-trace.schema.json", "schemas/surface-structure.schema.json",
    "schemas/world.schema.json",
  ],
  fixtures: [
    "fixtures/asset-family-valid.json", "fixtures/connected-desk.json",
    "fixtures/depth-occlusion.json", "fixtures/deterministic-replay.json",
    "fixtures/interaction-cancel-timeout.json", "fixtures/minimal-office.json",
    "fixtures/navigation-reservations.json", "fixtures/operations-states.json",
    "fixtures/placement-rotation-clearance.json", "fixtures/projection-roundtrip.json",
    "fixtures/room-structure-cutaway.json", "fixtures/invalid/asset-admission.json",
    "fixtures/invalid/connectivity-missing-mask.json", "fixtures/invalid/world-overlap.json",
  ],
  templates: [
    "templates/acceptance-review.md", "templates/asset-family-brief.md",
    "templates/asset-family-manifest.json", "templates/interaction-definition.json",
  ],
};

const failures = [];
const json = (path) => JSON.parse(readFileSync(join(knowledgeRoot, path), "utf8"));
const same = (actual, expected) => JSON.stringify(actual) === JSON.stringify(expected);
const fail = (message) => failures.push(message);

function collectFiles(directory) {
  return readdirSync(directory).flatMap((name) => {
    const absolute = join(directory, name);
    return statSync(absolute).isDirectory() ? collectFiles(absolute) : [absolute];
  });
}

export function createOfficeSchemaValidator() {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const schemaDirectory = join(knowledgeRoot, "schemas");
  for (const file of readdirSync(schemaDirectory).filter((name) => name.endsWith(".schema.json"))) {
    ajv.addSchema(JSON.parse(readFileSync(join(schemaDirectory, file), "utf8")));
  }
  return ajv;
}

function validateSchema(ajv, schemaName, document, label, shouldPass = true) {
  const schemaId = `https://affiliate-operations.example/schemas/office-v2/${schemaName}`;
  const validate = ajv.getSchema(schemaId);
  if (!validate) return fail(`${label}: schema not registered (${schemaName})`);
  const valid = validate(document);
  if (valid !== shouldPass) {
    fail(`${label}: expected schema validation to ${shouldPass ? "pass" : "fail"} (${ajv.errorsText(validate.errors)})`);
  }
}

function checkInventory() {
  const expected = Object.values(expectedKnowledge).flat().sort();
  if (expected.length !== 65) fail(`Knowledge inventory definition has ${expected.length} entries instead of 65`);
  for (const path of expected) {
    const absolute = join(knowledgeRoot, path);
    if (!existsSync(absolute)) fail(`Missing knowledge file: ${path}`);
    else if (readFileSync(absolute).length === 0) fail(`Empty knowledge file: ${path}`);
  }
  const actual = collectFiles(knowledgeRoot)
    .map((file) => relative(knowledgeRoot, file).replaceAll("\\", "/"))
    .filter((path) => path.endsWith(".md") || path.endsWith(".json"))
    .sort();
  for (const path of actual.filter((path) => !expected.includes(path))) fail(`Unregistered knowledge file: ${path}`);
  for (const path of expected.filter((path) => !actual.includes(path))) fail(`Inventory path not found: ${path}`);
  for (const path of actual.filter((path) => path.endsWith(".json"))) {
    try { json(path); } catch (error) { fail(`Invalid JSON ${path}: ${error.message}`); }
  }
}

function checkSchemas(ajv) {
  const checks = [
    ["world.schema.json", json("fixtures/minimal-office.json"), "minimal world"],
    ["connectivity.schema.json", json("fixtures/connected-desk.json"), "connected desk"],
    ["entity-definition.schema.json", json("fixtures/placement-rotation-clearance.json").definition, "placement definition"],
    ["interaction.schema.json", json("fixtures/interaction-cancel-timeout.json").definition, "interaction definition"],
    ["simulation-trace.schema.json", json("fixtures/deterministic-replay.json"), "replay trace"],
    ["asset.schema.json", json("fixtures/asset-family-valid.json"), "valid asset family"],
    ["asset.schema.json", json("templates/asset-family-manifest.json"), "asset template"],
    ["interaction.schema.json", json("templates/interaction-definition.json"), "interaction template"],
  ];
  for (const definition of json("fixtures/room-structure-cutaway.json").definitions) {
    checks.push(["surface-structure.schema.json", definition, `structure ${definition.definitionId}`]);
  }
  for (const snapshot of json("fixtures/operations-states.json").snapshots) {
    checks.push(["operations-snapshot.schema.json", snapshot, `operations ${snapshot.snapshotId}`]);
  }
  for (const [schema, document, label] of checks) validateSchema(ajv, schema, document, label);
  const rejectedAsset = json("fixtures/invalid/asset-admission.json");
  validateSchema(ajv, rejectedAsset.schema, rejectedAsset.document, rejectedAsset.expectedFailure, false);
}

function checkProjection() {
  const fixture = json("fixtures/projection-roundtrip.json");
  for (const entry of fixture.cases) {
    const { x, y, elevation } = entry.world;
    const projected = {
      xPx: fixture.origin.xPx + (x - y) * 32,
      yPx: fixture.origin.yPx + (x + y) * 16 - elevation * 16,
    };
    if (!same(projected, entry.screen)) fail(`Projection mismatch: ${entry.name}`);
    const dx = entry.screen.xPx - fixture.origin.xPx;
    const dy = entry.screen.yPx - fixture.origin.yPx + elevation * 16;
    const inverse = { x: dy / 32 + dx / 64, y: dy / 32 - dx / 64 };
    if (inverse.x !== x || inverse.y !== y) fail(`Projection round trip mismatch: ${entry.name}`);
  }
}

function rotate(cell, orientation) {
  if (orientation === "east") return { x: -cell.y, y: cell.x };
  if (orientation === "south") return { x: -cell.x, y: -cell.y };
  if (orientation === "west") return { x: cell.y, y: -cell.x };
  return { ...cell };
}

function checkPlacement() {
  const fixture = json("fixtures/placement-rotation-clearance.json");
  for (const entry of fixture.cases) {
    const translated = (cells) => cells.map((cell) => {
      const local = rotate(cell, entry.orientation);
      return { x: entry.anchor.x + local.x, y: entry.anchor.y + local.y };
    });
    const footprint = translated(fixture.definition.footprint);
    const clearance = translated(fixture.definition.clearance);
    const outside = footprint.some(({ x, y }) => x < 0 || y < 0 || x >= fixture.bounds.width || y >= fixture.bounds.depth);
    const occupied = new Set((entry.occupied ?? []).map(({ x, y }) => `${x},${y}`));
    const clearanceBlocked = clearance.some(({ x, y }) => occupied.has(`${x},${y}`));
    const result = outside ? "out-of-bounds" : clearanceBlocked ? "clearance" : "accepted";
    if (result !== entry.expected) fail(`Placement result mismatch: ${entry.name}`);
    if (entry.expectedCells && !same(footprint, entry.expectedCells)) fail(`Rotated footprint mismatch: ${entry.name}`);
  }
}

function checkDepth() {
  const fixture = json("fixtures/depth-occlusion.json");
  const bands = new Map(["floor", "ground", "world", "upper", "effect"].map((name, index) => [name, index]));
  for (const entry of fixture.cases) {
    const sorted = entry.entities.toSorted((left, right) =>
      bands.get(left.band) - bands.get(right.band)
      || left.groundY - right.groundY
      || left.elevation - right.elevation
      || left.id.localeCompare(right.id),
    ).map(({ id }) => id);
    if (!same(sorted, entry.expectedBackToFront)) fail(`Depth order mismatch: ${entry.name}`);
  }
}

function connectivityMask(cell, occupied) {
  return (occupied.has(`${cell.x},${cell.y - 1}`) ? 1 : 0)
    | (occupied.has(`${cell.x + 1},${cell.y}`) ? 2 : 0)
    | (occupied.has(`${cell.x},${cell.y + 1}`) ? 4 : 0)
    | (occupied.has(`${cell.x - 1},${cell.y}`) ? 8 : 0);
}

function connectivityFailures(document) {
  const variants = new Set(document.variants.map(({ mask }) => mask));
  return document.supportedMasks.filter((mask) => !variants.has(mask));
}

function checkConnectivity(ajv) {
  const fixture = json("fixtures/connected-desk.json");
  if (connectivityFailures(fixture).length) fail("Connected desk lacks a supported mask variant");
  if (new Set(fixture.variants.map(({ variantId }) => variantId)).size !== fixture.variants.length) fail("Connected desk variant IDs are not unique");
  for (const entry of fixture.cases) {
    const occupied = new Set(entry.cells.map(({ x, y }) => `${x},${y}`));
    const masks = entry.cells.map((cell) => connectivityMask(cell, occupied));
    if (!same(masks, entry.expectedMasks)) fail(`Connectivity mask mismatch: ${entry.name}`);
  }
  const rejected = json("fixtures/invalid/connectivity-missing-mask.json");
  validateSchema(ajv, rejected.schema, rejected.document, "negative connectivity schema");
  if (connectivityFailures(rejected.document).length === 0) fail(`${rejected.expectedFailure}: semantic rejection did not trigger`);
}

function findPath(fixture, entry) {
  const blocked = new Set(fixture.blockedCells.map(({ x, y }) => `${x},${y}`));
  const key = ({ x, y }) => `${x},${y}`;
  const heuristic = ({ x, y }) => Math.abs(entry.goal.x - x) + Math.abs(entry.goal.y - y);
  const open = [{ cell: entry.start, cost: 0, path: [entry.start] }];
  const best = new Map([[key(entry.start), 0]]);
  while (open.length) {
    open.sort((left, right) => left.cost + heuristic(left.cell) - right.cost - heuristic(right.cell)
      || heuristic(left.cell) - heuristic(right.cell)
      || left.cell.y - right.cell.y || left.cell.x - right.cell.x);
    const current = open.shift();
    if (key(current.cell) === key(entry.goal)) return current.path;
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      const cell = { x: current.cell.x + dx, y: current.cell.y + dy };
      if (cell.x < 0 || cell.y < 0 || cell.x >= fixture.bounds.width || cell.y >= fixture.bounds.depth || blocked.has(key(cell))) continue;
      const cost = current.cost + 1;
      if (cost >= (best.get(key(cell)) ?? Infinity)) continue;
      best.set(key(cell), cost);
      open.push({ cell, cost, path: [...current.path, cell] });
    }
  }
  return [];
}

function checkNavigationAndInteractions() {
  const navigation = json("fixtures/navigation-reservations.json");
  const pathCase = navigation.cases.find(({ expectedPath }) => expectedPath);
  if (!same(findPath(navigation, pathCase), pathCase.expectedPath)) fail(`Navigation path mismatch: ${pathCase.name}`);
  const reservation = navigation.cases.find(({ requests }) => requests);
  const ordered = reservation.requests.toSorted((a, b) => a.issuedTick - b.issuedTick || a.commandId.localeCompare(b.commandId));
  if (ordered[0].actorId !== reservation.expectedOwner || !same(ordered.slice(1).map(({ actorId }) => actorId), reservation.expectedWaiting)) {
    fail(`Reservation order mismatch: ${reservation.name}`);
  }
  const interactions = json("fixtures/interaction-cancel-timeout.json");
  for (const entry of interactions.cases) {
    const last = entry.events.at(-1).type;
    const result = last === "advance" ? interactions.definition.resultEvent : interactions.definition.cancellation.resultEvent;
    if (result !== entry.expected) fail(`Interaction result mismatch: ${entry.name}`);
    if (entry.expectedReservationReleased && !interactions.definition.cancellation.releaseReservations) fail(`Reservation leak: ${entry.name}`);
  }
}

function checkNegativeWorld(ajv) {
  const rejected = json("fixtures/invalid/world-overlap.json");
  validateSchema(ajv, rejected.schema, rejected.document, "negative world schema");
  const definitions = new Map(rejected.definitions.map((definition) => [definition.definitionId, definition]));
  const occupied = new Set();
  let overlap = false;
  for (const entity of rejected.document.entities) {
    for (const local of definitions.get(entity.definitionId).footprint) {
      const cell = `${entity.anchor.x + local.x},${entity.anchor.y + local.y},${entity.anchor.elevation}`;
      if (occupied.has(cell)) overlap = true;
      occupied.add(cell);
    }
  }
  if (!overlap) fail(`${rejected.expectedFailure}: semantic rejection did not trigger`);
}

export function runKnowledgeCheck() {
  checkInventory();
  if (failures.length === 0) {
    const ajv = createOfficeSchemaValidator();
    checkSchemas(ajv);
    checkProjection();
    checkPlacement();
    checkDepth();
    checkConnectivity(ajv);
    checkNavigationAndInteractions();
    checkNegativeWorld(ajv);
  }
  if (failures.length) throw new Error(failures.map((message) => `- ${message}`).join("\n"));
  console.log("Office V2 knowledge OK: 65 files, 12 schemas, and 11 behavior fixtures validated.");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try { runKnowledgeCheck(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}

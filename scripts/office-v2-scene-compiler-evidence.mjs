import { canonicalJson } from "@affiliate-ops/office-v2-contracts";
import { compileScenePlan } from "@affiliate-ops/office-v2-world";
import {
  compareExpectedDiagnostic,
  mismatch,
  validateSchema,
} from "./office-v2-knowledge-evidence.mjs";

export const scenePlanFixturePath = "fixtures/scene-plan-target-floor.json";

function clone(value) {
  return structuredClone(value);
}

function loadInput(context, fixture) {
  const wrapper = fixture.baseFixture ? context.readJson(fixture.baseFixture) : fixture;
  if (!wrapper) return null;
  const topology = context.readJson(wrapper.topologyFixture);
  const roomTemplates = wrapper.roomTemplateFixtures.map((path) => context.readJson(path));
  if (!topology || roomTemplates.some((entry) => !entry)) return null;
  return {
    wrapper,
    plan: clone(wrapper.plan),
    topology: clone(topology),
    roomTemplates: clone(roomTemplates),
  };
}

function applyMutation(input, mutation) {
  const result = {
    plan: clone(input.plan),
    topology: clone(input.topology),
    roomTemplates: clone(input.roomTemplates),
  };
  if (mutation === "reorder-input") {
    result.plan.floorPlans.reverse();
    result.plan.reservedCores.reverse();
    result.topology.floors.reverse();
    result.topology.portals.reverse();
    result.topology.siteEnvelope.contextCells.reverse();
    result.roomTemplates[0].facilityGroups.reverse();
    result.roomTemplates[0].facilityGroups.forEach((group) => group.facilities.reverse());
  } else if (mutation === "change-composition-profile") {
    result.plan.compositionProfile = "review";
  } else if (mutation === "unresolved-room-reference") {
    result.plan.floorPlans[0].room.id.value = "missing-room";
  } else if (mutation === "array-index-derived-id") {
    result.plan.reservedCores[0].id = "reserved-core-0";
  } else if (mutation === "unsupported-semantic-variant") {
    result.plan.semanticVariant = "legacy-office-v2";
  } else if (mutation === "site-occupancy-leak") {
    result.plan.siteOccupancy = { cells: [{ x: 9, y: 11 }] };
  } else if (mutation === "direct-v1-world") {
    result.plan = { schemaVersion: "office-world-v1", worldId: "legacy-world" };
  } else if (mutation) {
    throw new Error(`Unsupported scene-plan mutation: ${mutation}`);
  }
  return result;
}

function evaluateTargetSemantics(context, fixturePath, entry, result) {
  const compiled = result.compiledBuilding;
  const world = compiled?.floors?.[0]?.world;
  if (!compiled || !world) return;
  context.evidence.semanticRules += 1;
  mismatch(context, fixturePath, entry, "target floor count", compiled.floors.length, 1);
  mismatch(context, fixturePath, entry, "large floor width", world.bounds.width, 32);
  mismatch(context, fixturePath, entry, "large floor depth", world.bounds.depth, 24);
  mismatch(context, fixturePath, entry, "assigned actor capacity", world.actorCapacity.assigned, 10);
  mismatch(context, fixturePath, entry, "reserved actor capacity", world.actorCapacity.reserved, 5);
  mismatch(context, fixturePath, entry, "maximum actor capacity", world.actorCapacity.maximum, 15);
  mismatch(context, fixturePath, entry, "workstation entity count", world.entities.filter(({ semantic }) => semantic === "work").length, 10);
  mismatch(context, fixturePath, entry, "legal entrance portal", world.portals.some(({ id, kind }) => id === "main-entrance" && kind === "entrance"), true);
  mismatch(context, fixturePath, entry, "reserved stair/lift core kinds", world.reservedCores.map(({ kind }) => kind).sort(), ["lift", "stair"]);
  mismatch(context, fixturePath, entry, "site context kinds", compiled.siteEnvelope.contextKinds.slice().sort(), ["backdrop", "curb", "planting", "road", "sidewalk"]);
  mismatch(context, fixturePath, entry, "compiler version", result.report.compilerVersion, "office-scene-compiler-v1");
  if (Object.hasOwn(world, "site")) {
    context.add("knowledge.fixture-mismatch", `${fixturePath} (${entry.name}): site context leaked into floor world`, { fixture: fixturePath, caseName: entry.name });
  }
}

export function evaluateScenePlanCase(context, ajv, fixturePath, fixture, entry) {
  const input = loadInput(context, fixture);
  if (!input) return null;
  const mutated = applyMutation(input, entry.mutation);
  const isValidCase = entry.expectedValid === true;
  if (isValidCase) {
    validateSchema(context, ajv, "scene-plan.schema.json", mutated.plan, `${fixturePath} (${entry.name}) scene plan`, true, fixturePath);
  }
  const result = compileScenePlan(mutated.plan, {
    topology: mutated.topology,
    roomTemplates: mutated.roomTemplates,
  });
  if (entry.expectedFailure) {
    compareExpectedDiagnostic(context, fixturePath, entry.expectedFailure, result.diagnostics[0] ?? null);
    return result;
  }
  if (!result.ok || !result.compiledBuilding) {
    context.add("knowledge.fixture-mismatch", `${fixturePath} (${entry.name}): target scene plan was rejected`, { fixture: fixturePath, caseName: entry.name, diagnostics: result.diagnostics });
    return result;
  }
  context.evidence.semanticRules += 1;
  validateSchema(context, ajv, "world-v2.schema.json", result.compiledBuilding.floors[0].world, `${fixturePath} (${entry.name}) world`, true, fixturePath);
  validateSchema(context, ajv, "compiled-building.schema.json", result.compiledBuilding, `${fixturePath} (${entry.name}) compiled building`, true, fixturePath);
  validateSchema(context, ajv, "compilation-report.schema.json", result.report, `${fixturePath} (${entry.name}) compilation report`, true, fixturePath);
  evaluateTargetSemantics(context, fixturePath, entry, result);
  if (entry.mutation === "reorder-input") {
    const baseline = loadInput(context, fixture);
    const baselineResult = compileScenePlan(baseline.plan, { topology: baseline.topology, roomTemplates: baseline.roomTemplates });
    mismatch(context, fixturePath, entry, "reordered source hash", result.sourcePlanHash, baselineResult.sourcePlanHash);
    mismatch(context, fixturePath, entry, "reordered world hash", result.canonicalWorldHash, baselineResult.canonicalWorldHash);
    mismatch(context, fixturePath, entry, "reordered canonical world bytes", canonicalJson(result.compiledBuilding), canonicalJson(baselineResult.compiledBuilding));
  }
  if (entry.mutation === "change-composition-profile") {
    const baseline = loadInput(context, fixture);
    const baselineResult = compileScenePlan(baseline.plan, { topology: baseline.topology, roomTemplates: baseline.roomTemplates });
    if (result.sourcePlanHash === baselineResult.sourcePlanHash || result.canonicalWorldHash === baselineResult.canonicalWorldHash) {
      context.add("knowledge.fixture-mismatch", `${fixturePath} (${entry.name}): semantic field did not change a hash`, { fixture: fixturePath, caseName: entry.name });
    }
  }
  return result;
}

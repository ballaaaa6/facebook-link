import {
  evaluateConnectivityDefinition,
  evaluateUnsupportedProofWorkstationFixture,
  proofWorkstationFixturePath,
  rejectedProofWorkstationFixturePath,
} from "./office-v2-proof-workstation-evidence.mjs";
import { fixtureRegistry } from "./office-v2-knowledge-manifest.mjs";
import {
  connectivityFailures,
  evaluateConnectivity,
  evaluateDepth,
  evaluateInteraction,
  evaluatePlacement,
  evaluateProjection,
  evaluateReservation,
  evaluateStructure,
  findPath,
  findWorldOverlap,
} from "./office-v2-knowledge-probes.mjs";
import { evaluateCommonV2Case } from "./office-v2-common-v2-evidence.mjs";
import { evaluateDefinitionBundleMutation } from "./office-v2-knowledge-world-adapter.mjs";
import {
  caseKind,
  compareExpectedDiagnostic,
  mismatch,
} from "./office-v2-knowledge-evidence.mjs";

function executeCase(context, registration, fixture, entry, ajv) {
  const { path, caseRunner } = registration;
  const handled = (
    (caseRunner === "projection" && entry.world && entry.screen)
    || (caseRunner === "placement" && entry.anchor && entry.orientation && entry.expected)
    || (caseRunner === "depth" && entry.entities && entry.expectedBackToFront)
    || (caseRunner === "connectivity" && entry.cells && entry.expectedMasks)
    || (caseRunner === "interaction" && entry.events && entry.expected)
    || (caseRunner === "structure" && typeof entry.state === "string" && typeof entry.expectedTraversable === "boolean")
    || (caseRunner === "common-v2" && (typeof entry.definition === "string" || typeof entry.semantic === "string"))
    || (caseRunner === "navigation" && ["path", "reservation"].includes(caseKind(entry)))
  );
  if (!handled) {
    context.add("knowledge.unhandled-fixture-case", `${path}: unhandled fixture case ${entry?.name ?? "<unnamed>"}`, { fixture: path, case: entry });
    return;
  }
  context.coverage.executedCases += 1;
  context.coverage.executedCaseIds.push(`${path}#${entry.name}`);
  context.evidencedFixtures.add(path);
  context.evidence.semantic += 1;
  try {
    if (caseRunner === "projection") {
      const result = evaluateProjection(fixture, entry);
      mismatch(context, path, entry, "forward projection", result.projected, entry.screen);
      mismatch(context, path, entry, "algebraic center-point inverse", result.inverse, entry.world);
    } else if (caseRunner === "placement") {
      const result = evaluatePlacement(fixture, entry);
      mismatch(context, path, entry, "placement result", result.result, entry.expected);
      if (entry.expectedCells) mismatch(context, path, entry, "rotated footprint", result.footprint, entry.expectedCells);
    } else if (caseRunner === "depth") {
      mismatch(context, path, entry, "depth order", evaluateDepth(entry), entry.expectedBackToFront);
    } else if (caseRunner === "connectivity") {
      mismatch(context, path, entry, "connectivity masks", evaluateConnectivity(entry), entry.expectedMasks);
    } else if (caseRunner === "interaction") {
      const result = evaluateInteraction(fixture, entry);
      mismatch(context, path, entry, "interaction terminal result", result.result, entry.expected);
      if (entry.expectedReservationReleased !== undefined) {
        mismatch(context, path, entry, "reservation release", result.reservationReleased, entry.expectedReservationReleased);
      }
    } else if (caseRunner === "structure") {
      mismatch(context, path, entry, "structure traversability", evaluateStructure(fixture, entry).traversable, entry.expectedTraversable);
    } else if (caseRunner === "common-v2") {
      const result = evaluateCommonV2Case(ajv, entry);
      const expectedValid = entry.expectedValid === true;
      mismatch(context, path, entry, "common V2 schema validity", result.valid, expectedValid);
      if (!expectedValid) compareExpectedDiagnostic(context, path, entry.expectedFailure, result.diagnostic);
    } else if (caseKind(entry) === "path") {
      const result = findPath(fixture, entry);
      mismatch(context, path, entry, "navigation path", result.path, entry.expectedPath);
      if (entry.expectedStepCount !== undefined) mismatch(context, path, entry, "navigation step count", result.stepCount, entry.expectedStepCount);
      if (entry.expectedCost !== undefined) mismatch(context, path, entry, "navigation cost", result.totalCost, entry.expectedCost);
      if (fixture.costModel?.cardinalStepCost !== undefined) mismatch(context, path, entry, "navigation step cost unit", result.stepCost, fixture.costModel.cardinalStepCost);
      if (fixture.costModel?.heuristicUnit !== undefined) mismatch(context, path, entry, "navigation heuristic unit", result.heuristicUnit, fixture.costModel.heuristicUnit);
    } else {
      const result = evaluateReservation(entry);
      mismatch(context, path, entry, "reservation owner", result.owner, entry.expectedOwner);
      mismatch(context, path, entry, "reservation wait order", result.waiting, entry.expectedWaiting);
    }
  } catch (error) {
    context.add("knowledge.fixture-probe-error", `${path} (${entry.name}): probe failed`, { fixture: path, caseName: entry.name, reason: error.message });
  }
}

export function runFixtureCases(context, ajv) {
  for (const registration of fixtureRegistry) {
    const fixture = context.readJson(registration.path);
    if (!fixture) continue;
    if (registration.caseRunner === "connectivity") {
      const definition = fixture.definition ?? fixture;
      const evaluation = evaluateConnectivityDefinition(registration.path, definition);
      context.evidence.semanticRules += evaluation.semanticRules;
      for (const diagnostic of evaluation.diagnostics) {
        context.add(diagnostic.code, diagnostic.message, diagnostic.context, diagnostic.owner);
      }
    }
    const cases = Array.isArray(fixture.cases) ? fixture.cases : [];
    context.coverage.declaredCases += cases.length;
    const names = new Set();
    for (const [index, entry] of cases.entries()) {
      context.coverage.declaredCaseIds.push(`${registration.path}#${entry?.name ?? `<index:${index}>`}`);
      if (!entry || typeof entry.name !== "string" || names.has(entry.name)) {
        context.add("knowledge.duplicate-fixture-case", `${registration.path}: case names must be present and unique`, { fixture: registration.path, caseName: entry?.name ?? null });
      } else names.add(entry.name);
      if (!registration.caseRunner) {
        context.add("knowledge.unhandled-fixture-case", `${registration.path}: fixture declares cases without a runner`, { fixture: registration.path, case: entry });
      } else executeCase(context, registration, fixture, entry, ajv);
    }
  }
}

export function runNegativeDiagnostics(context) {
  const connectivityPath = "fixtures/invalid/connectivity-missing-mask.json";
  const connectivity = context.readJson(connectivityPath);
  if (connectivity) {
    const missingMasks = connectivityFailures(connectivity.document);
    const actual = missingMasks.length ? {
      code: "connectivity.missing-variant",
      owner: "connectivity",
      version: 1,
      message: "A supported connectivity mask has no variant.",
      context: { missingMasks },
    } : null;
    compareExpectedDiagnostic(context, connectivityPath, connectivity.expectedFailure, actual);
  }
  const unsupportedPath = rejectedProofWorkstationFixturePath;
  const unsupported = context.readJson(unsupportedPath);
  if (unsupported) {
    const proof = context.readJson(proofWorkstationFixturePath);
    const evaluation = evaluateUnsupportedProofWorkstationFixture(unsupported, proof?.definition);
    if (!evaluation.definitionMatches) {
      context.add(
        "knowledge.proof-workstation-definition-mismatch",
        "Unsupported-mask fixture must use the proof workstation definition unchanged.",
        { fixture: unsupportedPath },
      );
    }
    compareExpectedDiagnostic(context, unsupportedPath, unsupported.expectedFailure, evaluation.diagnostic);
  }
  const worldPath = "fixtures/invalid/world-overlap.json";
  const world = context.readJson(worldPath);
  if (world) {
    const overlap = findWorldOverlap(world);
    const actual = overlap ? {
      code: "world.occupied",
      owner: "world",
      version: 1,
      message: "Two blocking entities occupy the same world cell.",
      context: overlap,
    } : null;
    compareExpectedDiagnostic(context, worldPath, world.expectedFailure, actual);
  }
  const bundlePath = "fixtures/invalid/definition-bundle-reference-closure.json";
  const bundleFixture = context.readJson(bundlePath);
  if (bundleFixture) {
    const evaluation = evaluateDefinitionBundleMutation(context, bundleFixture);
    compareExpectedDiagnostic(context, bundlePath, bundleFixture.expectedFailure, evaluation?.diagnostics[0] ?? null);
  }
}

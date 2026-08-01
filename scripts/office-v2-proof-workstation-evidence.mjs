import { isDeepStrictEqual } from "node:util";

export const proofWorkstationFixturePath = "fixtures/proof-workstation-connectivity-v2.json";
export const rejectedProofWorkstationFixturePath = "fixtures/invalid/proof-workstation-unsupported-mask.json";
const expectedMasks = [0, 2, 8, 10];

function orderedMasks(values) {
  return values.toSorted((left, right) => left - right);
}

export function findProofWorkstationScopeDiagnostics(definition) {
  const diagnostics = [];
  const supportedMasks = orderedMasks(definition.supportedMasks);
  const variantMasks = orderedMasks(definition.variants.map(({ mask }) => mask));
  if (!isDeepStrictEqual(supportedMasks, expectedMasks)) {
    diagnostics.push({
      code: "connectivity.proof-workstation-mask-scope",
      owner: "connectivity",
      version: 1,
      message: "Proof workstation must support exactly masks 0, 2, 8, and 10.",
      context: { fixture: proofWorkstationFixturePath, supportedMasks },
    });
  }
  if (!isDeepStrictEqual(variantMasks, expectedMasks)) {
    diagnostics.push({
      code: "connectivity.proof-workstation-variant-scope",
      owner: "connectivity",
      version: 1,
      message: "Proof workstation variants must close exactly over masks 0, 2, 8, and 10.",
      context: { fixture: proofWorkstationFixturePath, variantMasks },
    });
  }
  return diagnostics;
}

export function evaluateConnectivityDefinition(fixture, definition) {
  const diagnostics = [];
  const variants = new Set(definition.variants.map(({ mask }) => mask));
  const missingMasks = definition.supportedMasks.filter((mask) => !variants.has(mask));
  if (missingMasks.length) {
    diagnostics.push({
      code: "connectivity.missing-variant",
      owner: "connectivity",
      message: "Connectivity family lacks a supported mask variant.",
      context: { fixture, missingMasks },
    });
  }
  const variantIds = definition.variants.map(({ variantId }) => variantId);
  if (new Set(variantIds).size !== variantIds.length) {
    diagnostics.push({
      code: "connectivity.duplicate-variant-id",
      owner: "connectivity",
      message: "Connectivity variant IDs must be unique.",
      context: { fixture },
    });
  }
  if (fixture === proofWorkstationFixturePath) {
    diagnostics.push(...findProofWorkstationScopeDiagnostics(definition));
  }
  return {
    diagnostics,
    semanticRules: fixture === proofWorkstationFixturePath ? 4 : 2,
  };
}

export function evaluateUnsupportedProofWorkstationFixture(rejected, proofDefinition) {
  const requestedMasks = rejected.requestedMasks;
  const supported = new Set(rejected.document.supportedMasks);
  const unsupportedMasks = orderedMasks(requestedMasks.filter((mask) => !supported.has(mask)));
  const everyRequestIsUnsupported = requestedMasks.length > 0
    && unsupportedMasks.length === requestedMasks.length
    && new Set(requestedMasks).size === requestedMasks.length;
  return {
    definitionMatches: isDeepStrictEqual(rejected.document, proofDefinition),
    diagnostic: everyRequestIsUnsupported ? {
      code: "connectivity.unsupported-mask",
      owner: "connectivity",
      version: 1,
      message: "The connectivity family does not support the requested arrangement.",
      context: {
        familyId: rejected.document.familyId,
        familyVersion: rejected.document.familyVersion,
        unsupportedMasks,
      },
    } : null,
  };
}

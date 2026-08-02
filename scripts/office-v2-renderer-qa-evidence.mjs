import { compareExpectedDiagnostic, mismatch } from "./office-v2-knowledge-evidence.mjs";

export const rendererQaFixturePath = "fixtures/renderer-qa-contracts-v1.json";
export const rendererBundleFixturePath = "fixtures/lab/renderer-benchmark-bundle-v1.json";
export const rendererQaRejectionFixturePath = "fixtures/invalid/renderer-qa-rejections.json";

const portOperations = [
  "mount", "renderSnapshot", "setCamera", "pickSemantic", "resize", "loadBundle",
  "unloadBundle", "swapBundle", "showMissingAsset", "captureDeterministic",
  "handleContextLoss", "teardown", "remount",
];
const actorProfiles = [1, 10, 15, 25, 50];
const viewports = ["1440x900", "1024x768", "390x844"];
const operationalStates = ["working", "waiting", "review", "blocked", "unavailable", "idle"];

function diagnostic(code, message, context = {}) {
  return { code, owner: "presentation", version: 1, message, context };
}

function viewportKey(viewport) {
  return `${viewport.width}x${viewport.height}`;
}

export function evaluateRendererQaCase(context, fixture, entry) {
  context.evidence.semanticRules += 1;
  const document = fixture.contracts?.[entry.documentKey] ?? fixture.document;
  const path = entry.kind === "synthetic-bundle" ? rendererBundleFixturePath : rendererQaFixturePath;
  if (entry.kind === "renderer-port") {
    const names = document.operations.map((operation) => operation.name).toSorted();
    mismatch(context, path, entry, "renderer port operation set", names, [...portOperations].toSorted());
    mismatch(context, path, entry, "renderer port effect", document.operations.every((operation) => operation.effect === "presentation-only"), true);
    mismatch(context, path, entry, "abortable teardown policy", document.loadPolicy.teardownSettlesPendingLoads, true);
    return;
  }
  if (entry.kind === "presentation-snapshot") {
    mismatch(context, path, entry, "snapshot entity fields", Object.keys(document.entities[0]).toSorted(), ["entityId", "freshness", "label", "renderParts", "selection", "semanticState", "transform"].toSorted());
    mismatch(context, path, entry, "snapshot forbidden mutable state", Object.hasOwn(document, "rendererState"), false);
    return;
  }
  if (entry.kind === "benchmark") {
    mismatch(context, path, entry, "benchmark actor profiles", document.actorProfiles, actorProfiles);
    mismatch(context, path, entry, "benchmark viewports", document.viewports.map(viewportKey), viewports);
    mismatch(context, path, entry, "benchmark status", document.status, entry.expected);
    mismatch(context, path, entry, "benchmark winner", document.winner, null);
    return;
  }
  if (entry.kind === "accessibility") {
    mismatch(context, path, entry, "accessibility actor profiles", document.actorProfiles, [1, 10, 15]);
    mismatch(context, path, entry, "accessibility operational states", document.operationalStates, operationalStates);
    mismatch(context, path, entry, "accessibility requirements", Object.values(document.requirements).every(Boolean), true);
    mismatch(context, path, entry, "accessibility case count", document.cases.length, 10);
    return;
  }
  if (entry.kind === "lifecycle") {
    mismatch(context, path, entry, "lifecycle state set", document.states, ["mounted", "visible", "hidden", "restoring", "destroyed"]);
    mismatch(context, path, entry, "lifecycle cleanup resources", Object.values(document.resourceInvariant).slice(1).every((value) => value === 0), true);
    mismatch(context, path, entry, "lifecycle teardown transition", document.transitions.some((transition) => transition.event === "teardown" && transition.to === "destroyed"), true);
    return;
  }
  if (entry.kind === "golden") {
    mismatch(context, path, entry, "golden update policy", document.updatePolicy, entry.expected);
    mismatch(context, path, entry, "golden geometry independence", document.geometryIndependent, true);
    mismatch(context, path, entry, "golden preference pins", [document.forcedColor, document.reducedMotion], ["none", "no-preference"]);
    return;
  }
  if (entry.kind === "property-model") {
    mismatch(context, path, entry, "property profile status", document.status, entry.expected);
    mismatch(context, path, entry, "property evidence claim", document.evidenceClaimed, false);
    mismatch(context, path, entry, "property dependency admission", [document.library.installed, document.library.admitted], [false, false]);
    mismatch(context, path, entry, "independent model count", document.models.filter((model) => model.independent).length, 3);
    return;
  }
  if (entry.kind === "synthetic-bundle") {
    mismatch(context, path, entry, "synthetic bundle root", document.root, "docs/office-v2/fixtures/lab");
    mismatch(context, path, entry, "synthetic bundle admission", document.admission, entry.expected);
    mismatch(context, path, entry, "synthetic bundle test-only flag", document.testOnly, true);
    mismatch(context, path, entry, "synthetic bundle actor profiles", document.profiles.map((profile) => profile.actorCount), actorProfiles);
    return;
  }
  context.add("knowledge.unhandled-fixture-case", `${path}: unknown renderer/QA case`, { fixture: path, caseName: entry.name, kind: entry.kind });
}

export function evaluateRendererQaNegativeDiagnostic(entry) {
  const document = entry.document;
  if (entry.kind === "renderer-port-contract-invalid" && !document.operations.some((operation) => operation.name === "teardown")) {
    return diagnostic("presentation.renderer-port-contract-invalid", "The renderer port omits a required lifecycle operation.", { operation: "teardown" });
  }
  if (entry.kind === "presentation-snapshot-owned-state" && Object.hasOwn(document, "rendererState")) {
    return diagnostic("presentation.snapshot-owned-state-forbidden", "A presentation snapshot contains renderer-owned mutable state.", { pointer: "/rendererState" });
  }
  if (entry.kind === "benchmark-winner" && document.winner !== null) {
    return diagnostic("presentation.benchmark-protocol-invalid", "A benchmark protocol cannot name a winner before valid evidence.", { winner: document.winner });
  }
  if (entry.kind === "accessibility-coverage" && document.cases.length < 10) {
    return diagnostic("presentation.accessibility-coverage-incomplete", "Accessibility fixtures must include deterministic focus and parity cases.", { caseCount: document.cases.length });
  }
  if (entry.kind === "lifecycle-cleanup" && Object.values(document.resourceInvariant).some((value) => typeof value === "number" && value !== 0)) {
    return diagnostic("presentation.lifecycle-cleanup-incomplete", "Lifecycle teardown leaves a presentation resource pending.", { resourceInvariant: document.resourceInvariant });
  }
  if (entry.kind === "golden-policy" && document.updatePolicy !== "normal-checks-never-rewrite") {
    return diagnostic("presentation.golden-manifest-invalid", "Normal golden checks must never rewrite approved output.", { updatePolicy: document.updatePolicy });
  }
  if (entry.kind === "property-model-admission" && (document.library.installed || document.library.admitted)) {
    return diagnostic("presentation.property-model-profile-invalid", "The pinned property/model profile is not executable before dependency admission.", { library: document.library.name, installed: document.library.installed, admitted: document.library.admitted });
  }
  if (entry.kind === "synthetic-bundle-path" && (document.root !== "docs/office-v2/fixtures/lab" || document.testOnly !== true || document.admission !== "fixture-only")) {
    return diagnostic("presentation.synthetic-bundle-fixture-only", "Synthetic benchmark material is restricted to fixture/lab and cannot enter runtime admission.", { root: document.root, admission: document.admission });
  }
  return null;
}

export function runRendererQaNegativeDiagnostics(context, readJson) {
  const fixture = readJson(rendererQaRejectionFixturePath);
  if (!fixture) return;
  for (const entry of fixture.cases) {
    compareExpectedDiagnostic(context, rendererQaRejectionFixturePath, entry.expectedFailure, evaluateRendererQaNegativeDiagnostic(entry));
  }
}

export function rendererQaSchemaChecks(fixture) {
  return [
    ["renderer-port.schema.json", fixture.contracts.rendererPort, "renderer port"],
    ["presentation-snapshot.schema.json", fixture.contracts.presentationSnapshot, "presentation snapshot"],
    ["renderer-benchmark.schema.json", fixture.contracts.benchmark, "renderer benchmark"],
    ["accessibility-fixture.schema.json", fixture.contracts.accessibility, "accessibility fixture"],
    ["lifecycle-fixture.schema.json", fixture.contracts.lifecycle, "lifecycle fixture"],
    ["golden-manifest.schema.json", fixture.contracts.golden, "golden manifest"],
    ["property-model-profile.schema.json", fixture.contracts.propertyModel, "property/model profile"],
  ];
}

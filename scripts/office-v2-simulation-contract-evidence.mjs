import { compareExpectedDiagnostic, mismatch } from "./office-v2-knowledge-evidence.mjs";

export const simulationContractFixturePath = "fixtures/simulation-contracts-v2.json";

function compareUtf16(left, right) {
  const length = Math.min(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const difference = left.charCodeAt(index) - right.charCodeAt(index);
    if (difference !== 0) return difference;
  }
  return left.length - right.length;
}

function commandValue(command) {
  return command?.commandId?.value ?? "";
}

function commandOrderKey(command) {
  return [
    command.scheduledTick,
    command.sourceRank,
    command.sourceSequence,
    commandValue(command),
  ];
}

function compareCommand(left, right) {
  const leftKey = commandOrderKey(left);
  const rightKey = commandOrderKey(right);
  for (let index = 0; index < 3; index += 1) {
    const difference = leftKey[index] - rightKey[index];
    if (difference !== 0) return difference;
  }
  return compareUtf16(leftKey[3], rightKey[3]);
}

function diagnostic(code, message, context = {}) {
  return { code, owner: "simulation", version: 1, message, context };
}

export function evaluateSimulationContractCase(context, fixture, entry) {
  context.evidence.semanticRules += 1;
  if (entry.kind === "command-order") {
    const commands = fixture.commands
      .filter((command) => entry.commandIds.includes(commandValue(command)))
      .toSorted(compareCommand)
      .map(commandValue);
    mismatch(context, simulationContractFixturePath, entry, "same-tick command order", commands, entry.expectedOrder);
    return;
  }
  if (entry.kind === "command-idempotency") {
    const duplicate = entry.duplicate.commandVersion === entry.existing.commandVersion
      && entry.duplicate.payloadDigest === entry.existing.payloadDigest;
    const conflict = entry.conflict.commandVersion !== entry.existing.commandVersion
      || entry.conflict.payloadDigest !== entry.existing.payloadDigest;
    mismatch(context, simulationContractFixturePath, entry, "duplicate command status", duplicate ? "idempotent-duplicate" : "accepted", entry.expectedDuplicateStatus);
    mismatch(context, simulationContractFixturePath, entry, "command conflict diagnostic", conflict ? "simulation.command-id-conflict" : null, entry.expectedConflict);
    return;
  }
  if (entry.kind === "resource-normalization") {
    const normalized = [...entry.resourceKeys].sort(compareUtf16);
    mismatch(context, simulationContractFixturePath, entry, "normalized resource keys", normalized, entry.expectedOrder);
    return;
  }
  if (entry.kind === "tick-boundary") {
    const outcome = entry.expiresTick <= entry.currentTick
      ? "expired-before-apply"
      : entry.notBeforeTick > entry.currentTick
        ? "not-yet-eligible"
        : "eligible";
    mismatch(context, simulationContractFixturePath, entry, "tick boundary outcome", outcome, entry.expected);
    return;
  }
  if (entry.kind === "cleanup") {
    const resources = [...entry.resources].sort(compareUtf16);
    const released = [...entry.released].sort(compareUtf16);
    mismatch(context, simulationContractFixturePath, entry, "cleanup resource set", released, resources);
    mismatch(context, simulationContractFixturePath, entry, "idempotent cleanup policy", Boolean(entry.expectedIdempotent), true);
    return;
  }
  if (entry.kind === "lifecycle-catch-up") {
    const applied = Math.min(entry.accumulatedTicks, entry.maximumTicksPerPump);
    const diagnosticCode = entry.accumulatedTicks > entry.maximumTicksPerPump
      ? "simulation.lifecycle-catch-up-capped"
      : null;
    mismatch(context, simulationContractFixturePath, entry, "ticks applied in one pump", applied, entry.expectedAppliedTicks);
    mismatch(context, simulationContractFixturePath, entry, "catch-up diagnostic", diagnosticCode, entry.expectedDiagnostic);
    return;
  }
  context.add("knowledge.unhandled-fixture-case", `${simulationContractFixturePath}: unknown simulation case kind`, {
    fixture: simulationContractFixturePath,
    caseName: entry.name,
    kind: entry.kind,
  });
}

export function evaluateSimulationNegativeDiagnostic(fixture) {
  if (fixture.kind === "command-id-conflict") {
    const existing = fixture.existing;
    const incoming = fixture.document;
    if (existing?.commandId?.value === incoming?.commandId?.value
      && (existing.commandVersion !== incoming.commandVersion || existing.payloadDigest !== incoming.payloadDigest)) {
      return diagnostic("simulation.command-id-conflict", "A command ID was reused with a different version or payload digest.", {
        commandId: incoming.commandId.value,
      });
    }
  }
  if (fixture.kind === "scheduled-in-past") {
    if (fixture.document?.scheduledTick < fixture.currentTick) {
      return diagnostic("simulation.command-scheduled-in-past", "A command is scheduled before the current simulation tick.", {
        commandId: fixture.document.commandId.value,
        scheduledTick: fixture.document.scheduledTick,
        currentTick: fixture.currentTick,
      });
    }
  }
  if (fixture.kind === "duplicate-resource") {
    const keys = fixture.document?.resourceKeys ?? [];
    const duplicates = keys.filter((key, index) => keys.indexOf(key) !== index);
    if (duplicates.length > 0) {
      return diagnostic("simulation.resource-duplicate", "A requested resource set contains a duplicate key.", { duplicates: [...new Set(duplicates)].sort(compareUtf16) });
    }
  }
  if (fixture.kind === "presentation-state") {
    if (Object.hasOwn(fixture.document ?? {}, "rendererState")) {
      return diagnostic("simulation.snapshot-presentation-state", "A simulation snapshot contains presentation-owned state.", { pointer: "/rendererState" });
    }
  }
  if (fixture.kind === "catch-up-overflow") {
    if (fixture.accumulatedTicks > fixture.maximumTicksPerPump) {
      return diagnostic("simulation.lifecycle-catch-up-capped", "Presentation catch-up exceeds the per-pump logical tick cap.", {
        accumulatedTicks: fixture.accumulatedTicks,
        maximumTicksPerPump: fixture.maximumTicksPerPump,
      });
    }
  }
  if (fixture.kind === "missing-yield-cell") {
    if (Array.isArray(fixture.yieldCells) && fixture.yieldCells.length === 0) {
      return diagnostic("simulation.deadlock-no-yield-cell", "A deterministic deadlock victim has no legal yield cell.", {
        actorId: fixture.actorId,
        intentId: fixture.intentId,
        worldRevision: fixture.worldRevision,
      });
    }
  }
  if (fixture.kind === "incomplete-migration") {
    if (fixture.hasCompleteResourceContext !== true) {
      return {
        code: "contract.migration-context-missing",
        owner: "contract",
        version: 1,
        message: "An in-progress simulation action is missing versioned resource context.",
        context: { form: "simulation-snapshot", sourceVersion: fixture.sourceVersion },
      };
    }
  }
  return null;
}

export function runSimulationNegativeDiagnostics(context, readJson) {
  const paths = [
    "fixtures/invalid/simulation-command-id-conflict.json",
    "fixtures/invalid/simulation-command-scheduled-past.json",
    "fixtures/invalid/simulation-duplicate-resource.json",
    "fixtures/invalid/simulation-presentation-state.json",
    "fixtures/invalid/simulation-catch-up-overflow.json",
    "fixtures/invalid/simulation-missing-yield-cell.json",
    "fixtures/invalid/simulation-incomplete-migration.json",
  ];
  for (const path of paths) {
    const fixture = readJson(path);
    if (fixture) compareExpectedDiagnostic(context, path, fixture.expectedFailure, evaluateSimulationNegativeDiagnostic(fixture));
  }
}

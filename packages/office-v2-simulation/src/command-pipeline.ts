import type {
  CommandDocument,
  EventDocument,
  ResultDocument,
} from "@affiliate-ops/office-v2-contracts";

export const COMMAND_PIPELINE_VERSION = "office-command-pipeline-v1" as const;

type CommandId = CommandDocument["commandId"];
type CommandKind = CommandDocument["kind"];

export interface CommandLedgerEntry {
  readonly commandVersion: number;
  readonly payloadDigest: string;
  readonly resultId: ResultDocument["resultId"];
  readonly appliedTick: number;
}

export interface IntentCommandFact {
  readonly intentId: string;
  readonly commandKind: CommandKind;
  readonly appliedTick: number;
  readonly targetEntityId?: string;
  readonly interactionId?: string;
  readonly reason?: string;
}

export interface CommandPipelineState {
  readonly schemaVersion: typeof COMMAND_PIPELINE_VERSION;
  readonly tick: number;
  readonly worldRevision: number;
  readonly acceptedCommands: Readonly<Record<string, CommandLedgerEntry>>;
  readonly pendingCommands: readonly CommandDocument[];
  readonly intentFacts: Readonly<Record<string, IntentCommandFact>>;
  readonly eventSequence: number;
  readonly results: readonly ResultDocument[];
  readonly events: readonly EventDocument[];
}

export interface CommandPipelineAdvance {
  readonly state: CommandPipelineState;
  readonly results: readonly ResultDocument[];
  readonly events: readonly EventDocument[];
  readonly appliedCommandIds: readonly string[];
}

type DiagnosticCode =
  | "simulation.command-owner-invalid"
  | "simulation.command-scheduled-in-past"
  | "simulation.command-id-conflict"
  | "simulation.world-revision-stale"
  | "simulation.tick-invalid";

function identity(kind: string, value: string): { readonly kind: string; readonly value: string } {
  return { kind, value };
}

function commandKey(command: Pick<CommandDocument, "commandId">): string {
  return command.commandId.value;
}

function compareUtf16(left: string, right: string): number {
  const length = Math.min(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const difference = left.charCodeAt(index) - right.charCodeAt(index);
    if (difference !== 0) return difference;
  }
  return left.length - right.length;
}

function compareCommands(left: CommandDocument, right: CommandDocument): number {
  return left.scheduledTick - right.scheduledTick
    || left.sourceRank - right.sourceRank
    || left.sourceSequence - right.sourceSequence
    || compareUtf16(left.commandId.value, right.commandId.value);
}

function diagnostic(
  code: DiagnosticCode,
  message: string,
  pointers: readonly string[],
): ResultDocument["diagnostic"] {
  return {
    code,
    owner: "simulation",
    version: 1,
    message,
    pointers,
  };
}

function resultId(command: CommandDocument, suffix = "accepted"): ResultDocument["resultId"] {
  return identity("result", `command-${command.commandId.value}-${suffix}`) as ResultDocument["resultId"];
}

function eventId(command: CommandDocument, sequence: number): EventDocument["eventId"] {
  return identity("event", `command-${command.commandId.value}-${sequence}`) as EventDocument["eventId"];
}

function resultFor(
  command: CommandDocument,
  tick: number,
  status: ResultDocument["status"],
  stateChanged: boolean,
  result: ResultDocument["resultId"],
  failure?: ResultDocument["diagnostic"],
): ResultDocument {
  const base = {
    schemaVersion: "office-simulation-result-v2" as const,
    resultId: result,
    commandId: command.commandId,
    tick,
    status,
    stateChanged,
    payloadDigest: command.payloadDigest,
  };
  return failure === undefined ? base : { ...base, diagnostic: failure };
}

function cloneState(state: CommandPipelineState): {
  acceptedCommands: Record<string, CommandLedgerEntry>;
  pendingCommands: CommandDocument[];
  intentFacts: Record<string, IntentCommandFact>;
  eventSequence: number;
  results: ResultDocument[];
  events: EventDocument[];
} {
  return {
    acceptedCommands: { ...state.acceptedCommands },
    pendingCommands: [...state.pendingCommands],
    intentFacts: { ...state.intentFacts },
    eventSequence: state.eventSequence,
    results: [...state.results],
    events: [...state.events],
  };
}

function invalidOwner(command: CommandDocument): ResultDocument["diagnostic"] | null {
  const hasActor = command.actorId !== undefined;
  const hasSystem = command.systemOwner !== undefined;
  if (command.ownerKind === "actor" && hasActor && !hasSystem) return null;
  if (command.ownerKind === "system" && hasSystem && !hasActor) return null;
  return diagnostic(
    "simulation.command-owner-invalid",
    "A command owner must contain exactly the identity required by ownerKind.",
    ["/ownerKind", "/actorId", "/systemOwner"],
  );
}

function factFromCommand(command: CommandDocument, tick: number): IntentCommandFact {
  const fact: IntentCommandFact = {
    intentId: command.payload.intentId.value,
    commandKind: command.kind,
    appliedTick: tick,
  };
  if (command.payload.targetEntityId !== undefined) {
    return { ...fact, targetEntityId: command.payload.targetEntityId.value };
  }
  if (command.payload.interactionId !== undefined) {
    return { ...fact, interactionId: command.payload.interactionId.value };
  }
  if (command.payload.reason !== undefined) {
    return { ...fact, reason: command.payload.reason };
  }
  return fact;
}

function acceptedEvent(
  command: CommandDocument,
  tick: number,
  sequence: number,
): EventDocument {
  const payload: EventDocument["payload"] = {
    intentId: command.payload.intentId,
  };
  return {
    schemaVersion: "office-simulation-event-v2",
    eventId: eventId(command, sequence),
    eventVersion: 1,
    emittedTick: tick,
    sequence,
    sourceCommandId: command.commandId,
    kind: "command-accepted",
    payload,
  };
}

export function createCommandPipelineState(worldRevision = 0, tick = 0): CommandPipelineState {
  if (!Number.isSafeInteger(worldRevision) || worldRevision < 0) {
    throw new RangeError("worldRevision must be a non-negative safe integer");
  }
  if (!Number.isSafeInteger(tick) || tick < 0) {
    throw new RangeError("tick must be a non-negative safe integer");
  }
  return {
    schemaVersion: COMMAND_PIPELINE_VERSION,
    tick,
    worldRevision,
    acceptedCommands: {},
    pendingCommands: [],
    intentFacts: {},
    eventSequence: 0,
    results: [],
    events: [],
  };
}

function rejectedResult(
  command: CommandDocument,
  tick: number,
  failure: ResultDocument["diagnostic"],
): ResultDocument {
  return resultFor(command, tick, "rejected", false, resultId(command, "rejected"), failure);
}

/**
 * Advance the pure command pipeline to an explicit logical tick.
 *
 * Commands are facts at this layer only. Facility assignment, navigation,
 * interaction progress, and replay hashing consume the accepted ledger later.
 */
export function advanceCommandPipeline(
  state: CommandPipelineState,
  commands: readonly CommandDocument[] = [],
  targetTick = state.tick,
): CommandPipelineAdvance {
  if (!Number.isSafeInteger(targetTick) || targetTick < state.tick) {
    throw new RangeError("targetTick must be a non-negative safe integer at or after the current tick");
  }

  const mutable = cloneState(state);
  const outputs: ResultDocument[] = [];
  const events: EventDocument[] = [];
  const appliedCommandIds: string[] = [];
  const acceptedAtEntry = state.acceptedCommands;

  for (const command of commands) {
    const key = commandKey(command);
    const accepted = acceptedAtEntry[key];
    if (accepted !== undefined) {
      if (accepted.commandVersion === command.commandVersion && accepted.payloadDigest === command.payloadDigest) {
        outputs.push(resultFor(command, state.tick, "idempotent-duplicate", false, accepted.resultId));
      } else {
        outputs.push(rejectedResult(command, state.tick, diagnostic(
          "simulation.command-id-conflict",
          "A command ID was already accepted with a different version or payload digest.",
          ["/commandId", "/commandVersion", "/payloadDigest"],
        )));
      }
      continue;
    }
    if (command.scheduledTick < state.tick) {
      outputs.push(rejectedResult(command, state.tick, diagnostic(
        "simulation.command-scheduled-in-past",
        "A command cannot be scheduled before the current logical tick.",
        ["/scheduledTick"],
      )));
      continue;
    }
    const ownerFailure = invalidOwner(command);
    if (ownerFailure !== null) {
      outputs.push(rejectedResult(command, state.tick, ownerFailure));
      continue;
    }
    mutable.pendingCommands.push(command);
  }

  for (let tick = state.tick; tick <= targetTick; tick += 1) {
    const eligible = mutable.pendingCommands
      .filter((command) => command.scheduledTick <= tick)
      .sort(compareCommands);
    mutable.pendingCommands = mutable.pendingCommands.filter((command) => command.scheduledTick > tick);

    for (const command of eligible) {
      const key = commandKey(command);
      const accepted = mutable.acceptedCommands[key];
      if (accepted !== undefined) {
        if (accepted.commandVersion === command.commandVersion && accepted.payloadDigest === command.payloadDigest) {
          outputs.push(resultFor(command, tick, "idempotent-duplicate", false, accepted.resultId));
        } else {
          outputs.push(rejectedResult(command, tick, diagnostic(
            "simulation.command-id-conflict",
            "A command ID was already accepted with a different version or payload digest.",
            ["/commandId", "/commandVersion", "/payloadDigest"],
          )));
        }
        continue;
      }
      const ownerFailure = invalidOwner(command);
      if (ownerFailure !== null) {
        outputs.push(rejectedResult(command, tick, ownerFailure));
        continue;
      }
      if (command.expectedWorldRevision !== state.worldRevision) {
        outputs.push(rejectedResult(command, tick, diagnostic(
          "simulation.world-revision-stale",
          "A command expected a different world revision at apply time.",
          ["/expectedWorldRevision"],
        )));
        continue;
      }

      const result = resultFor(command, tick, "accepted", true, resultId(command));
      const sequence = mutable.eventSequence + 1;
      const event = acceptedEvent(command, tick, sequence);
      mutable.acceptedCommands[key] = {
        commandVersion: command.commandVersion,
        payloadDigest: command.payloadDigest,
        resultId: result.resultId,
        appliedTick: tick,
      };
      mutable.intentFacts[command.payload.intentId.value] = factFromCommand(command, tick);
      mutable.eventSequence = sequence;
      mutable.results.push(result);
      mutable.events.push(event);
      outputs.push(result);
      events.push(event);
      appliedCommandIds.push(key);
    }
  }

  const nextState: CommandPipelineState = {
    ...state,
    tick: targetTick,
    acceptedCommands: mutable.acceptedCommands,
    pendingCommands: mutable.pendingCommands,
    intentFacts: mutable.intentFacts,
    eventSequence: mutable.eventSequence,
    results: mutable.results,
    events: mutable.events,
  };
  return { state: nextState, results: outputs, events, appliedCommandIds };
}

export function commandIdValue(commandId: CommandId): string {
  return commandId.value;
}

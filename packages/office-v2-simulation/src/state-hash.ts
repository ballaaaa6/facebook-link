import {
  canonicalHashHex,
  canonicalJsonBytes,
  normalizeDeclaredCollections,
  type JsonCollectionDeclaration,
  type JsonValue,
} from "@affiliate-ops/office-v2-contracts";

export const SIMULATION_STATE_HASH_DOMAIN = "office-v2:simulation" as const;
export const SIMULATION_STATE_HASH_VERSION = "office-simulation-state-v2" as const;
export const SIMULATION_PRNG_VERSION = "office-prng-v1" as const;

export interface SimulationHashInput {
  readonly state: JsonValue;
  /** Presentation state is intentionally not part of the simulation hash. */
  readonly presentationState?: JsonValue;
  readonly collectionDeclarations?: readonly JsonCollectionDeclaration[];
}

export interface SimulationHashResult {
  readonly normalizedState: JsonValue;
  readonly canonicalBytes: Uint8Array;
  readonly stateHash: string;
  readonly domain: typeof SIMULATION_STATE_HASH_DOMAIN;
  readonly domainVersion: typeof SIMULATION_STATE_HASH_VERSION;
}

export interface SimulationRandomStream {
  readonly streamId: string;
  readonly algorithm: typeof SIMULATION_PRNG_VERSION;
  readonly state: number;
  readonly drawCount: number;
}

export interface RandomDraw {
  readonly value: number;
  readonly stream: SimulationRandomStream;
}

function assertStreamId(streamId: string): void {
  if (typeof streamId !== "string" || streamId.length === 0) {
    throw new TypeError("simulation.prng-stream-invalid: streamId must be non-empty");
  }
}

function assertSeed(seed: number): void {
  if (!Number.isSafeInteger(seed)) {
    throw new RangeError("simulation.prng-seed-invalid: seed must be a safe integer");
  }
}

function assertStream(stream: SimulationRandomStream): void {
  assertStreamId(stream.streamId);
  if (stream.algorithm !== SIMULATION_PRNG_VERSION) {
    throw new TypeError("simulation.prng-algorithm-invalid: unsupported stream algorithm");
  }
  if (!Number.isSafeInteger(stream.state) || stream.state < 0 || stream.state > 0xffffffff) {
    throw new RangeError("simulation.prng-state-invalid: state must be a uint32");
  }
  if (!Number.isSafeInteger(stream.drawCount) || stream.drawCount < 0) {
    throw new RangeError("simulation.prng-draw-count-invalid: drawCount must be non-negative");
  }
}

function streamSeed(seed: number, streamId: string): number {
  assertSeed(seed);
  assertStreamId(streamId);
  const digest = canonicalHashHex({
    domain: "office-v2:simulation-prng",
    domainVersion: SIMULATION_PRNG_VERSION,
    payload: { seed, streamId },
  });
  const derived = Number.parseInt(digest.slice(0, 8), 16) >>> 0;
  return derived === 0 ? 0x6d2b79f5 : derived;
}

/** Create an independent named xorshift32 stream from a seed and stream name. */
export function createRandomStream(seed: number, streamId: string): SimulationRandomStream {
  return {
    streamId,
    algorithm: SIMULATION_PRNG_VERSION,
    state: streamSeed(seed, streamId),
    drawCount: 0,
  };
}

/** Advance one named stream without mutating the input object. */
export function nextRandom(stream: SimulationRandomStream): RandomDraw {
  assertStream(stream);
  let state = stream.state >>> 0;
  state ^= state << 13;
  state ^= state >>> 17;
  state ^= state << 5;
  state >>>= 0;
  return {
    value: state / 0x100000000,
    stream: { ...stream, state, drawCount: stream.drawCount + 1 },
  };
}

/** Normalize only the collections explicitly declared by the simulation owner. */
export function normalizeSimulationState(
  state: JsonValue,
  collectionDeclarations: readonly JsonCollectionDeclaration[] = [],
): JsonValue {
  return normalizeDeclaredCollections(state, collectionDeclarations);
}

/**
 * Project simulation truth before hashing. Presentation is supplied separately
 * and intentionally ignored, so renderer/effect state cannot change replay
 * identity.
 */
export function projectHashableSimulationState(input: SimulationHashInput): JsonValue {
  return normalizeSimulationState(input.state, input.collectionDeclarations ?? []);
}

export function hashSimulationState(input: SimulationHashInput): SimulationHashResult {
  const normalizedState = projectHashableSimulationState(input);
  return {
    normalizedState,
    canonicalBytes: canonicalJsonBytes(normalizedState),
    stateHash: canonicalHashHex({
      domain: SIMULATION_STATE_HASH_DOMAIN,
      domainVersion: SIMULATION_STATE_HASH_VERSION,
      payload: normalizedState,
    }),
    domain: SIMULATION_STATE_HASH_DOMAIN,
    domainVersion: SIMULATION_STATE_HASH_VERSION,
  };
}

export function simulationCollectionDeclarations(
  pointers: readonly string[],
): readonly JsonCollectionDeclaration[] {
  return pointers.map((pointer) => ({
    pointer,
    order: "unordered" as const,
    key: (entry: JsonValue): string => {
      if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
        throw new TypeError("contract.collection-key-invalid: collection entry must be an object");
      }
      const record = entry as { readonly id?: JsonValue; readonly commandId?: JsonValue; readonly streamId?: JsonValue };
      const identity = record.id ?? record.commandId ?? record.streamId;
      if (typeof identity === "string") return identity;
      if (typeof identity === "object" && identity !== null && !Array.isArray(identity)) {
        const value = (identity as { readonly value?: JsonValue }).value;
        if (typeof value === "string") return value;
      }
      throw new TypeError("contract.collection-key-invalid: entry has no stable identity");
    },
  }));
}

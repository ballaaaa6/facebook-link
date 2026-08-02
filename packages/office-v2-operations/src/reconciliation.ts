import { canonicalJson, parseJsonText, type JsonValue } from "@affiliate-ops/office-v2-contracts";
import type {
  ExternalInput as SimulationExternalInput,
  ExternalInputId,
  SnapshotDocument as SimulationSnapshotV2Document,
  OperationsEventRecord,
  OperationsSnapshotDocument,
} from "@affiliate-ops/office-v2-contracts";
import {
  applyChoreographyTransition,
  createChoreographyState,
  projectPresentationState,
  type ChoreographyDiagnostic,
  type ChoreographyIntent,
  type ChoreographyScope,
  type ChoreographyState,
  type ChoreographyTransition,
  type SemanticPresentationProjection,
} from "./choreography.ts";
import type { AdapterDiagnostic, AdapterDiagnosticCode, OperationsCursor } from "./index.ts";

export const RECONCILIATION_SCHEMA_VERSION = "office-operations-reconciliation-v1" as const;
export const RECONCILIATION_TICK_RATE_HZ = 10 as const;

export type ReconciliationMode = "reconnect" | "reload" | "restore" | "resume" | "bfcache-restore";
export type ReconciliationStatus = "applied" | "duplicate" | "current-truth" | "future" | "expired" | "resync-required" | "conflict" | "rejected";
export type ReconciliationDiagnostic = AdapterDiagnostic | ChoreographyDiagnostic;

export interface ExternalInputFingerprint {
  readonly inputId: string;
  readonly payloadDigest: string;
}
export interface ExternalInputCursor {
  readonly streamId: string;
  readonly streamEpoch: number;
  readonly throughSequence: number;
  readonly retentionWindowStart: number;
  readonly seenInputs: readonly ExternalInputFingerprint[];
}
export interface TwoClockState {
  readonly simulationTick: number;
  readonly simulationTickRateHz: typeof RECONCILIATION_TICK_RATE_HZ;
  readonly externalNow: string;
  readonly externalThroughSequence: number;
}
export interface ReconciliationQueueItem {
  readonly operationId: string;
  readonly intentId: string;
  readonly payloadDigest: string;
  readonly priorityClass: "durable" | "decorative";
  readonly issuedTick: number;
  readonly enqueueTick: number;
  readonly status: "pending" | "in-progress" | "completed" | "failed" | "expired" | "canceled";
  readonly expiresAt: string | null;
  readonly sourceEventId: string | null;
}
export interface PendingReconciliationIntent {
  readonly intent: ChoreographyIntent;
  readonly expiresAt: string | null;
}
export interface ReconciliationIntentLedgerEntry {
  readonly id: string;
  readonly durableEventId: string | null;
}
export interface ReconciliationCheckpoint {
  readonly schemaVersion: typeof RECONCILIATION_SCHEMA_VERSION;
  readonly simulationSnapshot: SimulationSnapshotV2Document;
  readonly cursor: ExternalInputCursor;
  readonly clocks: TwoClockState;
  readonly choreography: ChoreographyState;
  readonly pendingOperations: readonly ReconciliationQueueItem[];
  readonly pendingIntents: readonly PendingReconciliationIntent[];
  readonly intentLedger: readonly ReconciliationIntentLedgerEntry[];
}
export interface ReconciliationEventPolicy {
  readonly durableEventId: string;
  readonly validFrom?: string;
  readonly expiresAt?: string;
  readonly transition?: ChoreographyTransition;
}
export interface ReconciliationRequest {
  readonly mode: ReconciliationMode;
  readonly checkpoint: ReconciliationCheckpoint;
  readonly operationsSnapshot: OperationsSnapshotDocument;
  readonly externalNow: string;
  readonly eventPolicies?: readonly ReconciliationEventPolicy[];
  readonly durableOperations?: readonly ReconciliationQueueItem[];
}
export interface ReconciliationResult {
  readonly mode: ReconciliationMode;
  readonly status: ReconciliationStatus;
  readonly checkpoint: ReconciliationCheckpoint;
  readonly projection: SemanticPresentationProjection;
  readonly acceptedInputs: readonly SimulationExternalInput[];
  readonly consumedInputIds: readonly string[];
  readonly duplicateInputIds: readonly string[];
  readonly expiredInputIds: readonly string[];
  readonly coalescedIntentIds: readonly string[];
  readonly intents: readonly ChoreographyIntent[];
  readonly pendingIntents: readonly PendingReconciliationIntent[];
  readonly pendingOperations: readonly ReconciliationQueueItem[];
  readonly diagnostics: readonly ReconciliationDiagnostic[];
}

export function operationsCursorToExternalInputCursor(cursor: OperationsCursor): ExternalInputCursor {
  return {
    streamId: cursor.streamId,
    streamEpoch: cursor.streamEpoch,
    throughSequence: cursor.throughSequence,
    retentionWindowStart: cursor.retentionWindowStart,
    seenInputs: cursor.seenEvents.map((event) => ({ inputId: event.durableEventId, payloadDigest: event.payloadDigest })).sort(compareFingerprint),
  };
}
export function externalInputCursorToOperationsCursor(cursor: ExternalInputCursor): OperationsCursor {
  return {
    streamId: cursor.streamId,
    streamEpoch: cursor.streamEpoch,
    throughSequence: cursor.throughSequence,
    retentionWindowStart: cursor.retentionWindowStart,
    seenEvents: cursor.seenInputs.map((event) => ({ durableEventId: event.inputId, payloadDigest: event.payloadDigest })).sort(compareFingerprintAsEvent),
  };
}
export function createReconciliationCheckpoint(input: {
  readonly simulationSnapshot: SimulationSnapshotV2Document;
  readonly cursor: ExternalInputCursor;
  readonly scope: ChoreographyScope;
  readonly externalNow: string;
  readonly pendingOperations?: readonly ReconciliationQueueItem[];
  readonly pendingIntents?: readonly PendingReconciliationIntent[];
  readonly intentLedger?: readonly ReconciliationIntentLedgerEntry[];
}): ReconciliationCheckpoint {
  assertTimestamp(input.externalNow, "externalNow");
  return {
    schemaVersion: RECONCILIATION_SCHEMA_VERSION,
    simulationSnapshot: input.simulationSnapshot,
    cursor: cloneCursor(input.cursor),
    clocks: {
      simulationTick: input.simulationSnapshot.tick,
      simulationTickRateHz: RECONCILIATION_TICK_RATE_HZ,
      externalNow: input.externalNow,
      externalThroughSequence: input.cursor.throughSequence,
    },
    choreography: createChoreographyState(input.scope),
    pendingOperations: sortQueue(input.pendingOperations ?? []),
    pendingIntents: sortPendingIntents(input.pendingIntents ?? []),
    intentLedger: sortLedger(input.intentLedger ?? []),
  };
}
export function validateReconciliationCheckpoint(checkpoint: ReconciliationCheckpoint): readonly AdapterDiagnostic[] {
  const diagnostics: AdapterDiagnostic[] = [];
  if (checkpoint.schemaVersion !== RECONCILIATION_SCHEMA_VERSION) diagnostics.push(adapterDiagnostic("adapter.reconciliation-invalid", "The reconciliation checkpoint schema is unsupported.", { actual: String(checkpoint.schemaVersion) }));
  if (checkpoint.simulationSnapshot.schemaVersion !== "office-simulation-snapshot-v2" || checkpoint.simulationSnapshot.tickRateHz !== RECONCILIATION_TICK_RATE_HZ) diagnostics.push(adapterDiagnostic("adapter.reconciliation-invalid", "The reconciliation checkpoint must contain a completed 10 Hz Snapshot V2 boundary.", { subjectId: "simulationSnapshot" }));
  if (checkpoint.clocks.simulationTick !== checkpoint.simulationSnapshot.tick || checkpoint.clocks.simulationTickRateHz !== RECONCILIATION_TICK_RATE_HZ) diagnostics.push(adapterDiagnostic("adapter.reconciliation-invalid", "Simulation clock state disagrees with the restored Snapshot V2 tick.", { expected: checkpoint.simulationSnapshot.tick, actual: checkpoint.clocks.simulationTick }));
  if (checkpoint.clocks.externalThroughSequence !== checkpoint.cursor.throughSequence) diagnostics.push(adapterDiagnostic("adapter.reconciliation-invalid", "External clock state disagrees with the restored input cursor.", { expected: checkpoint.cursor.throughSequence, actual: checkpoint.clocks.externalThroughSequence }));
  if (!isTimestamp(checkpoint.clocks.externalNow)) diagnostics.push(adapterDiagnostic("adapter.reconciliation-invalid", "The restored external clock is not a valid timestamp.", { subjectId: "externalNow" }));
  if (!validCursor(checkpoint.cursor)) diagnostics.push(adapterDiagnostic("adapter.reconciliation-invalid", "The restored external-input cursor is contradictory or invalid.", { subjectId: "cursor" }));
  const seen = new Map<string, string>();
  for (const input of checkpoint.simulationSnapshot.externalInputs) {
    if (input.kind !== "operations-event") continue;
    const id = valueOf(input.inputId);
    const prior = seen.get(id);
    if (prior !== undefined && prior !== input.payloadDigest) diagnostics.push(adapterDiagnostic("adapter.event-digest-conflict", "The restored Snapshot V2 contains one external input ID with multiple payload digests.", { subjectId: id }));
    seen.set(id, input.payloadDigest);
  }
  return diagnostics;
}
export function serializeReconciliationCheckpoint(checkpoint: ReconciliationCheckpoint): string {
  return canonicalJson(checkpoint as unknown as JsonValue);
}
export function deserializeReconciliationCheckpoint(serialized: string): ReconciliationCheckpoint {
  const value = parseJsonText(serialized);
  if (!isRecord(value) || value.schemaVersion !== RECONCILIATION_SCHEMA_VERSION) throw new TypeError("adapter.reconciliation-invalid: unsupported checkpoint schema");
  return value as unknown as ReconciliationCheckpoint;
}

export function reconcileOperations(input: ReconciliationRequest): ReconciliationResult {
  const projection = projectPresentationState(input.operationsSnapshot);
  const diagnostics: ReconciliationDiagnostic[] = [...validateReconciliationCheckpoint(input.checkpoint)];
  const policies = policyMap(input.eventPolicies ?? [], diagnostics);
  const now = Date.parse(input.externalNow);
  if (!Number.isFinite(now)) diagnostics.push(adapterDiagnostic("adapter.reconciliation-invalid", "The supplied external clock is not a valid timestamp.", { subjectId: "externalNow" }));
  if (isTimestamp(input.checkpoint.clocks.externalNow) && now < Date.parse(input.checkpoint.clocks.externalNow)) diagnostics.push(adapterDiagnostic("adapter.clock-skew", "The external clock moved backwards across reconciliation.", { expected: input.checkpoint.clocks.externalNow, actual: input.externalNow }));
  const queue = reconcileQueue(input.checkpoint.pendingOperations, input.durableOperations, input.externalNow, diagnostics);
  const coalescedBase = coalescePendingIntents(input.checkpoint.pendingIntents, input.externalNow, diagnostics);
  const intentsBase: IntentResult = { pending: coalescedBase.pending, ledger: sortLedger(input.checkpoint.intentLedger), emitted: [], coalesced: coalescedBase.coalesced };
  const unchanged = (status: ReconciliationStatus, checkpoint = input.checkpoint): ReconciliationResult => result(input, status, checkpoint, projection, [], [], [], [], [], [], intentsBase.pending, queue.items, diagnostics);
  if (diagnostics.some((entry) => entry.code === "adapter.reconciliation-invalid" || entry.code === "adapter.clock-skew")) return unchanged("rejected");
  if (valueOf(input.operationsSnapshot.observedAt) && now < Date.parse(input.operationsSnapshot.observedAt)) {
    diagnostics.push(adapterDiagnostic("adapter.clock-skew", "The operations snapshot was observed after the supplied external clock.", { expected: input.externalNow, actual: input.operationsSnapshot.observedAt }));
    return unchanged("rejected");
  }
  const windowIssues = validateWindow(input.operationsSnapshot);
  diagnostics.push(...windowIssues);
  const cursor = input.checkpoint.cursor;
  if (cursor.streamId !== valueOf(input.operationsSnapshot.streamId)) return currentTruth(input, projection, queue, intentsBase, diagnostics, "adapter.stream-mismatch");
  if (cursor.streamEpoch !== input.operationsSnapshot.streamEpoch) return currentTruth(input, projection, queue, intentsBase, diagnostics, "adapter.stream-epoch-changed");
  if (cursor.throughSequence > input.operationsSnapshot.throughSequence) {
    diagnostics.push(adapterDiagnostic("adapter.cursor-ahead-of-snapshot", "The restored external cursor is newer than the delivered operations truth.", { expected: input.operationsSnapshot.throughSequence, actual: cursor.throughSequence }));
    return unchanged("rejected");
  }
  if (cursor.throughSequence + 1 < input.operationsSnapshot.windowStartSequence || cursor.throughSequence + 1 < cursor.retentionWindowStart || windowIssues.length > 0) return currentTruth(input, projection, queue, intentsBase, diagnostics, windowIssues[0]?.code ?? "adapter.cursor-too-old");
  const persisted = persistedExternalInputs(input.checkpoint.simulationSnapshot, diagnostics);
  const seen = new Map(cursor.seenInputs.map((entry) => [entry.inputId, entry.payloadDigest]));
  for (const [id, digest] of persisted) {
    const prior = seen.get(id);
    if (prior !== undefined && prior !== digest) diagnostics.push(adapterDiagnostic("adapter.event-digest-conflict", "The restored cursor and Snapshot V2 disagree about an external input digest.", { subjectId: id }));
    seen.set(id, digest);
  }
  if (diagnostics.some((entry) => entry.code === "adapter.event-digest-conflict")) return unchanged("conflict");
  let current = input.checkpoint;
  let through = cursor.throughSequence;
  let expected = through + 1;
  const acceptedInputs: SimulationExternalInput[] = [];
  const consumed: string[] = [];
  const duplicates: string[] = [];
  const expired: string[] = [];
  const generated: PendingReconciliationIntent[] = [];
  let stopped: ReconciliationStatus | undefined;
  for (const event of input.operationsSnapshot.events) {
    const id = valueOf(event.durableEventId);
    const knownDigest = seen.get(id);
    if (knownDigest !== undefined) {
      if (knownDigest !== event.payloadDigest) {
        diagnostics.push(adapterDiagnostic("adapter.event-digest-conflict", "A durable event ID was reused with a different payload digest.", { subjectId: id }));
        return unchanged("conflict");
      }
      duplicates.push(id);
      through = Math.max(through, event.sequence);
      expected = event.sequence + 1;
      continue;
    }
    if (event.sequence !== expected) {
      diagnostics.push(adapterDiagnostic(event.sequence < expected ? "adapter.late-event" : "adapter.sequence-gap", "The next external input does not follow the restored high-water cursor.", { expectedSequence: expected, actualSequence: event.sequence }));
      return currentTruth(input, projection, queue, intentsBase, diagnostics, event.sequence < expected ? "adapter.late-event" : "adapter.sequence-gap");
    }
    const policy = policies.get(id);
    const transition = policy?.transition;
    if (transition !== undefined && (valueOf(transition.durableEventId) !== id || transition.payloadDigest !== event.payloadDigest)) {
      diagnostics.push(adapterDiagnostic("adapter.event-digest-conflict", "A choreography transition does not match its durable operations event.", { subjectId: id }));
      return unchanged("conflict");
    }
    const eligibility = eventEligibility(event, policy, input.externalNow, diagnostics);
    if (eligibility === "invalid") return unchanged("rejected");
    if (eligibility === "future") {
      diagnostics.push(adapterDiagnostic("adapter.external-input-future", "A future external input remains pending and cannot advance the cursor.", { subjectId: id, actual: input.externalNow }));
      stopped = "future";
      break;
    }
    seen.set(id, event.payloadDigest);
    through = event.sequence;
    expected = event.sequence + 1;
    consumed.push(id);
    if (eligibility === "expired") {
      expired.push(id);
      diagnostics.push(adapterDiagnostic("adapter.external-input-expired", "An expired external input was consumed without execution.", { subjectId: id }));
      continue;
    }
    acceptedInputs.push(toSimulationInput(event, current.clocks.simulationTick));
    if (transition !== undefined) {
      const reduced = applyChoreographyTransition(current.choreography, transition);
      diagnostics.push(...reduced.diagnostics);
      current = { ...current, choreography: reduced.state };
      for (const intent of reduced.intents) generated.push({ intent, expiresAt: policy?.expiresAt ?? null });
    }
  }
  const nextCursor = { ...cursor, streamId: valueOf(input.operationsSnapshot.streamId), streamEpoch: input.operationsSnapshot.streamEpoch, throughSequence: through, retentionWindowStart: input.operationsSnapshot.windowStartSequence, seenInputs: [...seen.entries()].map(([inputId, payloadDigest]) => ({ inputId, payloadDigest })).sort(compareFingerprint) };
  const intentResult = reconcileIntents(current, intentsBase, generated, input.externalNow, diagnostics);
  const nextCheckpoint: ReconciliationCheckpoint = { ...current, cursor: nextCursor, clocks: { ...current.clocks, externalNow: input.externalNow, externalThroughSequence: through }, pendingOperations: queue.items, pendingIntents: intentResult.pending, intentLedger: intentResult.ledger };
  const status = stopped ?? (expired.length > 0 && acceptedInputs.length === 0 ? "expired" : acceptedInputs.length > 0 || intentResult.emitted.length > 0 || queue.changed ? "applied" : duplicates.length > 0 ? "duplicate" : "duplicate");
  return result(input, status, nextCheckpoint, projection, acceptedInputs, consumed, duplicates, expired, intentResult.coalesced, intentResult.emitted, intentResult.pending, queue.items, diagnostics);
}

function currentTruth(input: ReconciliationRequest, projection: SemanticPresentationProjection, queue: QueueResult, intents: IntentResult, diagnostics: ReconciliationDiagnostic[], reason: AdapterDiagnosticCode): ReconciliationResult {
  if (!diagnostics.some((entry) => entry.code === reason)) diagnostics.push(adapterDiagnostic(reason, "Current durable operations truth replaces the unavailable historical event suffix.", { subjectId: valueOf(input.operationsSnapshot.snapshotId) }));
  const resetSeen = reason === "adapter.stream-mismatch" || reason === "adapter.stream-epoch-changed";
  const seen = new Map(resetSeen ? [] : input.checkpoint.cursor.seenInputs.map((entry) => [entry.inputId, entry.payloadDigest]));
  for (const event of input.operationsSnapshot.events) seen.set(valueOf(event.durableEventId), event.payloadDigest);
  const through = input.operationsSnapshot.throughSequence;
  const checkpoint: ReconciliationCheckpoint = {
    ...input.checkpoint,
    cursor: { ...input.checkpoint.cursor, streamId: valueOf(input.operationsSnapshot.streamId), streamEpoch: input.operationsSnapshot.streamEpoch, throughSequence: through, retentionWindowStart: input.operationsSnapshot.windowStartSequence, seenInputs: [...seen.entries()].map(([inputId, payloadDigest]) => ({ inputId, payloadDigest })).sort(compareFingerprint) },
    clocks: { ...input.checkpoint.clocks, externalNow: input.externalNow, externalThroughSequence: through },
    pendingOperations: queue.items,
    pendingIntents: intents.pending,
    intentLedger: intents.ledger,
  };
  return result(input, "current-truth", checkpoint, projection, [], [], [], [], intents.coalesced, [], intents.pending, queue.items, diagnostics);
}
function result(input: ReconciliationRequest, status: ReconciliationStatus, checkpoint: ReconciliationCheckpoint, projection: SemanticPresentationProjection, acceptedInputs: readonly SimulationExternalInput[], consumed: readonly string[], duplicates: readonly string[], expired: readonly string[], coalesced: readonly string[], intents: readonly ChoreographyIntent[], pendingIntents: readonly PendingReconciliationIntent[], pendingOperations: readonly ReconciliationQueueItem[], diagnostics: readonly ReconciliationDiagnostic[]): ReconciliationResult {
  return { mode: input.mode, status, checkpoint, projection, acceptedInputs, consumedInputIds: consumed, duplicateInputIds: duplicates, expiredInputIds: expired, coalescedIntentIds: coalesced, intents, pendingIntents, pendingOperations, diagnostics: stableDiagnostics(diagnostics) };
}

interface QueueResult { readonly items: readonly ReconciliationQueueItem[]; readonly changed: boolean; }
interface IntentResult { readonly pending: readonly PendingReconciliationIntent[]; readonly ledger: readonly ReconciliationIntentLedgerEntry[]; readonly emitted: readonly ChoreographyIntent[]; readonly coalesced: readonly string[]; }
function reconcileQueue(restored: readonly ReconciliationQueueItem[], durable: readonly ReconciliationQueueItem[] | undefined, nowText: string, diagnostics: ReconciliationDiagnostic[]): QueueResult {
  const map = new Map(restored.map((item) => [item.operationId, { ...item }]));
  let changed = false;
  for (const incoming of [...(durable ?? [])].sort((left, right) => compareStrings(left.operationId, right.operationId))) {
    const existing = map.get(incoming.operationId);
    if (existing === undefined) { map.set(incoming.operationId, { ...incoming }); changed = true; continue; }
    if (existing.payloadDigest !== incoming.payloadDigest) { diagnostics.push(adapterDiagnostic("adapter.queue-item-conflict", "A durable queue item changed payload identity during reconciliation.", { subjectId: incoming.operationId })); continue; }
    if (terminal(existing.status) && !terminal(incoming.status)) { diagnostics.push(adapterDiagnostic("adapter.queue-item-resurrection", "A terminal queue item cannot be resurrected by a reconnect delivery.", { subjectId: incoming.operationId })); continue; }
    if (terminal(existing.status) && terminal(incoming.status) && existing.status !== incoming.status) { diagnostics.push(adapterDiagnostic("adapter.queue-item-conflict", "A completed queue item conflicts with another terminal outcome.", { subjectId: incoming.operationId })); continue; }
    if (queueRank(incoming.status) > queueRank(existing.status)) { map.set(incoming.operationId, { ...existing, ...incoming }); changed = true; }
  }
  for (const [id, item] of map) {
    if (!terminal(item.status) && item.expiresAt !== null && expiresAt(item.expiresAt, nowText)) { map.set(id, { ...item, status: "expired" }); diagnostics.push(adapterDiagnostic("adapter.operation-expired", "A pending operation expired while the client was offline.", { subjectId: id })); changed = true; }
  }
  return { items: sortQueue([...map.values()]), changed };
}
function reconcileIntents(current: ReconciliationCheckpoint, base: IntentResult, generated: readonly PendingReconciliationIntent[], nowText: string, diagnostics: ReconciliationDiagnostic[]): IntentResult {
  const before = new Set(current.intentLedger.map((entry) => entry.id));
  const generatedIds = new Set(generated.map((entry) => entry.intent.id));
  const candidates = [...base.pending, ...generated];
  const coalescedResult = coalescePendingIntents(candidates, nowText, diagnostics);
  const records = coalescedResult.pending;
  const emitted = records.filter((record) => generatedIds.has(record.intent.id) && !before.has(record.intent.id)).map((record) => record.intent);
  const ledgerMap = new Map(current.intentLedger.map((entry) => [entry.id, entry]));
  for (const record of candidates) ledgerMap.set(record.intent.id, { id: record.intent.id, durableEventId: durableEventId(record.intent) });
  const coalesced = [...new Set([...base.coalesced, ...coalescedResult.coalesced])].sort(compareStrings);
  return { pending: records, ledger: sortLedger([...ledgerMap.values()]), emitted, coalesced };
}
interface CoalescedIntentResult { readonly pending: readonly PendingReconciliationIntent[]; readonly coalesced: readonly string[]; }
function coalescePendingIntents(values: readonly PendingReconciliationIntent[], nowText: string, diagnostics: ReconciliationDiagnostic[]): CoalescedIntentResult {
  const byKey = new Map<string, PendingReconciliationIntent>();
  const coalesced = new Set<string>();
  for (const value of [...values].sort((left, right) => compareStrings(left.intent.id, right.intent.id))) {
    if (value.expiresAt !== null && expiresAt(value.expiresAt, nowText)) { diagnostics.push(adapterDiagnostic("adapter.intent-stale", "An intent outside its external validity window was discarded.", { subjectId: value.intent.id })); continue; }
    const key = intentCoalesceKey(value.intent);
    const previous = byKey.get(key);
    if (previous === undefined) { byKey.set(key, value); continue; }
    const winner = compareIntent(value, previous) > 0 ? value : previous;
    const loser = winner === value ? previous : value;
    byKey.set(key, winner);
    coalesced.add(loser.intent.id);
  }
  return { pending: [...byKey.values()].sort((left, right) => compareStrings(left.intent.id, right.intent.id)), coalesced: [...coalesced].sort(compareStrings) };
}

function validateWindow(snapshot: OperationsSnapshotDocument): AdapterDiagnostic[] {
  const diagnostics: AdapterDiagnostic[] = [];
  if (snapshot.events.length === 0) {
    if (snapshot.windowStartSequence !== snapshot.throughSequence + 1) diagnostics.push(adapterDiagnostic("adapter.sequence-gap", "An empty operations window must start immediately after its through sequence.", { subjectId: valueOf(snapshot.snapshotId) }));
    return diagnostics;
  }
  let expected = snapshot.windowStartSequence;
  for (const event of snapshot.events) { if (event.sequence !== expected) { diagnostics.push(adapterDiagnostic("adapter.sequence-gap", "The operations event window is not contiguous.", { expectedSequence: expected, actualSequence: event.sequence })); break; } expected += 1; }
  if (snapshot.events.at(-1)?.sequence !== snapshot.throughSequence) diagnostics.push(adapterDiagnostic("adapter.sequence-gap", "The operations window through sequence does not match its final event.", { expectedSequence: snapshot.throughSequence, actualSequence: snapshot.events.at(-1)?.sequence ?? null }));
  return diagnostics;
}
function eventEligibility(event: OperationsEventRecord, policy: ReconciliationEventPolicy | undefined, nowText: string, diagnostics: ReconciliationDiagnostic[]): "eligible" | "expired" | "future" | "invalid" {
  const eventTime = Date.parse(event.occurredAt);
  const validFrom = policy?.validFrom === undefined ? Number.NEGATIVE_INFINITY : Date.parse(policy.validFrom);
  const expires = policy?.expiresAt === undefined ? Number.POSITIVE_INFINITY : Date.parse(policy.expiresAt);
  const now = Date.parse(nowText);
  if (!Number.isFinite(eventTime) || (policy?.validFrom !== undefined && !Number.isFinite(validFrom)) || (policy?.expiresAt !== undefined && !Number.isFinite(expires)) || (policy?.validFrom !== undefined && policy?.expiresAt !== undefined && expires <= validFrom)) { diagnostics.push(adapterDiagnostic("adapter.reconciliation-invalid", "An external event has contradictory validity timestamps.", { subjectId: valueOf(event.durableEventId) })); return "invalid"; }
  if (eventTime > now || now < validFrom) return "future";
  if (now >= expires) return "expired";
  return "eligible";
}
function policyMap(policies: readonly ReconciliationEventPolicy[], diagnostics: ReconciliationDiagnostic[]): Map<string, ReconciliationEventPolicy> {
  const result = new Map<string, ReconciliationEventPolicy>();
  for (const policy of [...policies].sort((left, right) => compareStrings(left.durableEventId, right.durableEventId))) { if (result.has(policy.durableEventId)) diagnostics.push(adapterDiagnostic("adapter.reconciliation-invalid", "An external event validity policy is duplicated.", { subjectId: policy.durableEventId })); else result.set(policy.durableEventId, policy); }
  return result;
}
function persistedExternalInputs(snapshot: SimulationSnapshotV2Document, diagnostics: ReconciliationDiagnostic[]): Map<string, string> {
  const result = new Map<string, string>();
  for (const input of snapshot.externalInputs) { if (input.kind !== "operations-event") continue; const id = valueOf(input.inputId); const prior = result.get(id); if (prior !== undefined && prior !== input.payloadDigest) diagnostics.push(adapterDiagnostic("adapter.event-digest-conflict", "The restored Snapshot V2 repeats an external event with a different digest.", { subjectId: id })); result.set(id, input.payloadDigest); }
  return result;
}
function toSimulationInput(event: OperationsEventRecord, simulationTick: number): SimulationExternalInput {
  return { inputId: { kind: "external-input", value: valueOf(event.durableEventId) } as ExternalInputId, scheduledTick: simulationTick + 1, kind: "operations-event", payloadDigest: event.payloadDigest };
}
function validCursor(cursor: ExternalInputCursor): boolean {
  return typeof cursor.streamId === "string" && cursor.streamId.length > 0 && Number.isSafeInteger(cursor.streamEpoch) && cursor.streamEpoch > 0 && Number.isSafeInteger(cursor.throughSequence) && cursor.throughSequence >= 0 && Number.isSafeInteger(cursor.retentionWindowStart) && cursor.retentionWindowStart >= 0 && cursor.seenInputs.every((entry) => typeof entry.inputId === "string" && entry.inputId.length > 0 && typeof entry.payloadDigest === "string" && entry.payloadDigest.length > 0);
}
function cloneCursor(cursor: ExternalInputCursor): ExternalInputCursor { return { ...cursor, seenInputs: cursor.seenInputs.map((entry) => ({ ...entry })).sort(compareFingerprint) }; }
function stableDiagnostics(values: readonly ReconciliationDiagnostic[]): ReconciliationDiagnostic[] { return [...values].sort((left, right) => compareStrings(left.code, right.code) || compareStrings(JSON.stringify(left.context), JSON.stringify(right.context))); }
function adapterDiagnostic(code: AdapterDiagnosticCode, message: string, context: Readonly<Record<string, string | number | boolean | null>>): AdapterDiagnostic { return { code, owner: "adapter", version: 1, message, context }; }
function assertTimestamp(value: string, name: string): void { if (!isTimestamp(value)) throw new TypeError(`${name} must be an ISO timestamp`); }
function isTimestamp(value: string): boolean { return typeof value === "string" && value.length > 0 && Number.isFinite(Date.parse(value)); }
function expiresAt(value: string, now: string): boolean { return Date.parse(now) >= Date.parse(value); }
function terminal(value: ReconciliationQueueItem["status"]): boolean { return value === "completed" || value === "failed" || value === "expired" || value === "canceled"; }
function queueRank(value: ReconciliationQueueItem["status"]): number { return terminal(value) ? 2 : value === "in-progress" ? 1 : 0; }
function sortQueue(values: readonly ReconciliationQueueItem[]): ReconciliationQueueItem[] { return [...values].map((value) => ({ ...value })).sort((left, right) => (left.priorityClass === right.priorityClass ? left.enqueueTick - right.enqueueTick || compareStrings(left.operationId, right.operationId) : left.priorityClass === "durable" ? -1 : 1)); }
function sortPendingIntents(values: readonly PendingReconciliationIntent[]): PendingReconciliationIntent[] { return [...values].map((value) => ({ ...value, intent: { ...value.intent } })).sort((left, right) => compareStrings(left.intent.id, right.intent.id)); }
function sortLedger(values: readonly ReconciliationIntentLedgerEntry[]): ReconciliationIntentLedgerEntry[] { return [...values].map((value) => ({ ...value })).sort((left, right) => compareStrings(left.id, right.id)); }
function intentCoalesceKey(intent: ChoreographyIntent): string { return intent.kind === "content-ready" ? `content-ready:${intent.workspaceId}:${intent.workflowId}:${intent.contentGroupId}` : `branch:${intent.workspaceId}:${intent.workflowId}:${intent.contentGroupId}:${intent.branch}`; }
function intentAttempt(intent: ChoreographyIntent): number { return intent.kind === "content-ready" ? Math.max(intent.branches.copy.attempt, intent.branches.visual.attempt) : intent.attempt; }
function intentRank(intent: ChoreographyIntent): number { return intent.kind === "branch-completed" ? 5 : intent.kind === "branch-failed" ? 4 : intent.kind === "branch-recovered" ? 3 : intent.kind === "handoff" ? 2 : intent.kind === "branch-started" ? 1 : 6; }
function compareIntent(left: PendingReconciliationIntent, right: PendingReconciliationIntent): number { return intentAttempt(left.intent) - intentAttempt(right.intent) || intentRank(left.intent) - intentRank(right.intent) || compareStrings(left.intent.occurredAt, right.intent.occurredAt) || compareStrings(left.intent.id, right.intent.id); }
function durableEventId(intent: ChoreographyIntent): string | null { return intent.kind === "content-ready" ? null : intent.durableEventId; }
function compareStrings(left: string, right: string): number { return left === right ? 0 : left < right ? -1 : 1; }
function compareFingerprint(left: ExternalInputFingerprint, right: ExternalInputFingerprint): number { return compareStrings(left.inputId, right.inputId); }
function compareFingerprintAsEvent(left: { readonly durableEventId: string }, right: { readonly durableEventId: string }): number { return compareStrings(left.durableEventId, right.durableEventId); }
function valueOf(value: unknown): string { return typeof value === "string" ? value : value && typeof value === "object" && "value" in value ? String(value.value) : String(value); }
function isRecord(value: JsonValue): value is { readonly [key: string]: JsonValue } { return value !== null && typeof value === "object" && !Array.isArray(value); }

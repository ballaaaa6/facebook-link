import type { PresentationSnapshotDocument } from "@affiliate-ops/office-v2-contracts";
import { sortDepthRecords, type DepthStructuralRecord } from "@affiliate-ops/office-v2-world";
import { projectCameraPosition, type CameraState, type ScreenPoint } from "./camera.ts";

export interface SemanticPickResult {
  readonly entityId: string;
  readonly label: string;
  readonly semanticState: PresentationSnapshotDocument["entities"][number]["semanticState"];
  readonly freshness: PresentationSnapshotDocument["entities"][number]["freshness"];
  readonly groundContact: ScreenPoint;
}

export interface SemanticPickOptions {
  readonly hitRadiusPx?: number;
  readonly entityBand?: DepthStructuralRecord["band"];
}

interface Candidate {
  readonly entityId: string;
  readonly label: string;
  readonly semanticState: SemanticPickResult["semanticState"];
  readonly freshness: SemanticPickResult["freshness"];
  readonly groundContact: ScreenPoint;
  readonly record: DepthStructuralRecord;
  readonly distanceSquared: number;
}

function distanceSquared(left: ScreenPoint, right: ScreenPoint): number {
  const x = left.xPx - right.xPx;
  const y = left.yPx - right.yPx;
  return x * x + y * y;
}

/** Resolve a pointer to the frontmost registered semantic entity without issuing a mutation. */
export function pickSemanticEntity(
  snapshot: PresentationSnapshotDocument,
  camera: CameraState,
  point: ScreenPoint,
  options: SemanticPickOptions = {},
): SemanticPickResult | null {
  const radius = options.hitRadiusPx ?? 24;
  if (!Number.isFinite(radius) || radius < 0) throw new RangeError("presentation.pick-invalid: hitRadiusPx must be non-negative");
  const candidates: Candidate[] = [];
  for (const entity of snapshot.entities) {
    const projected = projectCameraPosition(camera, entity.transform.position);
    const candidateDistance = distanceSquared(projected.groundContact, point);
    if (candidateDistance > radius * radius) continue;
    candidates.push({
      entityId: entity.entityId.value,
      label: entity.label,
      semanticState: entity.semanticState,
      freshness: entity.freshness,
      groundContact: projected.groundContact,
      distanceSquared: candidateDistance,
      record: {
        id: entity.entityId.value,
        semanticOwnerId: entity.entityId.value,
        groundContact: projected.groundContact,
        elevation: entity.transform.position.coordinate.elevation,
        band: options.entityBand ?? "world",
      },
    });
  }
  if (candidates.length === 0) return null;
  const ordered = sortDepthRecords(candidates.map((candidate) => candidate.record));
  const top = ordered.at(-1);
  if (!top) return null;
  const selected = candidates.find((candidate) => candidate.entityId === top.id);
  if (!selected) return null;
  return Object.freeze({
    entityId: selected.entityId,
    label: selected.label,
    semanticState: selected.semanticState,
    freshness: selected.freshness,
    groundContact: selected.groundContact,
  });
}

import type {
  FloorLocalCellPosition,
  PresentationSnapshotDocument,
} from "@affiliate-ops/office-v2-contracts";
import { sortDepthRecords } from "@affiliate-ops/office-v2-world";
import { projectCameraPosition, type CameraState, type ScreenPoint } from "./camera.ts";

export const SYNTHETIC_SCENE_REVISION = "office-synthetic-scene-v1" as const;

export type SyntheticSceneCommand =
  | {
      readonly kind: "floor";
      readonly corners: readonly ScreenPoint[];
    }
  | {
      readonly kind: "entity";
      readonly entityId: string;
      readonly label: string;
      readonly semanticState: PresentationSnapshotDocument["entities"][number]["semanticState"];
      readonly freshness: PresentationSnapshotDocument["entities"][number]["freshness"];
      readonly center: ScreenPoint;
      readonly groundContact: ScreenPoint;
      readonly selected: boolean;
      readonly focused: boolean;
      readonly radiusPx: number;
    };

export interface SyntheticScene {
  readonly revision: typeof SYNTHETIC_SCENE_REVISION;
  readonly commands: readonly SyntheticSceneCommand[];
  readonly sceneHash: string;
}

const STATE_COLORS: Readonly<Record<PresentationSnapshotDocument["entities"][number]["semanticState"], string>> = Object.freeze({
  working: "#55d6be",
  waiting: "#e0b55a",
  review: "#84a9ff",
  blocked: "#f07f72",
  unavailable: "#8b9a95",
  idle: "#d5e1dc",
});

function floorCell(camera: CameraState, x: number, y: number): FloorLocalCellPosition {
  return {
    space: "floor-local-cell",
    floor: camera.floor,
    coordinate: { space: "cell", x, y, elevation: 0 },
  } as FloorLocalCellPosition;
}

function floorCorners(camera: CameraState): readonly ScreenPoint[] {
  return Object.freeze([
    projectCameraPosition(camera, floorCell(camera, 0, 0)).groundContact,
    projectCameraPosition(camera, floorCell(camera, camera.bounds.width, 0)).groundContact,
    projectCameraPosition(camera, floorCell(camera, camera.bounds.width, camera.bounds.depth)).groundContact,
    projectCameraPosition(camera, floorCell(camera, 0, camera.bounds.depth)).groundContact,
  ]);
}

function hashScene(commands: readonly SyntheticSceneCommand[]): string {
  return deterministicPayloadHash(JSON.stringify(commands));
}

/** Stable non-cryptographic evidence hash for deterministic in-browser captures. */
export function deterministicPayloadHash(source: string): string {
  let first = 0x811c9dc5;
  let second = 0x9e3779b1;
  for (let index = 0; index < source.length; index += 1) {
    const code = source.charCodeAt(index);
    first = Math.imul(first ^ code, 0x01000193) >>> 0;
    second = Math.imul(second ^ (code + index), 0x85ebca6b) >>> 0;
  }
  const words = [
    first,
    second,
    first ^ second,
    Math.imul(first, second) >>> 0,
    Math.imul(first ^ 0xa5a5a5a5, 0x27d4eb2d) >>> 0,
    Math.imul(second ^ 0x3c6ef372, 0x165667b1) >>> 0,
    (first + 0x9e3779b9) >>> 0,
    (second + 0x7f4a7c15) >>> 0,
  ];
  return words.map((word) => word.toString(16).padStart(8, "0")).join("");
}

/** Build the one renderer-neutral synthetic scene consumed by both candidates. */
export function buildSyntheticScene(
  snapshot: PresentationSnapshotDocument,
  camera: CameraState,
): SyntheticScene {
  const byId = new Map(snapshot.entities.map((entity) => [entity.entityId.value, entity]));
  const ordered = sortDepthRecords(snapshot.entities.map((entity) => {
    const projected = projectCameraPosition(camera, entity.transform.position);
    return {
      id: entity.entityId.value,
      semanticOwnerId: entity.entityId.value,
      groundContact: projected.groundContact,
      elevation: entity.transform.position.coordinate.elevation,
      band: "world" as const,
    };
  }));
  if (ordered.length !== snapshot.entities.length) throw new Error("presentation.synthetic-scene-depth-invalid: depth ordering rejected the snapshot");

  const commands: SyntheticSceneCommand[] = [{ kind: "floor", corners: floorCorners(camera) }];
  for (const record of ordered) {
    const entity = byId.get(record.id);
    if (!entity) throw new Error(`presentation.synthetic-scene-entity-missing: ${record.id}`);
    const projected = projectCameraPosition(camera, entity.transform.position);
    commands.push({
      kind: "entity",
      entityId: entity.entityId.value,
      label: entity.label,
      semanticState: entity.semanticState,
      freshness: entity.freshness,
      center: projected,
      groundContact: projected.groundContact,
      selected: entity.selection.selected,
      focused: entity.selection.focused,
      radiusPx: entity.selection.focused ? 10 : entity.selection.selected ? 8 : 6,
    });
  }

  const frozenCommands = Object.freeze(commands.map((command) => Object.freeze({
    ...command,
    ...(command.kind === "floor" ? { corners: Object.freeze(command.corners.slice()) } : {}),
  })));
  return Object.freeze({
    revision: SYNTHETIC_SCENE_REVISION,
    commands: frozenCommands,
    sceneHash: hashScene(frozenCommands),
  });
}

export function syntheticSceneStateColor(state: Extract<SyntheticSceneCommand, { readonly kind: "entity" }>["semanticState"]): string {
  return STATE_COLORS[state] ?? "#d5e1dc";
}

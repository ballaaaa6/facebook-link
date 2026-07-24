import type { CharacterState } from "./characterRegistry";

export type OfficeLayer = "wall" | "furniture" | "equipment" | "decor";
export type OfficeAnchor = "center" | "bottom-center" | "wall-top" | "wall-right";
export type OfficeSupport =
  | "floor"
  | "desk-surface"
  | "table-surface"
  | "counter-surface"
  | "credenza-surface"
  | "rack-surface"
  | "wall"
  | "ceiling";

export interface OfficePoint {
  x: number;
  y: number;
}

export interface OfficeRectangle extends OfficePoint {
  width: number;
  height: number;
}

export interface OfficeWorkstation {
  id: string;
  zone: string;
  desk: string;
  chair: string;
  x: number;
  y: number;
  facing: "up" | "down" | "left" | "right";
  seat: OfficePoint;
  approach: OfficePoint;
  stand: OfficePoint;
  navNode: string;
  collision: OfficePoint & { width: number; height: number };
  previewSide?: "auto" | "left" | "right";
}

export type OfficeActivity = "coffee" | "lounge" | "meeting" | "printer" | "server" | "water";

export interface OfficePoi {
  id: string;
  activity: OfficeActivity;
  point: OfficePoint;
  navNode: string;
  capacity: number;
  duration: number;
  label: string;
  slots?: OfficePoint[];
}

export interface OfficeNavigationNode extends OfficePoint {
  id: string;
}

export interface OfficeMapObject {
  id: string;
  asset: string;
  x?: number;
  y?: number;
  parentId?: string;
  slot?: string;
  layer: OfficeLayer;
  anchor: OfficeAnchor;
}

export interface OfficeCompanion {
  id: string;
  character: string;
  home: OfficePoint;
  route: OfficePoint[];
  dwellSeconds: number;
  speedTilesPerSecond: number;
}

export interface OfficeMapDefinition {
  id?: string;
  gridSize?: number;
  width: number;
  height: number;
  zones: Array<{ id: string; label: string; x: number; y: number; width: number; height: number; capacity: number }>;
  workstations: OfficeWorkstation[];
  pois: OfficePoi[];
  routes: Array<OfficeRectangle & { id: string }>;
  navigation: {
    nodes: OfficeNavigationNode[];
    edges: Array<[string, string]>;
  };
  companions: OfficeCompanion[];
  objects: OfficeMapObject[];
}

export interface AgentPresentation {
  position: OfficePoint;
  state: CharacterState;
  seated: boolean;
  activityLabel?: string;
}

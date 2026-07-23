import type { CharacterState } from "./characterRegistry";

export interface OfficePoint {
  x: number;
  y: number;
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
}

export interface OfficeNavigationNode extends OfficePoint {
  id: string;
}

export interface OfficeMapDefinition {
  width: number;
  height: number;
  zones: Array<{ id: string; label: string; x: number; y: number; width: number; height: number; capacity: number }>;
  workstations: OfficeWorkstation[];
  pois: OfficePoi[];
  navigation: {
    nodes: OfficeNavigationNode[];
    edges: Array<[string, string]>;
  };
}

export interface AgentPresentation {
  position: OfficePoint;
  state: CharacterState;
  seated: boolean;
  activityLabel?: string;
}

export type Identifier = string;
export type IsoDateTime = string;
export type WorkspaceId = Identifier;

export interface WorkspaceScoped {
  workspaceId: WorkspaceId;
}

export interface Versioned {
  version: number;
}

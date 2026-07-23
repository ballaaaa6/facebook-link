import type { Identifier, IsoDateTime, WorkspaceScoped } from "./identity";

export type Capability =
  | "products.read"
  | "products.discover"
  | "links.create"
  | "content.create"
  | "content.review"
  | "publications.schedule"
  | "publications.publish"
  | "metrics.read"
  | "sessions.manage"
  | "sheets.sync"
  | "exports.create";

export type ActionRisk = "read_only" | "reversible" | "external_side_effect" | "sensitive";
export type ActionProposalStatus = "proposed" | "confirmed" | "rejected" | "expired" | "executed" | "failed";

export interface ActionProposal<TArguments = Record<string, unknown>> extends WorkspaceScoped {
  id: Identifier;
  requestedBy: Identifier;
  agentId: Identifier;
  capability: Capability;
  title: string;
  summary: string;
  risk: ActionRisk;
  arguments: TArguments;
  status: ActionProposalStatus;
  requiresConfirmation: boolean;
  createdAt: IsoDateTime;
  expiresAt: IsoDateTime;
}

export interface ToolPolicy {
  agentId: Identifier;
  capabilities: readonly Capability[];
  requireConfirmationFor: readonly ActionRisk[];
}

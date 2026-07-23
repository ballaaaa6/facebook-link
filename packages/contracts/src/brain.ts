import type { ActionProposal } from "./actions";
import type { Identifier, IsoDateTime, WorkspaceScoped } from "./identity";

export type BrainMessageRole = "user" | "assistant" | "system";

export interface BrainMessage {
  id: Identifier;
  role: BrainMessageRole;
  content: string;
  createdAt: IsoDateTime;
  agentId?: Identifier;
}

export interface BrainRequest extends WorkspaceScoped {
  conversationId: Identifier;
  selectedAgentId?: Identifier;
  message: string;
  recentMessages: readonly BrainMessage[];
  rollingSummary?: string;
}

export type BrainResponse =
  | { type: "answer"; message: string; agentId: Identifier }
  | { type: "action_proposal"; message: string; agentId: Identifier; proposal: ActionProposal };

export interface BrainProvider {
  respond(request: BrainRequest): Promise<BrainResponse>;
}

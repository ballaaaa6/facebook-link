import type { ActionProposal, BrainProvider, BrainRequest, BrainResponse, Capability } from "@affiliate-ops/contracts";

const roleHints: readonly { keywords: readonly string[]; agentId: string; label: string }[] = [
  { keywords: ["สินค้า", "product", "winner"], agentId: "product-ranker", label: "Ranker" },
  { keywords: ["ยอด", "metric", "วัดผล", "performance"], agentId: "performance-analyst", label: "Tian" },
  { keywords: ["แคปชั่น", "caption", "content"], agentId: "gemini-copywriter", label: "Mira" },
  { keywords: ["รูป", "image", "flow"], agentId: "flow-visual-producer", label: "Pixel" },
  { keywords: ["โพสต์", "publish", "schedule"], agentId: "publisher", label: "Pulse" },
  { keywords: ["ลิงก์", "link", "subid"], agentId: "link-attribution", label: "Link" },
];

function selectRole(request: BrainRequest) {
  if (request.selectedAgentId) {
    return roleHints.find((role) => role.agentId === request.selectedAgentId) ?? { agentId: request.selectedAgentId, label: "Team" };
  }
  const normalized = request.message.toLowerCase();
  return roleHints.find((role) => role.keywords.some((keyword) => normalized.includes(keyword))) ?? { agentId: "growth-strategist", label: "Nova" };
}

function proposal(request: BrainRequest, agentId: string, capability: Capability): ActionProposal {
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + 15 * 60_000);
  return {
    id: `proposal-${createdAt.getTime()}`,
    workspaceId: request.workspaceId,
    requestedBy: "operator",
    agentId,
    capability,
    title: "Prepare a pilot action",
    summary: `The mock team can prepare this request: ${request.message}`,
    risk: "external_side_effect",
    arguments: { message: request.message, simulationOnly: true },
    status: "proposed",
    requiresConfirmation: true,
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
}

export class MockBrainProvider implements BrainProvider {
  async respond(request: BrainRequest): Promise<BrainResponse> {
    const role = selectRole(request);
    const asksForAction = /(โพสต์|publish|schedule|สร้างลิงก์|create link)/i.test(request.message);
    if (asksForAction) {
      const capability: Capability = /(ลิงก์|link)/i.test(request.message) ? "links.create" : "publications.schedule";
      return {
        type: "action_proposal",
        agentId: role.agentId,
        message: `${role.label} prepared a simulation-only proposal. Confirming it will not call an external platform in this prototype.`,
        proposal: proposal(request, role.agentId, capability),
      };
    }
    return {
      type: "answer",
      agentId: role.agentId,
      message: `${role.label}: I mapped your request to the ${role.agentId} workflow. The live provider can replace this mock without changing the chat UI.`,
    };
  }
}

export function createBrainProvider(name = "mock"): BrainProvider {
  if (name !== "mock") throw new Error(`Brain provider '${name}' is not configured.`);
  return new MockBrainProvider();
}

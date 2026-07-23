import type { ActionProposal, BrainProvider, BrainRequest, BrainResponse, Capability } from "@affiliate-ops/contracts";

export const defaultWorkersAiModel = "@cf/zai-org/glm-4.7-flash";

export interface AiTextRunner {
  run(model: string, input: unknown): Promise<unknown>;
}

export interface WorkersAiBrainOptions {
  runner: AiTextRunner;
  model?: string;
}

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
    title: capability === "links.create" ? "Prepare attributed affiliate link" : "Prepare publication schedule",
    summary: `Prepare this request after operator confirmation: ${request.message}`,
    risk: "external_side_effect",
    arguments: { message: request.message, simulationOnly: true },
    status: "proposed",
    requiresConfirmation: true,
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
}

function asksForExternalAction(message: string) {
  return /(โพสต์|ตั้งเวลา|สร้างลิงก์|publish|schedule|create\s+(?:an?\s+)?link)/i.test(message);
}

function readText(result: unknown): string {
  if (typeof result === "string" && result.trim()) return result.trim();
  if (!result || typeof result !== "object") throw new Error("Workers AI returned an unsupported response.");
  const candidate = result as { response?: unknown; result?: { response?: unknown } };
  if (typeof candidate.response === "string" && candidate.response.trim()) return candidate.response.trim();
  if (typeof candidate.result?.response === "string" && candidate.result.response.trim()) return candidate.result.response.trim();
  throw new Error("Workers AI returned an empty response.");
}

function systemPrompt(agentId: string, label: string) {
  return [
    "You are TeamBrain for an affiliate operations control panel.",
    `Respond as ${label}, the ${agentId} specialist.`,
    "Answer in the same language as the operator. Thai should sound natural, direct, and practical.",
    "Never claim that you inspected metrics, accounts, products, or live systems unless those facts appear in the conversation.",
    "Explain assumptions briefly. Prefer a concrete next step.",
    "You may discuss external actions, but you cannot execute, confirm, or pretend to execute them.",
    "Keep the answer below 220 words.",
  ].join(" ");
}

export class MockBrainProvider implements BrainProvider {
  async respond(request: BrainRequest): Promise<BrainResponse> {
    const role = selectRole(request);
    if (asksForExternalAction(request.message)) {
      const capability: Capability = /(ลิงก์|link)/i.test(request.message) ? "links.create" : "publications.schedule";
      return {
        type: "action_proposal",
        agentId: role.agentId,
        message: `${role.label} prepared a confirmation-gated simulation proposal. No external platform has been called.`,
        proposal: proposal(request, role.agentId, capability),
      };
    }
    return {
      type: "answer",
      agentId: role.agentId,
      message: `${role.label}: ตอนนี้ระบบอยู่ในโหมดจำลอง จึงตอบได้จากกฎการส่งงานเท่านั้น แต่ยังไม่ได้อ่านข้อมูลจริงจากบัญชีหรือแดชบอร์ดภายนอก`,
    };
  }
}

export class WorkersAiBrainProvider implements BrainProvider {
  readonly #runner: AiTextRunner;
  readonly #model: string;

  constructor(options: WorkersAiBrainOptions) {
    this.#runner = options.runner;
    this.#model = options.model ?? defaultWorkersAiModel;
  }

  async respond(request: BrainRequest): Promise<BrainResponse> {
    const role = selectRole(request);
    const history = request.recentMessages.slice(-10).map((message) => ({ role: message.role, content: message.content }));
    const result = await this.#runner.run(this.#model, {
      messages: [
        { role: "system", content: systemPrompt(role.agentId, role.label) },
        ...(request.rollingSummary ? [{ role: "system", content: `Earlier conversation summary: ${request.rollingSummary}` }] : []),
        ...history,
        { role: "user", content: request.message },
      ],
      max_tokens: 700,
      temperature: 0.35,
    });
    const message = readText(result);
    if (!asksForExternalAction(request.message)) return { type: "answer", agentId: role.agentId, message };
    const capability: Capability = /(ลิงก์|link)/i.test(request.message) ? "links.create" : "publications.schedule";
    return { type: "action_proposal", agentId: role.agentId, message, proposal: proposal(request, role.agentId, capability) };
  }
}

export function createBrainProvider(name = "mock", options?: WorkersAiBrainOptions): BrainProvider {
  if (name === "mock") return new MockBrainProvider();
  if (name === "workers-ai" && options) return new WorkersAiBrainProvider(options);
  throw new Error(`Brain provider '${name}' is not configured.`);
}

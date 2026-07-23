import { agentCatalog } from "@affiliate-ops/agent-catalog";
import { createBrainProvider, defaultWorkersAiModel, type AiTextRunner } from "@affiliate-ops/brain";
import type { BrainRequest, HealthReport } from "@affiliate-ops/contracts";

const serviceVersion = "0.1.0";

interface Env {
  ASSETS?: { fetch(request: Request): Promise<Response> };
  AI?: AiTextRunner;
  BRAIN_MODEL?: string;
}

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { "cache-control": "no-store" } });
}

function health(): HealthReport {
  return {
    service: "affiliate-ops-api",
    status: "ok",
    version: serviceVersion,
    checkedAt: new Date().toISOString(),
  };
}

function isBrainRequest(value: unknown): value is BrainRequest {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<BrainRequest>;
  const messagesAreValid = Array.isArray(candidate.recentMessages)
    && candidate.recentMessages.length <= 12
    && candidate.recentMessages.every((message) => message
      && typeof message.id === "string"
      && (message.role === "user" || message.role === "assistant" || message.role === "system")
      && typeof message.content === "string"
      && message.content.length <= 4_000
      && typeof message.createdAt === "string");
  return typeof candidate.workspaceId === "string"
    && candidate.workspaceId.length > 0
    && candidate.workspaceId.length <= 100
    && typeof candidate.conversationId === "string"
    && candidate.conversationId.length > 0
    && candidate.conversationId.length <= 100
    && typeof candidate.message === "string"
    && candidate.message.trim().length > 0
    && candidate.message.length <= 2_000
    && messagesAreValid;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return json(health());
    }

    if (request.method === "GET" && url.pathname === "/v1/system/manifest") {
      return json({ version: serviceVersion, agents: agentCatalog, brainProvider: env.AI ? "workers-ai" : "unavailable", brainModel: env.BRAIN_MODEL ?? defaultWorkersAiModel });
    }

    if (request.method === "POST" && url.pathname === "/v1/brain/respond") {
      const body: unknown = await request.json().catch(() => null);
      if (!isBrainRequest(body)) return json({ error: "invalid_brain_request" }, 400);
      if (!env.AI) return json({ error: "brain_unavailable" }, 503);
      try {
        const brain = createBrainProvider("workers-ai", { runner: env.AI, model: env.BRAIN_MODEL ?? defaultWorkersAiModel });
        return json(await brain.respond(body));
      } catch {
        return json({ error: "brain_unavailable" }, 503);
      }
    }

    return json({ error: "not_found" }, 404);
  },
};

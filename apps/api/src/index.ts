import { agentCatalog } from "@affiliate-ops/agent-catalog";
import { createBrainProvider } from "@affiliate-ops/brain";
import type { BrainRequest, HealthReport } from "@affiliate-ops/contracts";

const serviceVersion = "0.1.0";
const brain = createBrainProvider("mock");

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
  return typeof candidate.workspaceId === "string"
    && typeof candidate.conversationId === "string"
    && typeof candidate.message === "string"
    && Array.isArray(candidate.recentMessages);
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return json(health());
    }

    if (request.method === "GET" && url.pathname === "/v1/system/manifest") {
      return json({ version: serviceVersion, agents: agentCatalog, brainProvider: "mock" });
    }

    if (request.method === "POST" && url.pathname === "/v1/brain/respond") {
      const body: unknown = await request.json().catch(() => null);
      if (!isBrainRequest(body)) return json({ error: "invalid_brain_request" }, 400);
      return json(await brain.respond(body));
    }

    return json({ error: "not_found" }, 404);
  },
};

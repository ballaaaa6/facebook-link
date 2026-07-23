import type { BrainRequest, BrainResponse } from "@affiliate-ops/contracts";

interface ApiError {
  error?: string;
}

function isBrainResponse(value: unknown): value is BrainResponse {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<BrainResponse>;
  return (candidate.type === "answer" || candidate.type === "action_proposal")
    && typeof candidate.agentId === "string"
    && typeof candidate.message === "string";
}

export async function askTeamBrain(request: BrainRequest): Promise<BrainResponse> {
  const response = await fetch("/v1/brain/respond", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(request),
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const code = body && typeof body === "object" ? (body as ApiError).error : undefined;
    throw new Error(code === "brain_unavailable" ? "TeamBrain ติดต่อ Workers AI ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" : "TeamBrain request failed");
  }
  if (!isBrainResponse(body)) throw new Error("TeamBrain returned an invalid response");
  return body;
}

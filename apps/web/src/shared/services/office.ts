import type { OfficeSnapshot } from "@affiliate-ops/contracts";
import { createDemoOfficeSnapshot } from "@affiliate-ops/office-read-model";

function isOfficeSnapshot(value: unknown): value is OfficeSnapshot {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<OfficeSnapshot>;
  return candidate.schemaVersion === 1
    && typeof candidate.sequence === "number"
    && typeof candidate.generatedAt === "string"
    && (candidate.mode === "simulation" || candidate.mode === "live")
    && Array.isArray(candidate.agents)
    && Array.isArray(candidate.metrics)
    && Array.isArray(candidate.connectors);
}

export interface OfficeFetchResult {
  snapshot: OfficeSnapshot;
  source: "api" | "fallback";
}

export async function fetchOfficeSnapshot(signal?: AbortSignal): Promise<OfficeFetchResult> {
  try {
    const response = await fetch("/v1/office", { headers: { accept: "application/json" }, signal });
    if (!response.ok) throw new Error(`office_http_${response.status}`);
    const body: unknown = await response.json();
    if (!isOfficeSnapshot(body)) throw new Error("invalid_office_snapshot");
    return { snapshot: body, source: "api" };
  } catch (error) {
    const isAbort = signal?.aborted
      || (typeof error === "object" && error !== null && "name" in error && error.name === "AbortError");
    if (isAbort) throw error;
    return { snapshot: createDemoOfficeSnapshot(), source: "fallback" };
  }
}

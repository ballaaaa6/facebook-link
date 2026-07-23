import type { AttributionDimensions } from "@affiliate-ops/contracts";

export const subIdOrder = ["platform", "account", "placement", "campaign", "creative"] as const;

export function sanitizeSubId(value: string, maxLength = 32): string {
  const normalized = value.normalize("NFKD").replace(/[^a-zA-Z0-9]/g, "");
  if (!normalized) {
    throw new Error("A Sub ID must contain at least one ASCII letter or number.");
  }
  return normalized.slice(0, maxLength);
}

export function encodeSubIds(dimensions: AttributionDimensions): [string, string, string, string, string] {
  return subIdOrder.map((key) => sanitizeSubId(dimensions[key])) as [string, string, string, string, string];
}

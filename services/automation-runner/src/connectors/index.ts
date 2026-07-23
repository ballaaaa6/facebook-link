import type { AffiliateLink, AttributionDimensions, ContentArtifact, ProductCandidate, Publication } from "@affiliate-ops/contracts";

export { connectorRegistry } from "./registry";

export interface SessionHealth {
  connector: string;
  authenticated: boolean;
  expiresAt?: string;
  detail?: string;
}

export interface ProductDiscoveryConnector {
  discover(limit: number): Promise<ProductCandidate[]>;
}

export interface AffiliateConnector {
  createLink(product: ProductCandidate, attribution: AttributionDimensions): Promise<AffiliateLink>;
  sessionHealth(): Promise<SessionHealth>;
}

export interface ContentConnector {
  createCopy(product: ProductCandidate, brief: string): Promise<ContentArtifact>;
  createVisuals(product: ProductCandidate, brief: string): Promise<ContentArtifact>;
  sessionHealth(): Promise<SessionHealth>;
}

export interface PublishingConnector {
  schedule(publication: Publication): Promise<Publication>;
}

export interface MetricsConnector {
  collect(from: string, to: string): Promise<Record<string, number>>;
}

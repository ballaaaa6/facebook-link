import type { Identifier, IsoDateTime, WorkspaceScoped } from "./identity";

export type Platform = "facebook" | "instagram" | "x" | "tiktok" | "discord";
export type ContentFormat = "image" | "video" | "reel" | "story" | "comment";

export interface ProductCandidate extends WorkspaceScoped {
  id: Identifier;
  sourceUrl: string;
  title: string;
  priceMinor: number;
  currency: "THB";
  score: number;
  discoveredAt: IsoDateTime;
}

export interface AttributionDimensions {
  platform: string;
  account: string;
  placement: string;
  campaign: string;
  creative: string;
}

export interface AffiliateLink extends WorkspaceScoped {
  id: Identifier;
  productId: Identifier;
  destinationUrl: string;
  shortUrl?: string;
  subIds: [string, string, string, string, string];
  createdAt: IsoDateTime;
}

export interface ContentArtifact extends WorkspaceScoped {
  id: Identifier;
  productId: Identifier;
  format: ContentFormat;
  caption: string;
  objectKeys: string[];
  createdAt: IsoDateTime;
}

export interface Publication extends WorkspaceScoped {
  id: Identifier;
  artifactId: Identifier;
  platform: Platform;
  accountId: Identifier;
  scheduledAt: IsoDateTime;
  publishedAt?: IsoDateTime;
  remoteId?: string;
}

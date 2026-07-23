export type ConnectorMode = "browser" | "api";

export interface ConnectorRegistration {
  id: string;
  mode: ConnectorMode;
  featureFlag: string;
  externalSideEffect: boolean;
}

export const connectorRegistry: readonly ConnectorRegistration[] = [
  { id: "shopee-discovery", mode: "browser", featureFlag: "shopeeDiscovery", externalSideEffect: false },
  { id: "shopee-affiliate", mode: "browser", featureFlag: "shopeeLinkCreation", externalSideEffect: true },
  { id: "gemini-copy", mode: "browser", featureFlag: "geminiBrowser", externalSideEffect: true },
  { id: "google-flow", mode: "browser", featureFlag: "flowBrowser", externalSideEffect: true },
  { id: "meta-publisher", mode: "api", featureFlag: "metaPublishing", externalSideEffect: true },
  { id: "browser-publisher-fallback", mode: "browser", featureFlag: "browserPublishingFallback", externalSideEffect: true },
  { id: "shopee-metrics", mode: "browser", featureFlag: "shopeeDiscovery", externalSideEffect: false },
  { id: "meta-metrics", mode: "api", featureFlag: "metaPublishing", externalSideEffect: false }
];

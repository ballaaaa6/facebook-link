export interface AgentDefinition {
  id: string;
  displayName: string;
  responsibility: string;
  consumes: readonly string[];
  produces: readonly string[];
  requiresHumanReview: boolean;
}

export const agentCatalog: readonly AgentDefinition[] = [
  { id: "market-scout", displayName: "Market Scout", responsibility: "Discover candidate products", consumes: ["shopee-feed"], produces: ["product-candidates"], requiresHumanReview: false },
  { id: "product-ranker", displayName: "Product Ranker", responsibility: "Score and select daily winners", consumes: ["product-candidates"], produces: ["ranked-products"], requiresHumanReview: false },
  { id: "growth-strategist", displayName: "Growth Strategist", responsibility: "Choose experiments, audiences, and time slots", consumes: ["performance-metrics"], produces: ["campaign-strategy"], requiresHumanReview: true },
  { id: "performance-analyst", displayName: "Performance Analyst", responsibility: "Join Shopee and channel performance", consumes: ["affiliate-metrics", "channel-metrics"], produces: ["performance-report"], requiresHumanReview: false },
  { id: "gemini-copywriter", displayName: "Gemini Copywriter", responsibility: "Create persuasive copy through the Gemini browser", consumes: ["selected-product", "campaign-strategy"], produces: ["caption-draft"], requiresHumanReview: false },
  { id: "flow-visual-producer", displayName: "Flow Visual Producer", responsibility: "Create visual content through Google Flow", consumes: ["selected-product", "campaign-strategy"], produces: ["visual-assets"], requiresHumanReview: false },
  { id: "link-attribution", displayName: "Attribution Builder", responsibility: "Create affiliate links and five Sub IDs", consumes: ["selected-product", "campaign-strategy"], produces: ["affiliate-link"], requiresHumanReview: false },
  { id: "qa-editor", displayName: "QA Editor", responsibility: "Validate content, links, policies, and rendering", consumes: ["caption-draft", "visual-assets", "affiliate-link"], produces: ["approved-content"], requiresHumanReview: true },
  { id: "publisher", displayName: "Publisher", responsibility: "Schedule and publish through official platform APIs", consumes: ["approved-content"], produces: ["publication"], requiresHumanReview: false },
  { id: "session-keeper", displayName: "Session Keeper", responsibility: "Monitor and refresh browser sessions", consumes: ["session-health"], produces: ["session-state"], requiresHumanReview: true }
];

export function getAgent(id: string): AgentDefinition | undefined {
  return agentCatalog.find((agent) => agent.id === id);
}

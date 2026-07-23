import type { Agent } from "../types";

export const agents: readonly Agent[] = [
  { id: "market-scout", name: "Scout", role: "Market Scout", status: "working", task: "Scanning Shopee feed", progress: 72 },
  { id: "product-ranker", name: "Ranker", role: "Product Ranker", status: "review", task: "Ranking 41 candidates", progress: 58 },
  { id: "growth-strategist", name: "Nova", role: "Growth Strategist", status: "waiting", task: "Waiting for daily metrics", progress: 18 },
  { id: "performance-analyst", name: "Tian", role: "Performance Analyst", status: "working", task: "Analyzing link attribution", progress: 84 },
  { id: "gemini-copywriter", name: "Mira", role: "Gemini Copywriter", status: "working", task: "Drafting Thai captions", progress: 44 },
  { id: "flow-visual-producer", name: "Pixel", role: "Flow Visual Producer", status: "waiting", task: "Queued behind copy", progress: 12 },
  { id: "link-attribution", name: "Link", role: "Attribution Builder", status: "review", task: "Assigning Sub IDs", progress: 63 },
  { id: "qa-editor", name: "Proof", role: "QA Editor", status: "waiting", task: "2 posts ready for QA", progress: 20 },
  { id: "publisher", name: "Pulse", role: "Publisher", status: "working", task: "Scheduling Facebook posts", progress: 76 },
  { id: "session-keeper", name: "Guard", role: "Session Keeper", status: "working", task: "Shopee session healthy", progress: 96 },
];

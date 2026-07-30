export interface DashboardMetric {
  id: string;
  label: string;
  value: string;
  note: string;
}

export const defaultMetrics: readonly DashboardMetric[] = [
  { id: "products", label: "Products scanned", value: "1,248", note: "+18% today" },
  { id: "winners", label: "Winners found", value: "12", note: "3 high confidence" },
  { id: "posts", label: "Posts scheduled", value: "9", note: "Across 3 time slots" },
  { id: "session", label: "Session health", value: "99.8%", note: "All profiles active" },
];

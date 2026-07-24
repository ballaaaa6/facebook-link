import type { OfficeMetric } from "@affiliate-ops/contracts";

const defaultMetrics: readonly OfficeMetric[] = [
  { id: "products", label: "Products scanned", value: "1,248", note: "+18% today" },
  { id: "winners", label: "Winners found", value: "12", note: "3 high confidence" },
  { id: "posts", label: "Posts scheduled", value: "9", note: "Across 3 time slots" },
  { id: "session", label: "Session health", value: "99.8%", note: "All profiles active" },
];

export function MetricStrip({ metrics = defaultMetrics }: { metrics?: readonly OfficeMetric[] }) {
  return <section className="metric-strip" aria-label="Daily operation metrics">{metrics.map((metric) => <div key={metric.id}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.note}</small></div>)}</section>;
}

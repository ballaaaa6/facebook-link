import { defaultMetrics, type DashboardMetric } from "../../features/dashboard/metrics";

export function MetricStrip({ metrics = defaultMetrics }: { metrics?: readonly DashboardMetric[] }) {
  return <section className="metric-strip" aria-label="Daily operation metrics">{metrics.map((metric) => <div key={metric.id}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.note}</small></div>)}</section>;
}

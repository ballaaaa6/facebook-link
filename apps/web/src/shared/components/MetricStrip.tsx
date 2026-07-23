const metrics = [
  ["Products scanned", "1,248", "+18% today"],
  ["Winners found", "12", "3 high confidence"],
  ["Posts scheduled", "9", "Across 3 time slots"],
  ["Session health", "99.8%", "All profiles active"],
] as const;

export function MetricStrip() {
  return <section className="metric-strip" aria-label="Daily operation metrics">{metrics.map(([label, value, note]) => <div key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></div>)}</section>;
}

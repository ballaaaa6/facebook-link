import { MetricStrip } from "../../shared/components/MetricStrip";

const funnel = [
  { label: "Scanned", value: 1248, width: 100 },
  { label: "Qualified", value: 142, width: 62 },
  { label: "Winners", value: 12, width: 34 },
  { label: "Scheduled", value: 9, width: 25 },
  { label: "Orders", value: 3, width: 14 },
] as const;

const rows = [
  ["Mini blender", "Facebook / Home Lab", "287", "14", "฿1,842", "6.4%"],
  ["Storage trolley", "Facebook / Easy Living", "193", "8", "฿936", "4.1%"],
  ["USB desk fan", "Facebook / Tech Finds", "118", "5", "฿522", "4.2%"],
] as const;

export function DashboardPage() {
  return <>
    <MetricStrip />
    <section className="dashboard-grid">
      <article className="card-surface chart-card"><div className="section-heading"><div><span className="eyebrow">Daily pipeline</span><h2>Conversion funnel</h2></div><span className="date-chip">23 Jul 2026</span></div><div className="funnel-chart">{funnel.map((item) => <div key={item.label}><span>{item.label}</span><i style={{ width: `${item.width}%` }} /><strong>{item.value.toLocaleString()}</strong></div>)}</div></article>
      <article className="card-surface health-card"><div className="section-heading"><div><span className="eyebrow">Infrastructure</span><h2>System health</h2></div><span className="health-score">99.8%</span></div><ul className="health-list"><li><i className="ok" /><span>Shopee session</span><b>Healthy · 5d 8h left</b></li><li><i className="ok" /><span>Gemini browser</span><b>Ready</b></li><li><i className="ok" /><span>Google Flow</span><b>Ready</b></li><li><i className="pending" /><span>Meta API</span><b>Not connected</b></li><li><i className="ok" /><span>Local storage</span><b>0.4 GB used</b></li></ul></article>
      <article className="card-surface performance-card"><div className="section-heading"><div><span className="eyebrow">Attribution</span><h2>Best content today</h2></div><button type="button" className="text-button">Export CSV</button></div><div className="data-table" role="table"><div className="table-row table-head" role="row"><span>Product</span><span>Destination</span><span>Clicks</span><span>Orders</span><span>Revenue</span><span>CVR</span></div>{rows.map((row) => <div className="table-row" role="row" key={row[0]}>{row.map((cell) => <span key={cell}>{cell}</span>)}</div>)}</div></article>
      <article className="card-surface run-card"><div className="section-heading"><div><span className="eyebrow">Latest run</span><h2>Pilot workflow</h2></div><span className="mock-badge">Simulation</span></div><ol className="run-timeline"><li className="done"><b>Discover</b><small>1,248 products</small></li><li className="done"><b>Rank</b><small>12 winners</small></li><li className="done"><b>Create</b><small>9 content sets</small></li><li className="active"><b>Review</b><small>2 need approval</small></li><li><b>Schedule</b><small>Waiting</small></li></ol></article>
    </section>
  </>;
}

import { MetricStrip } from "../../shared/components/MetricStrip";
import { TeamChatPanel } from "../../shared/components/TeamChatPanel";
import "./officeV2Page.css";

function EmptyEngineMount() {
  return (
    <section className="office-v2-stage card-surface" aria-labelledby="office-v2-title">
      <header className="office-v2-stage__header">
        <div>
          <span className="eyebrow">Live floor</span>
          <h2 id="office-v2-title">Agent office</h2>
        </div>
        <span className="office-v2-stage__status"><i /> V2 foundation</span>
      </header>
      <div className="office-v2-mount" data-engine="office-v2" data-scene="none">
        <div className="office-v2-mount__message">
          <span aria-hidden="true">V2</span>
          <h3>Office engine space is ready</h3>
          <p>No world, renderer, character, furniture, or runtime asset is installed yet.</p>
        </div>
        <dl className="office-v2-mount__facts" aria-label="Office Engine V2 status">
          <div><dt>World</dt><dd>Not installed</dd></div>
          <div><dt>Renderer</dt><dd>Not selected</dd></div>
          <div><dt>Assets</dt><dd>None</dd></div>
        </dl>
      </div>
    </section>
  );
}

function EmptyInspector() {
  return (
    <aside className="office-v2-inspector card-surface" aria-labelledby="office-v2-inspector-title">
      <div className="section-heading">
        <div><span className="eyebrow">Selected agent</span><h2 id="office-v2-inspector-title">No selection</h2></div>
        <i className="office-v2-inspector__status" />
      </div>
      <div className="office-v2-inspector__empty">
        <span aria-hidden="true">—</span>
        <p>Agent details will appear after the V2 world and operations adapter pass their entry gates.</p>
      </div>
      <dl>
        <div><dt>Snapshot</dt><dd>Unavailable</dd></div>
        <div><dt>Selection</dt><dd>Disabled</dd></div>
        <div><dt>Actions</dt><dd>Read-only</dd></div>
      </dl>
    </aside>
  );
}

export function OfficeV2Page() {
  return (
    <>
      <MetricStrip />
      <div className="office-v2-layout">
        <EmptyEngineMount />
        <EmptyInspector />
        <TeamChatPanel />
      </div>
    </>
  );
}

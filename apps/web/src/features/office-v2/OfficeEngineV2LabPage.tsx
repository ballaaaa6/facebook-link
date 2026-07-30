import { officeEngineEntryGates, officeEngineLayers } from "./foundation";
import "./officeEngineV2Lab.css";

export function OfficeEngineV2LabPage() {
  return (
    <main className="engine-lab" data-engine="office-v2" data-assets="none">
      <header className="engine-lab__header">
        <div>
          <span>Clean-room development surface</span>
          <h1>Office Engine V2</h1>
          <p>The renderer is intentionally empty. Architecture and tests come before scene art.</p>
        </div>
        <a href="/">Return to Office</a>
      </header>

      <section className="engine-lab__notice" aria-label="Current status">
        <strong>Foundation only</strong>
        <p>No map, character, furniture, runtime registry, or compatibility adapter is installed.</p>
      </section>

      <section className="engine-lab__grid" aria-label="Engine boundaries">
        {officeEngineLayers.map((layer, index) => (
          <article key={layer.id}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h2>{layer.title}</h2>
            <p>{layer.responsibility}</p>
          </article>
        ))}
      </section>

      <section className="engine-lab__gates">
        <div>
          <span>Build order</span>
          <h2>Entry gates</h2>
        </div>
        <ol>
          {officeEngineEntryGates.map((gate) => <li key={gate}>{gate}</li>)}
        </ol>
      </section>
    </main>
  );
}

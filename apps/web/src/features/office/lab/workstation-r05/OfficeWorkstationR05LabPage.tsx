import { useEffect, useState } from "react";
import { validateOfficeWorkstationStep5R05Final } from "@affiliate-ops/contracts";
import { R05StationCard } from "./R05Station";
import { R05TenSeatScene } from "./R05TenSeatScene";
import { r05Manifest } from "./r05Runtime";
import "./r05Lab.css";

type Scene = "single" | "ten";

export function OfficeWorkstationR05LabPage() {
  const query = new URLSearchParams(window.location.search);
  const [scene, setScene] = useState<Scene>(query.get("scene") === "single" ? "single" : "ten");
  const [debug, setDebug] = useState(query.get("debug") === "1");
  const [tick, setTick] = useState(0);
  const issues = validateOfficeWorkstationStep5R05Final(r05Manifest);

  useEffect(() => {
    const timer = window.setInterval(() => setTick((value) => value + 1), 1000 / r05Manifest.station.animation.fps);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="r05-lab" data-review-status={r05Manifest.status}>
      <header className="r05-header">
        <div>
          <span>STEP 5 · R05-3B–R05-5 · ISOLATED OWNER REVIEW</span>
          <h1>Real-chair workstation candidate</h1>
          <p>Accepted desk, monitor, keyboard and poses · Active Office remains byte-identical</p>
        </div>
        <dl>
          <div><dt>Characters</dt><dd>10 existing</dd></div>
          <div><dt>Desks</dt><dd>10 × 3×2</dd></div>
          <div><dt>Drift</dt><dd>0 px</dd></div>
        </dl>
      </header>

      <nav className="r05-controls" aria-label="R05 review controls">
        <div>
          <button aria-pressed={scene === "single"} onClick={() => setScene("single")}>single station</button>
          <button aria-pressed={scene === "ten"} onClick={() => setScene("ten")}>ten seats</button>
        </div>
        <button aria-pressed={debug} onClick={() => setDebug((value) => !value)}>debug</button>
      </nav>

      {scene === "single" ? (
        <section className="r05-single-review">
          <R05StationCard debug={debug} orientation="far" tick={tick} />
          <R05StationCard debug={debug} orientation="near" tick={tick} />
        </section>
      ) : <R05TenSeatScene debug={debug} tick={tick} />}

      <footer className="r05-footer">
        <span>mockup chair: forbidden</span>
        <span>old furniture: 0</span>
        <span>new character or pose: 0</span>
        <span>Active Office promotion: false</span>
        <strong>{issues.length === 0 ? "CONTRACT PASS" : `${issues.length} CONTRACT ISSUES`}</strong>
      </footer>
    </main>
  );
}

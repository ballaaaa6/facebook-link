import { useEffect, useState } from "react";
import {
  validateOfficeCharacterSeatSockets,
  validateOfficeWorkstationStep5R05R02,
  validateOfficeWorkstationTenSeatR05R02,
} from "@affiliate-ops/contracts";
import { R05PairScene } from "./R05PairScene";
import { R05StationCard } from "./R05Station";
import { R05UpperLeftTenSeatScene } from "./R05UpperLeftTenSeatScene";
import { r05Manifest, r05SeatSockets, r05TenSeatManifest, r05TenSeatMap } from "./r05Runtime";
import "./r05Lab.css";

type Scene = "single" | "pair" | "ten";

export function OfficeWorkstationR05LabPage() {
  const query = new URLSearchParams(window.location.search);
  const requestedScene = query.get("scene");
  const [scene, setScene] = useState<Scene>(requestedScene === "single" || requestedScene === "pair" ? requestedScene : "ten");
  const [debug, setDebug] = useState(query.get("debug") === "1");
  const [tick, setTick] = useState(0);
  const issues = [
    ...validateOfficeWorkstationStep5R05R02(r05Manifest),
    ...validateOfficeCharacterSeatSockets(r05SeatSockets),
    ...validateOfficeWorkstationTenSeatR05R02(r05TenSeatManifest, r05TenSeatMap),
  ];

  useEffect(() => {
    const timer = window.setInterval(() => setTick((value) => value + 1), 1000 / r05Manifest.station.animation.fps);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="r05-lab" data-review-status={r05Manifest.status}>
      <header className="r05-header">
        <div>
          <span>STEP 5 · R05-r02 · P4–P6 · OWNER REVIEW</span>
          <h1>Ten current seats, upper-left</h1>
          <p>Approved pair expanded to 5 columns · lower block reserved for 10 future employees</p>
        </div>
        <dl>
          <div><dt>Directories</dt><dd>19 audited</dd></div>
          <div><dt>Seat-capable</dt><dd>18 existing</dd></div>
          <div><dt>Current</dt><dd>10 seats</dd></div>
          <div><dt>Reserved</dt><dd>10 seats</dd></div>
          <div><dt>Total</dt><dd>20 seats</dd></div>
        </dl>
      </header>

      <nav className="r05-controls" aria-label="R05 review controls">
        <div>
          <button aria-pressed={scene === "single"} onClick={() => setScene("single")}>single station</button>
          <button aria-pressed={scene === "pair"} onClick={() => setScene("pair")}>paired depth proof</button>
          <button aria-pressed={scene === "ten"} onClick={() => setScene("ten")}>10-seat upper-left</button>
        </div>
        <button aria-pressed={debug} onClick={() => setDebug((value) => !value)}>debug</button>
      </nav>

      {scene === "single" ? (
        <section className="r05-single-review">
          <R05StationCard debug={debug} orientation="far" tick={tick} />
          <R05StationCard debug={debug} orientation="near" tick={tick} />
        </section>
      ) : scene === "pair" ? <R05PairScene debug={debug} tick={tick} /> : <R05UpperLeftTenSeatScene debug={debug} tick={tick} />}

      <footer className="r05-footer">
        <span>mockup chair: forbidden</span>
        <span>desk delta: 64 px</span>
        <span>seat records: 216</span>
        <span>new character or pose: 0</span>
        <span>hand sockets: out of scope</span>
        <span>Active Office promotion: false</span>
        <strong>{issues.length === 0 ? "CONTRACT PASS" : `${issues.length} CONTRACT ISSUES`}</strong>
      </footer>
    </main>
  );
}

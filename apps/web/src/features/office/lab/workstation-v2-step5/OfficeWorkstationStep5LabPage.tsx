import { useMemo, useState } from "react";
import {
  validateOfficeWorkstationStep5Manifest,
  type OfficeWorkstationStep5ManifestV1,
} from "@affiliate-ops/contracts";
import manifestJson from "../../../../../../../assets/game/manifests/office-workstation-step5-single-seat-v1.json";
import { useSceneClock } from "../../workstation/useSceneClock";
import { Step5AssetProvenance } from "./Step5AssetProvenance";
import { Step5Station } from "./Step5Station";
import { step5AnchorsStable, type Step5Orientation } from "./step5Runtime";
import "./step5Lab.css";

const manifest = manifestJson as unknown as OfficeWorkstationStep5ManifestV1;
type ReviewPanel = "assets" | "far" | "near" | "overlay" | "review";

function panelFromQuery(query: URLSearchParams): ReviewPanel {
  const panel = query.get("panel");
  return panel === "assets" || panel === "far" || panel === "near" || panel === "overlay" ? panel : "review";
}

export function OfficeWorkstationStep5LabPage() {
  const query = new URLSearchParams(window.location.search);
  const [panel, setPanel] = useState<ReviewPanel>(() => panelFromQuery(query));
  const [debug, setDebug] = useState(query.get("debug") === "1" || panel === "overlay");
  const [zoom, setZoom] = useState<1 | 2>(query.get("zoom") === "1" ? 1 : 2);
  const [paused, setPaused] = useState(query.get("paused") !== "0");
  const [fixedTick, setFixedTick] = useState(() => Math.max(0, Number(query.get("tick")) || 0));
  const capture = query.get("capture") === "1";
  const elapsedMs = useSceneClock();
  const liveTick = Math.floor((elapsedMs / 1_000) * manifest.animation.fps);
  const tick = paused ? fixedTick : liveTick;
  const issues = useMemo(() => validateOfficeWorkstationStep5Manifest(manifest), []);
  const stable = useMemo(() => (
    step5AnchorsStable(manifest, "far", manifest.animation.sampleTicks)
    && step5AnchorsStable(manifest, "near", manifest.animation.sampleTicks)
  ), []);
  const orientations: Step5Orientation[] = panel === "far" ? ["far"] : panel === "near" ? ["near"] : ["far", "near"];

  return (
    <main className="step5-lab" data-active-office-promotion="false" data-capture={capture} data-review-status={manifest.status}>
      <header className="step5-header">
        <div>
          <span>STEP 5 · ISOLATED SINGLE-SEAT LAB</span>
          <h1>One person. One accepted desk. Two review views.</h1>
          <p>No Active Office imports · no new art · no ten-seat assembly</p>
        </div>
        <dl>
          <div><dt>Desk</dt><dd>3 × 2</dd></div>
          <div><dt>Station</dt><dd>1 only</dd></div>
          <div><dt>Map hash</dt><dd>c40db448…c618d</dd></div>
        </dl>
      </header>

      <nav className="step5-controls" aria-label="Step 5 review controls">
        <div>
          {(["assets", "far", "near", "overlay", "review"] as const).map((value) => (
            <button aria-pressed={panel === value} key={value} onClick={() => setPanel(value)}>{value}</button>
          ))}
        </div>
        <div>
          <button aria-pressed={debug} onClick={() => setDebug((value) => !value)}>geometry</button>
          <button aria-pressed={zoom === 2} onClick={() => setZoom((value) => value === 1 ? 2 : 1)}>zoom {zoom}×</button>
          <button aria-pressed={paused} onClick={() => setPaused((value) => !value)}>{paused ? "paused" : "playing"}</button>
          <button onClick={() => setFixedTick((value) => value + 1)} disabled={!paused}>tick {tick}</button>
        </div>
      </nav>

      {capture && (
        <aside className="step5-capture-stamp">
          <strong>STEP 5 LAB ONLY</strong>
          <span>Active Office before/after: c40db448…c618d</span>
          <span>New artwork: 0 · promoted seats: 0/10</span>
        </aside>
      )}

      {panel === "assets" && <Step5AssetProvenance manifest={manifest} />}
      {panel !== "assets" && (
        <section className={`step5-review-stage is-${panel}`} data-review-panel={panel}>
          {panel === "review" && <Step5AssetProvenance manifest={manifest} />}
          <div className="step5-station-grid">
            {orientations.map((orientation) => (
              <Step5Station
                debug={debug || panel === "overlay"}
                key={orientation}
                manifest={manifest}
                orientation={orientation}
                tick={tick}
                zoom={zoom}
              />
            ))}
          </div>
          {panel === "review" && (
            <aside className="step5-review-gate">
              <strong>OWNER REVIEW REQUIRED</strong>
              <span>Step 6 / 10 seats: blocked</span>
              <span>Other 18 characters: blocked</span>
              <span>Active Office promotion: blocked</span>
            </aside>
          )}
        </section>
      )}

      <footer className="step5-footer">
        <span>Contract: {issues.length === 0 ? "PASS" : `${issues.length} ISSUES`}</span>
        <span>0/10 seats promoted</span>
        <span>Anchors t=0/10/20/30: {stable ? "STABLE" : "DRIFT"}</span>
        <strong>{issues.length === 0 && stable ? "READY FOR OWNER VISUAL REVIEW" : "STEP 5 BLOCKED"}</strong>
      </footer>
    </main>
  );
}

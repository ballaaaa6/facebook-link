import { useMemo, useState } from "react";
import {
  validateOfficeCharacterScaleManifest,
  validateOfficeWorkstationStep5Manifest,
  type OfficeCharacterScaleManifestV1,
  type OfficeWorkstationStep5ManifestV2,
} from "@affiliate-ops/contracts";
import characterScaleJson from "../../../../../../../assets/game/manifests/office-character-scale-standard-v1.json";
import manifestJson from "../../../../../../../assets/game/manifests/office-workstation-step5-single-seat-v2.json";
import { useSceneClock } from "../../workstation/useSceneClock";
import { Step5AssetProvenance } from "./Step5AssetProvenance";
import { Step5Station } from "./Step5Station";
import { step5AnchorsStable, type Step5Orientation } from "./step5Runtime";
import "./step5Lab.css";

const manifest = manifestJson as unknown as OfficeWorkstationStep5ManifestV2;
const characterScale = characterScaleJson as unknown as OfficeCharacterScaleManifestV1;
type ReviewPanel = "assets" | "far" | "near" | "overlay" | "review";

function panelFromQuery(query: URLSearchParams): ReviewPanel {
  const panel = query.get("panel");
  return panel === "assets" || panel === "far" || panel === "near" || panel === "overlay" ? panel : "review";
}

export function OfficeWorkstationStep5LabPage() {
  const query = new URLSearchParams(window.location.search);
  const [panel, setPanel] = useState<ReviewPanel>(() => panelFromQuery(query));
  const [debug, setDebug] = useState(query.get("debug") === "1" || panel === "overlay");
  const [zoom, setZoom] = useState<1 | 2>(query.get("zoom") === "2" ? 2 : 1);
  const [paused, setPaused] = useState(query.get("paused") !== "0");
  const [fixedTick, setFixedTick] = useState(() => Math.max(0, Number(query.get("tick")) || 0));
  const capture = query.get("capture") === "1";
  const elapsedMs = useSceneClock();
  const liveTick = Math.floor((elapsedMs / 1_000) * manifest.animation.fps);
  const tick = paused ? fixedTick : liveTick;
  const issues = useMemo(() => [
    ...validateOfficeCharacterScaleManifest(characterScale),
    ...validateOfficeWorkstationStep5Manifest(manifest),
  ], []);
  const stable = useMemo(() => (
    step5AnchorsStable(manifest, "far", manifest.animation.sampleTicks)
    && step5AnchorsStable(manifest, "near", manifest.animation.sampleTicks)
  ), []);
  const orientations: Step5Orientation[] = panel === "far" ? ["far"] : panel === "near" ? ["near"] : ["far", "near"];

  return (
    <main className="step5-lab" data-active-office-promotion="false" data-capture={capture} data-review-status={manifest.status}>
      <header className="step5-header">
        <div>
          <span>STEP 5 R02 · CHARACTER-RELATIVE REBUILD</span>
          <h1>Current Office person scale is the world ruler.</h1>
          <p>Person 1×1×3 · chair 1×1×2 · visible pixels may overlap logical cells</p>
        </div>
        <dl>
          <div><dt>Person</dt><dd>1×1×3</dd></div>
          <div><dt>Desk</dt><dd>3×2</dd></div>
          <div><dt>Seats</dt><dd>1 only</dd></div>
        </dl>
      </header>

      <nav className="step5-controls" aria-label="Step 5 revision 02 review controls">
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
          <strong>STEP 5 R02 LAB ONLY</strong>
          <span>Current Office scale: 96×104px @ tile 32</span>
          <span>Active Office unchanged · promoted seats: 0/10</span>
        </aside>
      )}

      {panel === "assets" && <Step5AssetProvenance manifest={manifest} />}
      {panel !== "assets" && (
        <section className={`step5-review-stage is-${panel}`} data-review-panel={panel}>
          {panel === "review" && <Step5AssetProvenance manifest={manifest} compact />}
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
              <span>Other roster members: blocked</span>
              <span>Active Office promotion: blocked</span>
            </aside>
          )}
        </section>
      )}

      <footer className="step5-footer">
        <span>Contract: {issues.length === 0 ? "PASS" : `${issues.length} ISSUES`}</span>
        <span>Desk sides: FAR=PUBLIC · NEAR=SEAT</span>
        <span>Seat/hip anchors: {stable ? "STABLE" : "DRIFT"}</span>
        <strong>{issues.length === 0 && stable ? "READY FOR OWNER VISUAL REVIEW" : "STEP 5 BLOCKED"}</strong>
      </footer>
    </main>
  );
}

import { useMemo, useState } from "react";
import {
  validateOfficeWorkstationComponentsV3,
  validateOfficeWorkstationStep5ManifestV4,
  type OfficeWorkstationStep5ManifestV4,
} from "@affiliate-ops/contracts";
import componentsJson from "../../../../../../../assets/game/manifests/office-workstation-components-v3.json";
import manifestJson from "../../../../../../../assets/game/manifests/office-workstation-step5-single-seat-v4.json";
import { useSceneClock } from "../../workstation/useSceneClock";
import { officeBackground } from "./r04Assets";
import { R04StationCard, R04StationStage } from "./R04Station";
import { r04AnchorsStable } from "./r04Runtime";
import "./r04Lab.css";

const manifest = manifestJson as unknown as OfficeWorkstationStep5ManifestV4;
type Panel = "review" | "overlay" | "office";

function panelFromQuery(query: URLSearchParams): Panel {
  const panel = query.get("panel");
  return panel === "overlay" || panel === "office" ? panel : "review";
}

export function OfficeWorkstationStep5R04LabPage() {
  const query = new URLSearchParams(window.location.search);
  const [panel, setPanel] = useState<Panel>(() => panelFromQuery(query));
  const [paused, setPaused] = useState(query.get("paused") !== "0");
  const [fixedTick, setFixedTick] = useState(() => Math.max(0, Number(query.get("tick")) || 0));
  const elapsedMs = useSceneClock();
  const tick = paused ? fixedTick : Math.floor((elapsedMs / 1_000) * manifest.animation.fps);
  const capture = query.get("capture") === "1";
  const issues = useMemo(() => [
    ...validateOfficeWorkstationComponentsV3(componentsJson),
    ...validateOfficeWorkstationStep5ManifestV4(manifest),
  ], []);
  const stable = r04AnchorsStable(manifest, "far") && r04AnchorsStable(manifest, "near");
  return (
    <main className="r04-lab" data-active-office-promotion="false" data-capture={capture} data-contract-issues={issues.length}>
      <header className="r04-header">
        <div>
          <span>STEP 5 R04 / REJECTED HISTORICAL EVIDENCE</span>
          <h1>Stable coordinates did not prove physical contact.</h1>
          <p>Desk retained / chair, person contact, monitor pivot, and keyboard placement rejected</p>
        </div>
        <dl>
          <div><dt>Desk top</dt><dd>96×64</dd></div>
          <div><dt>Seat=hip</dt><dd>declared only</dd></div>
          <div><dt>Max drift</dt><dd>0 px</dd></div>
        </dl>
      </header>
      <nav className="r04-controls">
        <div>{(["review", "overlay", "office"] as const).map((value) => (
          <button aria-pressed={panel === value} key={value} onClick={() => setPanel(value)}>{value}</button>
        ))}</div>
        <div>
          <button aria-pressed={paused} onClick={() => setPaused((value) => !value)}>{paused ? "paused" : "playing"}</button>
          <button disabled={!paused} onClick={() => setFixedTick((value) => value + 1)}>tick {tick}</button>
        </div>
      </nav>
      {panel !== "office" && (
        <section className="r04-review">
          <R04StationCard debug={panel === "overlay"} manifest={manifest} orientation="far" tick={tick} />
          <R04StationCard debug={panel === "overlay"} manifest={manifest} orientation="near" tick={tick} />
        </section>
      )}
      {panel === "office" && (
        <section className="r04-office-review">
          <div className="r04-office-stage">
            <img alt="Current Office background unchanged" src={officeBackground} />
            <div className="r04-office-station"><R04StationStage context debug={false} manifest={manifest} orientation="far" tick={tick} /></div>
          </div>
          <p>Read-only context preview. Active Office map, registry, roster, and background pixels are unchanged.</p>
        </section>
      )}
      <footer className="r04-footer">
        <span>Contract: {issues.length === 0 ? "PASS" : `${issues.length} ISSUES`}</span>
        <span>Anchors: {stable ? "STABLE" : "DRIFT"}</span>
        <span>Promoted seats: 0/10</span>
        <strong>R04 REJECTED / R05 CALIBRATION IS AUTHORITY</strong>
      </footer>
    </main>
  );
}

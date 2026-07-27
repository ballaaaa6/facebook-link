import { useMemo, useState } from "react";
import type { OfficeWorkstationBundleV1 } from "@affiliate-ops/contracts";
import bundleJson from "../../../../../../assets/game/manifests/office-workstation-bundle-v1.json";
import labMapJson from "../../../../../../assets/game/maps/office-workstation-v1-lab.json";
import { GeometryWorkstationComposite } from "../workstation/GeometryWorkstationComposite";
import {
  validateWorkstationLabMap,
  type WorkstationLabMap,
  type WorkstationPose,
} from "../workstation/workstationBundleRuntime";
import "./workstationGeometryV1Lab.css";

const bundle = bundleJson as unknown as OfficeWorkstationBundleV1;
const labMap = labMapJson as unknown as WorkstationLabMap;

export function WorkstationGeometryV1LabPage() {
  const query = new URLSearchParams(window.location.search);
  const [debug, setDebug] = useState(query.get("debug") === "1");
  const [pose, setPose] = useState<WorkstationPose>(query.get("pose") === "standing" ? "standing" : "seated");
  const [showActor, setShowActor] = useState(query.get("actors") !== "0");
  const issues = useMemo(() => validateWorkstationLabMap(labMap, bundle), []);

  return (
    <main className="workstation-v1-lab" data-status={labMap.status}>
      <header className="workstation-v1-header">
        <div>
          <span>GEOMETRY V3 · STAGING ONLY</span>
          <h1>Workstation Bundle v1 vertical slice</h1>
          <p>One modular desk family, two touching footprints, viewport-local screen animation.</p>
        </div>
        <dl>
          <div><dt>Bundle</dt><dd>v1</dd></div>
          <div><dt>Stations</dt><dd>{labMap.stations.length}</dd></div>
          <div><dt>Promotion</dt><dd>Disabled</dd></div>
        </dl>
      </header>

      <nav className="workstation-v1-controls" aria-label="Lab display controls">
        <button aria-pressed={pose === "seated"} onClick={() => setPose("seated")}>Seated</button>
        <button aria-pressed={pose === "standing"} onClick={() => setPose("standing")}>Standing</button>
        <button aria-pressed={debug} onClick={() => setDebug((value) => !value)}>Geometry</button>
        <button aria-pressed={showActor} onClick={() => setShowActor((value) => !value)}>Neutral actors</button>
      </nav>

      <section className="workstation-v1-viewport" aria-label="Paired workstation calibration room">
        <div
          className="workstation-v1-stage"
          data-debug={debug ? "true" : "false"}
          style={{ aspectRatio: `${labMap.grid.width} / ${labMap.grid.height}` }}
        >
          <div className="workstation-v1-grid" />
          <div className="workstation-v1-wall"><span>STAGING / NO ACTIVE OFFICE IMPORTS</span></div>
          {labMap.stations.map((station) => (
            <GeometryWorkstationComposite
              key={station.id}
              bundle={bundle}
              debug={debug}
              grid={labMap.grid}
              pose={pose}
              showActor={showActor}
              station={station}
            />
          ))}
        </div>
      </section>

      <footer className="workstation-v1-footer">
        <span>Far: down-facing · Near: up-facing</span>
        <span>5×4 footprint · 5×3 support · 1×1 seat</span>
        <strong>{issues.length === 0 ? "ACCEPTED-STAGING" : `${issues.length} CONTRACT ISSUES`}</strong>
      </footer>
    </main>
  );
}

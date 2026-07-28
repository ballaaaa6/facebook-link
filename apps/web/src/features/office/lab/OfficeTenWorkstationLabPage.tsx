import { useMemo, useState } from "react";
import {
  validateOfficeMapV2,
  validateOfficeWorkstationDeploymentManifestV1,
  type OfficeMapV2,
  type OfficeWorkstationBundleV1,
  type OfficeWorkstationDeploymentManifestV1,
} from "@affiliate-ops/contracts";
import bundleJson from "../../../../../../assets/game/manifests/office-workstation-bundle-v1.json";
import presetJson from "../../../../../../assets/game/manifests/office-workstation-deployment-v1.json";
import mapJson from "../../../../../../assets/game/maps/office-ten-v1.json";
import type { OfficeSeason, OfficeTimeOfDay } from "../components/officeSceneTime";
import { OfficeStructureLayer } from "../structure/OfficeStructureLayer";
import { WorkstationDeployment } from "../workstation/WorkstationDeployment";
import { useSceneClock } from "../workstation/useSceneClock";
import "./workstationGeometryV1Lab.css";
import "./officeTenLab.css";

const map = mapJson as unknown as OfficeMapV2;
const bundle = bundleJson as unknown as OfficeWorkstationBundleV1;
const presets = presetJson as unknown as OfficeWorkstationDeploymentManifestV1;

type WorkstationView = "furniture" | "seated" | "standing";

export function OfficeTenWorkstationLabPage() {
  const query = new URLSearchParams(window.location.search);
  const [view, setView] = useState<WorkstationView>(
    query.get("view") === "furniture" || query.get("view") === "standing"
      ? query.get("view") as WorkstationView
      : "seated",
  );
  const [geometryDebug, setGeometryDebug] = useState(query.get("geometry") === "1");
  const [equipmentDebug, setEquipmentDebug] = useState(query.get("equipment") === "1");
  const [structureDebug, setStructureDebug] = useState(query.get("structure") === "1");
  const [doorState, setDoorState] = useState<"open" | "closed">(query.get("door") === "open" ? "open" : "closed");
  const [season, setSeason] = useState<OfficeSeason>("spring");
  const [timeOfDay, setTimeOfDay] = useState<OfficeTimeOfDay>("day");
  const elapsedMs = useSceneClock();
  const issues = useMemo(() => [
    ...validateOfficeMapV2(map),
    ...validateOfficeWorkstationDeploymentManifestV1(presets, bundle),
  ], []);
  const presetById = useMemo(() => new Map(presets.presets.map((preset) => [preset.id, preset])), []);

  return (
    <main className="office-ten-lab" data-status={map.status}>
      <header className="office-ten-header">
        <div>
          <span>OFFICE MAP V2 · REJECTED EVIDENCE</span>
          <h1>Historical ten-workstation regression lab</h1>
          <p>29×20 semantic room · shared scene clock · Active Office promotion disabled</p>
        </div>
        <dl>
          <div><dt>Stations</dt><dd>10</dd></div>
          <div><dt>Roles</dt><dd>7 / 2 / 1</dd></div>
          <div><dt>Clock</dt><dd>{Math.floor(elapsedMs / 1000)}s</dd></div>
        </dl>
      </header>

      <section className="office-ten-controls" aria-label="Acceptance lab controls">
        <div className="office-ten-control-group" aria-label="Workstation view">
          {(["furniture", "seated", "standing"] as const).map((candidate) => (
            <button aria-pressed={view === candidate} key={candidate} onClick={() => setView(candidate)}>
              {candidate}
            </button>
          ))}
        </div>
        <div className="office-ten-control-group" aria-label="Debug overlays">
          <button aria-pressed={geometryDebug} onClick={() => setGeometryDebug((value) => !value)}>geometry</button>
          <button aria-pressed={equipmentDebug} onClick={() => setEquipmentDebug((value) => !value)}>equipment</button>
          <button aria-pressed={structureDebug} onClick={() => setStructureDebug((value) => !value)}>structure</button>
        </div>
        <label>
          Season
          <select value={season} onChange={(event) => setSeason(event.target.value as OfficeSeason)}>
            {(["spring", "summer", "autumn", "winter"] as const).map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
        <label>
          Window
          <select value={timeOfDay} onChange={(event) => setTimeOfDay(event.target.value as OfficeTimeOfDay)}>
            {(["dawn", "day", "evening", "night"] as const).map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
        <button
          className="office-ten-door-control"
          data-state={doorState}
          onClick={() => setDoorState((value) => value === "open" ? "closed" : "open")}
        >
          Door: {doorState}
        </button>
      </section>

      <section className="office-ten-viewport" aria-label="Ten workstation semantic office room">
        <div
          className="office-ten-stage"
          data-shared-scene-clock="true"
          style={{ aspectRatio: `${map.grid.width} / ${map.grid.height}` }}
        >
          <OfficeStructureLayer
            debug={structureDebug}
            doorState={doorState}
            map={map}
            season={season}
            timeOfDay={timeOfDay}
          />
          {map.workstationDeployments.map((station) => {
            const preset = presetById.get(station.presetId);
            if (!preset) return null;
            return (
              <WorkstationDeployment
                bundle={bundle}
                debug={geometryDebug}
                elapsedMs={elapsedMs}
                equipmentDebug={equipmentDebug}
                grid={map.grid}
                key={station.id}
                pose={view === "standing" ? "standing" : "seated"}
                preset={preset}
                showActor={view !== "furniture"}
                station={station}
              />
            );
          })}
        </div>
      </section>

      <footer className="office-ten-footer">
        <span>Window: {season} / {timeOfDay}</span>
        <span>Portal: {doorState === "open" ? "passable" : "blocked"}</span>
        <strong>{issues.length === 0 ? "REJECTED-GEOMETRY / FIXTURE VALID" : `${issues.length} CONTRACT ISSUES`}</strong>
      </footer>
    </main>
  );
}

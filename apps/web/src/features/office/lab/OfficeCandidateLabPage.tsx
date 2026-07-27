import { useMemo, useState } from "react";
import { createDemoOfficeSnapshot } from "@affiliate-ops/office-read-model";
import {
  validateOfficeCandidateManifest,
  validateOfficeDerivedAssetManifest,
  validateOfficeMapV2,
  type OfficeCandidateManifestV1,
  type OfficeDerivedAssetManifest,
  type OfficeMapV2,
} from "@affiliate-ops/contracts";
import candidateJson from "../../../../../../assets/game/manifests/office-candidate-v1.json";
import derivedJson from "../../../../../../assets/game/manifests/office-derived-assets-v1.json";
import mapJson from "../../../../../../assets/game/maps/office-ten-v1.json";
import type { CharacterState } from "../characterRegistry";
import { OfficeCanvas } from "../components/OfficeCanvas";
import type { OfficeSeason, OfficeTimeOfDay } from "../components/officeSceneTime";
import { CandidateFacilityScene } from "./CandidateFacilityScene";
import { CandidateRosterScene } from "./CandidateRosterScene";
import {
  CandidateWorkstationScene,
  type CandidateWorkstationView,
} from "./CandidateWorkstationScene";
import { modernOfficeLabCharacters } from "./modernOfficeLabCharacters";
import "../officeScene.css";
import "./workstationGeometryV1Lab.css";
import "./officeTenLab.css";
import "./officeCandidateLab.css";

const candidate = candidateJson as unknown as OfficeCandidateManifestV1;
const derived = derivedJson as unknown as OfficeDerivedAssetManifest;
const structuralMap = mapJson as unknown as OfficeMapV2;
type CandidateScenario = "live" | "workstations" | "facilities" | "roster";

function initialScenario(query: URLSearchParams): CandidateScenario {
  const value = query.get("scene");
  return value === "live" || value === "facilities" || value === "roster" ? value : "workstations";
}

export function OfficeCandidateLabPage() {
  const query = new URLSearchParams(window.location.search);
  const [scenario, setScenario] = useState<CandidateScenario>(() => initialScenario(query));
  const [workstationView, setWorkstationView] = useState<CandidateWorkstationView>(
    query.get("view") === "furniture" || query.get("view") === "standing" ? query.get("view") as CandidateWorkstationView : "seated",
  );
  const [debug, setDebug] = useState(query.get("debug") === "1");
  const [doorState, setDoorState] = useState<"open" | "closed">(query.get("door") === "open" ? "open" : "closed");
  const [season, setSeason] = useState<OfficeSeason>((query.get("season") as OfficeSeason) || "spring");
  const [timeOfDay, setTimeOfDay] = useState<OfficeTimeOfDay>((query.get("time") as OfficeTimeOfDay) || "day");
  const [rosterState, setRosterState] = useState<CharacterState>(
    (query.get("pose") as CharacterState) || "working-front-seated",
  );
  const [selectedId, setSelectedId] = useState("");
  const agents = useMemo(
    () => createDemoOfficeSnapshot(new Date("2026-07-27T09:00:00+07:00")).agents.map((agent) => ({
      ...agent,
      status: "running" as const,
      currentTask: "Office Candidate review",
      statusReason: "Rendering the isolated review candidate",
    })),
    [],
  );
  const issues = useMemo(() => [
    ...validateOfficeCandidateManifest(candidate),
    ...validateOfficeMapV2(structuralMap),
    ...validateOfficeDerivedAssetManifest(derived),
  ], []);

  return (
    <main className="office-candidate-lab" data-review-status={candidate.review.status}>
      <header className="candidate-header">
        <div>
          <span>STEP 21–23 · ISOLATED REVIEW CANDIDATE</span>
          <h1>Office Candidate v1</h1>
          <p>Real prototype characters · Active Office hash-locked · promotion disabled</p>
        </div>
        <dl>
          <div><dt>Agents</dt><dd>10 + 8</dd></div>
          <div><dt>Companion</dt><dd>1</dd></div>
          <div><dt>Revision</dt><dd>{candidate.review.revision}</dd></div>
        </dl>
      </header>

      <section className="candidate-controls" aria-label="Office Candidate controls">
        <div className="candidate-control-group" aria-label="Review scenario">
          {(["live", "workstations", "facilities", "roster"] as const).map((value) => (
            <button aria-pressed={scenario === value} key={value} onClick={() => setScenario(value)}>{value}</button>
          ))}
        </div>
        {scenario === "workstations" && (
          <div className="candidate-control-group" aria-label="Workstation view">
            {(["furniture", "seated", "standing"] as const).map((value) => (
              <button aria-pressed={workstationView === value} key={value} onClick={() => setWorkstationView(value)}>{value}</button>
            ))}
          </div>
        )}
        {scenario === "roster" && (
          <select value={rosterState} onChange={(event) => setRosterState(event.target.value as CharacterState)}>
            {(["working-front-seated", "working-back-seated", "interact-front", "lounge-front", "idle"] as const)
              .map((value) => <option key={value}>{value}</option>)}
          </select>
        )}
        <button aria-pressed={debug} onClick={() => setDebug((value) => !value)}>debug</button>
        {scenario === "workstations" && (
          <>
            <select value={season} onChange={(event) => setSeason(event.target.value as OfficeSeason)}>
              {(["spring", "summer", "autumn", "winter"] as const).map((value) => <option key={value}>{value}</option>)}
            </select>
            <select value={timeOfDay} onChange={(event) => setTimeOfDay(event.target.value as OfficeTimeOfDay)}>
              {(["dawn", "day", "evening", "night"] as const).map((value) => <option key={value}>{value}</option>)}
            </select>
            <button data-state={doorState} onClick={() => setDoorState((value) => value === "open" ? "closed" : "open")}>door {doorState}</button>
          </>
        )}
      </section>

      {scenario === "workstations" && (
        <CandidateWorkstationScene debug={debug} doorState={doorState} season={season} timeOfDay={timeOfDay} view={workstationView} />
      )}
      {scenario === "facilities" && <CandidateFacilityScene debug={debug} />}
      {scenario === "roster" && <CandidateRosterScene state={rosterState} />}
      {scenario === "live" && (
        <section className="candidate-live-scene" data-candidate-scene="live">
          <div className="candidate-live-note">Runtime compatibility preview · existing Active Office map remains read-only</div>
          <OfficeCanvas
            agents={agents}
            characterDefinitions={modernOfficeLabCharacters}
            debugGeometry={debug}
            mode="live"
            onSelect={setSelectedId}
            selectedId={selectedId}
          />
        </section>
      )}

      <footer className="candidate-footer">
        <span>Active Office promotion: false</span>
        <span>Commercial approval: false</span>
        <span>Saved review: {candidate.review.revision}</span>
        <strong>{issues.length === 0 ? "READY FOR VISUAL REVIEW" : `${issues.length} CONTRACT ISSUES`}</strong>
      </footer>
    </main>
  );
}

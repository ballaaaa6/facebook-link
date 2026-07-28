import { useMemo, useState } from "react";
import type {
  OfficeMapV2,
  OfficeWorkstationBundleV1,
  OfficeWorkstationDeploymentManifestV1,
} from "@affiliate-ops/contracts";
import bundleJson from "../../../../../../assets/game/manifests/office-workstation-bundle-v1.json";
import presetJson from "../../../../../../assets/game/manifests/office-workstation-deployment-v1.json";
import mapJson from "../../../../../../assets/game/maps/office-ten-v1.json";
import { AnimatedAgent } from "../components/AnimatedAgent";
import type { OfficeSeason, OfficeTimeOfDay } from "../components/officeSceneTime";
import { OfficeStructureLayer } from "../structure/OfficeStructureLayer";
import { WorkstationDeployment } from "../workstation/WorkstationDeployment";
import { useSceneClock } from "../workstation/useSceneClock";
import { modernOfficeLabCharacters } from "./modernOfficeLabCharacters";

const map = mapJson as unknown as OfficeMapV2;
const bundle = bundleJson as unknown as OfficeWorkstationBundleV1;
const presets = presetJson as unknown as OfficeWorkstationDeploymentManifestV1;

export type CandidateWorkstationView = "furniture" | "seated" | "standing";

export function CandidateWorkstationScene({
  debug,
  doorState,
  season,
  timeOfDay,
  view,
}: {
  debug: boolean;
  doorState: "open" | "closed";
  season: OfficeSeason;
  timeOfDay: OfficeTimeOfDay;
  view: CandidateWorkstationView;
}) {
  const elapsedMs = useSceneClock();
  const [sceneStartedAt] = useState(() => performance.now());
  const presetById = useMemo(
    () => new Map(presets.presets.map((preset) => [preset.id, preset])),
    [],
  );

  return (
    <section className="candidate-office-viewport" aria-label="Office Candidate workstation scene">
      <div
        className="office-ten-stage candidate-office-stage"
        data-candidate-scene="workstations"
        data-character-count={view === "furniture" ? 0 : 10}
        data-shared-scene-clock="true"
      >
        <OfficeStructureLayer
          debug={debug}
          doorState={doorState}
          map={map}
          season={season}
          timeOfDay={timeOfDay}
        />
        {map.workstationDeployments.map((station) => {
          const preset = presetById.get(station.presetId);
          const character = modernOfficeLabCharacters[station.agentId];
          if (!preset || !character) return null;
          const state = view === "standing"
            ? "idle"
            : station.orientation === "front"
              ? "working-front-seated"
              : "working-back-seated";
          return (
            <WorkstationDeployment
              actor={(
                <span className="candidate-workstation-character" data-agent-id={station.agentId}>
                  <AnimatedAgent
                    agentId={station.agentId}
                    characterDefinition={character}
                    name={station.agentId}
                    sceneStartedAt={sceneStartedAt}
                    state={state}
                  />
                </span>
              )}
              bundle={bundle}
              debug={debug}
              elapsedMs={elapsedMs}
              equipmentDebug={debug}
              grid={map.grid}
              key={station.id}
              pose={view === "standing" ? "standing" : "seated"}
              preset={preset}
              showActor={view !== "furniture"}
              station={station}
            />
          );
        })}
        <aside className="candidate-stage-stamp">
          <strong>Rejected evidence r01</strong>
          <span>{season} · {timeOfDay} · door {doorState}</span>
        </aside>
      </div>
    </section>
  );
}

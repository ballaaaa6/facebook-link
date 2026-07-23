import officeMap from "../../../../../../assets/game/maps/office-c-v1.json";
import coffeeCounter from "../../../../../../assets/game/processed/core-furniture-c-v1/counter.coffee.png";
import deskCreative from "../../../../../../assets/game/processed/core-furniture-c-v1/desk.creative.up.png";
import deskNoc from "../../../../../../assets/game/processed/core-furniture-c-v1/desk.noc.up.png";
import deskStandard from "../../../../../../assets/game/processed/core-furniture-c-v1/desk.standard.up.png";
import petBed from "../../../../../../assets/game/processed/core-furniture-c-v1/pet-bed.round.png";
import sectionalSofa from "../../../../../../assets/game/processed/core-furniture-c-v1/sofa.sectional.png";
import missionTable from "../../../../../../assets/game/processed/core-furniture-c-v1/table.mission.png";
import robotMascot from "../../../../../../assets/game/processed/decor-mechanical-c-v1/mascot.robot.png";
import serverRack from "../../../../../../assets/game/processed/equipment-c-v1/server.rack.png";
import { StatusDot } from "../../../shared/components/StatusDot";
import { agents } from "../../../shared/data/agents";
import { AnimatedAgent } from "./AnimatedAgent";

const zoneLabels: Record<string, string> = { "research-growth": "Research & Growth", "creative-studio": "Creative Studio", release: "Release Bay", "mission-handoff": "Mission Handoff", lounge: "Lounge", "systems-noc": "Systems NOC" };
const deskAssets: Record<string, string> = { "desk.standard.up": deskStandard, "desk.creative.up": deskCreative, "desk.noc.up": deskNoc };
const sharedAssets: Record<string, string> = { "table.mission": missionTable, "sofa.sectional": sectionalSofa, "counter.coffee": coffeeCounter, "pet-bed.round": petBed, "server.rack": serverRack };
const sharedWidths: Record<string, number> = { "table.mission": 16, "sofa.sectional": 13, "counter.coffee": 14, "pet-bed.round": 7, "server.rack": 5 };

export function OfficeCanvas({ selectedId, onSelect }: { selectedId: string; onSelect: (id: string) => void }) {
  return (
    <div className="office-frame"><div className="office-world" role="img" aria-label="Warm pixel operations office">
      <div className="window-row" aria-hidden="true"><span /><span /><span /><span /></div>
      {officeMap.zones.map((zone) => <div className={`office-zone zone-${zone.id}`} key={zone.id} style={{ left: `${(zone.x / officeMap.width) * 100}%`, top: `${(zone.y / officeMap.height) * 100}%`, width: `${(zone.width / officeMap.width) * 100}%`, height: `${(zone.height / officeMap.height) * 100}%` }}><span>{zoneLabels[zone.id]}</span></div>)}
      {officeMap.sharedObjects.map((object) => <img className="world-object" key={object.id} src={sharedAssets[object.asset]} alt="" style={{ left: `${(object.x / officeMap.width) * 100}%`, top: `${(object.y / officeMap.height) * 100}%`, width: `${sharedWidths[object.asset]}%` }} />)}
      {officeMap.workstations.map((station) => {
        const agent = agents.find((item) => item.id === station.id)!;
        return <button type="button" className={`workstation ${station.id === selectedId ? "is-selected" : ""}`} key={station.id} aria-label={`Select ${agent.role}`} onClick={() => onSelect(station.id)} style={{ left: `${(station.x / officeMap.width) * 100}%`, top: `${(station.y / officeMap.height) * 100}%` }}><img src={deskAssets[station.desk]} alt="" />{station.id === "performance-analyst" ? <AnimatedAgent state={agent.status === "working" ? "working" : "idle"} /> : <span className={`agent-marker marker-${agent.status}`}>{agent.name.slice(0, 1)}</span>}<span className="agent-nameplate"><StatusDot status={agent.status} />{agent.name}</span></button>;
      })}
      <img className="robot-mascot" src={robotMascot} alt="Pixel, the office mascot" />
    </div></div>
  );
}

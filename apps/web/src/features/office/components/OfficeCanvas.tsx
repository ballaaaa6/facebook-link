import officeMap from "../../../../../../assets/game/maps/office-c-v1.json";
import bobaSheet from "../../../../../../assets/game/characters/boba/spritesheet.webp";
import { StatusDot } from "../../../shared/components/StatusDot";
import { agents } from "../../../shared/data/agents";
import { officeAssetRegistry } from "./officeAssetRegistry";
import { AnimatedAgent } from "./AnimatedAgent";
import { WorldObject, type OfficeMapObject, type ResolvedOfficeObject } from "./WorldObject";

const mapObjects = officeMap.objects as OfficeMapObject[];
const attachmentSlots: Record<string, { x: number; y: number }> = {
  "desk-rear-center": { x: 0, y: -0.22 },
  "desk-rear-left": { x: -0.72, y: -0.18 },
  "desk-rear-right": { x: 0.72, y: -0.18 },
  "desk-front-center": { x: 0, y: 0.26 },
  "desk-front-left": { x: -0.72, y: 0.18 },
  "desk-front-right": { x: 0.72, y: 0.18 },
  "table-left": { x: -0.9, y: -0.12 },
  "table-right": { x: 0.9, y: -0.12 },
  "counter-left": { x: -0.9, y: -0.1 },
  "counter-right": { x: 0.9, y: -0.1 },
};

const parentPositions = new Map<string, { x: number; y: number }>([
  ...officeMap.workstations.map((station) => [station.id, { x: station.x, y: station.y }] as const),
  ...mapObjects.flatMap((object) => typeof object.x === "number" && typeof object.y === "number" ? [[object.id, { x: object.x, y: object.y }] as const] : []),
]);

const resolvedMapObjects = mapObjects.flatMap((object): ResolvedOfficeObject[] => {
  if (object.parentId) {
    const parent = parentPositions.get(object.parentId);
    const offset = object.slot ? attachmentSlots[object.slot] : undefined;
    if (!parent || !offset) return [];
    return [{ ...object, x: parent.x + offset.x, y: parent.y + offset.y }];
  }
  if (typeof object.x !== "number" || typeof object.y !== "number") return [];
  return [{ ...object, x: object.x, y: object.y }];
});

export function OfficeCanvas({ selectedId, onSelect }: { selectedId: string; onSelect: (id: string) => void }) {
  const percentX = (x: number) => `${(x / officeMap.width) * 100}%`;
  const percentY = (y: number) => `${(y / officeMap.height) * 100}%`;

  return (
    <div className="office-frame">
      <div className="office-world" aria-label="Warm pixel operations office">
        <div className="window-row" aria-hidden="true"><span /><span /><span /><span /></div>
        {resolvedMapObjects.map((object) => <WorldObject key={object.id} object={object} worldWidth={officeMap.width} percentX={percentX} percentY={percentY} />)}
        {officeMap.workstations.map((station) => {
          const agent = agents.find((item) => item.id === station.id);
          const desk = officeAssetRegistry[station.desk];
          if (!agent || !desk) return null;

          const seated = agent.status === "working";
          const position = seated ? station.seat : station.stand;
          const state = agent.status === "working" ? "working" : agent.status === "review" ? "review" : "waiting";
          const deskDepth = 300 + Math.round(station.y * 10);
          const agentDepth = seated ? deskDepth + 1 : 600 + Math.round(position.y * 10);
          return (
            <div key={station.id}>
              <img
                className="workstation-desk"
                src={desk.file}
                alt=""
                aria-hidden="true"
                style={{
                  left: percentX(station.x),
                  top: percentY(station.y),
                  width: `${(desk.widthTiles / officeMap.width) * 100}%`,
                  zIndex: deskDepth,
                }}
              />
              <button
                type="button"
                className={`agent-entity ${seated ? "is-seated" : "is-standing"} ${station.id === selectedId ? "is-selected" : ""}`}
                aria-label={`Select ${agent.role}`}
                onClick={() => onSelect(station.id)}
                style={{
                  left: percentX(position.x),
                  top: percentY(position.y),
                  zIndex: agentDepth,
                }}
              >
                <AnimatedAgent agentId={agent.id} name={agent.name} state={state} />
              </button>
              <span className="agent-nameplate" style={{ left: percentX(seated ? station.x : position.x), top: percentY(seated ? station.y + 1.45 : position.y + 0.85) }}>
                <StatusDot status={agent.status} />{agent.name}
              </span>
            </div>
          );
        })}
        <span className="petdex-mascot" aria-label="Boba, the office companion" style={{ backgroundImage: `url(${bobaSheet})` }} />
      </div>
    </div>
  );
}

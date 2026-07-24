import { useState, type CSSProperties } from "react";
import officeMapJson from "../../../../../../assets/game/maps/office-c-v1.json";
import bobaSheet from "../../../../../../assets/game/characters/boba/spritesheet.webp";
import { StatusDot } from "../../../shared/components/StatusDot";
import { agents } from "../../../shared/data/agents";
import { useOfficeSimulation } from "../officeSimulation";
import type { OfficeMapDefinition } from "../officeTypes";
import { officeAssetRegistry } from "./officeAssetRegistry";
import { AnimatedAgent } from "./AnimatedAgent";
import { WorldObject, type OfficeMapObject, type ResolvedOfficeObject } from "./WorldObject";

const officeMap = officeMapJson as unknown as OfficeMapDefinition & { objects: OfficeMapObject[] };
const mapObjects = officeMap.objects;
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
  ...mapObjects.flatMap((object) => (
    typeof object.x === "number" && typeof object.y === "number"
      ? [[object.id, { x: object.x, y: object.y }] as const]
      : []
  )),
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
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const simulation = useOfficeSimulation(officeMap, agents);
  const percentX = (x: number) => `${(x / officeMap.width) * 100}%`;
  const percentY = (y: number) => `${(y / officeMap.height) * 100}%`;

  return (
    <div className="office-frame">
      <div className="office-world" aria-label="Warm pixel operations office">
        <div className="window-row" aria-hidden="true"><span /><span /><span /><span /></div>
        {resolvedMapObjects.map((object) => (
          <WorldObject
            key={object.id}
            object={object}
            worldWidth={officeMap.width}
            percentX={percentX}
            percentY={percentY}
          />
        ))}
        {officeMap.workstations.map((station) => {
          const agent = agents.find((item) => item.id === station.id);
          const desk = officeAssetRegistry[station.desk];
          const chair = officeAssetRegistry[station.chair];
          const presentation = simulation[station.id];
          if (!agent || !desk || !chair || !presentation) return null;

          const { position, seated, state, activityLabel } = presentation;
          const deskDepth = 100 + Math.round(station.y * 20);
          const agentDepth = seated ? deskDepth - 1 : 110 + Math.round(position.y * 20);
          const nameY = seated ? station.y + 1.35 : position.y + 0.9;
          const hovered = hoveredId === station.id;
          const selected = selectedId === station.id;
          const cardOnLeft = position.x > officeMap.width - 8;

          return (
            <div className="workstation-rig" key={station.id}>
              <img
                className="workstation-chair"
                src={chair.file}
                alt=""
                aria-hidden="true"
                style={{
                  left: percentX(station.seat.x),
                  top: percentY(station.seat.y + 0.08),
                  width: `${(chair.widthTiles / officeMap.width) * 100}%`,
                  zIndex: deskDepth - 2,
                }}
              />
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
                className={`agent-entity ${seated ? "is-seated" : "is-standing"} ${selected ? "is-selected" : ""}`}
                aria-label={`Select ${agent.role}`}
                onClick={() => onSelect(station.id)}
                onMouseEnter={() => setHoveredId(station.id)}
                onMouseLeave={() => setHoveredId(null)}
                onFocus={() => setHoveredId(station.id)}
                onBlur={() => setHoveredId(null)}
                style={{
                  left: percentX(position.x),
                  top: percentY(position.y),
                  zIndex: agentDepth,
                }}
              >
                <AnimatedAgent agentId={agent.id} name={agent.name} state={state} />
              </button>
              {activityLabel && !seated ? (
                <span
                  className="agent-activity-badge"
                  style={{ left: percentX(position.x), top: percentY(position.y - 1.75), zIndex: 960 }}
                >
                  {activityLabel}
                </span>
              ) : null}
              <span
                className={`agent-nameplate ${seated ? "is-seated" : ""} ${hovered || selected ? "is-visible" : ""}`}
                style={{ left: percentX(seated ? station.x : position.x), top: percentY(nameY) }}
              >
                <StatusDot status={agent.status} />{agent.name}
              </span>
              {hovered ? (
                <span
                  className={`agent-hover-card ${cardOnLeft ? "opens-left" : ""}`}
                  style={{
                    left: percentX(position.x + (cardOnLeft ? -1.2 : 1.2)),
                    top: percentY(Math.max(2.8, position.y - 1.1)),
                  }}
                >
                  <strong>{agent.name}</strong>
                  <small>{agent.role}</small>
                  <em>{agent.task}</em>
                  <i><StatusDot status={agent.status} />{agent.status} · {agent.progress}%</i>
                </span>
              ) : null}
            </div>
          );
        })}
        <span
          className="petdex-mascot"
          aria-label="Boba resting by the pet bed"
          style={{
            backgroundImage: `url(${bobaSheet})`,
            left: percentX(10.1),
            top: percentY(18.45),
            zIndex: 475,
          } as CSSProperties}
        />
      </div>
    </div>
  );
}

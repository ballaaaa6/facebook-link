import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { OfficeAgentView, OfficeMode } from "@affiliate-ops/contracts";
import officeMapJson from "../../../../../../assets/game/maps/office-c-v1.json";
import bobaSheet from "../../../../../../assets/game/characters/boba/spritesheet.webp";
import type { OfficeMapDefinition } from "../officeTypes";
import { AgentEntity, type AgentPreviewAnchor } from "./AgentEntity";
import { AgentTooltip } from "./AgentTooltip";
import { officeAssetRegistry } from "./officeAssetRegistry";
import { WorldObject, type OfficeMapObject, type ResolvedOfficeObject } from "./WorldObject";

const officeMap = officeMapJson as unknown as OfficeMapDefinition & { objects: OfficeMapObject[] };
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
  ...officeMap.objects.flatMap((object) => (
    typeof object.x === "number" && typeof object.y === "number"
      ? [[object.id, { x: object.x, y: object.y }] as const]
      : []
  )),
]);

const resolvedMapObjects = officeMap.objects.flatMap((object): ResolvedOfficeObject[] => {
  if (object.parentId) {
    const parent = parentPositions.get(object.parentId);
    const offset = object.slot ? attachmentSlots[object.slot] : undefined;
    if (!parent || !offset) return [];
    return [{ ...object, x: parent.x + offset.x, y: parent.y + offset.y }];
  }
  if (typeof object.x !== "number" || typeof object.y !== "number") return [];
  return [{ ...object, x: object.x, y: object.y }];
});

export function OfficeCanvas({
  agents,
  mode,
  selectedId,
  onSelect,
}: {
  agents: readonly OfficeAgentView[];
  mode: OfficeMode;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [preview, setPreview] = useState<AgentPreviewAnchor | null>(null);
  const [zoom, setZoom] = useState(() => window.matchMedia("(max-width: 760px)").matches ? .5 : 1);
  const previewAgent = useMemo(
    () => agents.find((agent) => agent.agentId === preview?.agentId),
    [agents, preview?.agentId],
  );
  const percentX = (x: number) => `${(x / officeMap.width) * 100}%`;
  const percentY = (y: number) => `${(y / officeMap.height) * 100}%`;

  useEffect(() => {
    if (!preview) return;
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreview(null);
    };
    window.addEventListener("keydown", dismiss);
    return () => window.removeEventListener("keydown", dismiss);
  }, [preview]);

  const showPreview = (anchor: AgentPreviewAnchor) => {
    const frame = frameRef.current?.getBoundingClientRect();
    if (!frame) return;
    const viewportLeft = anchor.left - frame.left;
    const left = viewportLeft + frameRef.current!.scrollLeft;
    const top = anchor.top - frame.top + frameRef.current!.scrollTop;
    setPreview({ ...anchor, left, top, opensLeft: viewportLeft > frame.width - 220 });
  };

  const focusSelected = () => {
    const frame = frameRef.current;
    const button = frame?.querySelector<HTMLElement>(`[data-agent-id="${selectedId}"]`);
    if (!frame || !button) return;
    const frameRect = frame.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    frame.scrollBy({
      left: buttonRect.left - frameRect.left - frameRect.width / 2 + buttonRect.width / 2,
      top: buttonRect.top - frameRect.top - frameRect.height / 2 + buttonRect.height / 2,
      behavior: "smooth",
    });
  };

  return (
    <div className="office-viewport">
      <div className="office-viewport-toolbar" aria-label="Office view controls">
        <button type="button" onClick={() => setZoom((value) => Math.max(.45, value - .1))} aria-label="Zoom out">−</button>
        <span>{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={() => setZoom((value) => Math.min(1.35, value + .1))} aria-label="Zoom in">+</button>
        <button type="button" onClick={() => setZoom(1)}>Reset</button>
        <button type="button" onClick={focusSelected}>Focus agent</button>
      </div>
      <div
        className="office-frame"
        ref={frameRef}
        onPointerDown={(event) => {
          const target = event.target as HTMLElement;
          if (!target.closest(".agent-entity, .agent-hover-card")) setPreview(null);
        }}
      >
      <div
        className="office-world"
        aria-label="Warm pixel operations office"
        style={{ width: `${zoom * 100}%`, minWidth: `${680 * zoom}px` }}
      >
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
        {officeMap.workstations.map((station, index) => {
          const agent = agents.find((item) => item.agentId === station.id);
          const desk = officeAssetRegistry[station.desk];
          const chair = officeAssetRegistry[station.chair];
          if (!agent || !desk || !chair) return null;
          const deskDepth = 100 + Math.round(station.y * 20);
          return (
            <div className="workstation-rig" key={station.id}>
              <img
                className="workstation-chair"
                src={chair.file}
                alt=""
                aria-hidden="true"
                style={{ left: percentX(station.seat.x), top: percentY(station.seat.y + 0.08), width: `${(chair.widthTiles / officeMap.width) * 100}%`, zIndex: deskDepth - 2 }}
              />
              <img
                className="workstation-desk"
                src={desk.file}
                alt=""
                aria-hidden="true"
                style={{ left: percentX(station.x), top: percentY(station.y), width: `${(desk.widthTiles / officeMap.width) * 100}%`, zIndex: deskDepth }}
              />
              <AgentEntity
                agent={agent}
                index={index}
                map={officeMap}
                mode={mode}
                selected={selectedId === agent.agentId}
                previewed={preview?.agentId === agent.agentId}
                station={station}
                onPreview={showPreview}
                onSelect={onSelect}
              />
            </div>
          );
        })}
        <span
          className="petdex-mascot"
          aria-label="Boba resting by the pet bed"
          style={{ backgroundImage: `url(${bobaSheet})`, left: percentX(10.1), top: percentY(18.45), zIndex: 475 } as CSSProperties}
        />
      </div>
      {previewAgent && preview ? <AgentTooltip agent={previewAgent} anchor={preview} /> : null}
      </div>
    </div>
  );
}

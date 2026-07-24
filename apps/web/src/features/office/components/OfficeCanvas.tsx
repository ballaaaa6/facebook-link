import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { OfficeAgentView, OfficeMode } from "@affiliate-ops/contracts";
import officeMapJson from "../../../../../../assets/game/maps/office-c-v1.json";
import bobaSheet from "../../../../../../assets/game/characters/boba/runtime-spritesheet-v2.webp";
import bobaSheet2x from "../../../../../../assets/game/characters/boba/runtime-spritesheet-v2@2x.webp";
import { resolveOfficeLayout, validateOfficeLayout } from "../layout/officeLayout";
import type { OfficeMapDefinition } from "../officeTypes";
import { AgentEntity, type AgentPreviewRequest } from "./AgentEntity";
import { AgentTooltip } from "./AgentTooltip";
import { officeAssetRegistry, officeSlotSets } from "./officeAssetRegistry";
import { WorldObject } from "./WorldObject";

const officeMap = officeMapJson as unknown as OfficeMapDefinition;
const officeLayout = resolveOfficeLayout(officeMap, officeAssetRegistry, officeSlotSets);
const officeLayoutIssues = validateOfficeLayout(officeMap, officeAssetRegistry, officeLayout);
if (officeLayoutIssues.length > 0) {
  throw new Error(`Invalid Office C layout: ${officeLayoutIssues.join("; ")}`);
}
const resolvedMapObjects = officeLayout.objects;
const zoomLevels = [.5, .75, 1, 1.25] as const;

function adjacentZoom(current: number, direction: -1 | 1) {
  const currentIndex = zoomLevels.findIndex((value) => value === current);
  const index = currentIndex < 0 ? 2 : currentIndex;
  return zoomLevels[Math.max(0, Math.min(zoomLevels.length - 1, index + direction))]!;
}

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
  const [preview, setPreview] = useState<AgentPreviewRequest | null>(null);
  const [zoom, setZoom] = useState(() => window.matchMedia("(max-width: 760px)").matches ? .5 : 1);
  const [sceneStartedAt] = useState(() => performance.now());
  const previewAgent = useMemo(
    () => agents.find((agent) => agent.agentId === preview?.agentId),
    [agents, preview?.agentId],
  );
  const percentX = (x: number) => `${(x / officeMap.width) * 100}%`;
  const percentY = (y: number) => `${(y / officeMap.height) * 100}%`;
  const endPreview = (agentId: string) => {
    setPreview((current) => current?.agentId === agentId ? null : current);
  };

  useEffect(() => {
    if (!preview) return;
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreview(null);
    };
    window.addEventListener("keydown", dismiss);
    return () => window.removeEventListener("keydown", dismiss);
  }, [preview]);

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
        <button type="button" onClick={() => setZoom((value) => adjacentZoom(value, -1))} aria-label="Zoom out">−</button>
        <span>{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={() => setZoom((value) => adjacentZoom(value, 1))} aria-label="Zoom in">+</button>
        <button type="button" onClick={() => setZoom(1)}>Fit room</button>
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
        {officeMap.workstations.map((station) => {
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
                style={{ left: percentX(station.seat.x), top: percentY(station.seat.y + 0.08), width: `${(chair.renderWidthTiles / officeMap.width) * 100}%`, zIndex: deskDepth - 2 }}
              />
              <img
                className="workstation-desk"
                src={desk.file}
                alt=""
                aria-hidden="true"
                style={{ left: percentX(station.x), top: percentY(station.y), width: `${(desk.renderWidthTiles / officeMap.width) * 100}%`, zIndex: deskDepth }}
              />
              <AgentEntity
                agent={agent}
                agents={agents}
                frameRef={frameRef}
                map={officeMap}
                mode={mode}
                sceneStartedAt={sceneStartedAt}
                selected={selectedId === agent.agentId}
                previewed={preview?.agentId === agent.agentId}
                station={station}
                onPreview={setPreview}
                onPreviewEnd={endPreview}
                onSelect={onSelect}
              />
            </div>
          );
        })}
        <span
          className="petdex-mascot"
          aria-label="Boba resting by the pet bed"
          style={{
            backgroundImage: `image-set(url("${bobaSheet}") 1x, url("${bobaSheet2x}") 2x)`,
            left: percentX(10.1),
            top: percentY(18.45),
            zIndex: 475,
          } as CSSProperties}
        />
      </div>
      {previewAgent && preview
        ? <AgentTooltip agent={previewAgent} frameRef={frameRef} request={preview} />
        : null}
      </div>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { OfficeAgentView, OfficeMode } from "@affiliate-ops/contracts";
import "../officeScene.css";
import officeMapJson from "../../../../../../assets/game/maps/office-c-v2.json";
import { resolveOfficeLayout, validateOfficeLayout } from "../layout/officeLayout";
import type { OfficeMapDefinition } from "../officeTypes";
import { fittedTileSize } from "../motion/pixelGeometry";
import { AgentEntity, type AgentPreviewRequest } from "./AgentEntity";
import { AgentTooltip } from "./AgentTooltip";
import { CompanionEntity } from "./CompanionEntity";
import { officeAssetRegistry, officeSlotSets } from "./officeAssetRegistry";
import { WorldObject } from "./WorldObject";

const officeMap = officeMapJson as unknown as OfficeMapDefinition;
const officeLayout = resolveOfficeLayout(officeMap, officeAssetRegistry, officeSlotSets);
const officeLayoutIssues = validateOfficeLayout(officeMap, officeAssetRegistry, officeLayout);
if (officeLayoutIssues.length > 0) {
  throw new Error(`Invalid Office C layout: ${officeLayoutIssues.join("; ")}`);
}
const resolvedMapObjects = officeLayout.objects;

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
  const [tileSize, setTileSize] = useState(10);
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

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const fitScene = () => {
      const style = window.getComputedStyle(frame);
      const horizontalBorder = Number.parseFloat(style.borderLeftWidth) + Number.parseFloat(style.borderRightWidth);
      const verticalBorder = Number.parseFloat(style.borderTopWidth) + Number.parseFloat(style.borderBottomWidth);
      const next = fittedTileSize(
        frame.clientWidth - horizontalBorder,
        frame.clientHeight - verticalBorder,
        officeMap.width,
        officeMap.height,
      );
      setTileSize((current) => current === next ? current : next);
    };
    fitScene();
    const observer = new ResizeObserver(fitScene);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="office-viewport">
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
        style={{
          "--tile-size": `${tileSize}px`,
          width: `${officeMap.width * tileSize}px`,
          height: `${officeMap.height * tileSize}px`,
        } as CSSProperties}
      >
        <div className="window-row" aria-hidden="true"><span /><span /><span /><span /></div>
        {officeMap.zones.map((zone) => (
          <span
            className={`office-zone office-zone-${zone.id}`}
            key={zone.id}
            aria-hidden="true"
            style={{
              left: percentX(zone.x),
              top: percentY(zone.y),
              width: percentX(zone.width),
              height: percentY(zone.height),
            }}
          />
        ))}
        <span className="office-lounge-rug" aria-hidden="true" />
        {resolvedMapObjects.map((object) => (
          <WorldObject
            key={object.id}
            object={object}
            worldWidth={officeMap.width}
            worldHeight={officeMap.height}
            percentX={percentX}
            percentY={percentY}
          />
        ))}
        {officeMap.workstations.map((station) => {
          const agent = agents.find((item) => item.agentId === station.id);
          const desk = officeAssetRegistry[station.desk];
          if (!agent || !desk) return null;
          const deskDepth = 100 + Math.round(station.y * 20);
          return (
            <div className="workstation-rig" key={station.id}>
              <img
                className="workstation-desk"
                src={desk.file}
                alt=""
                aria-hidden="true"
                style={{
                  left: percentX(station.x),
                  top: percentY(station.y),
                  width: `${(desk.renderBox.width / officeMap.width) * 100}%`,
                  height: `${(desk.renderBox.height / officeMap.height) * 100}%`,
                  zIndex: deskDepth - 2,
                }}
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
              <img
                className="workstation-desk workstation-desk-front"
                src={desk.file}
                alt=""
                aria-hidden="true"
                style={{
                  left: percentX(station.x),
                  top: percentY(station.y),
                  width: `${(desk.renderBox.width / officeMap.width) * 100}%`,
                  height: `${(desk.renderBox.height / officeMap.height) * 100}%`,
                  zIndex: deskDepth + 2,
                }}
              />
            </div>
          );
        })}
        {officeMap.companions.map((companion) => (
          <CompanionEntity
            key={companion.id}
            companion={companion}
            mapWidth={officeMap.width}
            mapHeight={officeMap.height}
            sceneStartedAt={sceneStartedAt}
          />
        ))}
      </div>
      {previewAgent && preview
        ? <AgentTooltip agent={previewAgent} frameRef={frameRef} request={preview} />
        : null}
      </div>
    </div>
  );
}

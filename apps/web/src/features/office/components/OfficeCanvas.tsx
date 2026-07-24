import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { OfficeAgentView, OfficeMode } from "@affiliate-ops/contracts";
import "../officeScene.css";
import officeMapJson from "../../../../../../assets/game/maps/office-c-v2.json";
import { resolveOfficeLayout, validateOfficeLayout } from "../layout/officeLayout";
import type { OfficeMapDefinition } from "../officeTypes";
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
const tileSizeLevels = [10, 12, 16, 24, 32, 40] as const;
const workZoneWidth = officeMap.zones.find((zone) => zone.id === "work-floor")?.width ?? 24;

function adjacentTileSize(current: number, direction: -1 | 1) {
  const currentIndex = tileSizeLevels.findIndex((value) => value >= current);
  const index = currentIndex < 0 ? tileSizeLevels.length - 1 : currentIndex;
  return tileSizeLevels[Math.max(0, Math.min(tileSizeLevels.length - 1, index + direction))]!;
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
  const [tileSize, setTileSize] = useState(() => window.matchMedia("(max-width: 760px)").matches ? 12 : 32);
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
  const fitWidth = (tiles: number) => {
    const frame = frameRef.current;
    if (!frame) return;
    setTileSize(Math.max(10, Math.floor((frame.clientWidth - 2) / tiles)));
    frame.scrollTo({ left: 0, top: 0, behavior: "smooth" });
  };
  const showZone = (zoneId: string) => {
    const frame = frameRef.current;
    const zone = officeMap.zones.find((item) => item.id === zoneId);
    if (!frame || !zone) return;
    frame.scrollTo({ left: zone.x * tileSize, top: 0, behavior: "smooth" });
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
    const mobile = window.matchMedia("(max-width: 760px)").matches;
    setTileSize(Math.max(10, Math.floor((frame.clientWidth - 2) / (mobile ? workZoneWidth : officeMap.width))));
    frame.scrollTo({ left: 0, top: 0 });
  }, []);

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
        <button type="button" onClick={() => setTileSize((value) => adjacentTileSize(value, -1))} aria-label="Zoom out">−</button>
        <span>{tileSize}px</span>
        <button type="button" onClick={() => setTileSize((value) => adjacentTileSize(value, 1))} aria-label="Zoom in">+</button>
        <button type="button" onClick={() => fitWidth(workZoneWidth)}>Fit work</button>
        <button type="button" onClick={() => fitWidth(officeMap.width)}>Fit room</button>
        <button type="button" onClick={() => showZone("support-break")}>Break</button>
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
        <span className="office-entry-rug" aria-hidden="true" />
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
                style={{
                  left: percentX(station.seat.x),
                  top: percentY(station.seat.y),
                  width: `${(chair.renderBox.width / officeMap.width) * 100}%`,
                  height: `${(chair.renderBox.height / officeMap.height) * 100}%`,
                  zIndex: deskDepth - 4,
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

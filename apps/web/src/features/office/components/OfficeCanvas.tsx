import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { OfficeAgentView, OfficeMode } from "@affiliate-ops/contracts";
import "../officeScene.css";
import activeOfficeMapJson from "../../../../../../assets/game/maps/office-c-v2.json";
import type { CharacterDefinition } from "../characterRegistry";
import { resolveOfficeLayout, validateOfficeLayout } from "../layout/officeLayout";
import type { AgentPresentation, OfficeMapDefinition } from "../officeTypes";
import { fittedTileSize } from "../motion/pixelGeometry";
import { AgentEntity, type AgentPreviewRequest } from "./AgentEntity";
import { AgentTooltip } from "./AgentTooltip";
import { CompanionEntity } from "./CompanionEntity";
import { OfficeBackdrop } from "./OfficeBackdrop";
import { OfficeDebugOverlay } from "./OfficeDebugOverlay";
import {
  officeAssetRegistry,
  officeSlotSets,
  type OfficeAssetDefinition,
  type OfficeAssetSlot,
} from "./officeAssetRegistry";
import { officeSceneReference, officeSceneTimeAt } from "./officeSceneRuntime";
import { WorldObject } from "./WorldObject";

const activeOfficeMap = activeOfficeMapJson as unknown as OfficeMapDefinition;

export function OfficeCanvas({
  agents,
  mode,
  agentPresentations = {},
  assetRegistry = officeAssetRegistry,
  backdropMode = "scene",
  characterDefinitions = {},
  debugGeometry = false,
  mapDefinition = activeOfficeMap,
  showAgents = true,
  showAmbientDecor = true,
  showWorkstationChairs = false,
  slotSets = officeSlotSets,
  workstationChairForeground,
  workstationLayering = "standard",
  selectedId,
  onSelect,
}: {
  agents: readonly OfficeAgentView[];
  mode: OfficeMode;
  agentPresentations?: Readonly<Record<string, AgentPresentation>>;
  assetRegistry?: Record<string, OfficeAssetDefinition>;
  backdropMode?: "scene" | "structural";
  characterDefinitions?: Readonly<Record<string, CharacterDefinition>>;
  debugGeometry?: boolean;
  mapDefinition?: OfficeMapDefinition;
  showAgents?: boolean;
  showAmbientDecor?: boolean;
  showWorkstationChairs?: boolean;
  slotSets?: Record<string, Record<string, OfficeAssetSlot>>;
  workstationChairForeground?: {
    id: string;
    file: string;
    renderBox: { width: number; height: number };
  };
  workstationLayering?: "standard" | "paired-seating";
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const officeMap = mapDefinition;
  const resolvedMapObjects = useMemo(() => {
    const layout = resolveOfficeLayout(officeMap, assetRegistry, slotSets);
    const issues = validateOfficeLayout(officeMap, assetRegistry, layout);
    if (issues.length > 0) {
      throw new Error(`Invalid Office layout ${officeMap.id ?? "(unnamed)"}: ${issues.join("; ")}`);
    }
    return layout.objects;
  }, [assetRegistry, officeMap, slotSets]);
  const sceneBackdropScale = backdropMode === "structural"
    ? 1
    : (
      officeSceneReference.width / officeSceneReference.height
    ) / (officeMap.width / officeMap.height);
  const frameRef = useRef<HTMLDivElement>(null);
  const [preview, setPreview] = useState<AgentPreviewRequest | null>(null);
  const [tileSize, setTileSize] = useState(10);
  const [sceneStartedAt] = useState(() => performance.now());
  const [sceneTime, setSceneTime] = useState(() => officeSceneTimeAt(new Date()));
  const previewAgent = useMemo(
    () => agents.find((agent) => agent.agentId === preview?.agentId),
    [agents, preview?.agentId],
  );
  const percentX = (x: number) => `${(x / officeMap.width) * 100}%`;
  const percentY = (y: number) => `${(y / officeMap.height) * 100}%`;
  const mapWidthPx = officeMap.width * tileSize;
  const mapHeightPx = officeMap.height * tileSize;
  const stageWidthPx = Math.round(mapWidthPx * sceneBackdropScale);
  const endPreview = (agentId: string) => {
    setPreview((current) => current?.agentId === agentId ? null : current);
  };

  useEffect(() => {
    let timer: number | undefined;
    const refresh = () => {
      setSceneTime(officeSceneTimeAt(new Date()));
      const untilNextMinute = 60_000 - (Date.now() % 60_000) + 50;
      timer = window.setTimeout(refresh, untilNextMinute);
    };
    refresh();
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, []);

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
    const viewport = frame.parentElement ?? frame;
    const fitScene = () => {
      const style = window.getComputedStyle(frame);
      const horizontalBorder = (Number.parseFloat(style.borderLeftWidth) || 4) + (Number.parseFloat(style.borderRightWidth) || 4);
      const verticalBorder = (Number.parseFloat(style.borderTopWidth) || 4) + (Number.parseFloat(style.borderBottomWidth) || 4);
      const next = fittedTileSize(
        (viewport.clientWidth - horizontalBorder) / sceneBackdropScale,
        viewport.clientHeight - verticalBorder,
        officeMap.width,
        officeMap.height,
      );
      setTileSize((current) => current === next ? current : next);
    };
    fitScene();
    const observer = new ResizeObserver(fitScene);
    observer.observe(viewport);
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
          className="office-stage"
          style={{
            width: `${stageWidthPx}px`,
            height: `${mapHeightPx}px`,
          }}
        >
          {backdropMode === "scene"
            ? <OfficeBackdrop sceneTime={sceneTime} showAmbientDecor={showAmbientDecor} />
            : null}
          <div
            className="office-world"
            data-scene={backdropMode === "structural" ? "structural-lab" : "modern"}
            aria-label="Warm pixel operations office"
            style={{
              "--tile-size": `${tileSize}px`,
              "--structural-floor-start": percentY(
                officeMap.surfaces.find(({ support }) => support === "floor")?.y ?? 0,
              ),
              left: `${Math.round((stageWidthPx - mapWidthPx) / 2)}px`,
              width: `${mapWidthPx}px`,
              height: `${mapHeightPx}px`,
            } as CSSProperties}
          >
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
        {showAmbientDecor ? <span className="office-lounge-rug" aria-hidden="true" /> : null}
        {resolvedMapObjects.map((object) => (
          <WorldObject
            assetRegistry={assetRegistry}
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
          const desk = assetRegistry[station.desk];
          const chair = assetRegistry[station.chair];
          if (!desk || !chair) return null;
          const deskDepth = 100 + Math.round(station.y * 20);
          const nearPairedRow = workstationLayering === "paired-seating" && station.facing === "up";
          const deskBaseDepth = nearPairedRow ? deskDepth - 4 : deskDepth - 2;
          const deskForegroundDepth = nearPairedRow ? deskDepth - 4 : deskDepth + 2;
          return (
            <div
              className="workstation-rig"
              data-chair-asset={station.chair}
              data-desk-asset={station.desk}
              data-facing={station.facing}
              key={station.id}
            >
              <img
                className="workstation-desk"
                src={desk.file}
                data-asset-id={station.desk}
                alt=""
                aria-hidden="true"
                style={{
                  left: percentX(station.x),
                  top: percentY(station.y),
                  width: `${(desk.renderBox.width / officeMap.width) * 100}%`,
                  height: `${(desk.renderBox.height / officeMap.height) * 100}%`,
                  zIndex: deskBaseDepth,
                }}
              />
              {showWorkstationChairs
                ? (
                  <img
                    className="workstation-chair"
                    src={chair.file}
                    data-asset-id={station.chair}
                    alt=""
                    aria-hidden="true"
                    style={{
                      left: percentX(station.seat.x),
                      top: percentY(station.seat.y),
                      width: `${(chair.renderBox.width / officeMap.width) * 100}%`,
                      height: `${(chair.renderBox.height / officeMap.height) * 100}%`,
                      zIndex: deskDepth - 3,
                    }}
                  />
                )
                : null}
              {showAgents && agent
                ? (
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
                    characterDefinition={characterDefinitions[agent.agentId]}
                    presentationOverride={agentPresentations[agent.agentId]}
                    onPreview={setPreview}
                    onPreviewEnd={endPreview}
                    onSelect={onSelect}
                  />
                )
                : null}
              {workstationChairForeground
                ? (
                  <img
                    className="workstation-chair workstation-chair-foreground"
                    src={workstationChairForeground.file}
                    data-asset-id={workstationChairForeground.id}
                    alt=""
                    aria-hidden="true"
                    style={{
                      left: percentX(station.seat.x),
                      top: percentY(station.seat.y),
                      width: `${(workstationChairForeground.renderBox.width / officeMap.width) * 100}%`,
                      height: `${(workstationChairForeground.renderBox.height / officeMap.height) * 100}%`,
                      zIndex: deskDepth - 1,
                    }}
                  />
                )
                : null}
              <img
                className="workstation-desk workstation-desk-front"
                src={desk.file}
                data-asset-id={station.desk}
                alt=""
                aria-hidden="true"
                style={{
                  left: percentX(station.x),
                  top: percentY(station.y),
                  width: `${(desk.renderBox.width / officeMap.width) * 100}%`,
                  height: `${(desk.renderBox.height / officeMap.height) * 100}%`,
                  zIndex: deskForegroundDepth,
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
        {debugGeometry
          ? <OfficeDebugOverlay map={officeMap} percentX={percentX} percentY={percentY} />
          : null}
          </div>
        </div>
      {previewAgent && preview
        ? <AgentTooltip agent={previewAgent} frameRef={frameRef} request={preview} />
        : null}
      </div>
    </div>
  );
}

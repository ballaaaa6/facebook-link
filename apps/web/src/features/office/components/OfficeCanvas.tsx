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
import {
  officeSceneAssets,
  officeSceneReference,
  officeSceneTimeAt,
  officeWindowViewFor,
} from "./officeSceneRuntime";
import { WorldObject } from "./WorldObject";

const officeMap = officeMapJson as unknown as OfficeMapDefinition;
const officeLayout = resolveOfficeLayout(officeMap, officeAssetRegistry, officeSlotSets);
const officeLayoutIssues = validateOfficeLayout(officeMap, officeAssetRegistry, officeLayout);
if (officeLayoutIssues.length > 0) {
  throw new Error(`Invalid Office C layout: ${officeLayoutIssues.join("; ")}`);
}
const resolvedMapObjects = officeLayout.objects;
const sceneBackdropScale = (
  officeSceneReference.width / officeSceneReference.height
) / (officeMap.width / officeMap.height);

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
  const [sceneTime, setSceneTime] = useState(() => officeSceneTimeAt(new Date()));
  const previewAgent = useMemo(
    () => agents.find((agent) => agent.agentId === preview?.agentId),
    [agents, preview?.agentId],
  );
  const percentX = (x: number) => `${(x / officeMap.width) * 100}%`;
  const percentY = (y: number) => `${(y / officeMap.height) * 100}%`;
  const referencePercentX = (x: number) => `${(x / officeSceneReference.width) * 100}%`;
  const referencePercentY = (y: number) => `${(y / officeSceneReference.height) * 100}%`;
  const referenceWidth = (width: number) => `${(width / officeSceneReference.width) * 100}%`;
  const referenceHeight = (height: number) => `${(height / officeSceneReference.height) * 100}%`;
  const windowView = officeWindowViewFor(sceneTime);
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
          <div className="office-backdrop" aria-hidden="true">
            <img
              className="office-background-image"
              src={officeSceneAssets.background}
              alt=""
            />
            <img
              className="office-window-view"
              src={windowView}
              alt=""
              style={{
                left: referencePercentX(officeSceneReference.window.x),
                top: referencePercentY(officeSceneReference.window.y),
                width: referenceWidth(officeSceneReference.window.width),
                height: referenceHeight(officeSceneReference.window.height),
              }}
            />
            <img
              className="office-clock-face"
              src={officeSceneAssets.clockFace}
              alt=""
              style={{
                left: referencePercentX(officeSceneReference.clock.x),
                top: referencePercentY(officeSceneReference.clock.y),
                width: referenceWidth(officeSceneReference.clock.width),
                height: referenceHeight(officeSceneReference.clock.height),
              }}
            />
            <img
              className="office-clock-hand office-clock-hour-hand"
              src={officeSceneAssets.clockHourHand}
              alt=""
              style={{
                left: referencePercentX(officeSceneReference.clock.x + officeSceneReference.clock.width / 2),
                top: referencePercentY(officeSceneReference.clock.y + officeSceneReference.clock.height / 2),
                width: referenceWidth(officeSceneReference.clock.width),
                height: referenceHeight(officeSceneReference.clock.height),
                transform: `translate(-50%, -50%) rotate(${sceneTime.hourAngle}deg)`,
              }}
            />
            <img
              className="office-clock-hand office-clock-minute-hand"
              src={officeSceneAssets.clockMinuteHand}
              alt=""
              style={{
                left: referencePercentX(officeSceneReference.clock.x + officeSceneReference.clock.width / 2),
                top: referencePercentY(officeSceneReference.clock.y + officeSceneReference.clock.height / 2),
                width: referenceWidth(officeSceneReference.clock.width),
                height: referenceHeight(officeSceneReference.clock.height),
                transform: `translate(-50%, -50%) rotate(${sceneTime.minuteAngle}deg)`,
              }}
            />
          </div>
          <div
            className="office-world"
            data-scene="modern"
            aria-label="Warm pixel operations office"
            style={{
              "--tile-size": `${tileSize}px`,
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
        </div>
      {previewAgent && preview
        ? <AgentTooltip agent={previewAgent} frameRef={frameRef} request={preview} />
        : null}
      </div>
    </div>
  );
}

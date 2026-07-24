import { useEffect, useMemo, useRef, useState } from "react";
import type { Agent } from "../../shared/types";
import type {
  AgentPresentation,
  OfficeMapDefinition,
  OfficePoint,
  OfficePoi,
  OfficeWorkstation,
} from "./officeTypes";

const agentRoutines: Record<string, string[]> = {
  "market-scout": ["water", "printer"],
  "product-ranker": ["mission-review", "coffee"],
  "growth-strategist": ["coffee", "lounge-seat"],
  "performance-analyst": ["printer", "water"],
  "gemini-copywriter": ["coffee", "mission-review"],
  "flow-visual-producer": ["lounge-seat", "coffee"],
  "link-attribution": ["mission-review", "printer"],
  "qa-editor": ["printer", "mission-review"],
  publisher: ["coffee", "water"],
  "session-keeper": ["server-check", "coffee"],
};

const distance = (a: OfficePoint, b: OfficePoint) => Math.hypot(b.x - a.x, b.y - a.y);

function nearestDirection(a: OfficePoint, b: OfficePoint): "walk-left" | "walk-right" {
  return b.x < a.x ? "walk-left" : "walk-right";
}

function pathDistance(points: OfficePoint[]) {
  return points.slice(1).reduce((total, point, index) => total + distance(points[index], point), 0);
}

function samplePath(points: OfficePoint[], progress: number): { point: OfficePoint; state: "walk-left" | "walk-right" } {
  const total = pathDistance(points);
  let remaining = Math.max(0, Math.min(1, progress)) * total;
  for (let index = 1; index < points.length; index += 1) {
    const from = points[index - 1];
    const to = points[index];
    const length = distance(from, to);
    if (remaining <= length || index === points.length - 1) {
      const ratio = length === 0 ? 1 : remaining / length;
      return {
        point: { x: from.x + (to.x - from.x) * ratio, y: from.y + (to.y - from.y) * ratio },
        state: nearestDirection(from, to),
      };
    }
    remaining -= length;
  }
  return { point: points.at(-1) ?? { x: 0, y: 0 }, state: "walk-right" };
}

function findNodePath(map: OfficeMapDefinition, startId: string, endId: string): OfficePoint[] {
  const nodes = new Map(map.navigation.nodes.map((node) => [node.id, node]));
  const adjacency = new Map<string, string[]>();
  for (const [from, to] of map.navigation.edges) {
    adjacency.set(from, [...(adjacency.get(from) ?? []), to]);
    adjacency.set(to, [...(adjacency.get(to) ?? []), from]);
  }

  const queue = [startId];
  const previous = new Map<string, string | undefined>([[startId, undefined]]);
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || current === endId) break;
    for (const next of adjacency.get(current) ?? []) {
      if (previous.has(next)) continue;
      previous.set(next, current);
      queue.push(next);
    }
  }

  if (!previous.has(endId)) return [];
  const path: OfficePoint[] = [];
  let cursor: string | undefined = endId;
  while (cursor) {
    const node = nodes.get(cursor);
    if (node) path.unshift({ x: node.x, y: node.y });
    cursor = previous.get(cursor);
  }
  return path;
}

function routeFor(map: OfficeMapDefinition, station: OfficeWorkstation, poi: OfficePoi) {
  const nodePath = findNodePath(map, station.navNode, poi.navNode);
  return [station.seat, station.approach, ...nodePath, poi.point].filter((point, index, all) => (
    index === 0 || distance(point, all[index - 1]) > 0.05
  ));
}

function deskState(agent: Agent): AgentPresentation["state"] {
  if (agent.status === "working") return "working";
  if (agent.status === "review") return "review";
  return "waiting";
}

function interactionState(poi: OfficePoi): AgentPresentation["state"] {
  if (poi.activity === "meeting") return "review";
  if (poi.activity === "printer" || poi.activity === "server") return "working";
  if (poi.activity === "coffee" || poi.activity === "water") return "waving";
  return "idle";
}

function presentationAt(
  elapsedSeconds: number,
  index: number,
  agent: Agent,
  map: OfficeMapDefinition,
  station: OfficeWorkstation,
): AgentPresentation {
  const warmup = 8 + index * 1.7;
  if (elapsedSeconds < warmup) return { position: station.seat, state: deskState(agent), seated: true };

  const cycleLength = agent.status === "waiting" ? 54 : 72;
  const cycleElapsed = elapsedSeconds - warmup;
  const cycleIndex = Math.floor(cycleElapsed / cycleLength);
  const phaseTime = cycleElapsed % cycleLength;
  const poiIds = agentRoutines[agent.id] ?? ["water"];
  const poi = map.pois.find((item) => item.id === poiIds[cycleIndex % poiIds.length]);
  if (!poi) return { position: station.seat, state: deskState(agent), seated: true };

  const route = routeFor(map, station, poi);
  const travelDuration = Math.max(3, pathDistance(route) / 3.1);
  const deskDuration = agent.status === "waiting" ? 12 : 28;
  const interactionDuration = poi.duration;
  const outboundEnd = deskDuration + travelDuration;
  const interactionEnd = outboundEnd + interactionDuration;
  const returnEnd = interactionEnd + travelDuration;

  if (phaseTime < deskDuration || phaseTime >= returnEnd) {
    return { position: station.seat, state: deskState(agent), seated: true };
  }
  if (phaseTime < outboundEnd) {
    const sampled = samplePath(route, (phaseTime - deskDuration) / travelDuration);
    return { position: sampled.point, state: sampled.state, seated: false };
  }
  if (phaseTime < interactionEnd) {
    return { position: poi.point, state: interactionState(poi), seated: false, activityLabel: poi.label };
  }

  const sampled = samplePath([...route].reverse(), (phaseTime - interactionEnd) / travelDuration);
  return { position: sampled.point, state: sampled.state, seated: false };
}

export function useOfficeSimulation(
  map: OfficeMapDefinition,
  agents: readonly Agent[],
): Record<string, AgentPresentation> {
  const startedAt = useRef(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    startedAt.current = performance.now();
    let frame = 0;
    let lastUpdate = 0;
    const update = (time: number) => {
      if (time - lastUpdate >= 80) {
        lastUpdate = time;
        setElapsedSeconds((time - startedAt.current) / 1000);
      }
      frame = window.requestAnimationFrame(update);
    };
    frame = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return useMemo(() => Object.fromEntries(map.workstations.map((station, index) => {
    const agent = agents.find((item) => item.id === station.id);
    if (!agent) return [station.id, { position: station.seat, state: "idle", seated: true }];
    return [station.id, presentationAt(elapsedSeconds, index, agent, map, station)];
  })), [agents, elapsedSeconds, map]);
}

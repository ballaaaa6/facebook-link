import type { OfficeAgentView, OfficeMode } from "@affiliate-ops/contracts";
import type { AgentPresentation, OfficeMapDefinition, OfficePoint, OfficePoi, OfficeWorkstation } from "../officeTypes";

const routines: Record<string, string[]> = {
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

function samplePath(points: OfficePoint[], progress: number): AgentPresentation {
  const total = points.slice(1).reduce((sum, point, index) => sum + distance(points[index]!, point), 0);
  let remaining = Math.max(0, Math.min(1, progress)) * total;
  for (let index = 1; index < points.length; index += 1) {
    const from = points[index - 1]!;
    const to = points[index]!;
    const length = distance(from, to);
    if (remaining <= length || index === points.length - 1) {
      const ratio = length === 0 ? 1 : remaining / length;
      return {
        position: { x: from.x + (to.x - from.x) * ratio, y: from.y + (to.y - from.y) * ratio },
        state: to.x < from.x ? "walk-left" : "walk-right",
        seated: false,
      };
    }
    remaining -= length;
  }
  return { position: points.at(-1) ?? { x: 0, y: 0 }, state: "walk-right", seated: false };
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
  const points = [station.seat, station.approach, ...findNodePath(map, station.navNode, poi.navNode), poi.point];
  return points.filter((point, index) => index === 0 || distance(point, points[index - 1]!) > 0.05);
}

function deskState(agent: OfficeAgentView): AgentPresentation["state"] {
  if (agent.status === "failed" || agent.status === "blocked") return "failed";
  if (agent.status === "review" || agent.status === "waiting_human") return "review";
  if (agent.status === "running") return "working";
  if (agent.status === "offline" || agent.status === "stale") return "idle";
  return "waiting";
}

function interactionState(poi: OfficePoi): AgentPresentation["state"] {
  if (poi.activity === "meeting") return "review";
  if (poi.activity === "printer" || poi.activity === "server") return "working";
  if (poi.activity === "coffee" || poi.activity === "water") return "waving";
  return "idle";
}

export function presentationAt(
  elapsedSeconds: number,
  index: number,
  agent: OfficeAgentView,
  mode: OfficeMode,
  map: OfficeMapDefinition,
  station: OfficeWorkstation,
): AgentPresentation {
  const seated = { position: station.seat, state: deskState(agent), seated: true } as const;
  if (mode === "live") return seated;
  const warmup = 5 + index * 1.25;
  if (elapsedSeconds < warmup) return seated;
  const cycleLength = agent.status === "waiting_dependency" ? 50 : 66;
  const cycleElapsed = elapsedSeconds - warmup;
  const cycleIndex = Math.floor(cycleElapsed / cycleLength);
  const phaseTime = cycleElapsed % cycleLength;
  const poiIds = routines[agent.agentId] ?? ["water"];
  const poi = map.pois.find((item) => item.id === poiIds[cycleIndex % poiIds.length]);
  if (!poi) return seated;

  const route = routeFor(map, station, poi);
  const routeDistance = route.slice(1).reduce((sum, point, routeIndex) => sum + distance(route[routeIndex]!, point), 0);
  const travelDuration = Math.max(3, routeDistance / 3.1);
  const deskDuration = agent.status === "waiting_dependency" ? 10 : 20;
  const outboundEnd = deskDuration + travelDuration;
  const interactionEnd = outboundEnd + poi.duration;
  const returnEnd = interactionEnd + travelDuration;
  if (phaseTime < deskDuration || phaseTime >= returnEnd) return seated;
  if (phaseTime < outboundEnd) return samplePath(route, (phaseTime - deskDuration) / travelDuration);
  if (phaseTime < interactionEnd) {
    return { position: poi.point, state: interactionState(poi), seated: false, activityLabel: poi.label };
  }
  return samplePath([...route].reverse(), (phaseTime - interactionEnd) / travelDuration);
}

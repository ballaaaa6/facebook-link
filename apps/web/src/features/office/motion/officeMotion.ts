import type { OfficeAgentView, OfficeMode } from "@affiliate-ops/contracts";
import type {
  AgentPresentation,
  OfficeMapDefinition,
  OfficePoint,
  OfficePoi,
  OfficeWorkstation,
} from "../officeTypes";

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

interface RoutineWindow {
  key: string;
  index: number;
  agent: OfficeAgentView;
  station: OfficeWorkstation;
  poi: OfficePoi;
  cycleIndex: number;
  cycleStart: number;
  outboundStart: number;
  interactionStart: number;
  interactionEnd: number;
  returnEnd: number;
  route: OfficePoint[];
}

interface Allocation {
  accepted: boolean;
  slotIndex: number;
}

const allocationCache = new WeakMap<
  OfficeMapDefinition,
  Map<string, Map<string, Allocation>>
>();

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

function routeFor(
  map: OfficeMapDefinition,
  station: OfficeWorkstation,
  poi: OfficePoi,
  destination: OfficePoint = poi.point,
) {
  const nodePath = findNodePath(map, station.navNode, poi.navNode);
  const deskSideExit = { x: station.approach.x, y: station.stand.y };
  const points = [station.work, station.stand, deskSideExit, station.approach, ...nodePath, poi.point];
  if (distance(poi.point, destination) > 0.05) {
    points.push({ x: destination.x, y: poi.point.y }, destination);
  }
  return points.filter((point, index) => index === 0 || distance(point, points[index - 1]!) > 0.05);
}

function deskState(agent: OfficeAgentView): AgentPresentation["state"] {
  if (agent.status === "completed") return "celebrating";
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

function interactionIsSeated(poi: OfficePoi) {
  return poi.activity === "lounge" || poi.activity === "meeting";
}

function workstationPresentation(agent: OfficeAgentView, station: OfficeWorkstation): AgentPresentation {
  return { position: station.work, state: deskState(agent), seated: false };
}

function cycleLength(agent: OfficeAgentView) {
  return agent.status === "waiting_dependency" ? 50 : 66;
}

function windowForCycle(
  cycleIndex: number,
  index: number,
  agent: OfficeAgentView,
  map: OfficeMapDefinition,
  station: OfficeWorkstation,
): RoutineWindow | undefined {
  if (cycleIndex < 0) return undefined;
  const warmup = 5 + index * 1.25;
  const length = cycleLength(agent);
  const cycleStart = warmup + cycleIndex * length;
  const poiIds = routines[agent.agentId] ?? ["water"];
  const poi = map.pois.find((item) => item.id === poiIds[cycleIndex % poiIds.length]);
  if (!poi) return undefined;
  const route = routeFor(map, station, poi);
  const routeDistance = route.slice(1).reduce(
    (sum, point, routeIndex) => sum + distance(route[routeIndex]!, point),
    0,
  );
  const travelDuration = Math.max(3, routeDistance / 3.1);
  const deskDuration = agent.status === "waiting_dependency" ? 10 : 20;
  const outboundStart = cycleStart + deskDuration;
  const interactionStart = outboundStart + travelDuration;
  const interactionEnd = interactionStart + poi.duration;
  return {
    key: `${agent.agentId}:${cycleIndex}`,
    index,
    agent,
    station,
    poi,
    cycleIndex,
    cycleStart,
    outboundStart,
    interactionStart,
    interactionEnd,
    returnEnd: interactionEnd + travelDuration,
    route,
  };
}

function nearbyWindows(
  elapsedSeconds: number,
  agents: readonly OfficeAgentView[],
  map: OfficeMapDefinition,
) {
  return agents.flatMap((agent, index) => {
    const station = map.workstations.find((item) => item.id === agent.agentId);
    if (!station) return [];
    const warmup = 5 + index * 1.25;
    const currentCycle = Math.floor((elapsedSeconds - warmup) / cycleLength(agent));
    return [currentCycle - 1, currentCycle]
      .map((cycle) => windowForCycle(cycle, index, agent, map, station))
      .filter((window): window is RoutineWindow => Boolean(window));
  });
}

function intervalsOverlap(a: RoutineWindow, b: RoutineWindow) {
  return a.outboundStart < b.interactionEnd && b.outboundStart < a.interactionEnd;
}

function trafficConflict(
  candidate: RoutineWindow,
  candidateAllocation: Allocation,
  acceptedWindow: RoutineWindow,
  acceptedAllocation: Allocation,
  map: OfficeMapDefinition,
) {
  const start = Math.max(candidate.outboundStart, acceptedWindow.outboundStart);
  const end = Math.min(candidate.returnEnd, acceptedWindow.returnEnd);
  if (start >= end) return false;
  const candidateDestination = candidate.poi.slots?.[candidateAllocation.slotIndex] ?? candidate.poi.point;
  const acceptedDestination = acceptedWindow.poi.slots?.[acceptedAllocation.slotIndex] ?? acceptedWindow.poi.point;
  const candidateRoute = routeFor(map, candidate.station, candidate.poi, candidateDestination);
  const acceptedRoute = routeFor(map, acceptedWindow.station, acceptedWindow.poi, acceptedDestination);
  const candidateReturnRoute = [...candidateRoute].reverse();
  const acceptedReturnRoute = [...acceptedRoute].reverse();
  const activePosition = (
    window: RoutineWindow,
    route: OfficePoint[],
    returnRoute: OfficePoint[],
    elapsed: number,
  ) => {
    if (elapsed < window.interactionStart) {
      return samplePath(
        route,
        (elapsed - window.outboundStart) / (window.interactionStart - window.outboundStart),
      ).position;
    }
    if (elapsed < window.interactionEnd) return route.at(-1) ?? window.poi.point;
    return samplePath(
      returnRoute,
      (elapsed - window.interactionEnd) / (window.returnEnd - window.interactionEnd),
    ).position;
  };
  for (let elapsed = start; elapsed <= end; elapsed += 0.1) {
    const candidatePosition = activePosition(candidate, candidateRoute, candidateReturnRoute, elapsed);
    const acceptedPosition = activePosition(acceptedWindow, acceptedRoute, acceptedReturnRoute, elapsed);
    if (distance(candidatePosition, acceptedPosition) < 0.4) return true;
  }
  return false;
}

function allocateFacilities(windows: RoutineWindow[], map: OfficeMapDefinition) {
  const allocations = new Map<string, Allocation>();
  const accepted: Array<{ window: RoutineWindow; allocation: Allocation }> = [];
  const sorted = [...windows].sort(
    (a, b) => a.outboundStart - b.outboundStart || a.index - b.index || a.cycleIndex - b.cycleIndex,
  );
  for (const window of sorted) {
    const usedSlots = new Set(
      accepted
        .filter(({ window: candidate }) => candidate.poi.id === window.poi.id && intervalsOverlap(candidate, window))
        .map(({ allocation }) => allocation.slotIndex),
    );
    const slotIndex = Array.from({ length: window.poi.capacity }, (_, index) => index)
      .find((index) => !usedSlots.has(index));
    if (slotIndex === undefined) {
      allocations.set(window.key, { accepted: false, slotIndex: -1 });
      continue;
    }
    const allocation = { accepted: true, slotIndex };
    const blocked = accepted.some(({ window: acceptedWindow, allocation: acceptedAllocation }) =>
      trafficConflict(window, allocation, acceptedWindow, acceptedAllocation, map));
    if (blocked) {
      allocations.set(window.key, { accepted: false, slotIndex: -1 });
      continue;
    }
    accepted.push({ window, allocation });
    allocations.set(window.key, allocation);
  }
  return allocations;
}

function cachedAllocations(windows: RoutineWindow[], map: OfficeMapDefinition) {
  const key = windows
    .map((window) =>
      `${window.key}:${window.outboundStart}:${window.interactionEnd}:${window.returnEnd}`)
    .sort()
    .join("|");
  const mapCache = allocationCache.get(map) ?? new Map<string, Map<string, Allocation>>();
  const cached = mapCache.get(key);
  if (cached) return cached;
  const allocations = allocateFacilities(windows, map);
  mapCache.set(key, allocations);
  if (mapCache.size > 64) mapCache.delete(mapCache.keys().next().value!);
  allocationCache.set(map, mapCache);
  return allocations;
}

function presentationForWindow(
  elapsedSeconds: number,
  window: RoutineWindow,
  allocation: Allocation | undefined,
  map: OfficeMapDefinition,
): AgentPresentation {
  const workstation = workstationPresentation(window.agent, window.station);
  if (elapsedSeconds < window.outboundStart || elapsedSeconds >= window.returnEnd) return workstation;
  if (!allocation?.accepted) {
    return {
      ...workstation,
      state: "waiting",
      activityLabel: `Waiting — ${window.poi.label}`,
    };
  }
  const destination = window.poi.slots?.[allocation.slotIndex] ?? window.poi.point;
  const route = routeFor(map, window.station, window.poi, destination);
  const travelDuration = window.interactionStart - window.outboundStart;
  if (elapsedSeconds < window.interactionStart) {
    return samplePath(route, (elapsedSeconds - window.outboundStart) / travelDuration);
  }
  if (elapsedSeconds < window.interactionEnd) {
    return {
      position: destination,
      state: interactionState(window.poi),
      seated: interactionIsSeated(window.poi),
      activityLabel: window.poi.label,
    };
  }
  return samplePath([...route].reverse(), (elapsedSeconds - window.interactionEnd) / travelDuration);
}

export function presentationsAt(
  elapsedSeconds: number,
  agents: readonly OfficeAgentView[],
  mode: OfficeMode,
  map: OfficeMapDefinition,
) {
  const presentations = new Map<string, AgentPresentation>();
  if (mode === "live") {
    for (const agent of agents) {
      const station = map.workstations.find((item) => item.id === agent.agentId);
      if (station) presentations.set(agent.agentId, workstationPresentation(agent, station));
    }
    return presentations;
  }

  const windows = nearbyWindows(elapsedSeconds, agents, map);
  const allocations = cachedAllocations(windows, map);
  for (const [index, agent] of agents.entries()) {
    const station = map.workstations.find((item) => item.id === agent.agentId);
    if (!station) continue;
    const warmup = 5 + index * 1.25;
    if (elapsedSeconds < warmup) {
      presentations.set(agent.agentId, workstationPresentation(agent, station));
      continue;
    }
    const currentCycle = Math.floor((elapsedSeconds - warmup) / cycleLength(agent));
    const window = windows.find((item) => item.agent.agentId === agent.agentId && item.cycleIndex === currentCycle);
    presentations.set(
      agent.agentId,
      window
        ? presentationForWindow(elapsedSeconds, window, allocations.get(window.key), map)
        : workstationPresentation(agent, station),
    );
  }
  return presentations;
}

export function presentationAt(
  elapsedSeconds: number,
  index: number,
  agent: OfficeAgentView,
  mode: OfficeMode,
  map: OfficeMapDefinition,
  station: OfficeWorkstation,
): AgentPresentation {
  const agents = Array.from({ length: index }, (_, placeholderIndex) => ({
    ...agent,
    agentId: `placeholder-${placeholderIndex}`,
  }));
  agents.push(agent);
  const workstations = [
    ...Array.from({ length: index }, (_, placeholderIndex) => ({
      ...station,
      id: `placeholder-${placeholderIndex}`,
    })),
    station,
  ];
  return presentationsAt(elapsedSeconds, agents, mode, { ...map, workstations }).get(agent.agentId)
    ?? workstationPresentation(agent, station);
}

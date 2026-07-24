import assert from "node:assert/strict";
import test from "node:test";
import type { OfficeAgentView } from "@affiliate-ops/contracts";
import { presentationAt } from "../src/features/office/motion/officeMotion.ts";
import type { OfficeMapDefinition, OfficeWorkstation } from "../src/features/office/officeTypes.ts";

const station: OfficeWorkstation = {
  id: "market-scout",
  zone: "research",
  desk: "desk",
  chair: "chair",
  x: 0,
  y: 0,
  facing: "up",
  seat: { x: 0, y: 0 },
  approach: { x: 1, y: 0 },
  stand: { x: 1, y: 1 },
  navNode: "start",
  collision: { x: 0, y: 0, width: 1, height: 1 },
};

const map: OfficeMapDefinition = {
  width: 12,
  height: 6,
  zones: [],
  workstations: [station],
  pois: [{ id: "water", activity: "water", point: { x: 11, y: 0 }, navNode: "end", capacity: 1, duration: 2, label: "Water" }],
  routes: [],
  navigation: {
    nodes: [{ id: "start", x: 1, y: 0 }, { id: "end", x: 10, y: 0 }],
    edges: [["start", "end"]],
  },
};

const agent: OfficeAgentView = {
  agentId: "market-scout",
  displayName: "Market Scout",
  role: "Discover candidates",
  status: "running",
  statusReason: "working",
  currentTask: "Scanning",
  progress: { kind: "indeterminate" },
  activity: "research",
  attempt: 1,
  updatedAt: "2026-07-24T00:00:00.000Z",
  lastHeartbeatAt: "2026-07-24T00:00:00.000Z",
  requiresHuman: false,
  latestEvents: [],
};

test("live mode remains at the workstation", () => {
  const presentation = presentationAt(30, 0, agent, "live", map, station);
  assert.deepEqual(presentation.position, station.seat);
  assert.equal(presentation.seated, true);
});

test("simulation movement is continuous between display frames", () => {
  const first = presentationAt(25.1, 0, agent, "simulation", map, station);
  const second = presentationAt(25.116, 0, agent, "simulation", map, station);
  assert.equal(first.seated, false);
  assert.equal(second.seated, false);
  assert.ok(second.position.x > first.position.x);
  assert.ok(second.position.x - first.position.x < 0.1);
});

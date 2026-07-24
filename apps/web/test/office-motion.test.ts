import assert from "node:assert/strict";
import test from "node:test";
import type { OfficeAgentView } from "@affiliate-ops/contracts";
import { createDemoOfficeSnapshot } from "@affiliate-ops/office-read-model";
import officeMapJson from "../../../assets/game/maps/office-c-v1.json" with { type: "json" };
import { presentationAt, presentationsAt } from "../src/features/office/motion/officeMotion.ts";
import { pixelAlignedCharacterFrame } from "../src/features/office/motion/pixelGeometry.ts";
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
  objects: [],
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

test("a capacity-one facility never admits two agents", () => {
  const secondAgent = { ...agent, agentId: "unmapped-agent", displayName: "Second" };
  const secondStation = { ...station, id: secondAgent.agentId };
  const sceneMap = { ...map, workstations: [station, secondStation] };
  const presentations = presentationsAt(30, [agent, secondAgent], "simulation", sceneMap);
  assert.equal(presentations.get(agent.agentId)?.seated, false);
  assert.equal(presentations.get(secondAgent.agentId)?.seated, true);
  assert.match(presentations.get(secondAgent.agentId)?.activityLabel ?? "", /Waiting — Water/i);
});

test("character frames stay aligned to physical pixels", () => {
  assert.deepEqual(pixelAlignedCharacterFrame(680, 1), { width: 52, height: 56 });
  assert.deepEqual(pixelAlignedCharacterFrame(680, 2), { width: 51, height: 55 });
  assert.deepEqual(pixelAlignedCharacterFrame(1_280, 1), { width: 96, height: 104 });
  assert.deepEqual(pixelAlignedCharacterFrame(1_280, 2), { width: 96, height: 104 });
});

test("the real scene respects every facility capacity over repeated cycles", () => {
  const sceneMap = officeMapJson as unknown as OfficeMapDefinition;
  const sceneAgents = createDemoOfficeSnapshot().agents;
  for (let elapsed = 0; elapsed <= 300; elapsed += 0.25) {
    const presentations = presentationsAt(elapsed, sceneAgents, "simulation", sceneMap);
    for (const poi of sceneMap.pois) {
      const active = [...presentations.values()]
        .filter((presentation) => presentation.activityLabel === poi.label);
      assert.ok(active.length <= poi.capacity, `${poi.id} exceeded capacity at ${elapsed}s`);
      const positions = new Set(active.map(({ position }) => `${position.x}:${position.y}`));
      assert.equal(positions.size, active.length, `${poi.id} reused a slot at ${elapsed}s`);
    }
  }
});

test("the real scene does not place two moving agents in the same route cell", () => {
  const sceneMap = officeMapJson as unknown as OfficeMapDefinition;
  const sceneAgents = createDemoOfficeSnapshot().agents;
  for (let elapsed = 0; elapsed <= 300; elapsed += 0.25) {
    const moving = [...presentationsAt(elapsed, sceneAgents, "simulation", sceneMap).entries()]
      .filter(([, presentation]) => !presentation.seated);
    for (let left = 0; left < moving.length; left += 1) {
      for (let right = left + 1; right < moving.length; right += 1) {
        const [leftId, a] = moving[left]!;
        const [rightId, b] = moving[right]!;
        const separation = Math.hypot(a.position.x - b.position.x, a.position.y - b.position.y);
        assert.ok(separation >= 0.4, `${leftId} collided with ${rightId} at ${elapsed}s`);
      }
    }
  }
});

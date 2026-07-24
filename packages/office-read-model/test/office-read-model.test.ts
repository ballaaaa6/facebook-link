import assert from "node:assert/strict";
import test from "node:test";
import { createDemoOfficeSnapshot, projectAgent } from "../src/index.ts";

test("clamps determinate progress", () => {
  const agent = projectAgent({
    agentId: "market-scout",
    status: "running",
    statusReason: "working",
    currentTask: "Scanning",
    activity: "research",
    progress: 140,
    updatedAt: "2026-07-24T00:00:00.000Z",
  });
  assert.deepEqual(agent.progress, { kind: "determinate", value: 100 });
});

test("creates a complete deterministic pilot office", () => {
  const snapshot = createDemoOfficeSnapshot(new Date("2026-07-24T00:00:00.000Z"));
  assert.equal(snapshot.agents.length, 10);
  assert.equal(snapshot.mode, "simulation");
  assert.equal(snapshot.pendingReviews, 3);
  assert.equal(snapshot.agents.find((agent) => agent.agentId === "qa-editor")?.status, "waiting_human");
});

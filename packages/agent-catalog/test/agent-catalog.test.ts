import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { agentCatalog, getAgent } from "../src/index.ts";

interface AgentRuntimeConfig {
  agents: Array<{ id: string; enabled: boolean }>;
}

const runtimeConfig = JSON.parse(
  readFileSync(new URL("../../../config/agents.json", import.meta.url), "utf8"),
) as AgentRuntimeConfig;

test("catalog and runtime configuration contain the same ten unique roles", () => {
  const catalogIds = agentCatalog.map((agent) => agent.id);
  const configIds = runtimeConfig.agents.map((agent) => agent.id);
  assert.equal(agentCatalog.length, 10);
  assert.equal(new Set(catalogIds).size, 10);
  assert.equal(new Set(configIds).size, 10);
  assert.deepEqual([...catalogIds].sort(), [...configIds].sort());
  assert.equal(runtimeConfig.agents.filter((agent) => agent.enabled).length, 6);
  assert.equal(runtimeConfig.agents.filter((agent) => !agent.enabled).length, 4);
});

test("Product Ranker owns ranking evidence but not winner selection", () => {
  const ranker = getAgent("product-ranker");
  assert.ok(ranker);
  assert.deepEqual(ranker.produces, ["ranked-product-evidence"]);
  assert.equal(ranker.produces.includes("selected-product"), false);
  assert.equal(ranker.responsibility.includes("select"), false);
});

test("Growth Strategist alone produces the winner decision and selected product", () => {
  const strategist = getAgent("growth-strategist");
  assert.ok(strategist);
  assert.equal(strategist.consumes.includes("ranked-product-evidence"), true);
  assert.equal(strategist.produces.includes("winner-decision"), true);
  assert.equal(strategist.produces.includes("selected-product"), true);
  assert.equal(strategist.produces.includes("strategy-version-reference"), true);
  assert.equal(strategist.requiresHumanReview, true);
  assert.deepEqual(
    agentCatalog.filter((agent) => agent.produces.includes("winner-decision")).map((agent) => agent.id),
    ["growth-strategist"],
  );
});

test("copy and visual artifacts have distinct content owners", () => {
  assert.deepEqual(getAgent("gemini-copywriter")?.produces, ["caption-draft"]);
  assert.deepEqual(getAgent("flow-visual-producer")?.produces, ["visual-assets"]);
});

test("system facilities and the coordinator are not agent roles", () => {
  assert.equal(getAgent("workflow-coordinator"), undefined);
  assert.equal(getAgent("team-brain"), undefined);
  assert.equal(runtimeConfig.agents.some((agent) => agent.id === "workflow-coordinator"), false);
  assert.equal(runtimeConfig.agents.some((agent) => agent.id === "team-brain"), false);
});

test("Session Keeper owns session health rather than workflow-stage failures", () => {
  const sessionKeeper = getAgent("session-keeper");
  assert.ok(sessionKeeper);
  assert.deepEqual(sessionKeeper.consumes, ["session-health"]);
  assert.deepEqual(sessionKeeper.produces, ["session-state"]);
});

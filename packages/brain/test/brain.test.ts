import assert from "node:assert/strict";
import test from "node:test";
import { MockBrainProvider } from "../src/index.ts";

const baseRequest = {
  workspaceId: "pilot",
  conversationId: "conversation-1",
  recentMessages: [],
};

test("routes metric questions to the performance analyst", async () => {
  const response = await new MockBrainProvider().respond({ ...baseRequest, message: "ช่วยดูยอดวัดผลวันนี้" });
  assert.equal(response.agentId, "performance-analyst");
  assert.equal(response.type, "answer");
});

test("turns publishing requests into confirmation proposals", async () => {
  const response = await new MockBrainProvider().respond({ ...baseRequest, message: "schedule this post" });
  assert.equal(response.type, "action_proposal");
  if (response.type === "action_proposal") {
    assert.equal(response.proposal.requiresConfirmation, true);
    assert.equal(response.proposal.arguments.simulationOnly, true);
  }
});

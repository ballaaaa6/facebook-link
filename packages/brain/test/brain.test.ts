import assert from "node:assert/strict";
import test from "node:test";
import { MockBrainProvider, WorkersAiBrainProvider } from "../src/index.ts";

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

test("uses Workers AI while preserving deterministic agent routing", async () => {
  const calls: { model: string; input: unknown }[] = [];
  const provider = new WorkersAiBrainProvider({
    runner: {
      async run(model, input) {
        calls.push({ model, input });
        return { response: "ยอดคลิกควรเทียบตามช่วงเวลาและ Sub ID ก่อนสรุปผู้ชนะ" };
      },
    },
  });
  const response = await provider.respond({ ...baseRequest, message: "ช่วยวิเคราะห์ยอดคลิกวันนี้" });
  assert.equal(response.agentId, "performance-analyst");
  assert.equal(response.type, "answer");
  assert.match(response.message, /Sub ID/);
  assert.equal(calls.length, 1);
});

test("Workers AI cannot bypass confirmation for external actions", async () => {
  const provider = new WorkersAiBrainProvider({
    runner: { async run() { return { response: "จัดแผนโพสต์ให้แล้ว กรุณาตรวจสอบก่อนยืนยัน" }; } },
  });
  const response = await provider.respond({ ...baseRequest, message: "ตั้งเวลาโพสต์นี้ตอนสองทุ่ม" });
  assert.equal(response.type, "action_proposal");
  if (response.type === "action_proposal") {
    assert.equal(response.proposal.requiresConfirmation, true);
    assert.equal(response.proposal.status, "proposed");
    assert.equal(response.proposal.arguments.simulationOnly, true);
  }
});

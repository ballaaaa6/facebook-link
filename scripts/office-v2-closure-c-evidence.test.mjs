import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  createContentJoinState,
  recordContentBranchCompletion,
} from "../packages/workflows/src/index.ts";
import {
  createOfficeSchemaValidator,
} from "./office-v2-knowledge-check.mjs";
import { defaultKnowledgeRoot } from "./office-v2-knowledge-evidence.mjs";

const fixture = JSON.parse(readFileSync(join(defaultKnowledgeRoot, "fixtures", "operations-closure-c.json"), "utf8"));
const ajv = createOfficeSchemaValidator({ knowledgeRoot: defaultKnowledgeRoot });

test("Closure C schemas validate the snapshot, routing, and roster split", () => {
  assert.equal(ajv.getSchema("https://affiliate-operations.example/schemas/office-v2/operations-snapshot-v2.schema.json")(fixture.snapshots[0]), true);
  assert.equal(ajv.getSchema("https://affiliate-operations.example/schemas/office-v2/activity-routing.schema.json")(fixture.routing), true);
  assert.equal(ajv.getSchema("https://affiliate-operations.example/schemas/office-v2/roster-binding.schema.json")(fixture.roster), true);
  assert.equal(Object.hasOwn(fixture.snapshots[0], "characterDefinition"), false);
  assert.equal(Object.hasOwn(fixture.snapshots[0], "homeFacility"), false);
});

test("content_ready requires both current branches and has one system owner", () => {
  const identity = {
    workspaceId: "workspace-one",
    workflowId: "workflow-one",
    contentGroupId: "content-group-one",
    traceId: "trace-one",
  };
  const copy = completion("copy", "copy-completion-1", "copy-job", 1, "2026-08-02T00:00:01.000Z");
  const visual = completion("visual", "visual-completion-1", "visual-job", 1, "2026-08-02T00:00:02.000Z");
  const pending = recordContentBranchCompletion(createContentJoinState(identity), copy);
  assert.equal(pending.event, undefined);
  const joined = recordContentBranchCompletion(pending.state, visual);
  assert.equal(joined.event?.stage, "content_ready");
  assert.equal(joined.event?.actorType, "system");
  assert.equal(joined.event?.actorId, "workflow-coordinator");
  assert.equal(joined.event?.occurredAt, "2026-08-02T00:00:02.000Z");
});

test("copy-first and visual-first arrivals produce the same join event", () => {
  const identity = {
    workspaceId: "workspace-one",
    workflowId: "workflow-one",
    contentGroupId: "content-group-order",
    traceId: "trace-order",
  };
  const copy = completion("copy", "copy-order", "copy-job", 1, "2026-08-02T00:00:01.000Z", identity.contentGroupId, identity.traceId);
  const visual = completion("visual", "visual-order", "visual-job", 1, "2026-08-02T00:00:02.000Z", identity.contentGroupId, identity.traceId);
  const copyFirst = recordContentBranchCompletion(recordContentBranchCompletion(createContentJoinState(identity), copy).state, visual);
  const visualFirst = recordContentBranchCompletion(recordContentBranchCompletion(createContentJoinState(identity), visual).state, copy);
  assert.deepEqual(copyFirst.event, visualFirst.event);
  assert.deepEqual(copyFirst.state, visualFirst.state);
});

test("duplicate and stale branch completions stay idempotent or fail closed", () => {
  const identity = {
    workspaceId: "workspace-one",
    workflowId: "workflow-one",
    contentGroupId: "content-group-retry",
    traceId: "trace-retry",
  };
  const first = completion("copy", "copy-retry-1", "copy-job", 1, "2026-08-02T00:00:01.000Z", identity.contentGroupId, identity.traceId);
  const accepted = recordContentBranchCompletion(createContentJoinState(identity), first);
  const duplicate = recordContentBranchCompletion(accepted.state, first);
  assert.strictEqual(duplicate.state, accepted.state);
  const retry = completion("copy", "copy-retry-2", "copy-job", 2, "2026-08-02T00:00:03.000Z", identity.contentGroupId, identity.traceId);
  const retried = recordContentBranchCompletion(accepted.state, retry);
  assert.throws(() => recordContentBranchCompletion(retried.state, first), /superseded/);
});

function completion(branch, id, jobId, attempt, completedAt, contentGroupId = "content-group-one", traceId = "trace-one") {
  return {
    id,
    jobId,
    workspaceId: "workspace-one",
    workflowId: "workflow-one",
    contentGroupId,
    branch,
    attempt,
    artifactVersion: attempt,
    completedAt,
    traceId,
  };
}

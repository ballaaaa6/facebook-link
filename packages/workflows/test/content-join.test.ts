import assert from "node:assert/strict";
import test from "node:test";
import type { ContentBranchCompletion } from "@affiliate-ops/contracts";
import {
  createContentJoinState,
  recordContentBranchCompletion,
  WorkflowInvariantError,
} from "../src/index.ts";

const joinIdentity = {
  workspaceId: "workspace-one",
  workflowId: "workflow-one",
  contentGroupId: "content-group-one",
  traceId: "trace-one",
} as const;

test("one completed branch does not emit content_ready", () => {
  const update = recordContentBranchCompletion(createContentJoinState(joinIdentity), completion());
  assert.equal(update.event, undefined);
  assert.equal(update.state.completions.copy?.id, "copy-completion-1");
  assert.equal(update.state.completions.visual, null);
});

test("an exact duplicate completion is a no-op", () => {
  const value = completion();
  const accepted = recordContentBranchCompletion(createContentJoinState(joinIdentity), value);
  const duplicate = recordContentBranchCompletion(accepted.state, value);
  assert.strictEqual(duplicate.state, accepted.state);
  assert.equal(duplicate.event, undefined);
});

test("a reused completion ID with a changed payload fails before scope checks", () => {
  const value = completion();
  const accepted = recordContentBranchCompletion(createContentJoinState(joinIdentity), value);
  assert.throws(
    () =>
      recordContentBranchCompletion(accepted.state, {
        ...value,
        contentGroupId: "wrong-group",
        artifactVersion: 2,
      }),
    hasCode("workflow.content-completion-id-conflict"),
  );
});

test("a higher pending attempt replaces its branch artifact", () => {
  const firstCompletion = completion();
  const attemptOne = recordContentBranchCompletion(createContentJoinState(joinIdentity), firstCompletion);
  const attemptTwo = recordContentBranchCompletion(
    attemptOne.state,
    completion({ id: "copy-completion-2", attempt: 2, artifactVersion: 2 }),
  );
  assert.throws(
    () => recordContentBranchCompletion(attemptTwo.state, firstCompletion),
    hasCode("workflow.content-stale-attempt"),
  );
  const joined = recordContentBranchCompletion(attemptTwo.state, visualCompletion());
  assert.equal(joined.state.completions.copy?.attempt, 2);
  assert.equal(joined.event?.payload.copy.artifactVersion, 2);
  assert.deepEqual(
    joined.state.seenCompletions.map((item) => item.id),
    ["copy-completion-1", "copy-completion-2", "visual-completion-1"],
  );
});

test("an unseen stale attempt and a conflicting same attempt fail", () => {
  const current = recordContentBranchCompletion(
    createContentJoinState(joinIdentity),
    completion({ id: "copy-completion-2", attempt: 2, artifactVersion: 2 }),
  );
  assert.throws(
    () => recordContentBranchCompletion(current.state, completion()),
    hasCode("workflow.content-stale-attempt"),
  );
  assert.throws(
    () =>
      recordContentBranchCompletion(
        current.state,
        completion({ id: "copy-completion-2b", attempt: 2, artifactVersion: 3 }),
      ),
    hasCode("workflow.content-attempt-conflict"),
  );
});

test("wrong content group and workflow scope fail with stable diagnostics", () => {
  const state = createContentJoinState(joinIdentity);
  assert.throws(
    () => recordContentBranchCompletion(state, completion({ id: "wrong-group", contentGroupId: "other" })),
    hasCode("workflow.content-group-mismatch"),
  );
  assert.throws(
    () => recordContentBranchCompletion(state, completion({ id: "wrong-scope", workflowId: "other" })),
    hasCode("workflow.content-scope-mismatch"),
  );
});

test("copy and visual arrival order produces identical state and event", () => {
  const copy = completion();
  const visual = visualCompletion();

  const copyFirst = recordContentBranchCompletion(createContentJoinState(joinIdentity), copy);
  const copyThenVisual = recordContentBranchCompletion(copyFirst.state, visual);

  const visualFirst = recordContentBranchCompletion(createContentJoinState(joinIdentity), visual);
  const visualThenCopy = recordContentBranchCompletion(visualFirst.state, copy);

  assert.deepEqual(copyThenVisual.state, visualThenCopy.state);
  assert.deepEqual(copyThenVisual.event, visualThenCopy.event);
  assert.equal(copyThenVisual.event?.actorType, "system");
  assert.equal(copyThenVisual.event?.actorId, "workflow-coordinator");
  assert.equal(copyThenVisual.event?.stage, "content_ready");
  assert.equal(copyThenVisual.event?.occurredAt, "2026-08-01T00:00:02.000Z");
});

test("the join emits once and rework requires a fresh content group", () => {
  const first = recordContentBranchCompletion(createContentJoinState(joinIdentity), completion());
  const joined = recordContentBranchCompletion(first.state, visualCompletion());
  assert.ok(joined.event);

  const duplicate = recordContentBranchCompletion(joined.state, visualCompletion());
  assert.strictEqual(duplicate.state, joined.state);
  assert.equal(duplicate.event, undefined);
  assert.throws(
    () =>
      recordContentBranchCompletion(
        joined.state,
        completion({ id: "copy-completion-2", attempt: 2, artifactVersion: 2 }),
      ),
    hasCode("workflow.content-group-closed"),
  );

  const freshIdentity = { ...joinIdentity, contentGroupId: "content-group-two" };
  const freshCopy = recordContentBranchCompletion(
    createContentJoinState(freshIdentity),
    completion({ id: "copy-fresh", contentGroupId: freshIdentity.contentGroupId }),
  );
  const freshJoin = recordContentBranchCompletion(
    freshCopy.state,
    visualCompletion({ id: "visual-fresh", contentGroupId: freshIdentity.contentGroupId }),
  );
  assert.ok(freshJoin.event);
  assert.notEqual(freshJoin.event.id, joined.event?.id);
});

test("attempts, artifact versions, and timestamps are validated", () => {
  const state = createContentJoinState(joinIdentity);
  assert.throws(
    () =>
      recordContentBranchCompletion(state, {
        ...completion(),
        id: 42 as unknown as string,
      }),
    hasCode("workflow.content-completion-invalid"),
  );
  assert.throws(
    () => recordContentBranchCompletion(state, completion({ attempt: 0 })),
    hasCode("workflow.content-completion-invalid"),
  );
  assert.throws(
    () => recordContentBranchCompletion(state, completion({ artifactVersion: 0 })),
    hasCode("workflow.content-completion-invalid"),
  );
  assert.throws(
    () => recordContentBranchCompletion(state, completion({ completedAt: "not-a-date" })),
    hasCode("workflow.content-completion-invalid"),
  );
});

function completion(overrides: Partial<ContentBranchCompletion> = {}): ContentBranchCompletion {
  return {
    id: "copy-completion-1",
    jobId: "copy-job",
    workspaceId: joinIdentity.workspaceId,
    workflowId: joinIdentity.workflowId,
    contentGroupId: joinIdentity.contentGroupId,
    branch: "copy",
    attempt: 1,
    artifactVersion: 1,
    completedAt: "2026-08-01T00:00:02.000Z",
    traceId: joinIdentity.traceId,
    ...overrides,
  };
}

function visualCompletion(overrides: Partial<ContentBranchCompletion> = {}): ContentBranchCompletion {
  return completion({
    id: "visual-completion-1",
    jobId: "visual-job",
    branch: "visual",
    completedAt: "2026-08-01T00:00:01.000Z",
    ...overrides,
  });
}

function hasCode(code: WorkflowInvariantError["code"]): (error: unknown) => boolean {
  return (error) => error instanceof WorkflowInvariantError && error.code === code;
}

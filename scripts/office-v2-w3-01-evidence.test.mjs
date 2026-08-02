import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { openLocalDatabase } from "../packages/database/src/index.ts";
import { agentCatalog, getAgent } from "../packages/agent-catalog/src/index.ts";
import {
  bindRoster,
  canProposeInteraction,
  inspectOperationsSnapshot,
} from "../packages/office-v2-operations/src/index.ts";
import {
  assertContentBranchOwner,
  assertTransition,
  assertWorkflowEventOwnership,
  canTransition,
  createContentJoinState,
  getContentBranchOwnerId,
  nextStages,
  rankingEvidenceOwnerId,
  recordContentBranchCompletion,
  winnerSelectionOwnerId,
} from "../packages/workflows/src/index.ts";
import {
  persistPilotSimulation,
  simulatePilotRun,
} from "../services/automation-runner/src/index.ts";

const runtimeConfig = readJson("../config/agents.json");
const operationsFixture = readJson("../docs/office-v2/fixtures/operations-closure-c.json");
const migrationsPath = resolve(import.meta.dirname, "../packages/database/migrations");

test("P3-W3.1 workflow ownership and content join remain source-owned", () => {
  assert.equal(rankingEvidenceOwnerId, "product-ranker", "Product Ranker must own ranking evidence.");
  assert.equal(winnerSelectionOwnerId, "growth-strategist", "Growth Strategist must own winner selection.");

  const ranker = getAgent("product-ranker");
  assert.ok(ranker, "Product Ranker must remain in the agent catalog.");
  assert.deepEqual(ranker.produces, ["ranked-product-evidence"], "Product Ranker must produce ranking evidence only.");
  assert.equal(ranker.produces.includes("selected-product"), false, "Product Ranker must not produce the selected winner.");
  assert.deepEqual(
    agentCatalog.filter((agent) => agent.produces.includes("ranked-product-evidence")).map((agent) => agent.id),
    [rankingEvidenceOwnerId],
    "Product Ranker must be the sole ranking-evidence producer.",
  );

  const strategist = getAgent("growth-strategist");
  assert.ok(strategist, "Growth Strategist must remain in the agent catalog.");
  assert.equal(strategist.consumes.includes("ranked-product-evidence"), true, "Growth Strategist must consume ranking evidence.");
  assert.equal(strategist.produces.includes("selected-product"), true, "Growth Strategist must produce the selected winner.");
  assert.equal(strategist.produces.includes("strategy-version-reference"), true, "Growth Strategist must reference the strategy version.");
  assert.deepEqual(
    agentCatalog.filter((agent) => agent.produces.includes("selected-product")).map((agent) => agent.id),
    [winnerSelectionOwnerId],
    "Growth Strategist must be the sole selected-product producer.",
  );
  assert.deepEqual(
    agentCatalog.filter((agent) => agent.produces.includes("strategy-version-reference")).map((agent) => agent.id),
    [winnerSelectionOwnerId],
    "Growth Strategist must be the sole strategy-version-reference producer.",
  );
  assert.deepEqual(
    agentCatalog.filter((agent) => agent.produces.includes("winner-decision")).map((agent) => agent.id),
    ["growth-strategist"],
    "Growth Strategist must be the sole winner-decision producer.",
  );

  assert.equal(getContentBranchOwnerId("copy"), "gemini-copywriter", "Gemini Copywriter must own the copy branch.");
  assert.equal(getContentBranchOwnerId("visual"), "flow-visual-producer", "Flow Visual Producer must own the visual branch.");
  assert.doesNotThrow(
    () => assertWorkflowEventOwnership(workflowEvent("scored", "agent", "product-ranker")),
    "Product Ranker must own scored events.",
  );
  assert.throws(
    () => assertWorkflowEventOwnership(workflowEvent("scored", "agent", "growth-strategist")),
    hasCode("workflow.event-owner-mismatch"),
    "A non-ranker must not own scored events.",
  );
  assert.doesNotThrow(
    () => assertWorkflowEventOwnership(workflowEvent("selected", "agent", "growth-strategist")),
    "Growth Strategist must own selected events.",
  );
  assert.throws(
    () => assertWorkflowEventOwnership(workflowEvent("selected", "agent", "product-ranker")),
    hasCode("workflow.event-owner-mismatch"),
    "Product Ranker must not own selected events.",
  );
  assert.doesNotThrow(
    () => assertContentBranchOwner("copy", "gemini-copywriter"),
    "The copy branch must accept its declared owner.",
  );
  assert.doesNotThrow(
    () => assertContentBranchOwner("visual", "flow-visual-producer"),
    "The visual branch must accept its declared owner.",
  );
  assert.throws(
    () => assertContentBranchOwner("visual", "gemini-copywriter"),
    hasCode("workflow.event-owner-mismatch"),
    "The copy owner must not complete the visual branch.",
  );

  assert.equal(canTransition("content_queued", "content_ready"), false, "content_ready must not be a direct workflow transition.");
  assert.equal(nextStages("content_queued").includes("content_ready"), false, "content_ready must be absent from ordinary next stages.");
  assert.throws(
    () => assertTransition("content_queued", "content_ready"),
    hasCode("workflow.content-ready-requires-join"),
    "Only the content join reducer may emit content_ready.",
  );

  const identity = {
    workspaceId: "workspace-w3-01",
    workflowId: "workflow-w3-01",
    contentGroupId: "content-group-w3-01",
    traceId: "trace-w3-01",
  };
  const copy = contentCompletion("copy", "copy-completion-w3-01", "copy-job-w3-01", "2026-08-02T00:00:01.000Z", identity);
  const visual = contentCompletion("visual", "visual-completion-w3-01", "visual-job-w3-01", "2026-08-02T00:00:02.000Z", identity);

  const copyPending = recordContentBranchCompletion(createContentJoinState(identity), copy);
  assert.equal(copyPending.event, undefined, "One completed branch must not emit content_ready.");
  const copyFirst = recordContentBranchCompletion(copyPending.state, visual);

  const visualPending = recordContentBranchCompletion(createContentJoinState(identity), visual);
  assert.equal(visualPending.event, undefined, "The visual branch alone must not emit content_ready.");
  const visualFirst = recordContentBranchCompletion(visualPending.state, copy);

  assert.deepEqual(copyFirst.state, visualFirst.state, "Copy-first and visual-first joins must produce identical state.");
  assert.deepEqual(copyFirst.event, visualFirst.event, "Copy-first and visual-first joins must produce identical events.");
  assert.equal(copyFirst.event?.stage, "content_ready", "The joined stage must be content_ready.");
  assert.equal(copyFirst.event?.actorType, "system", "The content join event must be system-owned.");
  assert.equal(copyFirst.event?.actorId, "workflow-coordinator", "The workflow coordinator must own the content join event.");
  assert.deepEqual(
    copyFirst.event?.payload,
    {
      contentGroupId: identity.contentGroupId,
      copy: { completionId: copy.id, jobId: copy.jobId, attempt: 1, artifactVersion: 1 },
      visual: { completionId: visual.id, jobId: visual.jobId, attempt: 1, artifactVersion: 1 },
    },
    "The join event must preserve both branch correlations.",
  );
});

test("P3-W3.1 catalog, runtime, roster, and disabled-feature ownership stay aligned", () => {
  const catalogIds = agentCatalog.map((agent) => agent.id);
  const runtimeAgents = runtimeConfig.agents;
  const runtimeIds = runtimeAgents.map((agent) => agent.id);
  assert.equal(agentCatalog.length, 10, "The agent catalog must contain ten roles.");
  assert.equal(new Set(catalogIds).size, 10, "The agent catalog role IDs must be unique.");
  assert.equal(runtimeAgents.length, 10, "The runtime configuration must contain ten roles.");
  assert.equal(new Set(runtimeIds).size, 10, "The runtime configuration role IDs must be unique.");
  assert.deepEqual([...catalogIds].sort(), [...runtimeIds].sort(), "The runtime configuration must align with the ten catalog roles.");
  assert.deepEqual(
    runtimeAgents.filter((agent) => agent.enabled).map((agent) => agent.id).sort(),
    ["growth-strategist", "market-scout", "performance-analyst", "product-ranker", "qa-editor", "session-keeper"],
    "The pilot runtime must enable exactly the accepted six roles.",
  );
  assert.deepEqual(
    runtimeAgents.filter((agent) => !agent.enabled).map((agent) => agent.id).sort(),
    ["flow-visual-producer", "gemini-copywriter", "link-attribution", "publisher"],
    "The pilot runtime must keep the accepted four roles disabled.",
  );

  assert.equal(getAgent("workflow-coordinator"), undefined, "The workflow coordinator must be absent from the agent catalog.");
  assert.equal(getAgent("team-brain"), undefined, "TeamBrain must be absent from the agent catalog.");
  assert.equal(runtimeAgents.some((agent) => agent.id === "workflow-coordinator"), false, "The workflow coordinator must be absent from runtime configuration.");
  assert.equal(runtimeAgents.some((agent) => agent.id === "team-brain"), false, "TeamBrain must be absent from runtime configuration.");

  const sessionKeeper = getAgent("session-keeper");
  assert.ok(sessionKeeper, "Session Keeper must remain in the agent catalog.");
  assert.deepEqual(sessionKeeper.consumes, ["session-health"], "Session Keeper must consume session health only.");
  assert.deepEqual(sessionKeeper.produces, ["session-state"], "Session Keeper must produce session state, not workflow-stage output.");

  const liveSnapshot = operationsFixture.snapshots.find((snapshot) => snapshot.snapshotId.value === "snapshot-live");
  const staleSnapshot = operationsFixture.snapshots.find((snapshot) => snapshot.snapshotId.value === "snapshot-stale");
  assert.ok(liveSnapshot, "The Operations Snapshot V2 fixture must contain its live snapshot.");
  assert.ok(staleSnapshot, "The Operations Snapshot V2 fixture must contain its stale snapshot.");
  assert.deepEqual(inspectOperationsSnapshot(liveSnapshot), [], "The live Operations Snapshot V2 fixture must be internally valid.");
  assert.ok(
    inspectOperationsSnapshot(staleSnapshot).some((diagnostic) => diagnostic.code === "adapter.stale"),
    "A stale Operations Snapshot V2 must remain visibly stale.",
  );

  const rosterBindings = operationsFixture.roster.bindings;
  assert.equal(rosterBindings.length, 10, "The Operations Snapshot V2 roster must contain ten bindings.");
  assert.equal(new Set(rosterBindings.map((binding) => binding.agentInstanceId.value)).size, 10, "Roster agent instances must be unique.");
  for (const runtimeAgent of runtimeAgents) {
    const binding = rosterBindings.find((candidate) => candidate.roleId === runtimeAgent.id);
    assert.ok(binding, `The Operations Snapshot V2 roster must bind ${runtimeAgent.id}.`);
    assert.equal(binding.enabled, runtimeAgent.enabled, `Roster enablement must match runtime configuration for ${runtimeAgent.id}.`);
  }

  const teamBrainFacility = operationsFixture.routing.consoleFacilities.find((facility) => facility.facilityId === "teambrain-console");
  assert.ok(teamBrainFacility, "TeamBrain must be represented by a command-console facility.");
  assert.equal(teamBrainFacility.kind, "command-console", "TeamBrain must use the command-console facility kind.");
  assert.equal(teamBrainFacility.agentEligible, false, "TeamBrain must not be eligible for an agent roster binding.");
  assert.equal(rosterBindings.some((binding) => binding.roleId === "teambrain"), false, "TeamBrain must not appear in the roster.");
  assert.equal(liveSnapshot.agents.some((agent) => agent.roleId === "teambrain"), false, "TeamBrain must not appear as an Operations Snapshot actor.");

  const disabledRuntimeAgents = runtimeAgents.filter((agent) => !agent.enabled);
  for (const runtimeAgent of disabledRuntimeAgents) {
    const route = operationsFixture.routing.routes.find((candidate) => candidate.roleId === runtimeAgent.id);
    assert.ok(route, `A disabled runtime role must have an Operations Snapshot V2 route: ${runtimeAgent.id}.`);
    const binding = rosterBindings.find((candidate) => candidate.roleId === runtimeAgent.id);
    assert.ok(binding, `A disabled runtime role must have a disabled roster binding: ${runtimeAgent.id}.`);
    assert.equal(binding.enabled, false, `A disabled runtime role must not create an enabled roster actor: ${runtimeAgent.id}.`);
    for (const featureId of route.requiredFeatures) {
      const feature = liveSnapshot.features.find((candidate) => candidate.featureId === featureId);
      assert.ok(feature, `A disabled runtime role must declare its required feature: ${runtimeAgent.id}/${featureId}.`);
      assert.equal(feature.available, false, `A disabled feature must not be available: ${featureId}.`);
      assert.equal(feature.connectorEnabled, false, `A disabled feature connector must remain disabled: ${featureId}.`);
      assert.equal(feature.sessionAvailable, false, `A disabled feature session must remain unavailable: ${featureId}.`);
    }
    const proposalInteraction = route.allowedInteractions.find((interaction) => interaction !== "inspect-task");
    assert.ok(proposalInteraction, `A disabled runtime role must declare a proposal boundary: ${runtimeAgent.id}.`);
    const proposal = canProposeInteraction(
      liveSnapshot,
      operationsFixture.routing,
      operationsFixture.roster,
      binding.agentInstanceId.value,
      proposalInteraction,
    );
    assert.equal(proposal.allowed, false, `A disabled external feature must not allow an external action: ${runtimeAgent.id}.`);
    assert.ok(
      proposal.diagnostics.some((diagnostic) => diagnostic.code === "adapter.feature-disabled"),
      `A disabled external feature must retain adapter.feature-disabled evidence: ${runtimeAgent.id}.`,
    );
  }

  const rosterResult = bindRoster(liveSnapshot, operationsFixture.routing, operationsFixture.roster);
  assert.equal(rosterResult.diagnostics.length, 0, "The accepted ten-role roster must bind without adapter diagnostics.");
});

test("P3-W3.1 pilot producer preserves branch correlation and idempotent system audit", () => {
  const simulation = simulatePilotRun();
  assert.equal(simulation.jobs.length, 8, "The pilot producer must create the expected workflow jobs.");
  assert.equal(simulation.jobs.some((job) => job.stage === "content_ready"), false, "The pilot producer must not create a content_ready agent job.");
  assert.ok(simulation.jobs.every((job) => job.payload.simulationOnly === true), "Pilot jobs must be explicitly simulation-only.");
  assert.ok(simulation.results.every((result) => result.status === "succeeded"), "Pilot results must be successful simulation results.");
  assert.ok(simulation.results.every((result) => result.result?.simulationOnly === true), "Pilot result success must remain explicitly simulation-only.");
  assert.ok(simulation.jobs.every((job) => job.connectorId.startsWith("simulation.")), "Pilot connector IDs must not represent external connector execution.");

  const contentJobs = simulation.jobs.filter((job) => job.stage === "content_queued");
  assert.deepEqual(contentJobs.map((job) => job.payload.branch).sort(), ["copy", "visual"], "The pilot producer must fan out copy and visual branches.");
  assert.equal(new Set(contentJobs.map((job) => job.payload.contentGroupId)).size, 1, "Pilot branches must share one content group.");
  for (const job of contentJobs) {
    const result = simulation.results.find((candidate) => candidate.jobId === job.id);
    assert.ok(result, `The pilot producer must return a result for ${job.id}.`);
    const completion = result.result.contentCompletion;
    assert.ok(completion, `The pilot producer must return branch completion metadata for ${job.id}.`);
    assert.equal(completion.jobId, job.id, `Branch completion must correlate to its job: ${job.id}.`);
    assert.equal(completion.workspaceId, job.workspaceId, `Branch completion must preserve workspace correlation: ${job.id}.`);
    assert.equal(completion.workflowId, job.workflowId, `Branch completion must preserve workflow correlation: ${job.id}.`);
    assert.equal(completion.contentGroupId, job.payload.contentGroupId, `Branch completion must preserve content-group correlation: ${job.id}.`);
    assert.equal(completion.branch, job.payload.branch, `Branch completion must preserve branch identity: ${job.id}.`);
  }
  assert.equal(simulation.contentReadyEvent.actorType, "system", "The pilot join must be system-owned.");
  assert.equal(simulation.contentReadyEvent.actorId, "workflow-coordinator", "The pilot join must be owned by the workflow coordinator.");

  const { database } = openLocalDatabase(":memory:", migrationsPath);
  try {
    const reversed = { ...simulation, results: [...simulation.results].reverse() };
    const first = persistPilotSimulation(database, reversed);
    const second = persistPilotSimulation(database, reversed);
    assert.deepEqual(second, first, "Persisting the same pilot run twice must be idempotent.");
    assert.equal(first.jobs, 8, "Persistence must report all pilot jobs.");
    assert.equal(first.agentRuns, 8, "Persistence must report one run per pilot job.");
    assert.equal(first.auditEvents, 9, "Persistence must report agent audits plus one system join audit.");
    assert.equal(countRows(database, "jobs"), 8, "Idempotent persistence must keep eight job rows.");
    assert.equal(countRows(database, "agent_runs"), 8, "Idempotent persistence must keep eight agent-run rows.");
    assert.equal(countRows(database, "audit_events"), 9, "Idempotent persistence must keep one audit per job plus the join.");
    assert.equal(countRows(database, "job_outbox"), 8, "Idempotent persistence must keep one outbox row per job.");
    assert.equal(countRows(database, "jobs", "stage = 'content_ready'"), 0, "content_ready must not persist as an agent job.");
    assert.equal(countRows(database, "agent_runs", "agent_id = 'workflow-coordinator'"), 0, "The system coordinator must not persist as an agent run.");

    const contentRuns = database.prepare("SELECT agent_id, input_json FROM agent_runs").all()
      .map((row) => ({ agentId: String(row.agent_id), input: JSON.parse(String(row.input_json)) }))
      .filter((row) => row.input.branch)
      .map((row) => [row.input.branch, row.agentId])
      .sort((left, right) => String(left[0]).localeCompare(String(right[0])));
    assert.deepEqual(
      contentRuns,
      ["copy", "visual"].map((branch) => [branch, getContentBranchOwnerId(branch)]),
      "Persistence must preserve each branch owner and correlation.",
    );

    const coordinatorAudits = database.prepare("SELECT actor_type, actor_id, payload_json FROM audit_events WHERE event_type = 'workflow.content_ready'").all();
    assert.equal(coordinatorAudits.length, 1, "Persistence must emit exactly one system join audit.");
    const coordinatorAudit = coordinatorAudits[0];
    assert.equal(String(coordinatorAudit.actor_type), "system", "The persisted join audit must be system-owned.");
    assert.equal(String(coordinatorAudit.actor_id), "workflow-coordinator", "The persisted join audit must name the workflow coordinator.");
    assert.deepEqual(
      JSON.parse(String(coordinatorAudit.payload_json)),
      simulation.contentReadyEvent.payload,
      "The persisted join audit must preserve both branch references.",
    );
  } finally {
    database.close();
  }
});

function readJson(relativePath) {
  return JSON.parse(readFileSync(new URL(relativePath, import.meta.url), "utf8"));
}

function workflowEvent(stage, actorType, actorId) {
  return {
    id: `event-${stage}-${actorId}`,
    workspaceId: "workspace-w3-01",
    workflowId: "workflow-w3-01",
    stage,
    actorType,
    actorId,
    traceId: "trace-w3-01",
    occurredAt: "2026-08-02T00:00:00.000Z",
    payload: {},
  };
}

function contentCompletion(branch, id, jobId, completedAt, identity) {
  return {
    id,
    jobId,
    workspaceId: identity.workspaceId,
    workflowId: identity.workflowId,
    contentGroupId: identity.contentGroupId,
    branch,
    attempt: 1,
    artifactVersion: 1,
    completedAt,
    traceId: identity.traceId,
  };
}

function hasCode(code) {
  return (error) => error && typeof error === "object" && error.code === code;
}

function countRows(database, table, where = "1 = 1") {
  return Number(database.prepare(`SELECT COUNT(*) AS count FROM ${table} WHERE ${where}`).get()?.count);
}

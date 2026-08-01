# Workflow Model

## Happy path

```text
discovered -> scored -> selected -> link_ready -> content_queued
                                                    |-> copy
                                                    |-> visual
                                                    `-> system join -> content_ready
content_ready -> qa_approved -> scheduled -> published -> measured
```

Every active state may enter `failed`. Recovery starts only from a stage
explicitly permitted by `packages/workflows/src/index.ts`. `content_ready` is
not a normal transition target: only the content join reducer can emit it.

## Stage ownership

| Stage | Owner | Durable output |
|---|---|---|
| discovered | Market Scout | Product candidate and evidence snapshot |
| scored | Product Ranker | Ordered ranking evidence; no winner decision |
| selected | Growth Strategist | Winner decision referencing ranking evidence and a `strategy-version-reference` |
| link_ready | Attribution Builder | Affiliate URL and five Sub IDs |
| content_queued | Control plane fan-out | One content group and independent copy and visual jobs |
| content_ready | `workflow-coordinator` system actor | One deterministic join event referencing both accepted branch artifacts |
| qa_approved | QA Editor | Validation report and approval |
| scheduled | Publisher | Provider schedule reference |
| published | Publisher | Remote publication ID |
| measured | Performance Analyst | Joined daily metrics and recommendation |
| failed | Originating stage or connector diagnostic owner | Structured failure and failed-from stage |

Product Ranker owns ranking and its evidence. Growth Strategist alone selects
the winner. The selected event carries `selectedProductId`,
`rankingEvidenceId`, and `strategyVersionId`; the catalog exposes the last fact
as `strategy-version-reference`. Selection does not activate that strategy
version; activation remains a separate policy-approved audit action
with human review available.

Session Keeper owns session-health monitoring and verified recovery. It does
not become the owner of product, content, attribution, QA, publishing, or other
stage failures merely because a failed action used a browser session.

## Content fan-out and join

Copy and visual production are sibling jobs under one stable `contentGroupId`:

| Branch | Agent owner | Artifact |
|---|---|---|
| `copy` | Gemini Copywriter | Caption draft |
| `visual` | Flow Visual Producer | Visual assets |

Each successful completion carries a stable completion ID, job ID, workspace,
workflow, content group, branch, attempt, artifact version, completion time,
and trace ID. A single branch completion never advances the workflow.

The pure join reducer emits `content_ready` only after both current branch
completions exist. Its audit event uses `actorType: "system"` and
`actorId: "workflow-coordinator"`. The coordinator is not an agent role, job,
connector, or agent run and is absent from the agent catalog and runtime agent
configuration. TeamBrain likewise remains a command-console facility rather
than a workflow actor.

## Content idempotency

- An exact duplicate of the current branch completion is a no-op.
- Reusing a completion ID with different data is an ID conflict.
- A higher attempt replaces the pending artifact for that branch.
- Replaying a completion superseded by a higher attempt is stale and rejected.
- A different completion ID for the same branch attempt is a conflict.
- Wrong workspace, workflow, trace, or content group is rejected.
- Completion order is normalized, so copy-first and visual-first produce the
  same join state, payload, timestamp, and event ID.
- The join event is emitted once. After it exists, only exact duplicates of its
  current branch completions are no-ops; all unseen completions fail closed.
- Returning from `content_ready` to `content_queued` creates a new
  `contentGroupId`; a joined group is never reopened or mutated.

## Human gates

Human approval can be required for the first post on an account,
policy-sensitive categories, strategy activation, recovered sessions, and any
browser fallback publication.

## Retry behavior

- Network/timeouts: bounded exponential retry with an incremented attempt.
- Expired login: pause the affected profile, notify Session Keeper, and resume
  only after verified recovery without changing the originating failure owner.
- Invalid content/link: return to the producing stage with a new artifact
  version; content rework uses a fresh content group after a completed join.
- Platform policy rejection: stop; human review required.
- Unknown result after publish request: reconcile remote state before any
  retry.

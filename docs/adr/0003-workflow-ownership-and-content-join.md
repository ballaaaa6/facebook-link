# ADR 0003: Workflow Ownership and Content Join

Status: Accepted

## Decision

Product Ranker produces ordered product-ranking evidence and does not select a
winner. Growth Strategist alone owns the `selected` transition. A winner
selection references the selected product, the ranking evidence, and a strategy
version through the `strategy-version-reference` artifact. Strategy activation
remains a separate audited, policy-approved action with human review available;
it is never inferred from selection.

Content production uses exactly two independent branches, `copy` and `visual`,
under one stable `contentGroupId`. Gemini Copywriter owns copy and Flow Visual
Producer owns visual. Their branch jobs and completions remain independent; no
serial dependency is implied by their arrival order.

Each successful branch completion carries its stable ID, job ID, workspace ID,
workflow ID, content group ID, branch, positive attempt, positive artifact
version, completion time, and trace ID. The workflow applies these rules:

1. An exact completion may be applied once and redelivered as a no-op while it
   remains the current branch completion.
2. Reusing its ID with different data is a conflict, even when the changed data
   would otherwise fail a scope check.
3. A higher attempt replaces the pending branch artifact. An older superseded
   completion is stale, including an exact redelivery of that old completion.
4. A different completion ID at the current attempt is a conflict.
5. Workspace, workflow, trace, and content group must match the pending join.
6. Completion records are normalized by stable ID and branch slots have fixed
   copy/visual keys, making arrival order irrelevant.

Only the `workflow-coordinator` system actor may emit `content_ready`, and only
after the current copy and visual completions both exist. Its event ID is a
deterministic function of workspace, workflow, and content group; its timestamp
is the later branch completion time; and its payload references both accepted
artifacts. The event is emitted exactly once. A joined group is immutable, so
content rework creates a new `contentGroupId`.

`workflow-coordinator` is not an agent, connector, job, or agent run. It must
not appear in the agent catalog or runtime agent configuration. TeamBrain is a
command-console facility, not a workflow actor.

Failures retain the originating stage or connector diagnostic owner. Session
Keeper owns session health and verified session recovery only; it is not the
default owner for failures from every browser-backed stage.

## Why

The former stage graph allowed a producer to advance directly from
`content_queued` to `content_ready`, even when only one artifact existed. It
also represented every workflow event as an agent event, which forced a system
join to masquerade as an employee. Product winner ownership disagreed between
the workflow documentation and agent catalog.

Explicit branch correlation and a pure deterministic join make retries,
reordered delivery, persistence replay, and audit reconciliation testable
without treating presentation timing or array position as operational truth.

## Consequences

Normal transition APIs reject `content_ready`; callers must use the shared join
reducer. Producers and persistence carry content group, branch, attempt, and
artifact-version correlation and match results by `jobId`. The coordinator join
is one system audit event and does not create a connector job or agent run.

Current agent configuration remains ten roles, with six enabled and four
disabled. Disabled roles do not become active merely because deterministic
simulation fixtures exercise their contract. This decision adds no database
migration, Office runtime behavior, renderer dependency, or external action.

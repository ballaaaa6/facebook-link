# P3-EXIT-03 Ten-role operations trace

- Scenario count: 10
- Roles: market-scout, product-ranker, growth-strategist, performance-analyst, gemini-copywriter, flow-visual-producer, link-attribution, qa-editor, publisher, session-keeper
- Final authoritative equals projected: true
- Evidence hash: b7e91668b1f1782834140a03b332de4eabf8b25dc0ea972160bb30577c340892

## Ten-role choreography

1. market-scout — discovered — attempt 1 — succeeded — simulation-only
2. product-ranker — scored — attempt 1 — succeeded — simulation-only
3. growth-strategist — selected — attempt 1 — succeeded — simulation-only
4. link-attribution — link_ready — attempt 1 — succeeded — simulation-only
5. gemini-copywriter — content_queued — attempt 1 — succeeded — simulation-only
6. flow-visual-producer — content_queued — attempt 2 — succeeded — simulation-only
7. qa-editor — qa_approved — attempt 1 — succeeded — simulation-only
8. publisher — scheduled — attempt 1 — succeeded — simulation-only
9. session-keeper — content_queued — attempt 1 — succeeded — simulation-only
10. performance-analyst — measured — attempt 1 — succeeded — simulation-only

## Event and reconciliation decisions

- duplicate-delivery: duplicate; no-op
- same-id-changed-digest: conflict; fail-closed
- out-of-order-gap: resync-required; resync-required
- late-event: resync-required; resync-required
- review-rejection-approval: approved-after-rejection; workflow-stage-remained-authoritative
- failure-retry-recovery: completed; attempt-2-completed
- reconnect: reconnecting; adapter-owned
- disabled-connector: blocked; no connector action
- stale-office-projection: stale; not-authoritative
- current-truth-rebase: current-truth; epoch-2 cursor

## Authority boundary

The runner owns JobEnvelope/JobResult and persistence facts. Workflow ownership and the content_ready join remain workflow-coordinator-owned. Operations reconciliation projects current durable truth; presentationOnly intents never advance workflow state. Disabled connector actions: 0.

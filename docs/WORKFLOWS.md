# Workflow Model

## Happy path

```text
discovered -> scored -> selected -> link_ready -> content_queued
-> content_ready -> qa_approved -> scheduled -> published -> measured
```

Every active state may enter `failed`. Recovery starts only from a stage explicitly permitted by `packages/workflows/src/index.ts`.

## Agent handoffs

| Stage | Owner | Durable output |
|---|---|---|
| discovered | Market Scout | Product candidate and evidence snapshot |
| scored | Product Ranker | Score breakdown and rank |
| selected | Growth Strategist | Strategy version and winner decision |
| link_ready | Attribution Builder | Affiliate URL and five Sub IDs |
| content_queued | Gemini Copywriter / Flow Visual Producer | Content jobs |
| content_ready | Content producers | Caption and visual artifacts |
| qa_approved | QA Editor | Validation report and approval |
| scheduled | Publisher | Provider schedule reference |
| published | Publisher | Remote publication ID |
| measured | Performance Analyst | Joined daily metrics and recommendation |

## Human gates

Human approval can be required for the first post on an account, policy-sensitive categories, strategy activation, recovered sessions, and any browser fallback publication.

## Retry behavior

- Network/timeouts: bounded exponential retry.
- Expired login: pause profile, notify Session Keeper, resume after verified recovery.
- Invalid content/link: return to the producing stage with a new artifact version.
- Platform policy rejection: stop; human review required.
- Unknown result after publish request: reconcile remote state before any retry.

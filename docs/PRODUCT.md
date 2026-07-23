# Product Definition

## Vision

Affiliate Operations HQ is a control plane for running measurable, multi-channel affiliate content operations with a small number of supervised browser profiles first and a path to many accounts later.

## Pilot outcome

One Shopee Affiliate account and one Facebook page complete this loop reliably:

1. Discover promising products daily.
2. Snapshot evidence and rank candidates.
3. Select winners under configurable strategy rules.
4. Create a five-dimension attributed affiliate link.
5. Produce Thai copy through Gemini in the browser.
6. Produce visual content through Google Flow in the browser.
7. Validate links, content, policy, and duplication.
8. Schedule three or four posts at approved time slots.
9. Collect Shopee and Meta performance metrics.
10. Recommend a new strategy version with an audit trail.

## Primary surfaces

- Settings: accounts, schedules, quotas, content briefs, prompts, review policy, and feature flags.
- Dashboard: workflow throughput, failures, session health, publishing, attribution, and business metrics.
- Agent office: live visual representation of agent states and handoffs.
- Discord: approved commands and notifications after signature verification and access control.

## Explicit non-goals for the pilot

- Hundreds of pages before one account passes reliability tests.
- Unsupervised changes to strategy or publishing policy.
- Storing raw browser credentials in Cloudflare D1.
- Using unofficial automation where a supported official API meets the requirement.
- Selling access before authentication, tenant isolation, billing, and asset licenses are complete.

## Success gates

- Seven consecutive days without an unrecovered session failure.
- No duplicate publication from retries.
- Every affiliate URL reconstructs its platform, account, placement, campaign, and creative dimensions.
- Dashboard metrics reconcile with sampled provider reports.
- A failed run can resume from its last durable stage.

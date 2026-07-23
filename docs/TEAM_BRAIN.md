# TeamBrain

The chat panel depends on the `BrainProvider` contract. The current `MockBrainProvider` routes product, metrics, copy, visual, link, and publication requests to an agent without network calls.

Responses have only two forms:

1. `answer`: informational text from an agent.
2. `action_proposal`: an auditable proposal that requires confirmation when policy says so.

The provider never calls connector tools directly. A confirmed proposal is validated by the API and job policy before the runner can act. The current confirmation button explicitly changes simulation UI state only.

Cloudflare Workers AI can replace the mock later through `createBrainProvider` without rewriting the chat components. Conversation history is bounded; older turns become a rolling summary to control storage and token cost.

# TeamBrain

The browser chat posts a bounded `BrainRequest` to `POST /v1/brain/respond`. The Worker owns the provider boundary and currently uses the `AI` binding with `@cf/zai-org/glm-4.7-flash`. Browser code never calls an AI provider directly.

Responses have only two forms:

1. `answer`: informational text from an agent.
2. `action_proposal`: an auditable proposal that requires confirmation when policy says so.

The provider never calls connector tools directly. Requests that imply an external mutation are converted into an `action_proposal`; they are not executed by the model. A confirmed proposal must still pass API and job policy before a runner can act. The current confirmation button explicitly changes simulation UI state only.

`MockBrainProvider` remains available for deterministic tests and offline development, but production reports `brain_unavailable` instead of pretending a mock response came from AI. Conversation history is bounded to the ten most recent messages; older turns can become a rolling summary to control storage and token cost.

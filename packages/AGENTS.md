# Shared package instructions

- Packages cannot import from `apps` or `services`.
- Prefer small stable interfaces over environment-specific implementations.
- Reuse contracts before adding parallel entity types.
- Add tests for deterministic business rules and storage behavior.

# Oracle Runner Infrastructure

This directory documents the future Oracle Linux execution host. Do not migrate the pilot until the local runner passes the acceptance gates in `docs/PRODUCT.md`.

## Host requirements

- Non-root `affiliate-runner` service account
- Encrypted persistent volume for browser profiles
- Separate artifact volume with retention limits
- Pinned Node and browser versions
- Outbound access restricted to approved provider/control-plane endpoints
- Health endpoint, system service, restart limits, log rotation, disk alerts, and backups

`affiliate-runner.service.example` is a template only. Copy it into system configuration after replacing paths and creating an external environment file with strict permissions.

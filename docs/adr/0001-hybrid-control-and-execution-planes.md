# ADR 0001: Separate Control and Execution Planes

Status: Accepted

## Decision

Run the web, API, Discord entry point, durable state, and orchestration controls on Cloudflare. Run browser automation on a long-lived local/Oracle runner.

## Why

Browser sessions require persistent profiles, operating-system processes, long execution time, and recoverable local storage. These do not belong in an edge request runtime. The split also lets the dashboard scale without multiplying browser sessions.

## Consequences

The runner needs authenticated job transport, leases, heartbeats, idempotency, and reconciliation. No browser profile is uploaded to the web application.

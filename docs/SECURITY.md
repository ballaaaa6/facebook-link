# Security Model

## Sensitive assets

- Shopee, Gemini, Google Flow, Meta, and Discord credentials.
- Browser cookies, local storage, profile folders, and refresh material.
- Page access tokens and webhook secrets.
- Customer and tenant data in a future rental product.

## Controls

- Secrets are injected at runtime and never committed.
- Browser profiles are encrypted at rest and isolated by account.
- Logs use allow-listed fields and redact URLs when they may contain tokens.
- Discord commands require signature verification, authorization, and replay protection.
- Cloudflare endpoints require authentication and server-side authorization.
- Runners use narrow service credentials and outbound allow-lists where practical.
- Every publish, login recovery, strategy activation, and secret rotation creates an audit event.

## Incident behavior

On suspected credential exposure: disable the affected connector, revoke provider sessions/tokens, rotate secrets, preserve redacted audit evidence, and do not resume until profile health is verified.

## Repository checks

The repository check rejects common secret filenames and requires `.env.example`. It is a guardrail, not a substitute for GitHub secret scanning.

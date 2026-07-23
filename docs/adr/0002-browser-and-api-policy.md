# ADR 0002: API-First Publishing, Browser-First Content Accounts

Status: Accepted

## Decision

Use Meta Graph API for Facebook and Instagram publishing when supported. Use authenticated browser automation for Shopee Affiliate, Gemini, and Google Flow because the pilot relies on existing interactive accounts and avoids paid Gemini API usage.

## Consequences

Browser connectors require session health, visual/DOM reconciliation, bounded retries, and manual recovery gates. A browser publisher is a documented fallback, never the default Meta path.

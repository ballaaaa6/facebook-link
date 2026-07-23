# Discord Bot Worker

Receives verified Discord interactions and converts approved commands into orchestration requests. It must not receive browser cookies, profile archives, passwords, or raw secrets in messages.

The interactions endpoint intentionally returns `503` until signature verification is configured. This prevents an insecure placeholder from being deployed accidentally.

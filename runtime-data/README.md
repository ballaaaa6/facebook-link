# Runtime Data

This directory is the local pilot storage root and is ignored by Git except for this guide.

Expected runtime layout:

```text
database/          SQLite control state
objects/           Content-addressed original artifacts
thumbnails/        Rebuildable previews
exports/           Daily CSV/JSONL exports and manifests
backups/           Local snapshots (not a substitute for off-host backup)
logs/              Rotated structured logs
temp/              Short-lived atomic-write staging
private/profiles/  Encrypted browser profiles and session material
```

All database object references are relative keys. Move this directory to `/var/lib/affiliate-ops` on Oracle and update `APP_DATA_ROOT`; business logic must not change.

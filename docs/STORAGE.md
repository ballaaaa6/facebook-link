# Storage

## Pilot source of truth

SQLite stores operational state. `LocalFilesystemStore` stores immutable blobs by SHA-256 hash. Google Sheets is a mirror for humans, never the authoritative database.

```text
runtime-data/
  database/       affiliate-ops.sqlite and backups
  objects/        workspace/sha256/ab/cd/hash.ext plus metadata
  thumbnails/     rebuildable previews
  exports/        dated CSV/JSON archives
  logs/           rotated runner logs
  private/        encrypted sensitive material; never served
  profiles/       isolated browser profiles; never committed
  temp/           safe disposable working files
```

Only `runtime-data/README.md` is committed. The rest is ignored by Git.

## Oracle move

Point the same storage interface at `/srv/affiliate-ops/runtime-data`, copy the SQLite database while the runner is stopped, verify hashes, start one worker, and keep dated backups. No consumer should depend on a Windows path.

R2 remains an optional later adapter. It is not required for the pilot or Oracle deployment.

# Google Sheet mirror

Target spreadsheet: `1iIF2Pb9THDMLIJz66JgjxKIW6f0j_b-f_2aB2jhZo1s`.

The workbook has 10 tabs: `Today`, `Products`, `Links`, `Content`, `Publications`, `Metrics Daily`, `Run History`, `Review Queue`, `Dashboard`, and `_Mappings`. Headers are frozen and filters cover the first 1,000 rows.

## Rules

- SQLite is authoritative. Do not delete operational records because a sheet row was edited.
- Upsert by `(tab, record_id)` and reject older `record_version` values.
- Sync only non-secret values and opaque object keys or safe URLs.
- Never place cookies, access tokens, profile paths, raw prompts containing secrets, or private customer data in the workbook.
- Record every sync attempt, checkpoint, and row error in `sheet_sync_*` tables.
- Daily exports are append-only archives; the `Today` tab is a live view and is not cleared destructively.

The deterministic fake connector validates schema and idempotency before Google credentials are introduced.

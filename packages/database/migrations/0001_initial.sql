PRAGMA foreign_keys = ON;

CREATE TABLE workspaces (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE workspace_members (
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (workspace_id, user_id),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  display_name TEXT NOT NULL,
  external_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);

CREATE INDEX accounts_workspace_platform_idx ON accounts(workspace_id, platform, status);

CREATE TABLE browser_profiles (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  account_id TEXT,
  runner_id TEXT NOT NULL,
  secret_reference TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unknown',
  last_verified_at TEXT,
  expires_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  FOREIGN KEY (account_id) REFERENCES accounts(id)
);

CREATE TABLE products (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  external_id TEXT,
  source_url TEXT NOT NULL,
  title TEXT NOT NULL,
  shop_name TEXT,
  category TEXT,
  current_price_minor INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'THB',
  status TEXT NOT NULL DEFAULT 'active',
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);

CREATE UNIQUE INDEX products_provider_external_id_idx ON products(workspace_id, provider, external_id);

CREATE TABLE product_snapshots (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  price_minor INTEGER NOT NULL,
  sold_count INTEGER,
  rating REAL,
  review_count INTEGER,
  commission_rate REAL,
  payload_json TEXT NOT NULL DEFAULT '{}',
  captured_at TEXT NOT NULL,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE INDEX product_snapshots_product_time_idx ON product_snapshots(product_id, captured_at);

CREATE TABLE workflow_runs (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  stage TEXT NOT NULL,
  status TEXT NOT NULL,
  strategy_version TEXT NOT NULL,
  product_id TEXT,
  error_code TEXT,
  error_detail TEXT,
  started_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE INDEX workflow_runs_status_time_idx ON workflow_runs(status, updated_at);

CREATE TABLE agent_runs (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  workflow_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  status TEXT NOT NULL,
  attempt INTEGER NOT NULL DEFAULT 1,
  input_json TEXT NOT NULL DEFAULT '{}',
  output_json TEXT,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  FOREIGN KEY (workflow_id) REFERENCES workflow_runs(id)
);

CREATE INDEX agent_runs_workflow_idx ON agent_runs(workflow_id, started_at);

CREATE TABLE affiliate_links (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  workflow_id TEXT NOT NULL,
  destination_url TEXT NOT NULL,
  short_url TEXT,
  sub_id_1 TEXT NOT NULL,
  sub_id_2 TEXT NOT NULL,
  sub_id_3 TEXT NOT NULL,
  sub_id_4 TEXT NOT NULL,
  sub_id_5 TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (workflow_id) REFERENCES workflow_runs(id)
);

CREATE TABLE content_artifacts (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  workflow_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  artifact_type TEXT NOT NULL,
  format TEXT NOT NULL,
  storage_key TEXT,
  body_text TEXT,
  prompt_version TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  FOREIGN KEY (workflow_id) REFERENCES workflow_runs(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE publications (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  workflow_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  affiliate_link_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  placement TEXT NOT NULL,
  remote_id TEXT,
  status TEXT NOT NULL,
  scheduled_at TEXT NOT NULL,
  published_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  FOREIGN KEY (workflow_id) REFERENCES workflow_runs(id),
  FOREIGN KEY (account_id) REFERENCES accounts(id),
  FOREIGN KEY (affiliate_link_id) REFERENCES affiliate_links(id)
);

CREATE INDEX publications_schedule_idx ON publications(status, scheduled_at);

CREATE TABLE performance_metrics (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  publication_id TEXT,
  affiliate_link_id TEXT,
  metric_date TEXT NOT NULL,
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  reactions INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  orders INTEGER NOT NULL DEFAULT 0,
  revenue_minor INTEGER NOT NULL DEFAULT 0,
  commission_minor INTEGER NOT NULL DEFAULT 0,
  payload_json TEXT NOT NULL DEFAULT '{}',
  collected_at TEXT NOT NULL,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  FOREIGN KEY (publication_id) REFERENCES publications(id),
  FOREIGN KEY (affiliate_link_id) REFERENCES affiliate_links(id)
);

CREATE UNIQUE INDEX performance_metrics_daily_idx ON performance_metrics(workspace_id, publication_id, affiliate_link_id, metric_date);

CREATE TABLE strategy_versions (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  configuration_json TEXT NOT NULL,
  rationale TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  activated_at TEXT,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);

CREATE TABLE audit_events (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  actor_type TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  payload_json TEXT NOT NULL DEFAULT '{}',
  occurred_at TEXT NOT NULL,
  trace_id TEXT,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);

CREATE INDEX audit_events_entity_idx ON audit_events(workspace_id, entity_type, entity_id, occurred_at);

CREATE TABLE stored_objects (
  key TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  byte_length INTEGER NOT NULL,
  content_type TEXT NOT NULL,
  storage_provider TEXT NOT NULL DEFAULT 'local',
  created_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);

CREATE UNIQUE INDEX stored_objects_workspace_hash_idx ON stored_objects(workspace_id, sha256);

CREATE TABLE jobs (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  workflow_id TEXT NOT NULL,
  stage TEXT NOT NULL,
  connector_id TEXT NOT NULL,
  payload_version INTEGER NOT NULL,
  payload_json TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  status TEXT NOT NULL,
  attempt INTEGER NOT NULL DEFAULT 1,
  available_at TEXT NOT NULL,
  lease_owner TEXT,
  lease_until TEXT,
  trace_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  FOREIGN KEY (workflow_id) REFERENCES workflow_runs(id)
);

CREATE UNIQUE INDEX jobs_workspace_idempotency_idx ON jobs(workspace_id, idempotency_key);
CREATE INDEX jobs_claim_idx ON jobs(status, available_at, lease_until);

CREATE TABLE job_outbox (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  job_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  published_at TEXT,
  attempt INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  FOREIGN KEY (job_id) REFERENCES jobs(id)
);

CREATE INDEX job_outbox_pending_idx ON job_outbox(published_at, created_at);

CREATE TABLE job_inbox (
  message_id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  job_id TEXT NOT NULL,
  received_at TEXT NOT NULL,
  processed_at TEXT,
  result_json TEXT,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  FOREIGN KEY (job_id) REFERENCES jobs(id)
);

CREATE TABLE dead_letter_jobs (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  job_id TEXT NOT NULL,
  error_category TEXT NOT NULL,
  error_code TEXT NOT NULL,
  error_detail TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  failed_at TEXT NOT NULL,
  reviewed_at TEXT,
  reviewed_by TEXT,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  FOREIGN KEY (job_id) REFERENCES jobs(id)
);

CREATE TABLE action_proposals (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  capability TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  risk TEXT NOT NULL,
  arguments_json TEXT NOT NULL,
  status TEXT NOT NULL,
  requires_confirmation INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  confirmed_at TEXT,
  executed_at TEXT,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);

CREATE TABLE sheet_sync_targets (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  spreadsheet_id TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  timezone TEXT NOT NULL DEFAULT 'Asia/Bangkok',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);

CREATE UNIQUE INDEX sheet_sync_targets_workspace_idx ON sheet_sync_targets(workspace_id, spreadsheet_id);

CREATE TABLE sheet_sync_jobs (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  status TEXT NOT NULL,
  row_count INTEGER NOT NULL,
  idempotency_key TEXT NOT NULL,
  attempt INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  completed_at TEXT,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  FOREIGN KEY (target_id) REFERENCES sheet_sync_targets(id)
);

CREATE UNIQUE INDEX sheet_sync_jobs_idempotency_idx ON sheet_sync_jobs(workspace_id, idempotency_key);

CREATE TABLE sheet_sync_state (
  target_id TEXT NOT NULL,
  tab_name TEXT NOT NULL,
  record_type TEXT NOT NULL,
  record_id TEXT NOT NULL,
  record_version INTEGER NOT NULL,
  row_number INTEGER,
  checksum TEXT NOT NULL,
  synced_at TEXT NOT NULL,
  PRIMARY KEY (target_id, tab_name, record_type, record_id),
  FOREIGN KEY (target_id) REFERENCES sheet_sync_targets(id)
);

CREATE TABLE sheet_sync_errors (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  sync_job_id TEXT NOT NULL,
  tab_name TEXT NOT NULL,
  record_id TEXT,
  error_code TEXT NOT NULL,
  error_detail TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  FOREIGN KEY (sync_job_id) REFERENCES sheet_sync_jobs(id)
);

CREATE TABLE daily_exports (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  business_date TEXT NOT NULL,
  object_key TEXT NOT NULL,
  schema_version INTEGER NOT NULL,
  record_count INTEGER NOT NULL,
  checksum TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  FOREIGN KEY (object_key) REFERENCES stored_objects(key)
);

CREATE UNIQUE INDEX daily_exports_workspace_date_idx ON daily_exports(workspace_id, business_date, schema_version);

CREATE TABLE brain_conversations (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  title TEXT NOT NULL,
  selected_agent_id TEXT,
  rolling_summary TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);

CREATE TABLE brain_messages (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  conversation_id TEXT NOT NULL,
  role TEXT NOT NULL,
  agent_id TEXT,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  FOREIGN KEY (conversation_id) REFERENCES brain_conversations(id)
);

CREATE INDEX brain_messages_conversation_idx ON brain_messages(conversation_id, created_at);

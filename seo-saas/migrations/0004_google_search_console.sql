PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS gsc_oauth_states (
  state TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS gsc_connections (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL UNIQUE,
  connected_by_user_id TEXT NOT NULL,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT,
  token_expires_at TEXT,
  scope TEXT,
  selected_property TEXT,
  permission_level TEXT,
  connected_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_sync_at TEXT,
  last_error TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (connected_by_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS gsc_syncs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  property_url TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  clicks REAL NOT NULL DEFAULT 0,
  impressions REAL NOT NULL DEFAULT 0,
  ctr REAL NOT NULL DEFAULT 0,
  position REAL NOT NULL DEFAULT 0,
  query_count INTEGER NOT NULL DEFAULT 0,
  page_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS gsc_query_rows (
  id TEXT PRIMARY KEY,
  sync_id TEXT NOT NULL,
  query TEXT NOT NULL,
  clicks REAL NOT NULL DEFAULT 0,
  impressions REAL NOT NULL DEFAULT 0,
  ctr REAL NOT NULL DEFAULT 0,
  position REAL NOT NULL DEFAULT 0,
  FOREIGN KEY (sync_id) REFERENCES gsc_syncs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS gsc_page_rows (
  id TEXT PRIMARY KEY,
  sync_id TEXT NOT NULL,
  page TEXT NOT NULL,
  clicks REAL NOT NULL DEFAULT 0,
  impressions REAL NOT NULL DEFAULT 0,
  ctr REAL NOT NULL DEFAULT 0,
  position REAL NOT NULL DEFAULT 0,
  FOREIGN KEY (sync_id) REFERENCES gsc_syncs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS gsc_daily_rows (
  id TEXT PRIMARY KEY,
  sync_id TEXT NOT NULL,
  date TEXT NOT NULL,
  clicks REAL NOT NULL DEFAULT 0,
  impressions REAL NOT NULL DEFAULT 0,
  ctr REAL NOT NULL DEFAULT 0,
  position REAL NOT NULL DEFAULT 0,
  FOREIGN KEY (sync_id) REFERENCES gsc_syncs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_gsc_oauth_expiry ON gsc_oauth_states(expires_at);
CREATE INDEX IF NOT EXISTS idx_gsc_connections_project ON gsc_connections(project_id);
CREATE INDEX IF NOT EXISTS idx_gsc_syncs_project_date ON gsc_syncs(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gsc_queries_sync_clicks ON gsc_query_rows(sync_id, clicks DESC);
CREATE INDEX IF NOT EXISTS idx_gsc_pages_sync_clicks ON gsc_page_rows(sync_id, clicks DESC);
CREATE INDEX IF NOT EXISTS idx_gsc_daily_sync_date ON gsc_daily_rows(sync_id, date ASC);

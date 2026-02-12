-- SQLite schema for personal sign-ins

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS signins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  note TEXT,
  device TEXT,
  location TEXT
);

CREATE INDEX IF NOT EXISTS idx_signins_created_at ON signins(created_at);

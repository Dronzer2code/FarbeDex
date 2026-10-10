// SQLite schema — docs/TRD.md → STORAGE. Migrations are keyed by PRAGMA user_version.

export const DB_NAME = 'farbedex.db';

export const MIGRATIONS: readonly string[] = [
  // v1
  `
  CREATE TABLE IF NOT EXISTS catches (
    id TEXT PRIMARY KEY,
    created_at INTEGER NOT NULL,
    photo_path TEXT NOT NULL,
    thumb_path TEXT NOT NULL,
    width INTEGER NOT NULL, height INTEGER NOT NULL,
    subject_label TEXT, subject_score REAL,
    scene_label TEXT NOT NULL, scene_score REAL NOT NULL,
    other_pct REAL NOT NULL,
    note TEXT,
    live_checks TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS swatches (
    catch_id TEXT NOT NULL REFERENCES catches(id) ON DELETE CASCADE,
    entry_no INTEGER NOT NULL,
    hex TEXT NOT NULL,
    ok_l REAL NOT NULL, ok_c REAL NOT NULL, ok_h REAL NOT NULL,
    pct REAL NOT NULL,
    is_new INTEGER NOT NULL DEFAULT 0,
    rank INTEGER NOT NULL,
    PRIMARY KEY (catch_id, entry_no)
  );
  CREATE INDEX IF NOT EXISTS swatches_entry_idx ON swatches(entry_no);

  CREATE TABLE IF NOT EXISTS entries (
    no INTEGER PRIMARY KEY,
    name TEXT,
    name_source TEXT,
    times_caught INTEGER NOT NULL DEFAULT 0,
    sum_pct REAL NOT NULL DEFAULT 0,
    first_caught_at INTEGER, first_catch_id TEXT,
    best_hex TEXT, best_distance REAL, best_catch_id TEXT
  );

  CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  `,
];

export const ENTRY_COUNT = 151;

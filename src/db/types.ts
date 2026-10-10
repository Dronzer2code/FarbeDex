// Minimal async DB surface used by the repositories (subset of expo-sqlite's SQLiteDatabase), so the
// same SQL runs in the app and in tests (tests/helpers/nodeSqlite.ts wraps node:sqlite).
export type BindValue = string | number | null;

export interface DbLike {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, ...params: BindValue[]): Promise<unknown>;
  getFirstAsync<T>(sql: string, ...params: BindValue[]): Promise<T | null>;
  getAllAsync<T>(sql: string, ...params: BindValue[]): Promise<T[]>;
  withExclusiveTransactionAsync(task: (txn: DbLike) => Promise<void>): Promise<void>;
}

export type NameSource = 'GEMMA' | 'TEMPLATE';

export interface EntryRow {
  no: number;
  name: string | null;
  name_source: NameSource | null;
  times_caught: number;
  sum_pct: number;
  first_caught_at: number | null;
  first_catch_id: string | null;
  best_hex: string | null;
  best_distance: number | null;
  best_catch_id: string | null;
  shiny_count: number;
}

export interface CatchRow {
  id: string;
  created_at: number;
  photo_path: string;
  thumb_path: string;
  width: number;
  height: number;
  subject_label: string | null;
  subject_score: number | null;
  scene_label: string;
  scene_score: number;
  other_pct: number;
  note: string | null;
  live_checks: string;
  minority: string | null; // JSON MinoritySwatch[]
  title: string | null; // palette mood title (Namer)
  registered: number; // 1 once favourites were chosen (or auto-picked)
}

export interface SwatchRow {
  catch_id: string;
  entry_no: number;
  hex: string;
  ok_l: number;
  ok_c: number;
  ok_h: number;
  pct: number;
  is_new: number;
  rank: number;
  registered: number; // 1 = counted in the FarbeDex (a chosen favourite)
  shiny: number;
}

// FarbeDex grid filters and search (F4). Pure.
import type { Rarity } from './rules';
import type { EntryDef } from './types';

export type StatusFilter = 'ALL' | 'CAUGHT' | 'MISSING';

export interface EntryState {
  timesCaught: number;
  name: string | null;
}

export interface EntryFilter {
  status: StatusFilter;
  rarity: Rarity | null;
  family: string | null;
  query: string;
}

export const NO_FILTER: EntryFilter = { status: 'ALL', rarity: null, family: null, query: '' };

/** Matches "#067", "067", "67" against the number; other text against the stored name (caught only) or family. */
export function matchesQuery(e: EntryDef, s: EntryState, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const num = q.replace(/^#/, '');
  if (/^\d{1,3}$/.test(num)) return e.no === Number(num);
  // Missing Entries show "???", so their (kept) names are not searchable.
  const name = s.timesCaught > 0 ? (s.name ?? e.templateName) : '';
  return name.toLowerCase().includes(q) || e.family.toLowerCase().includes(q);
}

export function filterEntries(entries: readonly EntryDef[], states: ReadonlyMap<number, EntryState>, f: EntryFilter): EntryDef[] {
  return entries.filter((e) => {
    const s = states.get(e.no) ?? { timesCaught: 0, name: null };
    if (f.status === 'CAUGHT' && s.timesCaught === 0) return false;
    if (f.status === 'MISSING' && s.timesCaught > 0) return false;
    if (f.rarity && e.rarity !== f.rarity) return false;
    if (f.family && e.family !== f.family) return false;
    return matchesQuery(e, s, f.query);
  });
}

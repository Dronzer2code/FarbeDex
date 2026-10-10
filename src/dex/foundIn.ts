// FOUND-IN BAR — docs/DEX_SPEC.md: sum an Entry's pct across Catches grouped by subject label; top 3 labels
// as percentages of that sum, remainder "other".
import { largestRemainder } from '../color/percent';

export interface FoundInSegment {
  label: string;
  pct: number; // one decimal
}

export function foundIn(rows: readonly { subject_label: string | null; pct: number }[], top = 3): FoundInSegment[] {
  if (rows.length === 0) return [];
  const sums = new Map<string, number>();
  for (const r of rows) {
    const key = r.subject_label ?? 'other';
    sums.set(key, (sums.get(key) ?? 0) + r.pct);
  }
  const named = [...sums.entries()].filter(([k]) => k !== 'other').sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const head = named.slice(0, top);
  const rest = named.slice(top).reduce((s, [, v]) => s + v, 0) + (sums.get('other') ?? 0);
  const parts = [...head, ...(rest > 0 ? [['other', rest] as [string, number]] : [])];
  const units = largestRemainder(parts.map(([, v]) => v), 1000);
  return parts.map(([label], i) => ({ label, pct: units[i] / 10 }));
}

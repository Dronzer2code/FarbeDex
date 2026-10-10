// "Today's hunt": deterministic daily pick of a missing Entry (seed = local date). Pure.
import { mulberry32 } from '../color/prng';

export function dateSeed(d: Date): number {
  const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Picks one of `missing` (sorted Entry numbers) for the given day; null when everything is caught. */
export function todaysHunt(missing: readonly number[], day: Date): number | null {
  if (missing.length === 0) return null;
  const rand = mulberry32(dateSeed(day));
  return missing[Math.floor(rand() * missing.length)];
}

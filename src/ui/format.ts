// Formatting helpers (no Intl dependency).
import { ENTRIES } from '../dex/entries.generated';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDay(ms: number): string {
  const d = new Date(ms);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function formatDateTime(ms: number): string {
  const d = new Date(ms);
  return `${formatDay(ms)} ${d.getFullYear()} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** "Today" / "Yesterday" / "10 Oct" (with year when not this year). */
export function dayGroupLabel(ms: number, now = Date.now()): string {
  const startOf = (t: number) => {
    const d = new Date(t);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };
  const diffDays = Math.round((startOf(now) - startOf(ms)) / 86_400_000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  const d = new Date(ms);
  return d.getFullYear() === new Date(now).getFullYear() ? formatDay(ms) : `${formatDay(ms)} ${d.getFullYear()}`;
}

export function entryCode(no: number): string {
  return `#${String(no).padStart(3, '0')}`;
}

/** Stored name, else the template name. */
export function displayName(no: number, stored: string | null | undefined): string {
  return stored ?? ENTRIES[no - 1].templateName;
}

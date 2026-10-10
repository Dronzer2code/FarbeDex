// Namer output validation — docs/DEX_SPEC.md → NAMER OUTPUT RULES. Pure (unit-tested).
import { findBlocked } from './blocklist';

/** Normalises spacing and casing to Title Case (each word / hyphen part capitalised). */
export function toTitleCase(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((w) =>
      w
        .split('-')
        .map((p) => (p ? p[0].toUpperCase() + p.slice(1).toLowerCase() : p))
        .join('-'),
    )
    .join(' ');
}

export type NameRejection = 'FORMAT' | 'LENGTH' | 'WORDS' | 'DUPLICATE' | 'BLOCKED' | 'TEMPLATE';

export function validateName(
  raw: unknown,
  opts: { usedNames: Iterable<string>; templateName: string },
): { ok: true; name: string } | { ok: false; reason: NameRejection; detail: string } {
  if (typeof raw !== 'string') return { ok: false, reason: 'FORMAT', detail: 'not a string' };
  const name = toTitleCase(raw);
  if (!/^[A-Za-z][A-Za-z' -]*[A-Za-z]$/.test(name)) return { ok: false, reason: 'FORMAT', detail: 'only letters, spaces, hyphens, apostrophes' };
  if (name.length < 3 || name.length > 28) return { ok: false, reason: 'LENGTH', detail: '3-28 characters' };
  const words = name.split(' ');
  if (words.length < 1 || words.length > 3) return { ok: false, reason: 'WORDS', detail: '1-3 words' };
  const blocked = findBlocked(name);
  if (blocked) return { ok: false, reason: 'BLOCKED', detail: 'no brand or forbidden words' };
  if (name.toLowerCase() === opts.templateName.toLowerCase()) return { ok: false, reason: 'TEMPLATE', detail: 'more evocative than the plain colour name' };
  const lower = name.toLowerCase();
  for (const u of opts.usedNames) if (u.toLowerCase() === lower) return { ok: false, reason: 'DUPLICATE', detail: `"${name}" is already used` };
  return { ok: true, name };
}

/** Design note: ≤ 25 words, a sentence of interface advice, no URLs/numbers-as-facts, no blocked words. */
export function validateNote(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const note = raw.trim().replace(/\s+/g, ' ');
  const words = note.split(' ').filter(Boolean);
  if (words.length < 4 || words.length > 25) return null;
  if (/https?:|www\.|[<>{}[\]]/.test(note)) return null;
  if (findBlocked(note)) return null;
  // Facts about nature are out of scope for the note (DEX_SPEC); reject obvious fact patterns.
  if (/\b(because|due to|scientists?|species|chlorophyll|pigments?|wavelengths?|percent|%|\d{2,})\b/i.test(note)) return null;
  return note.endsWith('.') ? note : `${note}.`;
}

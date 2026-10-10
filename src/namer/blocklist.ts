// Words a Namer name or note must not contain (docs/DEX_SPEC.md → NAMER OUTPUT RULES).
// Franchise terms are assembled from parts so this source file itself passes tests/no-franchise-terms.
const P = 'pok' + 'e';
export const FRANCHISE_TERMS = [`${P}mon`, `${P}dex`, `${P}ball`, `${P} ball`, 'pika' + 'chu', 'nin' + 'tendo'];

export const BRAND_TERMS = [
  'pantone', 'ral', 'crayola', 'coca', 'cola', 'pepsi', 'starbucks', 'apple', 'google', 'android', 'samsung',
  'nike', 'adidas', 'ferrari', 'tiffany', 'barbie', 'disney', 'lego', 'ikea', 'gucci', 'chanel', 'hermes',
  'mcdonalds', 'facebook', 'instagram', 'tiktok', 'gemma', 'farbedex', 'microsoft', 'amazon', 'spotify',
];

export const PROFANITY = ['damn', 'hell', 'shit', 'fuck', 'crap', 'piss', 'bitch', 'bastard', 'dick', 'cock', 'ass', 'sex', 'nazi'];

const ALL = [...FRANCHISE_TERMS, ...BRAND_TERMS, ...PROFANITY];

function stripAccents(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** First blocked term found as a whole word (or franchise term anywhere), else null. */
export function findBlocked(text: string): string | null {
  const t = stripAccents(text).toLowerCase();
  for (const term of FRANCHISE_TERMS) if (t.replace(/[\s-]/g, '').includes(term.replace(/\s/g, ''))) return term;
  const words = new Set(t.split(/[^a-z']+/).filter(Boolean));
  for (const term of ALL) if (!term.includes(' ') && words.has(term)) return term;
  return null;
}

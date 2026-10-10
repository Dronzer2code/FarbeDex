import { ENTRIES } from '../src/dex/entries.generated';
import { buildEntries } from '../src/dex/buildEntries';
import { templateNameFor, toneFor } from '../src/dex/rules';

describe('dex rarity and generated entries', () => {
  it('tier counts are 42/42/37/21/9 (AC-F9.1)', () => {
    const counts: Record<string, number> = {};
    for (const e of ENTRIES) counts[e.rarity] = (counts[e.rarity] ?? 0) + 1;
    expect(counts).toEqual({ COMMON: 42, UNCOMMON: 42, RARE: 37, LEGENDARY: 21, MYTHICAL: 9 });
  });

  it('entries.generated.ts is in sync with the rules (run npm run build:dex)', () => {
    expect(ENTRIES).toEqual(buildEntries());
  });

  it('has 151 numbered entries with valid hex', () => {
    expect(ENTRIES).toHaveLength(151);
    ENTRIES.forEach((e, i) => {
      expect(e.no).toBe(i + 1);
      expect(e.code).toBe(`#${String(i + 1).padStart(3, '0')}`);
      expect(e.canonical.hex).toMatch(/^#[0-9A-F]{6}$/);
    });
  });

  it('template names and tones follow the spec', () => {
    expect(templateNameFor(4)).toBe('Stone');
    expect(templateNameFor(8 + 9 * 6 + 0 + 0)).toBe('Dusty Deep Green');
    expect(templateNameFor(8 + 9 * 10 + 6 + 1)).toBe('Pale Azure');
    expect(templateNameFor(8 + 9 * 4 + 3 + 2)).toBe('Vivid Gold');
    expect(toneFor(8 + 9 * 6)).toBe('deep dusty');
    expect(toneFor(8 + 9 * 10 + 6 + 1)).toBe('pale');
  });
});

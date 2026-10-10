import notes from '../assets/field-notes.json';
import { fieldNotesForFamily, verifiedFieldNotes, type FieldNote } from '../src/dex/fieldNotes';
import { HUE_FAMILIES } from '../src/dex/rules';

const all = notes as FieldNote[];

describe('field notes', () => {
  it('only verified cards are shown', () => {
    const mixed = [{ ...all[0], verified: true }, { ...all[1], verified: false }];
    expect(verifiedFieldNotes(mixed).map((n) => n.id)).toEqual([all[0].id]);
    expect(fieldNotesForFamily('Blue', mixed).map((n) => n.id)).toEqual([all[0].id]);
  });

  it('cards follow the seed schema (body ≤ 60 words, known families, https source)', () => {
    const families = new Set<string>(['Neutral', ...HUE_FAMILIES]);
    for (const n of all) {
      expect(n.body.split(/\s+/).length).toBeLessThanOrEqual(60);
      n.families.forEach((f) => expect(families.has(f)).toBe(true));
      expect(n.sourceUrl.startsWith('https://')).toBe(true);
      expect(typeof n.verified).toBe('boolean');
    }
  });
});

import { foundIn } from '../src/dex/foundIn';

describe('found-in bar', () => {
  it('top 3 subjects as % of the summed share, remainder other', () => {
    const r = foundIn([
      { subject_label: 'moss', pct: 30 },
      { subject_label: 'moss', pct: 30 },
      { subject_label: 'tree bark', pct: 20 },
      { subject_label: 'rock', pct: 5 },
      { subject_label: 'sky', pct: 5 },
      { subject_label: null, pct: 10 },
    ]);
    expect(r).toEqual([
      { label: 'moss', pct: 60 },
      { label: 'tree bark', pct: 20 },
      { label: 'rock', pct: 5 },
      { label: 'other', pct: 15 },
    ]);
    expect(r.reduce((s, x) => s + x.pct, 0)).toBeCloseTo(100, 6);
  });

  it('empty without catches', () => {
    expect(foundIn([])).toEqual([]);
  });
});

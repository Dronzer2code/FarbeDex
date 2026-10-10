import { ENTRIES } from '../src/dex/entries.generated';
import { NO_FILTER, filterEntries, type EntryState } from '../src/dex/filter';

const states = new Map<number, EntryState>([
  [4, { timesCaught: 2, name: 'Wet Pebble' }],
  [67, { timesCaught: 1, name: 'Moss Velvet' }],
  [100, { timesCaught: 0, name: 'Old Name' }], // uncaught but named
]);

describe('dex filter', () => {
  it('All shows 151; Caught/Missing split by timesCaught (AC-F4.3)', () => {
    expect(filterEntries(ENTRIES, states, NO_FILTER)).toHaveLength(151);
    expect(filterEntries(ENTRIES, states, { ...NO_FILTER, status: 'CAUGHT' }).map((e) => e.no)).toEqual([4, 67]);
    const missing = filterEntries(ENTRIES, states, { ...NO_FILTER, status: 'MISSING' });
    expect(missing).toHaveLength(149);
    expect(missing.every((e) => ![4, 67].includes(e.no))).toBe(true);
  });

  it('search by number and by name', () => {
    expect(filterEntries(ENTRIES, states, { ...NO_FILTER, query: '#067' }).map((e) => e.no)).toEqual([67]);
    expect(filterEntries(ENTRIES, states, { ...NO_FILTER, query: '4' }).map((e) => e.no)).toEqual([4]);
    expect(filterEntries(ENTRIES, states, { ...NO_FILTER, query: 'moss' }).map((e) => e.no)).toEqual([67]);
  });

  it('rarity and family filters', () => {
    expect(filterEntries(ENTRIES, states, { ...NO_FILTER, rarity: 'MYTHICAL' })).toHaveLength(9);
    expect(filterEntries(ENTRIES, states, { ...NO_FILTER, family: 'Neutral' })).toHaveLength(7);
    expect(filterEntries(ENTRIES, states, { ...NO_FILTER, family: 'Green' })).toHaveLength(9);
  });
});

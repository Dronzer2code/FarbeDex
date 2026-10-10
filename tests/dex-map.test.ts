import { hexToOklab, oklchToOklab } from '../src/color/oklab';
import { entryNoForOklab } from '../src/dex/map';
import { neighborsOf, stepEntry } from '../src/dex/neighbors';
import { chromaticEntryNo, entryCoords } from '../src/dex/rules';

describe('dex map', () => {
  it('pure grey L 0.6 → #004 Stone', () => {
    expect(entryNoForOklab(oklchToOklab({ l: 0.6, c: 0, h: 0 }))).toBe(4);
  });

  it('neutral bands follow L ranges', () => {
    expect(entryNoForOklab(hexToOklab('#000000'))).toBe(1);
    expect(entryNoForOklab(hexToOklab('#FFFFFF'))).toBe(7);
  });

  it('low chroma counts as neutral', () => {
    expect(entryNoForOklab(oklchToOklab({ l: 0.55, c: 0.02, h: 140 }))).toBe(4);
  });

  it('a vivid mid green maps to Green / Mid / Vivid', () => {
    // sRGB #00A000: OKLCH h ≈ 142° (sector 6 Green), L ≈ 0.62 (Mid), max chroma (Vivid).
    expect(entryNoForOklab(hexToOklab('#00A000'))).toBe(chromaticEntryNo(6, 1, 2));
  });

  it('entryCoords inverts chromaticEntryNo', () => {
    for (let s = 0; s < 16; s++)
      for (const l of [0, 1, 2] as const)
        for (const c of [0, 1, 2] as const) {
          const e = entryCoords(chromaticEntryNo(s, l, c));
          expect([e.sector, e.lBand, e.cBand]).toEqual([s, l, c]);
        }
  });

  it('neighbors and prev/next wrap', () => {
    expect(neighborsOf(1).map((n) => n.no)).toEqual([2]);
    expect(neighborsOf(7).map((n) => n.no)).toEqual([6]);
    const n = neighborsOf(chromaticEntryNo(0, 1, 1));
    expect(n.find((x) => x.kind === 'Prev hue')!.no).toBe(chromaticEntryNo(15, 1, 1));
    expect(stepEntry(151, 1)).toBe(1);
    expect(stepEntry(1, -1)).toBe(151);
  });
});

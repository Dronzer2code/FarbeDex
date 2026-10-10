import { extractPalette } from '../src/color/extract';
import { largestRemainder } from '../src/color/percent';
import { mulberry32 } from '../src/color/prng';

/** Image with given colour regions (fractions) plus a little noise. */
function image(regions: { rgb: [number, number, number]; frac: number }[], n = 160 * 120): Uint8Array {
  const rand = mulberry32(7);
  const data = new Uint8Array(n * 4);
  let i = 0;
  for (const { rgb, frac } of regions) {
    const count = Math.round(frac * n);
    for (let k = 0; k < count && i < n; k++, i++) {
      for (let c = 0; c < 3; c++) data[i * 4 + c] = Math.max(0, Math.min(255, rgb[c] + Math.round((rand() - 0.5) * 6)));
      data[i * 4 + 3] = 255;
    }
  }
  for (; i < n; i++) data.set([...regions[0].rgb, 255], i * 4);
  return data;
}

const sum = (xs: number[]) => Math.round(xs.reduce((s, v) => s + v, 0) * 10) / 10;

describe('extract', () => {
  const scene = image([
    { rgb: [120, 170, 230], frac: 0.4 }, // sky
    { rgb: [70, 110, 50], frac: 0.3 }, // leaves
    { rgb: [90, 70, 50], frac: 0.2 }, // bark
    { rgb: [230, 60, 90], frac: 0.08 }, // flower
    { rgb: [250, 240, 20], frac: 0.02 }, // a speck → Other
  ]);

  it('percentages sum to exactly 100.0 (AC-F3.1)', () => {
    const { swatches, otherPct } = extractPalette(scene);
    expect(sum([...swatches.map((s) => s.pct), otherPct])).toBe(100);
    swatches.forEach((s) => expect(Math.round(s.pct * 10)).toBe(s.pct * 10));
  });

  it('1–7 swatches, each ≥ 3%, sorted descending, small specks go to Other', () => {
    const { swatches, otherPct } = extractPalette(scene);
    expect(swatches.length).toBeGreaterThanOrEqual(1);
    expect(swatches.length).toBeLessThanOrEqual(7);
    swatches.forEach((s) => expect(s.pct).toBeGreaterThanOrEqual(3));
    for (let i = 1; i < swatches.length; i++) expect(swatches[i - 1].pct).toBeGreaterThanOrEqual(swatches[i].pct);
    expect(otherPct).toBeGreaterThan(0);
    expect(swatches.map((s) => s.rank)).toEqual(swatches.map((_, i) => i));
    expect(new Set(swatches.map((s) => s.entryNo)).size).toBe(swatches.length);
  });

  it('is deterministic (AC-F3.2)', () => {
    expect(extractPalette(scene)).toEqual(extractPalette(scene.slice()));
  });

  it('a single-colour photo gives one 100% swatch', () => {
    const { swatches, otherPct } = extractPalette(image([{ rgb: [95, 122, 58], frac: 1 }]));
    expect(swatches).toHaveLength(1);
    expect(swatches[0].pct + otherPct).toBe(100);
  });

  it('largestRemainder sums exactly', () => {
    expect(largestRemainder([1, 1, 1], 1000)).toEqual([334, 333, 333]);
    expect(largestRemainder([0.5, 0.25, 0.25], 1000)).toEqual([500, 250, 250]);
  });
});

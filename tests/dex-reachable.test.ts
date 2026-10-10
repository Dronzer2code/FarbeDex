// docs/DEX_SPEC.md: sampling sRGB on a 32³ grid (step 8 per channel) reaches every Entry 1–151.
import { oklabToOklch, srgb8ToOklab } from '../src/color/oklab';
import { entryNoForOklch } from '../src/dex/rules';

describe('dex reachability', () => {
  it('all 151 Entries are reachable on the 32³ sRGB grid', () => {
    const counts = new Array(152).fill(0);
    for (let r = 0; r < 256; r += 8)
      for (let g = 0; g < 256; g += 8)
        for (let b = 0; b < 256; b += 8) {
          const { l, c, h } = oklabToOklch(srgb8ToOklab(r, g, b));
          counts[entryNoForOklch(l, c, h)]++;
        }
    const missing = counts.map((n, no) => ({ no, n })).filter(({ no, n }) => no >= 1 && n === 0);
    expect(missing).toEqual([]);
  });
});

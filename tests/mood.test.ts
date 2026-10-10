import { paletteMood } from '../src/color/mood';
import { hexToOklab, oklabToOklch } from '../src/color/oklab';

const s = (hex: string, pct: number) => ({ ...oklabToOklch(hexToOklab(hex)), pct });

describe('palette mood', () => {
  it('names the reference blues COOL', () => {
    expect(paletteMood([s('#272B6B', 20), s('#2E3192', 20), s('#5A76C0', 20), s('#4FB3E8', 20), s('#E3F4F7', 20)])).toBe('COOL');
  });
  it('greens are FRESH, browns EARTHY, greys MUTED', () => {
    expect(paletteMood([s('#3C6E2E', 50), s('#6A9A3E', 50)])).toBe('FRESH');
    expect(paletteMood([s('#7A5A3C', 60), s('#9A7B5A', 40)])).toBe('EARTHY');
    expect(paletteMood([s('#777777', 60), s('#8A8A8A', 40)])).toBe('MUTED');
  });
  it('handles empty input', () => {
    expect(paletteMood([])).toBe('QUIET');
  });
});

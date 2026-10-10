import { contrastRatio } from '../src/color/contrast';
import { contrastPairs, toCss, toTailwind, toTokens } from '../src/export/formats';

const palette = [
  { no: 67, name: 'Wet Moss Stone', hex: '#5F7A3A', pct: 42 },
  { no: 104, name: 'Pale Azure', hex: '#78AAE6', pct: 31.5 },
  { no: 7, name: 'Chalk', hex: '#F4F4F2', pct: 20 },
];

describe('export (AC-F11.1)', () => {
  it('CSS uses --farbe-1..N in Distribution order with comments', () => {
    expect(toCss(palette)).toBe(
      ':root {\n' +
        '  /* #067 Wet Moss Stone · 42.0% */\n  --farbe-1: #5F7A3A;\n' +
        '  /* #104 Pale Azure · 31.5% */\n  --farbe-2: #78AAE6;\n' +
        '  /* #007 Chalk · 20.0% */\n  --farbe-3: #F4F4F2;\n' +
        '}\n',
    );
  });

  it('Tailwind and tokens contain the same values', () => {
    const tw = toTailwind(palette);
    expect(tw).toContain("farbe: {");
    expect(tw).toContain("1: '#5F7A3A'");
    expect(tw).toContain("3: '#F4F4F2'");
    const tokens = JSON.parse(toTokens(palette));
    expect(tokens.farbe['2']).toEqual({ $type: 'color', $value: '#78AAE6', $description: '#104 Pale Azure · 31.5%' });
    expect(Object.keys(tokens.farbe)).toEqual(['1', '2', '3']);
  });

  it('contrast ratios follow WCAG 2.x', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#777777', '#FFFFFF')).toBeCloseTo(4.48, 2);
    const pairs = contrastPairs(palette);
    expect(pairs).toHaveLength(3);
    expect(pairs[0].ratio).toBeGreaterThanOrEqual(pairs[1].ratio);
    pairs.forEach((p) => expect(['AA', 'AA-large', 'Fail']).toContain(p.grade));
  });
});

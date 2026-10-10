import { converter } from 'culori';

import { oklabToHex, oklabToOklch, srgb8ToOklab } from '../src/color/oklab';

const toOklab = converter('oklab');

const SAMPLES: [number, number, number][] = [
  [0, 0, 0],
  [255, 255, 255],
  [255, 0, 0],
  [0, 255, 0],
  [0, 0, 255],
  [95, 122, 58],
  [128, 128, 128],
  [17, 200, 230],
  [250, 120, 10],
];

describe('oklab', () => {
  it.each(SAMPLES)('matches culori for rgb(%i,%i,%i) within 1e-6', (r, g, b) => {
    const ours = srgb8ToOklab(r, g, b);
    const ref = toOklab({ mode: 'rgb', r: r / 255, g: g / 255, b: b / 255 })!;
    expect(Math.abs(ours.l - ref.l)).toBeLessThan(1e-6);
    expect(Math.abs(ours.a - ref.a)).toBeLessThan(1e-6);
    expect(Math.abs(ours.b - ref.b)).toBeLessThan(1e-6);
  });

  it.each(SAMPLES)('round-trips rgb(%i,%i,%i) through hex', (r, g, b) => {
    const p = srgb8ToOklab(r, g, b);
    const hex = `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
    expect(oklabToHex(p.l, p.a, p.b)).toBe(hex);
  });

  it('computes OKLCH hue in [0, 360)', () => {
    const { h, c } = oklabToOklch(srgb8ToOklab(0, 0, 255));
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThan(360);
    expect(c).toBeGreaterThan(0.3);
  });
});

import { hexToOklab, oklabToOklch } from '../src/color/oklab';
import { colourShares, refineSubject } from '../src/referee/subjectPrior';

const p = (hex: string, pct: number) => ({ oklch: oklabToOklch(hexToOklab(hex)), pct });
const SKY = [p('#6FA8E8', 55), p('#A9CBF2', 25), p('#F2F4F7', 20)];
const LEAVES = [p('#3C6E2E', 60), p('#6A9A3E', 25), p('#2B3324', 15)];

describe('subject colour sanity check', () => {
  it('a blue sky photo can never be "fern" (team report)', () => {
    const r = refineSubject({ fern: 0.55, sky: 0.3, grass: 0.1, clouds: 0.05 }, SKY);
    expect(r?.label).toBe('sky');
  });

  it('keeps a plausible top label', () => {
    expect(refineSubject({ fern: 0.6, moss: 0.3, sky: 0.1 }, LEAVES)?.label).toBe('fern');
  });

  it('returns null rather than a wrong label when nothing plausible is confident', () => {
    expect(refineSubject({ fern: 0.9, moss: 0.1 }, SKY)).toBeNull();
    expect(refineSubject({}, SKY)).toBeNull();
  });

  it('computes colour shares', () => {
    const s = colourShares(SKY);
    expect(s.blue + s.lightNeutral).toBeGreaterThan(0.9);
    expect(colourShares(LEAVES).green).toBeGreaterThan(0.8);
  });
});

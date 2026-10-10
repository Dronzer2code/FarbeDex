// Cmax(L, h): max in-gamut chroma — docs/DEX_SPEC.md → COLOUR CONVERSIONS.
// Binary search on C in [0, 0.4], 18 iterations; memoised by round(L·200), round(h) and computed at
// those rounded values so the result depends only on the key.
import { inSrgbGamut, oklabToHex, oklchToOklab } from './oklab';

const memo = new Map<number, number>();

export function cmax(L: number, h: number): number {
  const lk = Math.round(L * 200);
  const hk = Math.round(h) % 360;
  const key = lk * 1000 + hk;
  const hit = memo.get(key);
  if (hit !== undefined) return hit;

  const l = lk / 200;
  const rad = (hk * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  let lo = 0;
  let hi = 0.4;
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2;
    if (inSrgbGamut(l, mid * cos, mid * sin)) lo = mid;
    else hi = mid;
  }
  memo.set(key, lo);
  return lo;
}

/** Relative chroma rc = C / Cmax(L, h); 0 when Cmax = 0. */
export function relativeChroma(L: number, C: number, h: number): number {
  const m = cmax(L, h);
  return m > 0 ? C / m : 0;
}

/** OKLCH → hex, reducing chroma until in gamut (docs/DEX_SPEC.md → Canonical colour). */
export function oklchToHexClipped(l: number, c: number, h: number): { hex: string; c: number } {
  let { a, b } = oklchToOklab({ l, c, h });
  if (inSrgbGamut(l, a, b)) return { hex: oklabToHex(l, a, b), c };
  let lo = 0;
  let hi = c;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    ({ a, b } = oklchToOklab({ l, c: mid, h }));
    if (inSrgbGamut(l, a, b)) lo = mid;
    else hi = mid;
  }
  ({ a, b } = oklchToOklab({ l, c: lo, h }));
  return { hex: oklabToHex(l, a, b), c: lo };
}

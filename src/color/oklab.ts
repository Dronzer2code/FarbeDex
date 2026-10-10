// sRGB ↔ OKLab/OKLCH (Björn Ottosson's matrices, as in culori) — docs/DEX_SPEC.md → COLOUR CONVERSIONS.
// Hand-written for per-pixel speed; tests/oklab.test.ts checks it against culori.

export interface Oklab {
  l: number;
  a: number;
  b: number;
}

export interface Oklch {
  l: number;
  c: number;
  h: number; // degrees [0, 360)
}

function srgbChannelToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function linearChannelToSrgb(c: number): number {
  const abs = Math.abs(c);
  const v = abs <= 0.0031308 ? abs * 12.92 : 1.055 * Math.pow(abs, 1 / 2.4) - 0.055;
  return c < 0 ? -v : v;
}

/** 256-entry lookup: 8-bit sRGB → linear. */
export const SRGB8_TO_LINEAR: Float64Array = (() => {
  const lut = new Float64Array(256);
  for (let i = 0; i < 256; i++) lut[i] = srgbChannelToLinear(i / 255);
  return lut;
})();

export function linearToOklab(r: number, g: number, b: number): Oklab {
  const l = Math.cbrt(0.412221469470763 * r + 0.5363325372617348 * g + 0.0514459932675022 * b);
  const m = Math.cbrt(0.2119034958178252 * r + 0.6806995506452344 * g + 0.1073969535369406 * b);
  const s = Math.cbrt(0.0883024591900564 * r + 0.2817188391361215 * g + 0.6299787016738222 * b);
  return {
    l: 0.210454268309314 * l + 0.7936177747023054 * m - 0.0040720430116193 * s,
    a: 1.9779985324311684 * l - 2.4285922420485799 * m + 0.450593709617411 * s,
    b: 0.0259040424655478 * l + 0.7827717124575296 * m - 0.8086757549230774 * s,
  };
}

/** OKLab → linear sRGB (may be outside [0,1]). */
export function oklabToLinear(L: number, a: number, b: number): [number, number, number] {
  const l = Math.pow(L + 0.3963377773761749 * a + 0.2158037573099136 * b, 3);
  const m = Math.pow(L - 0.1055613458156586 * a - 0.0638541728258133 * b, 3);
  const s = Math.pow(L - 0.0894841775298119 * a - 1.2914855480194092 * b, 3);
  return [
    4.0767416360759574 * l - 3.3077115392580616 * m + 0.2309699031821044 * s,
    -1.2684379732850317 * l + 2.6097573492876887 * m - 0.3413193760026573 * s,
    -0.0041960761386756 * l - 0.7034186179359362 * m + 1.7076146940746117 * s,
  ];
}

export function srgb8ToOklab(r: number, g: number, b: number): Oklab {
  return linearToOklab(SRGB8_TO_LINEAR[r], SRGB8_TO_LINEAR[g], SRGB8_TO_LINEAR[b]);
}

export function oklabToOklch({ l, a, b }: Oklab): Oklch {
  const c = Math.sqrt(a * a + b * b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  if (h >= 360) h -= 360;
  return { l, c, h };
}

export function oklchToOklab({ l, c, h }: Oklch): Oklab {
  const rad = (h * Math.PI) / 180;
  return { l, a: c * Math.cos(rad), b: c * Math.sin(rad) };
}

/** OKLab → gamma-encoded sRGB in [0,1] (unclamped). */
export function oklabToSrgb(L: number, a: number, b: number): [number, number, number] {
  const [r, g, bl] = oklabToLinear(L, a, b);
  return [linearChannelToSrgb(r), linearChannelToSrgb(g), linearChannelToSrgb(bl)];
}

export const GAMUT_EPS = 1e-4;

export function inSrgbGamut(L: number, a: number, b: number, eps = GAMUT_EPS): boolean {
  const rgb = oklabToSrgb(L, a, b);
  return rgb.every((v) => v >= -eps && v <= 1 + eps);
}

function toHex2(v: number): string {
  const n = Math.round(Math.min(1, Math.max(0, v)) * 255);
  return n.toString(16).padStart(2, '0').toUpperCase();
}

/** OKLab → '#RRGGBB' (channels clamped). */
export function oklabToHex(L: number, a: number, b: number): string {
  const [r, g, bl] = oklabToSrgb(L, a, b);
  return `#${toHex2(r)}${toHex2(g)}${toHex2(bl)}`;
}

export function hexToSrgb8(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) throw new Error(`Bad hex ${hex}`);
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function hexToOklab(hex: string): Oklab {
  const [r, g, b] = hexToSrgb8(hex);
  return srgb8ToOklab(r, g, b);
}

/** Euclidean distance in OKLab (ΔE_OK). */
export function deltaEOK(p: Oklab, q: Oklab): number {
  const dl = p.l - q.l;
  const da = p.a - q.a;
  const db = p.b - q.b;
  return Math.sqrt(dl * dl + da * da + db * db);
}

// One-word palette mood (title of the palette image). Deterministic fallback when Gemma's title is missing.
// Pure (unit-tested).

export interface MoodSwatch {
  l: number; // OKLCH lightness
  c: number; // OKLCH chroma
  h: number; // hue degrees
  pct: number;
}

export function paletteMood(sw: readonly MoodSwatch[]): string {
  const total = sw.reduce((s, x) => s + x.pct, 0);
  if (total <= 0) return 'QUIET';
  const w = (f: (x: MoodSwatch) => number) => sw.reduce((s, x) => s + f(x) * x.pct, 0) / total;
  const avgL = w((x) => x.l);
  const avgC = w((x) => x.c);
  const share = (pred: (x: MoodSwatch) => boolean) => sw.filter((x) => x.c >= 0.03 && pred(x)).reduce((s, x) => s + x.pct, 0) / total;
  const cool = share((x) => x.h >= 170 && x.h < 300);
  const warm = share((x) => x.h < 95 || x.h >= 330);
  const green = share((x) => x.h >= 95 && x.h < 170);

  if (avgC < 0.035) return avgL > 0.7 ? 'AIRY' : avgL < 0.35 ? 'MOODY' : 'MUTED';
  if (avgC > 0.16) return 'VIVID';
  if (cool >= 0.5) return 'COOL';
  if (green >= 0.5) return 'FRESH';
  if (warm >= 0.5) return avgC < 0.08 ? 'EARTHY' : 'WARM';
  if (avgL > 0.75) return 'AIRY';
  if (avgL < 0.35) return 'MOODY';
  return 'BALANCED';
}

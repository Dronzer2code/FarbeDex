// Colour sanity check for the Referee's subject label (team report 2026-10-10: a sky photo was labelled
// "fern"). The model's subject probabilities are vetoed when the photo's actual colours cannot support the
// subject (fern needs real green, sky needs blue or bright neutral, …). Pure (unit-tested).

export interface PaletteColour {
  oklch: { l: number; c: number; h: number };
  pct: number;
}

interface Shares {
  blue: number; // cyan → violet
  green: number;
  warm: number; // red / orange / yellow
  pinkPurple: number;
  neutral: number;
  lightNeutral: number;
  chromatic: number;
}

const CHROMA_MIN = 0.03;

export function colourShares(palette: readonly PaletteColour[]): Shares {
  const total = palette.reduce((s, p) => s + p.pct, 0) || 1;
  const sh: Shares = { blue: 0, green: 0, warm: 0, pinkPurple: 0, neutral: 0, lightNeutral: 0, chromatic: 0 };
  for (const p of palette) {
    const w = p.pct / total;
    const { l, c, h } = p.oklch;
    if (c < CHROMA_MIN) {
      sh.neutral += w;
      if (l > 0.7) sh.lightNeutral += w;
      continue;
    }
    sh.chromatic += w;
    if (h >= 190 && h < 300) sh.blue += w;
    else if (h >= 95 && h < 190) sh.green += w;
    else if (h >= 300 && h < 345) sh.pinkPurple += w;
    else sh.warm += w;
  }
  return sh;
}

/** Minimum colour evidence each subject needs (share of the palette, 0..1). */
const NEEDS: Record<string, (s: Shares) => boolean> = {
  sky: (s) => s.blue + s.lightNeutral >= 0.3,
  clouds: (s) => s.lightNeutral + s.neutral * 0.5 + s.blue >= 0.35,
  'sunset sky': (s) => s.warm + s.pinkPurple >= 0.25,
  'tree leaves': (s) => s.green >= 0.2,
  'autumn leaves': (s) => s.warm >= 0.25,
  grass: (s) => s.green >= 0.2,
  fern: (s) => s.green >= 0.25,
  moss: (s) => s.green >= 0.2,
  lichen: (s) => s.green + s.neutral >= 0.3,
  'tree bark': (s) => s.warm + s.neutral >= 0.35,
  flower: (s) => s.chromatic >= 0.12,
  'potted plant': (s) => s.green >= 0.12,
  fruit: (s) => s.warm + s.green + s.pinkPurple >= 0.2,
  soil: (s) => s.warm + s.neutral >= 0.4,
  rock: (s) => s.neutral + s.warm >= 0.4,
  sand: (s) => s.warm + s.lightNeutral + s.neutral >= 0.4,
  water: (s) => s.blue + s.green * 0.5 + s.neutral >= 0.3,
  wood: (s) => s.warm + s.neutral >= 0.35,
  'rusty metal': (s) => s.warm >= 0.2,
  'brick wall': (s) => s.warm >= 0.2,
  'painted wall': () => true,
};

export const SUBJECT_MIN = 0.2;

/**
 * Re-ranks subject probabilities by colour plausibility. Returns null when no plausible subject is
 * confident enough — better no label than a wrong one.
 */
export function refineSubject(
  probs: Readonly<Record<string, number>>,
  palette: readonly PaletteColour[],
): { label: string; score: number } | null {
  const entries = Object.entries(probs).filter(([, p]) => Number.isFinite(p));
  if (entries.length === 0 || palette.length === 0) return null;
  const sh = colourShares(palette);
  const total = entries.reduce((s, [, p]) => s + p, 0);
  if (total <= 0) return null;
  // Only colour-plausible subjects can win; confidence is measured against the model's original mass,
  // so a field of implausible labels cannot be renormalised back into a confident wrong answer.
  const plausible = entries.filter(([label]) => NEEDS[label]?.(sh) ?? true);
  if (plausible.length === 0) return null;
  const [label, p] = plausible.reduce((a, b) => (b[1] > a[1] ? b : a));
  const score = p / total;
  return score >= SUBJECT_MIN ? { label, score } : null;
}

// Palette extraction + Distribution — docs/DEX_SPEC.md → PALETTE EXTRACTION AND DISTRIBUTION (steps 2–8).
// Step 1 (downscale to 160 px + JPEG decode) happens in src/capture/imagePrep.ts.
import { entryNoForOklab } from '../dex/map';
import { kmeans } from './kmeans';
import { SRGB8_TO_LINEAR, linearToOklab, oklabToHex, oklabToOklch, type Oklch } from './oklab';
import { largestRemainder } from './percent';

export interface Swatch {
  entryNo: number;
  hex: string;
  oklch: Oklch;
  pct: number; // one decimal
  isNew: boolean; // set at commit time
  rank: number; // 0 = largest
}

/** A colour seen in the photo but below the palette cut (< 3% or beyond the top 7). Shown, never counted. */
export interface MinoritySwatch {
  entryNo: number;
  hex: string;
  pct: number; // one decimal, part of otherPct
}

export interface Extraction {
  swatches: Swatch[];
  otherPct: number;
  minority: MinoritySwatch[];
}

export const EXTRACT = {
  k: 8,
  maxIter: 15,
  tol: 0.001,
  mergeDeltaE: 0.035,
  minSharePct: 3.0,
  maxSwatches: 7,
} as const;

interface Cluster {
  l: number;
  a: number;
  b: number;
  w: number; // pixel fraction
}

/** RGBA (alpha ignored) → flat OKLab triples. */
export function rgbaToOklab(rgba: Uint8Array | Uint8ClampedArray): Float64Array {
  const n = rgba.length >> 2;
  const out = new Float64Array(n * 3);
  for (let i = 0; i < n; i++) {
    const p = linearToOklab(SRGB8_TO_LINEAR[rgba[i * 4]], SRGB8_TO_LINEAR[rgba[i * 4 + 1]], SRGB8_TO_LINEAR[rgba[i * 4 + 2]]);
    out[i * 3] = p.l;
    out[i * 3 + 1] = p.a;
    out[i * 3 + 2] = p.b;
  }
  return out;
}

function weightedMean(p: Cluster, q: Cluster): Cluster {
  const w = p.w + q.w;
  return { l: (p.l * p.w + q.l * q.w) / w, a: (p.a * p.w + q.a * q.w) / w, b: (p.b * p.w + q.b * q.w) / w, w };
}

/** Step 4: repeatedly merge the closest pair closer than `threshold` (area-weighted). */
export function mergeClusters(clusters: Cluster[], threshold: number): Cluster[] {
  const cs = clusters.slice();
  for (;;) {
    let bi = -1;
    let bj = -1;
    let bd = threshold;
    for (let i = 0; i < cs.length; i++)
      for (let j = i + 1; j < cs.length; j++) {
        const d = Math.hypot(cs[i].l - cs[j].l, cs[i].a - cs[j].a, cs[i].b - cs[j].b);
        if (d < bd) {
          bd = d;
          bi = i;
          bj = j;
        }
      }
    if (bi < 0) return cs;
    cs[bi] = weightedMean(cs[bi], cs[bj]);
    cs.splice(bj, 1);
  }
}

export function extractFromOklab(points: Float64Array | Float32Array): Extraction {
  const n = points.length / 3;
  if (n === 0) return { swatches: [], otherPct: 100, minority: [] };
  const { centroids, counts } = kmeans(points, EXTRACT.k, EXTRACT.maxIter, EXTRACT.tol);

  let clusters: Cluster[] = [];
  for (let c = 0; c < counts.length; c++) {
    if (counts[c] > 0) clusters.push({ l: centroids[c * 3], a: centroids[c * 3 + 1], b: centroids[c * 3 + 2], w: counts[c] / n });
  }
  clusters = mergeClusters(clusters, EXTRACT.mergeDeltaE);

  // Step 5: map to Entries and combine clusters of the same Entry.
  const byEntry = new Map<number, Cluster>();
  for (const cl of clusters) {
    const no = entryNoForOklab(cl);
    const prev = byEntry.get(no);
    byEntry.set(no, prev ? weightedMean(prev, cl) : cl);
  }

  // Steps 6 + 8: threshold, keep ≤ 7 largest, sort by share desc (tie: lower Entry number).
  const sorted = [...byEntry.entries()]
    .map(([entryNo, cl]) => ({ entryNo, cl }))
    .sort((p, q) => q.cl.w - p.cl.w || p.entryNo - q.entryNo);
  const kept = sorted.filter((s) => s.cl.w * 100 >= EXTRACT.minSharePct).slice(0, EXTRACT.maxSwatches);
  const keptShare = kept.reduce((s, k) => s + k.cl.w, 0);
  const otherShare = Math.max(0, 1 - keptShare);

  // Step 7: largest remainder to one decimal, Other included.
  const units = largestRemainder([...kept.map((k) => k.cl.w), otherShare], 1000);
  const swatches: Swatch[] = kept.map((k, i) => ({
    entryNo: k.entryNo,
    hex: oklabToHex(k.cl.l, k.cl.a, k.cl.b),
    oklch: oklabToOklch(k.cl),
    pct: units[i] / 10,
    isNew: false,
    rank: i,
  }));
  const otherPct = units[units.length - 1] / 10;
  // Minority colours: everything that did not make the palette, largest first; their % never exceeds Other.
  const keptSet = new Set(kept.map((k) => k.entryNo));
  let budget = Math.round(otherPct * 10);
  const minority: MinoritySwatch[] = [];
  for (const s of sorted) {
    if (keptSet.has(s.entryNo)) continue;
    const u = Math.min(budget, Math.round(s.cl.w * 1000));
    if (u <= 0) continue;
    budget -= u;
    minority.push({ entryNo: s.entryNo, hex: oklabToHex(s.cl.l, s.cl.a, s.cl.b), pct: u / 10 });
  }
  return { swatches, otherPct, minority };
}

/** Full extraction from decoded RGBA pixels (the 160 px analysis image). */
export function extractPalette(rgba: Uint8Array | Uint8ClampedArray): Extraction {
  return extractFromOklab(rgbaToOklab(rgba));
}

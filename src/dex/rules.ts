// The 151 Entries — docs/DEX_SPEC.md → THE 151 ENTRIES. Pure functions shared by build-dex and runtime.
import { relativeChroma } from '../color/gamut';

export type Rarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'LEGENDARY' | 'MYTHICAL';
export type Band = 0 | 1 | 2;

export const ENTRY_TOTAL = 151;

export const NEUTRAL_L_EDGES = [0, 0.22, 0.36, 0.5, 0.64, 0.78, 0.9, 1] as const;
export const NEUTRAL_LABELS = ['Ink', 'Charcoal', 'Slate', 'Stone', 'Pebble', 'Mist', 'Chalk'] as const;

export const HUE_FAMILIES = [
  'Rose', 'Red', 'Vermilion', 'Orange', 'Gold', 'Lime', 'Green', 'Jade',
  'Teal', 'Cyan', 'Azure', 'Blue', 'Indigo', 'Violet', 'Magenta', 'Fuchsia',
] as const;

export type HueFamily = (typeof HUE_FAMILIES)[number] | 'Neutral';

export const NEUTRAL_C_MAX = 0.025;
export const NEUTRAL_RC_MAX = 0.12;

export function isNeutral(C: number, rc: number): boolean {
  return C < NEUTRAL_C_MAX || rc < NEUTRAL_RC_MAX;
}

export function neutralBand(L: number): number {
  for (let i = 1; i < NEUTRAL_L_EDGES.length - 1; i++) if (L < NEUTRAL_L_EDGES[i]) return i - 1;
  return 6;
}

export function hueSector(h: number): number {
  return Math.floor(h / 22.5) % 16;
}

export function lightnessBand(L: number): Band {
  return L < 0.45 ? 0 : L < 0.72 ? 1 : 2;
}

export function chromaBand(rc: number): Band {
  return rc < 0.4 ? 0 : rc < 0.7 ? 1 : 2;
}

export function chromaticEntryNo(s: number, l: Band, c: Band): number {
  return 8 + 9 * s + 3 * l + c;
}

/** Maps an OKLCH colour to its Entry number (1..151). */
export function entryNoForOklch(L: number, C: number, h: number): number {
  const rc = relativeChroma(L, C, h);
  if (isNeutral(C, rc)) return 1 + neutralBand(L);
  return chromaticEntryNo(hueSector(h), lightnessBand(L), chromaBand(rc));
}

export interface EntryCoords {
  no: number;
  family: HueFamily;
  sector: number | null;
  lBand: Band | null;
  cBand: Band | null;
  neutralBand: number | null;
}

export function entryCoords(no: number): EntryCoords {
  if (no < 1 || no > ENTRY_TOTAL) throw new Error(`Entry ${no} out of range`);
  if (no <= 7) return { no, family: 'Neutral', sector: null, lBand: null, cBand: null, neutralBand: no - 1 };
  const k = no - 8;
  const sector = Math.floor(k / 9);
  const lBand = Math.floor((k % 9) / 3) as Band;
  const cBand = (k % 3) as Band;
  return { no, family: HUE_FAMILIES[sector], sector, lBand, cBand, neutralBand: null };
}

// RARITY
export const HUE_WEIGHT = [2, 1, 1, 0, 1, 0, 0, 1, 2, 2, 1, 2, 3, 3, 2, 2] as const;

export function rarityFor(no: number): Rarity {
  const { sector, lBand, cBand } = entryCoords(no);
  if (sector === null || lBand === null || cBand === null) return 'COMMON';
  if (cBand === 2 && (sector === 11 || sector === 12 || sector === 13)) return 'MYTHICAL';
  const skyAdjust = lBand === 2 && (sector === 10 || sector === 11) ? 1 : 0;
  const score = Math.max(0, HUE_WEIGHT[sector] + cBand - skyAdjust);
  if (score <= 1) return 'COMMON';
  if (score === 2) return 'UNCOMMON';
  if (score === 3) return 'RARE';
  if (score === 4) return 'LEGENDARY';
  return 'MYTHICAL';
}

// TEMPLATE NAMES
const CHROMA_WORD = ['Dusty', '', 'Vivid'] as const;
const LIGHT_WORD = ['Deep', '', 'Pale'] as const;

export function templateNameFor(no: number): string {
  const { family, lBand, cBand, neutralBand: nb } = entryCoords(no);
  if (nb !== null) return NEUTRAL_LABELS[nb];
  return [CHROMA_WORD[cBand!], LIGHT_WORD[lBand!], family].filter(Boolean).join(' ');
}

/** Namer "tone": `[lightWord chromaWord]` lowercased, e.g. "deep dusty" (docs/TRD.md → NAMER). */
export function toneFor(no: number): string {
  const { lBand, cBand, neutralBand: nb } = entryCoords(no);
  if (nb !== null) return 'neutral';
  return [LIGHT_WORD[lBand!], CHROMA_WORD[cBand!]].filter(Boolean).join(' ').toLowerCase() || 'clear';
}

// CANONICAL COLOUR
const CANON_L = [0.36, 0.585, 0.82] as const;
const CANON_RC = [0.27, 0.55, 0.85] as const;

export function canonicalOklch(no: number): { l: number; c: number; h: number; rcMid: number | null } {
  const { sector, lBand, cBand, neutralBand: nb } = entryCoords(no);
  if (nb !== null) {
    return { l: (NEUTRAL_L_EDGES[nb] + NEUTRAL_L_EDGES[nb + 1]) / 2, c: 0, h: 0, rcMid: null };
  }
  return { l: CANON_L[lBand!], c: NaN, h: 22.5 * sector! + 11.25, rcMid: CANON_RC[cBand!] };
}

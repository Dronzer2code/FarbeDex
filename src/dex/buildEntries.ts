// Builds the 151 EntryDefs from the rules (used by scripts/build-dex.ts and tests).
import { cmax, oklchToHexClipped } from '../color/gamut';
import { ENTRY_TOTAL, canonicalOklch, entryCoords, rarityFor, templateNameFor } from './rules';
import type { EntryDef } from './types';

const round = (v: number, d = 6) => Number(v.toFixed(d));

export function buildEntries(): EntryDef[] {
  const out: EntryDef[] = [];
  for (let no = 1; no <= ENTRY_TOTAL; no++) {
    const coords = entryCoords(no);
    const canon = canonicalOklch(no);
    const c = canon.rcMid === null ? 0 : canon.rcMid * cmax(canon.l, canon.h);
    const clipped = oklchToHexClipped(canon.l, c, canon.h);
    out.push({
      no,
      code: `#${String(no).padStart(3, '0')}`,
      family: coords.family,
      sector: coords.sector,
      lBand: coords.lBand,
      cBand: coords.cBand,
      neutralBand: coords.neutralBand,
      canonical: { l: round(canon.l), c: round(clipped.c), h: round(canon.h), hex: clipped.hex },
      rarity: rarityFor(no),
      templateName: templateNameFor(no),
    });
  }
  return out;
}

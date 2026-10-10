import type { Rarity } from './rules';

export type { Rarity };

export interface EntryDef {
  no: number; // 1..151
  code: string; // '#001'
  family: string; // 'Neutral' | 'Rose' | ... | 'Fuchsia'
  sector: number | null; // 0..15, null for Neutral
  lBand: 0 | 1 | 2 | null; // null for Neutral
  cBand: 0 | 1 | 2 | null;
  neutralBand: number | null; // 0..6 for Neutral, else null
  canonical: { l: number; c: number; h: number; hex: string };
  rarity: Rarity;
  templateName: string;
}

// Shiny colours (team request 2026-10-10): picking a Rare / Legendary / Mythical colour as a favourite has a
// 1-in-400 chance to be Shiny. Pure helpers (unit-tested).
import type { Rarity } from './rules';

export const SHINY_ODDS = 400;
export const SPECIAL_RARITIES: readonly Rarity[] = ['RARE', 'LEGENDARY', 'MYTHICAL'];

export function isSpecialRarity(r: Rarity): boolean {
  return SPECIAL_RARITIES.includes(r);
}

/** Rolls the shiny chance for one favourite pick. `rand` returns [0, 1). */
export function rollShiny(r: Rarity, rand: () => number = Math.random): boolean {
  return isSpecialRarity(r) && rand() < 1 / SHINY_ODDS;
}

/** Top `n` entry numbers by share (the default favourites when the user does not choose). */
export function defaultFavourites(swatches: readonly { entry_no: number; pct: number }[], n = 2): number[] {
  return [...swatches].sort((a, b) => b.pct - a.pct || a.entry_no - b.entry_no).slice(0, n).map((s) => s.entry_no);
}

export const FAVOURITES_PER_CATCH = 2;

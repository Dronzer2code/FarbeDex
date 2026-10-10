// Derived colours — docs/UI_DESIGN.md → DESIGN TOKENS.
import { contrastRatio } from '../color/contrast';
import { oklchToHexClipped } from '../color/gamut';
import { hexToOklab, oklabToOklch } from '../color/oklab';
import { ENTRIES } from '../dex/entries.generated';
import { HUE_FAMILIES } from '../dex/rules';
import { color } from './tokens';

/** Light tint of a colour: OKLCH L = min(0.94, L + 0.25), C = C · 0.45. */
export function tint(hex: string): string {
  const { l, c, h } = oklabToOklch(hexToOklab(hex));
  return oklchToHexClipped(Math.min(0.94, l + 0.25), c * 0.45, h).hex;
}

/** ink or white, whichever contrasts more with `hex`. */
export function onColor(hex: string): string {
  return contrastRatio(hex, color.ink) >= contrastRatio(hex, '#FFFFFF') ? color.ink : '#FFFFFF';
}

/** Representative dot colour of a Hue Family (its Mid / Clear Entry; Neutral → Stone). */
export function familyColor(family: string): string {
  const s = HUE_FAMILIES.indexOf(family as (typeof HUE_FAMILIES)[number]);
  if (s < 0) return ENTRIES[3].canonical.hex;
  return ENTRIES[8 + 9 * s + 3 + 1 - 1].canonical.hex;
}

/** Colour shown for an Entry: best sample if caught, else canonical. */
export function entryDisplayHex(no: number, bestHex: string | null): string {
  return bestHex ?? ENTRIES[no - 1].canonical.hex;
}

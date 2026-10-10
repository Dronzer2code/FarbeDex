// Colour → Entry mapping (docs/DEX_SPEC.md).
import { oklabToOklch, type Oklab } from '../color/oklab';
import { entryNoForOklch } from './rules';

export function entryNoForOklab(c: Oklab): number {
  const { l, c: chroma, h } = oklabToOklch(c);
  return entryNoForOklch(l, chroma, h);
}

// WCAG 2.x contrast — docs/TRD.md → EXPORT.
import { SRGB8_TO_LINEAR, hexToSrgb8 } from './oklab';

export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToSrgb8(hex);
  return 0.2126 * SRGB8_TO_LINEAR[r] + 0.7152 * SRGB8_TO_LINEAR[g] + 0.0722 * SRGB8_TO_LINEAR[b];
}

export function contrastRatio(hexA: string, hexB: string): number {
  const la = relativeLuminance(hexA);
  const lb = relativeLuminance(hexB);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export type ContrastGrade = 'AA' | 'AA-large' | 'Fail';

export function contrastGrade(ratio: number): ContrastGrade {
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3) return 'AA-large';
  return 'Fail';
}

// Original FarbeDex marks (docs/UI_DESIGN.md → BRAND). The mark is a drop split by three diagonal
// bands — never a circle with a horizontal band.
import { useRef } from 'react';
import Svg, { Circle, ClipPath, Defs, G, Path, Polygon } from 'react-native-svg';

import type { Rarity } from '../dex/rules';
import { rarityColor } from './tokens';

export const DROP_PATH = 'M32 3 C32 3 11 26 11 40 A21 21 0 0 0 53 40 C53 26 32 3 32 3 Z';
export const MARK_COLORS = ['#F2C48D', '#D9774E', '#3E5C7E'] as const;

let clipSeq = 0;

/** Prism-drop mark. `mono` draws all bands in one colour (watermarks) with stepped opacity. */
export function FarbeMark({ size = 32, mono, opacity = 1 }: { size?: number; mono?: string; opacity?: number }) {
  const id = useRef(`drop${clipSeq++}`).current;
  const [light, mid, deep] = mono ? [mono, mono, mono] : MARK_COLORS;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" opacity={opacity}>
      <Defs>
        <ClipPath id={id}>
          <Path d={DROP_PATH} />
        </ClipPath>
      </Defs>
      <G clipPath={`url(#${id})`}>
        <Polygon points="0,0 64,0 64,14 0,46" fill={light} opacity={mono ? 0.45 : 1} />
        <Polygon points="0,46 64,14 64,38 0,70" fill={mid} opacity={mono ? 0.7 : 1} />
        <Polygon points="0,70 64,38 64,64 0,64" fill={deep} />
      </G>
    </Svg>
  );
}

/** Rarity icons: Common ring · Uncommon two stacked dots · Rare diamond · Legendary 4-point star · Mythical crescent + spark. */
export function RarityIcon({ rarity, size = 16, color }: { rarity: Rarity; size?: number; color?: string }) {
  const c = color ?? rarityColor[rarity];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {rarity === 'COMMON' && <Circle cx={12} cy={12} r={7} stroke={c} strokeWidth={3} fill="none" />}
      {rarity === 'UNCOMMON' && (
        <>
          <Circle cx={12} cy={7} r={4.2} fill={c} />
          <Circle cx={12} cy={17} r={4.2} fill={c} />
        </>
      )}
      {rarity === 'RARE' && <Path d="M12 2 L21 12 L12 22 L3 12 Z" fill={c} />}
      {rarity === 'LEGENDARY' && <Path d="M12 1 L14.6 9.4 L23 12 L14.6 14.6 L12 23 L9.4 14.6 L1 12 L9.4 9.4 Z" fill={c} />}
      {rarity === 'MYTHICAL' && (
        <>
          <Path d="M15 3 A9.5 9.5 0 1 0 21 17 A7.5 7.5 0 1 1 15 3 Z" fill={c} />
          <Path d="M19 2 L19.9 4.6 L22.5 5.5 L19.9 6.4 L19 9 L18.1 6.4 L15.5 5.5 L18.1 4.6 Z" fill={c} />
        </>
      )}
    </Svg>
  );
}

export const RARITY_LABEL: Record<Rarity, string> = {
  COMMON: 'Common',
  UNCOMMON: 'Uncommon',
  RARE: 'Rare',
  LEGENDARY: 'Legendary',
  MYTHICAL: 'Mythical',
};

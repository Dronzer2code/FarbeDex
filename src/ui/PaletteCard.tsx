// Shareable palette image (team request 2026-10-10): colour stripes + one-word mood title, like a mood-board
// swatch card. Drawn with react-native-svg so it can be exported to PNG via Svg.toDataURL (no extra native code).
import { forwardRef } from 'react';
import Svg, { G, Rect, Text as SvgText } from 'react-native-svg';

import { fontFamily } from './tokens';

export interface CardColour {
  hex: string;
  l: number; // OKLCH lightness, for dark → light ordering
  no: number;
}

export const CARD_W = 360;
export const CARD_H = 450;
export const CARD_EXPORT = { width: 1080, height: 1350 };

export const PaletteCard = forwardRef<Svg, { colours: CardColour[]; title: string; caption?: string }>(function PaletteCard(
  { colours, title, caption },
  ref,
) {
  const sorted = [...colours].sort((a, b) => a.l - b.l).slice(0, 7);
  const pad = 20;
  const stripeH = 300;
  const w = (CARD_W - pad * 2) / Math.max(1, sorted.length);
  return (
    <Svg ref={ref} width="100%" height="100%" viewBox={`0 0 ${CARD_W} ${CARD_H}`}>
      <Rect x={0} y={0} width={CARD_W} height={CARD_H} fill="#FFFFFF" />
      <G>
        {sorted.map((c, i) => (
          <Rect key={c.no} x={pad + i * w} y={pad} width={w + 0.5} height={stripeH} fill={c.hex} />
        ))}
      </G>
      {sorted.map((c, i) => (
        <SvgText
          key={`t${c.no}`}
          x={pad + i * w + w / 2}
          y={pad + stripeH + 16}
          fontSize={sorted.length > 5 ? 7 : 8.5}
          fontFamily={fontFamily.mono500}
          fill="#6B6B76"
          textAnchor="middle"
        >
          {c.hex}
        </SvgText>
      ))}
      <SvgText x={pad} y={pad + stripeH + 62} fontSize={34} fontFamily={fontFamily.ui600} fill="#17171C" letterSpacing={2}>
        {title.toUpperCase()}
      </SvgText>
      {caption ? (
        <SvgText x={pad} y={pad + stripeH + 84} fontSize={10} fontFamily={fontFamily.ui400} fill="#6B6B76">
          {caption}
        </SvgText>
      ) : null}
      <SvgText x={CARD_W - pad} y={CARD_H - 14} fontSize={10} fontFamily={fontFamily.ui500} fill="#6B6B76" textAnchor="end">
        Caught outside with FarbeDex
      </SvgText>
    </Svg>
  );
});

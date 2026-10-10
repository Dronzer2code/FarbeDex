// Original line icons (react-native-svg). No franchise shapes (docs/UI_DESIGN.md → BRAND).
import Svg, { Circle, Path, Rect } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export function HomeIcon({ size = 24, color = '#17171C' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round">
      <Path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z" />
    </Svg>
  );
}

export function GridIcon({ size = 24, color = '#17171C' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8}>
      <Rect x={4} y={4} width={7} height={7} rx={2} />
      <Rect x={13} y={4} width={7} height={7} rx={2} />
      <Rect x={4} y={13} width={7} height={7} rx={2} />
      <Rect x={13} y={13} width={7} height={7} rx={2} />
    </Svg>
  );
}

export function AlbumIcon({ size = 24, color = '#17171C' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round">
      <Rect x={3.5} y={5} width={17} height={14} rx={3} />
      <Path d="m3.5 16 5-5 4 4 2.5-2.5 5.5 5.5" />
      <Circle cx={15.5} cy={9.5} r={1.5} />
    </Svg>
  );
}

export function SettingsIcon({ size = 24, color = '#17171C' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round">
      <Path d="M5 7h9M18 7h1M5 12h3M12 12h7M5 17h11M20 17h-1" />
      <Circle cx={16} cy={7} r={2} />
      <Circle cx={10} cy={12} r={2} />
      <Circle cx={18} cy={17} r={2} />
    </Svg>
  );
}

/** 6-blade camera aperture (iris) glyph for the Catch button. */
export function ApertureIcon({ size = 28, color = '#FFFFFF' }: IconProps) {
  const blades = [0, 60, 120, 180, 240, 300];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.7} strokeLinejoin="round">
      <Circle cx={12} cy={12} r={9.2} />
      {blades.map((deg) => (
        <Path key={deg} d="M12 2.8 L16.6 10.6" transform={`rotate(${deg} 12 12)`} />
      ))}
    </Svg>
  );
}

export function CloseIcon({ size = 24, color = '#FFFFFF' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
      <Path d="M6 6l12 12M18 6 6 18" />
    </Svg>
  );
}

export function ChevronIcon({ size = 24, color = '#17171C', direction = 'right' }: IconProps & { direction?: 'left' | 'right' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d={direction === 'right' ? 'm9 5 7 7-7 7' : 'm15 5-7 7 7 7'} />
    </Svg>
  );
}

export function FlashIcon({ size = 24, color = '#FFFFFF', on = false }: IconProps & { on?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={on ? color : 'none'} stroke={color} strokeWidth={1.8} strokeLinejoin="round">
      <Path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12z" />
    </Svg>
  );
}

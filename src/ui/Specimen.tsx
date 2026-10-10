// Organic pebble specimen (docs/UI_DESIGN.md → COMPONENTS). Variant = no % 3.
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Ellipse, Path } from 'react-native-svg';

import { usePrefs } from '../store/prefs';
import { onColor } from './colorUtils';
import { SpecimenFace } from './SpecimenFace';
import { color, fontFamily } from './tokens';

const PEBBLES = [
  'M52 9 C76 11 93 29 91 54 C89 77 70 93 47 92 C23 91 7 73 9 49 C11 26 29 7 52 9 Z',
  'M48 11 C69 6 90 20 92 43 C95 66 82 88 58 92 C34 96 11 82 8 59 C5 37 27 16 48 11 Z',
  'M55 9 C79 13 94 34 90 58 C86 80 65 94 42 90 C19 86 6 67 10 44 C14 22 33 6 55 9 Z',
] as const;

export type SpecimenSize = 56 | 120 | 200;

export function Specimen({
  no,
  hex,
  size = 56,
  missing,
  face = true,
}: {
  no: number;
  hex?: string;
  size?: SpecimenSize | number;
  missing?: boolean;
  /** Cozy face (team request 2026-10-10); also needs Settings → Faces on colours. */
  face?: boolean;
}) {
  const d = PEBBLES[no % 3];
  const facesEnabled = usePrefs((p) => p.facesEnabled);
  const showFace = face && facesEnabled && !missing && !!hex && size >= 30;
  const ink = showFace ? onColor(hex!) : '#000';
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {/* soft drop shadow */}
        <Ellipse cx={52} cy={94} rx={30} ry={4} fill="#000" opacity={missing ? 0.05 : 0.1} />
        {missing ? (
          <Path d={d} fill={color.silhouette} stroke={color.inkSoft} strokeOpacity={0.45} strokeWidth={200 / size} strokeDasharray="6 5" />
        ) : (
          <>
            <Path d={d} fill={hex ?? color.silhouette} />
            <Ellipse cx={36} cy={30} rx={15} ry={9} fill="#FFFFFF" opacity={0.25} transform="rotate(-25 36 30)" />
            {showFace ? <SpecimenFace no={no} ink={ink} spark={ink === '#FFFFFF' ? hex! : '#FFFFFF'} body={hex!} /> : null}
          </>
        )}
      </Svg>
      {missing ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={styles.center}>
            <Text style={[styles.q, { fontSize: Math.max(11, size * 0.2) }]}>???</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  q: { color: color.inkSoft, fontFamily: fontFamily.ui600 },
});

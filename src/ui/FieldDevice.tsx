// Home "colour field device" header (team request 2026-10-10: a cooler, collector-device dashboard).
// Original design: the shell takes the colour of the latest catch, a lens shows recent colours, a dark inset
// display reads out completion. Deliberately NOT a red device / blue lens / three coloured lights.
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { onColor, tint } from './colorUtils';
import { ApertureIcon } from './icons';
import { color, fontFamily, radius, space } from './tokens';

const DEFAULT_SHELL = '#3E5C7E';

export interface FieldDeviceProps {
  caught: number;
  total?: number;
  catchesToday: number;
  recentHexes: string[]; // newest first
  refereeReady: boolean;
  namerReady: boolean;
}

function Lens({ hexes, size }: { hexes: string[]; size: number }) {
  const [a, b, c] = [hexes[0] ?? '#F2C48D', hexes[1] ?? hexes[0] ?? '#D9774E', hexes[2] ?? hexes[1] ?? hexes[0] ?? '#3E5C7E'];
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id="lens" cx="38%" cy="35%" r="70%">
            <Stop offset="0" stopColor={tint(a)} />
            <Stop offset="0.45" stopColor={a} />
            <Stop offset="0.8" stopColor={b} />
            <Stop offset="1" stopColor={c} />
          </RadialGradient>
        </Defs>
        <Circle cx={50} cy={50} r={48} fill="#FFFFFF" />
        <Circle cx={50} cy={50} r={41} fill={color.ink} />
        <Circle cx={50} cy={50} r={36} fill="url(#lens)" />
        <Path d="M30 32 A26 26 0 0 1 52 22" stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" opacity={0.55} fill="none" />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
        <ApertureIcon size={size * 0.34} color="rgba(255,255,255,0.75)" />
      </View>
    </View>
  );
}

function Status({ label, ok, fg }: { label: string; ok: boolean; fg: string }) {
  return (
    <View style={[styles.status, { borderColor: fg === '#FFFFFF' ? 'rgba(255,255,255,0.35)' : 'rgba(23,23,28,0.2)' }]}>
      <Text style={[styles.statusText, { color: fg }]}>
        {label} {ok ? '✓' : '·'}
      </Text>
    </View>
  );
}

export function FieldDevice({ caught, total = 151, catchesToday, recentHexes, refereeReady, namerReady }: FieldDeviceProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const shell = recentHexes[0] ?? DEFAULT_SHELL;
  const fg = onColor(shell);
  const readout = `${String(caught).padStart(3, '0')} / ${total}`;
  return (
    <View
      style={{ backgroundColor: shell, paddingTop: insets.top + space[3] }}
      accessible
      accessibilityLabel={`FarbeDex: ${caught} of ${total} caught, ${catchesToday} catches today`}
    >
      <View style={styles.topRow}>
        <Lens hexes={recentHexes} size={92} />
        <View style={{ flex: 1, gap: space[2] }}>
          <Text style={[styles.brand, { color: fg }]}>FarbeDex</Text>
          <View style={styles.statusRow}>
            <Status label="Referee" ok={refereeReady} fg={fg} />
            <Status label="Namer" ok={namerReady} fg={fg} />
            <Status label="Offline" ok={refereeReady && namerReady} fg={fg} />
          </View>
        </View>
      </View>

      <View style={styles.display}>
        <View style={styles.displayRow}>
          <Text style={styles.readout}>{readout}</Text>
          <Text style={styles.displayLabel}>CAUGHT</Text>
        </View>
        <View style={styles.meter}>
          <View style={[styles.meterFill, { width: `${(caught / total) * 100}%`, backgroundColor: tint(shell) }]} />
        </View>
        <Text style={styles.displaySub}>
          {catchesToday === 0 ? 'No catches yet today — step outside.' : `${catchesToday} ${catchesToday === 1 ? 'catch' : 'catches'} today`}
        </Text>
      </View>

      <Svg width={width} height={36} viewBox={`0 0 ${width} 36`} preserveAspectRatio="none" style={{ marginTop: space[3] }}>
        <Path d={`M0 36 L0 22 Q${width / 2} -14 ${width} 22 L${width} 36 Z`} fill={color.bg} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: space[4], paddingHorizontal: space[4] },
  brand: { fontSize: 26, fontFamily: fontFamily.ui600, letterSpacing: 0.5 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  status: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  statusText: { fontSize: 11, fontFamily: fontFamily.ui500 },
  display: {
    marginTop: space[4],
    marginHorizontal: space[4],
    backgroundColor: 'rgba(23,23,28,0.88)',
    borderRadius: radius.md,
    padding: space[4],
    gap: space[2],
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  displayRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  readout: { fontFamily: fontFamily.mono500, fontSize: 34, color: '#E9FBEF', letterSpacing: 2 },
  displayLabel: { fontFamily: fontFamily.ui500, fontSize: 11, letterSpacing: 1.5, color: 'rgba(233,251,239,0.7)' },
  meter: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.12)', overflow: 'hidden' },
  meterFill: { height: 6, borderRadius: 3 },
  displaySub: { fontFamily: fontFamily.ui400, fontSize: 12, color: 'rgba(233,251,239,0.8)' },
});

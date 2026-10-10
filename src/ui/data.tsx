// Data display components: StatColumn, SegmentBar, SwatchRow, ValueRow (docs/UI_DESIGN.md → COMPONENTS).
import * as Clipboard from 'expo-clipboard';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { showToast } from './toast';
import { color, fontFamily, radius, space, type } from './tokens';

export function StatColumn({ icon, label, value }: { icon?: ReactNode; label: string; value: string }) {
  return (
    <View style={styles.stat} accessible accessibilityLabel={`${label}: ${value}`}>
      <View style={styles.statHead}>
        {icon}
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export interface Segment {
  key: string;
  label: string;
  pct: number;
  color: string;
}

export function SegmentBar({ segments, legend = true, height = 14 }: { segments: Segment[]; legend?: boolean; height?: number }) {
  const visible = segments.filter((s) => s.pct > 0);
  return (
    <View style={{ gap: space[2] }}>
      <View
        style={[styles.bar, { height }]}
        accessible
        accessibilityLabel={visible.map((s) => `${s.label} ${s.pct.toFixed(1)} percent`).join(', ')}
      >
        {visible.map((s, i) => (
          <View key={s.key} style={{ flex: s.pct, backgroundColor: s.color, marginLeft: i === 0 ? 0 : 2 }} />
        ))}
      </View>
      {legend ? (
        <View style={styles.legend}>
          {visible.map((s) => (
            <View key={s.key} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: s.color }]} />
              <Text style={styles.legendText} numberOfLines={1}>
                {s.label} <Text style={styles.mono}>{s.pct.toFixed(1)}%</Text>
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** Thin Distribution strip (Album thumbnails, catch result). */
export function DistributionStrip({ strip, otherPct, height = 6 }: { strip: { hex: string; pct: number }[]; otherPct: number; height?: number }) {
  return (
    <View style={[styles.strip, { height }]}>
      {strip.map((s, i) => (
        <View key={i} style={{ flex: s.pct, backgroundColor: s.hex }} />
      ))}
      {otherPct > 0 ? <View style={{ flex: otherPct, backgroundColor: color.silhouette }} /> : null}
    </View>
  );
}

export function NewPill() {
  return (
    <View style={styles.newPill} accessibilityLabel="new">
      <Text style={styles.newText}>NEW</Text>
    </View>
  );
}

export function SwatchRow({ hex, name, no, pct, isNew, onPress }: { hex: string; name: string; no: number; pct: number; isNew?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${pct.toFixed(1)} percent${isNew ? ', new' : ''}`}
      style={({ pressed }) => [styles.swatchRow, pressed && { opacity: 0.7 }]}
    >
      <View style={[styles.swatchDot, { backgroundColor: hex }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.swatchName} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.swatchNo}>#{String(no).padStart(3, '0')}</Text>
      </View>
      {isNew ? <NewPill /> : null}
      <Text style={styles.swatchPct}>{pct.toFixed(1)}%</Text>
    </Pressable>
  );
}

function CopyIcon({ size = 18, c = color.inkSoft }: { size?: number; c?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8}>
      <Rect x={8} y={8} width={12} height={12} rx={2.5} />
      <Path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </Svg>
  );
}

export function ValueRow({ label, value }: { label: string; value: string }) {
  const copy = async () => {
    await Clipboard.setStringAsync(value);
    showToast('Copied');
  };
  return (
    <View style={styles.valueRow}>
      <Text style={styles.valueLabel}>{label}</Text>
      <Text style={styles.value} selectable>
        {value}
      </Text>
      <Pressable onPress={copy} accessibilityRole="button" accessibilityLabel={`Copy ${label}`} hitSlop={8} style={styles.copy}>
        <CopyIcon />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  stat: { flex: 1, gap: 4 },
  statHead: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statLabel: { ...type.label, color: color.inkSoft },
  statValue: { ...type.stat, color: color.ink },
  bar: { flexDirection: 'row', borderRadius: radius.pill, overflow: 'hidden', backgroundColor: color.surface },
  legend: { flexDirection: 'row', flexWrap: 'wrap', columnGap: space[3], rowGap: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: '100%' },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 13, fontFamily: fontFamily.ui400, color: color.ink },
  mono: { fontFamily: fontFamily.mono500, color: color.inkSoft },
  strip: { flexDirection: 'row', borderRadius: 3, overflow: 'hidden' },
  newPill: { backgroundColor: color.ink, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  newText: { color: '#FFFFFF', fontSize: 11, fontFamily: fontFamily.ui600 },
  swatchRow: { flexDirection: 'row', alignItems: 'center', gap: space[3], minHeight: 56 },
  swatchDot: { width: 44, height: 44, borderRadius: 22 },
  swatchName: { fontSize: 15, fontFamily: fontFamily.ui500, color: color.ink },
  swatchNo: { fontSize: 13, fontFamily: fontFamily.mono500, color: color.inkSoft },
  swatchPct: { fontSize: 15, fontFamily: fontFamily.mono500, color: color.ink, minWidth: 56, textAlign: 'right' },
  valueRow: { flexDirection: 'row', alignItems: 'center', minHeight: 48, gap: space[3] },
  valueLabel: { ...type.label, color: color.inkSoft, width: 56 },
  value: { flex: 1, fontSize: 15, fontFamily: fontFamily.mono500, color: color.ink },
  copy: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  minority: { gap: space[2], paddingVertical: space[2] },
  minorityHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  minorityTitle: { fontSize: 15, fontFamily: fontFamily.ui500, color: color.inkSoft },
  minorityPct: { fontSize: 15, fontFamily: fontFamily.mono500, color: color.inkSoft },
  minorityHelp: { fontSize: 12, fontFamily: fontFamily.ui400, color: color.inkSoft },
  minorityWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  minorityChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: color.surfaceSunken, borderRadius: radius.pill, paddingHorizontal: 10, minHeight: 36 },
  minorityDot: { width: 16, height: 16, borderRadius: 8 },
  minorityCode: { fontSize: 12, fontFamily: fontFamily.mono500, color: color.ink },
  minorityChipPct: { fontSize: 12, fontFamily: fontFamily.mono500, color: color.inkSoft },
});

/** Colours seen in the photo but below the palette cut: shown, never counted (team decision 2026-10-10). */
export function MinorityColours({
  minority,
  otherPct,
  onPressEntry,
}: {
  minority: { entryNo: number; hex: string; pct: number }[];
  otherPct: number;
  onPressEntry?: (no: number) => void;
}) {
  if (otherPct <= 0) return null;
  return (
    <View style={styles.minority} accessible={!onPressEntry} accessibilityLabel={`Minority colours, ${otherPct.toFixed(1)} percent`}>
      <View style={styles.minorityHead}>
        <Text style={styles.minorityTitle}>Minority colours</Text>
        <Text style={styles.minorityPct}>{otherPct.toFixed(1)}%</Text>
      </View>
      <Text style={styles.minorityHelp}>Too small to count as a catch — look for them in bigger patches.</Text>
      {minority.length > 0 ? (
        <View style={styles.minorityWrap}>
          {minority.map((m) => (
            <Pressable
              key={m.entryNo}
              onPress={onPressEntry ? () => onPressEntry(m.entryNo) : undefined}
              disabled={!onPressEntry}
              accessibilityRole={onPressEntry ? 'button' : 'text'}
              accessibilityLabel={`Entry ${m.entryNo}, ${m.pct.toFixed(1)} percent, minority`}
              style={styles.minorityChip}
            >
              <View style={[styles.minorityDot, { backgroundColor: m.hex }]} />
              <Text style={styles.minorityCode}>#{String(m.entryNo).padStart(3, '0')}</Text>
              <Text style={styles.minorityChipPct}>{m.pct.toFixed(1)}%</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

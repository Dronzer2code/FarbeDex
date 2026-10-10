// Grid card (docs/UI_DESIGN.md → EntryCard). Mythical caught cards get an iridescent rotating border.
import { memo, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import type { EntryDef } from '../dex/types';
import { FarbeMark, RARITY_LABEL, RarityIcon } from './brand';
import { onColor } from './colorUtils';
import { Specimen } from './Specimen';
import { color, fontFamily, radius } from './tokens';

export interface EntryCardProps {
  entry: EntryDef;
  caught: boolean;
  name: string | null;
  hex: string | null; // best sample
  timesCaught?: number;
  label?: string; // e.g. Neighbor kind
  shiny?: boolean;
  compact?: boolean;
  onPress?: () => void;
}

/** Conic gradient approximated by 36 hue wedges (RN has no conic gradient). */
function ConicRing({ size }: { size: number }) {
  const r = size / 2;
  const wedges = Array.from({ length: 36 }, (_, i) => {
    const a0 = (i * 10 * Math.PI) / 180;
    const a1 = ((i + 1) * 10 * Math.PI) / 180;
    const d = `M${r} ${r} L${r + r * Math.cos(a0)} ${r + r * Math.sin(a0)} L${r + r * Math.cos(a1)} ${r + r * Math.sin(a1)} Z`;
    return <Path key={i} d={d} fill={`hsl(${i * 10}, 75%, 62%)`} />;
  });
  return (
    <Svg width={size} height={size}>
      {wedges}
    </Svg>
  );
}

function MythicalBorder() {
  const [{ width, height }, setSize] = useState({ width: 0, height: 0 });
  const reduce = useReducedMotion();
  const rot = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    rot.value = withRepeat(withTiming(360, { duration: 4000, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(rot);
  }, [reduce, rot]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }] }));
  const size = Math.ceil(Math.hypot(width, height));
  return (
    <View
      style={[StyleSheet.absoluteFill, styles.borderClip]}
      pointerEvents="none"
      onLayout={(e) => setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
    >
      {size > 0 ? (
      <Animated.View style={[{ position: 'absolute', left: (width - size) / 2, top: (height - size) / 2, width: size, height: size }, style]}>
        <ConicRing size={size} />
      </Animated.View>
      ) : null}
    </View>
  );
}

export const EntryCard = memo(function EntryCard({ entry, caught, name, hex, timesCaught, label, compact, shiny, onPress }: EntryCardProps) {
  const h = compact ? 96 : 120;
  const bg = caught ? hex ?? entry.canonical.hex : color.silhouetteBg;
  const fg = caught ? onColor(bg) : color.ink;
  const mythical = caught && entry.rarity === 'MYTHICAL';
  const a11y = caught
    ? `Entry ${entry.no}, ${name ?? 'unnamed'}, ${RARITY_LABEL[entry.rarity]}, caught ${timesCaught ?? 1} times`
    : `Entry ${entry.no}, not caught yet, ${entry.family} family, ${RARITY_LABEL[entry.rarity]}`;

  const card = (
    <View style={[styles.card, { height: mythical ? h - 4 : h, backgroundColor: bg }]}>
      <View style={styles.watermark} pointerEvents="none">
        <FarbeMark size={compact ? 54 : 70} mono={fg} opacity={0.12} />
      </View>
      <View style={styles.text}>
        {label ? <Text style={[styles.kind, { color: fg }]}>{label}</Text> : null}
        <Text style={[styles.name, { color: caught ? fg : color.inkSoft }]} numberOfLines={1}>
          {caught ? `${shiny ? '✦ ' : ''}${name ?? entry.templateName}` : '???'}
        </Text>
        <Text style={[styles.number, { color: caught ? fg : color.inkSoft, opacity: caught ? 0.8 : 1 }]}>{entry.code}</Text>
        {!compact ? (
          <View style={[styles.rarity, { backgroundColor: caught ? 'rgba(255,255,255,0.25)' : color.surface }]}>
            <RarityIcon rarity={entry.rarity} size={11} color={caught ? fg : undefined} />
            <Text style={[styles.rarityText, { color: caught ? fg : color.ink }]} numberOfLines={1}>
              {RARITY_LABEL[entry.rarity]}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={styles.specimen}>
        <Specimen no={entry.no} hex={caught ? bg : undefined} missing={!caught} shiny={caught && shiny} size={compact ? 44 : 56} />
      </View>
    </View>
  );

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      style={({ pressed }) => [{ flex: 1, height: h }, pressed && { transform: [{ scale: 0.97 }] }]}
    >
      {mythical ? (
        <View style={styles.mythWrap}>
          <MythicalBorder />
          {card}
        </View>
      ) : (
        card
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: 14, flexDirection: 'row', overflow: 'hidden' },
  mythWrap: { flex: 1, borderRadius: radius.lg + 2, padding: 2, overflow: 'hidden' },
  borderClip: { borderRadius: radius.lg + 2, overflow: 'hidden' },
  watermark: { position: 'absolute', right: -10, bottom: -14 },
  text: { flex: 1, gap: 2 },
  kind: { fontSize: 10, fontFamily: fontFamily.ui500, letterSpacing: 0.6, textTransform: 'uppercase', opacity: 0.8 },
  name: { fontSize: 16, fontFamily: fontFamily.ui600 },
  number: { fontSize: 13, fontFamily: fontFamily.mono500 },
  rarity: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', maxWidth: '100%', flexShrink: 1, gap: 4, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3, marginTop: 6 },
  rarityText: { fontSize: 10.5, fontFamily: fontFamily.ui500, flexShrink: 1 },
  specimen: { justifyContent: 'center' },
});

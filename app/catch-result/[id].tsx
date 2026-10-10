// Catch result — docs/UI_DESIGN.md → Catch result; docs/PROCESS_FLOW.md → J2 step 4.
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { useNamerStatus } from '../../src/namer/namer';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getCatch } from '../../src/db/catchRepo';
import { getAllEntries } from '../../src/db/entryRepo';
import type { SwatchRow } from '../../src/db/types';
import { ENTRIES } from '../../src/dex/entries.generated';
import { useDbQuery } from '../../src/store/data';
import { RarityChip } from '../../src/ui/Chip';
import { Button } from '../../src/ui/controls';
import { DistributionStrip, NewPill } from '../../src/ui/data';
import { displayName, entryCode } from '../../src/ui/format';
import { Specimen } from '../../src/ui/Specimen';
import { color, fontFamily, radius, shadow, space, type } from '../../src/ui/tokens';

/** Name that pulses while the Namer is working (static under reduce-motion). */
function ShimmerName({ name, waiting }: { name: string; waiting: boolean }) {
  const reduce = useReducedMotion();
  const o = useSharedValue(1);
  useEffect(() => {
    if (!waiting || reduce) {
      cancelAnimation(o);
      o.value = 1;
      return;
    }
    o.value = withRepeat(withSequence(withTiming(0.35, { duration: 600 }), withTiming(1, { duration: 600 })), -1);
  }, [waiting, reduce, o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.Text style={[styles.name, style]} numberOfLines={1}>
      {name}
    </Animated.Text>
  );
}

function SwatchCard({ s, name, index, naming }: { s: SwatchRow; name: string; index: number; naming: boolean }) {
  const entry = ENTRIES[s.entry_no - 1];
  const reduce = useReducedMotion();
  const isNew = s.is_new === 1;
  // New Entries flip from silhouette to colour (rotateY 450 ms, then a soft pop).
  const flip = useSharedValue(isNew && !reduce ? 0 : 1);
  const pop = useSharedValue(1);
  useEffect(() => {
    if (!isNew || reduce) return;
    flip.value = withDelay(250 + index * 180, withTiming(1, { duration: 450 }));
    pop.value = withDelay(250 + index * 180 + 450, withSequence(withTiming(1.04, { duration: 120 }), withTiming(1, { duration: 120 })));
  }, [isNew, reduce, index, flip, pop]);
  const front = useAnimatedStyle(() => ({
    opacity: flip.value >= 0.5 ? 1 : 0,
    transform: [{ perspective: 600 }, { rotateY: `${(1 - flip.value) * 180}deg` }, { scale: pop.value }],
  }));
  const back = useAnimatedStyle(() => ({
    opacity: flip.value < 0.5 ? 1 : 0,
    transform: [{ perspective: 600 }, { rotateY: `${-flip.value * 180}deg` }],
  }));

  return (
    <Pressable
      onPress={() => router.push(`/entry/${s.entry_no}`)}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${entryCode(s.entry_no)}, ${s.pct.toFixed(1)} percent${isNew ? ', new' : ''}`}
      style={styles.card}
    >
      <View style={{ width: 56, height: 56 }}>
        <Animated.View style={[StyleSheet.absoluteFill, back]}>
          <Specimen no={s.entry_no} missing size={56} />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, front]}>
          <Specimen no={s.entry_no} hex={s.hex} size={56} />
        </Animated.View>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <ShimmerName name={name} waiting={naming && isNew} />
        <Text style={styles.code}>
          {entryCode(s.entry_no)} · {s.pct.toFixed(1)}%
        </Text>
        <View style={{ flexDirection: 'row', marginTop: 4 }}>
          <RarityChip rarity={entry.rarity} />
        </View>
      </View>
      {isNew ? <NewPill /> : null}
    </Pressable>
  );
}

export default function CatchResult() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const naming = useNamerStatus((st) => !!st.pending[id]);
  const lastNamer = useNamerStatus((st) => st.last);
  const { data } = useDbQuery(
    async (db) => {
      const c = await getCatch(db, id);
      const entries = await getAllEntries(db);
      return { c, names: new Map(entries.map((e) => [e.no, e.name])) };
    },
    [id],
  );

  if (!data) return <View style={styles.root} />;
  if (!data.c) {
    return (
      <SafeAreaView style={[styles.root, { padding: space[4] }]}>
        <Text style={type.body}>This catch no longer exists.</Text>
        <Button label="Back" onPress={() => router.replace('/')} />
      </SafeAreaView>
    );
  }
  const { catch: c, swatches } = data.c;
  const newCount = swatches.filter((s) => s.is_new === 1).length;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.photoWrap}>
          <Image source={{ uri: c.thumb_path }} style={styles.photo} contentFit="cover" accessibilityLabel="Your photo" />
          <DistributionStrip strip={swatches.map((s) => ({ hex: s.hex, pct: s.pct }))} otherPct={c.other_pct} height={8} />
        </View>
        <Text style={styles.headline} accessibilityRole="header">
          {swatches.length} {swatches.length === 1 ? 'colour' : 'colours'} caught
          {newCount > 0 ? <Text style={styles.accent}> · {newCount} new!</Text> : null}
        </Text>
        {swatches.map((s, i) => (
          <SwatchCard key={s.entry_no} s={s} index={i} naming={naming} name={displayName(s.entry_no, data.names.get(s.entry_no))} />
        ))}
        {__DEV__ ? (
          <Text style={styles.dev}>
            {naming ? 'namer: working…' : `namer: ${lastNamer ? JSON.stringify(lastNamer) : '—'}`}
            {'\n'}capture: {c.live_checks}
          </Text>
        ) : null}
      </ScrollView>
      <View style={styles.actions}>
        <View style={{ flex: 1 }}>
          <Button label="View photo" variant="secondary" onPress={() => router.replace(`/photo/${c.id}`)} />
        </View>
        <View style={{ flex: 1 }}>
          <Button label="Catch again" onPress={() => router.replace('/catch')} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  content: { padding: space[4], gap: space[3], paddingBottom: space[6] },
  photoWrap: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: color.surface, ...shadow.card },
  photo: { width: '100%', aspectRatio: 4 / 3 },
  headline: { ...type.display, fontSize: 28, color: color.ink, marginTop: space[2] },
  accent: { color: color.success },
  card: { flexDirection: 'row', alignItems: 'center', gap: space[3], backgroundColor: color.surface, borderRadius: radius.md, padding: space[3], ...shadow.card },
  name: { fontSize: 17, fontFamily: fontFamily.ui600, color: color.ink },
  code: { fontSize: 13, fontFamily: fontFamily.mono500, color: color.inkSoft },
  dev: { fontFamily: fontFamily.mono500, fontSize: 10, color: color.inkSoft },
  actions: { flexDirection: 'row', gap: space[3], padding: space[4], paddingTop: space[2] },
});

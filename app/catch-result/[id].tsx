// Catch result — docs/UI_DESIGN.md → Catch result; docs/PROCESS_FLOW.md → J2 step 4.
// Team rule 2026-10-10: the user picks 2 favourite colours from the palette; only those register in the
// FarbeDex. Rare+ picks get a special reveal; each Rare+ pick has a 1/400 chance to be Shiny.
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { getCatch, parseMinority } from '../../src/db/catchRepo';
import { getAllEntries } from '../../src/db/entryRepo';
import type { SwatchRow } from '../../src/db/types';
import { ENTRIES } from '../../src/dex/entries.generated';
import { FAVOURITES_PER_CATCH, defaultFavourites, isSpecialRarity } from '../../src/dex/shiny';
import { useNamerStatus } from '../../src/namer/namer';
import { useDbQuery } from '../../src/store/data';
import { confirmFavourites, registerDefaultsIfPending } from '../../src/store/favourites';
import { RarityChip } from '../../src/ui/Chip';
import { Button } from '../../src/ui/controls';
import { DistributionStrip, MinorityColours, NewPill } from '../../src/ui/data';
import { displayName, entryCode } from '../../src/ui/format';
import { playSound } from '../../src/ui/sounds';
import { Specimen, sparklePath } from '../../src/ui/Specimen';
import { color, fontFamily, radius, rarityColor, shadow, space, type } from '../../src/ui/tokens';

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

/** Rotating light rays behind a Rare+ specimen (special reveal). */
function Burst({ tint, size }: { tint: string; size: number }) {
  const reduce = useReducedMotion();
  const rot = useSharedValue(0);
  const s = useSharedValue(reduce ? 1 : 0.4);
  useEffect(() => {
    if (reduce) return;
    s.value = withSequence(withTiming(1.15, { duration: 380, easing: Easing.out(Easing.back(2)) }), withTiming(1, { duration: 200 }));
    rot.value = withRepeat(withTiming(360, { duration: 6000, easing: Easing.linear }), -1);
    return () => cancelAnimation(rot);
  }, [reduce, rot, s]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }, { scale: s.value }] }));
  const rays = Array.from({ length: 12 }, (_, i) => {
    const a0 = ((i * 30 - 6) * Math.PI) / 180;
    const a1 = ((i * 30 + 6) * Math.PI) / 180;
    return `M50 50 L${50 + 50 * Math.cos(a0)} ${50 + 50 * Math.sin(a0)} L${50 + 50 * Math.cos(a1)} ${50 + 50 * Math.sin(a1)} Z`;
  });
  return (
    <Animated.View style={[{ position: 'absolute', width: size, height: size }, style]} pointerEvents="none">
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {rays.map((d, i) => (
          <Path key={i} d={d} fill={tint} opacity={0.28} />
        ))}
      </Svg>
    </Animated.View>
  );
}

/** Twinkling sparkles around a Shiny specimen. */
function Twinkles({ size }: { size: number }) {
  const reduce = useReducedMotion();
  const o = useSharedValue(1);
  useEffect(() => {
    if (reduce) return;
    o.value = withRepeat(withSequence(withTiming(0.25, { duration: 420 }), withTiming(1, { duration: 420 })), -1);
    return () => cancelAnimation(o);
  }, [reduce, o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  const stars: [number, number, number][] = [
    [8, 10, 7],
    [92, 18, 9],
    [14, 88, 6],
    [88, 86, 7],
    [50, 4, 5],
  ];
  return (
    <Animated.View style={[{ position: 'absolute', width: size, height: size }, style]} pointerEvents="none">
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {stars.map(([x, y, r], i) => (
          <Path key={i} d={sparklePath(x, y, r)} fill="#FFF3B0" stroke="#E0A800" strokeWidth={0.8} />
        ))}
      </Svg>
    </Animated.View>
  );
}

function PickCard({
  s,
  name,
  inFarbeDex,
  selected,
  onToggle,
}: {
  s: SwatchRow;
  name: string;
  inFarbeDex: boolean;
  selected: boolean;
  onToggle: () => void;
}) {
  const entry = ENTRIES[s.entry_no - 1];
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${inFarbeDex ? name : 'Unknown colour'}, ${entryCode(s.entry_no)}, ${s.pct.toFixed(1)} percent, ${entry.rarity.toLowerCase()}${
        inFarbeDex ? '' : ', not in your FarbeDex yet'
      }`}
      style={({ pressed }) => [styles.card, selected && styles.cardSelected, pressed && { transform: [{ scale: 0.98 }] }]}
    >
      <Specimen no={s.entry_no} hex={s.hex} size={56} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.name} numberOfLines={1}>
          {inFarbeDex ? name : 'Not in your FarbeDex yet'}
        </Text>
        <Text style={styles.code}>
          {entryCode(s.entry_no)} · {s.hex} · {s.pct.toFixed(1)}%
        </Text>
        <View style={{ flexDirection: 'row', marginTop: 4 }}>
          <RarityChip rarity={entry.rarity} />
        </View>
      </View>
      <View style={[styles.check, selected && { backgroundColor: color.ink, borderColor: color.ink }]}>
        {selected ? <Text style={styles.checkMark}>✓</Text> : null}
      </View>
    </Pressable>
  );
}

function RevealCard({ s, name, index, naming }: { s: SwatchRow; name: string; index: number; naming: boolean }) {
  const entry = ENTRIES[s.entry_no - 1];
  const reduce = useReducedMotion();
  const isNew = s.is_new === 1;
  const shiny = s.shiny === 1;
  const special = isSpecialRarity(entry.rarity);
  const flip = useSharedValue(isNew && !reduce ? 0 : 1);
  const pop = useSharedValue(1);
  useEffect(() => {
    if (reduce) return;
    if (isNew) flip.value = withDelay(250 + index * 220, withTiming(1, { duration: 450 }));
    if (isNew || special || shiny)
      pop.value = withDelay(250 + index * 220 + 450, withSequence(withTiming(special ? 1.12 : 1.04, { duration: 140 }), withTiming(1, { duration: 160 })));
  }, [isNew, special, shiny, reduce, index, flip, pop]);
  const front = useAnimatedStyle(() => ({
    opacity: flip.value >= 0.5 ? 1 : 0,
    transform: [{ perspective: 600 }, { rotateY: `${(1 - flip.value) * 180}deg` }, { scale: pop.value }],
  }));
  const back = useAnimatedStyle(() => ({
    opacity: flip.value < 0.5 ? 1 : 0,
    transform: [{ perspective: 600 }, { rotateY: `${-flip.value * 180}deg` }],
  }));
  const big = special || shiny ? 84 : 56;

  return (
    <Pressable
      onPress={() => router.push(`/entry/${s.entry_no}`)}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${entryCode(s.entry_no)}${isNew ? ', new' : ''}${shiny ? ', shiny' : ''}`}
      style={[styles.card, special && { borderWidth: 2, borderColor: rarityColor[entry.rarity] }, shiny && styles.shinyCard]}
    >
      {shiny ? (
        <View style={styles.shinyBanner}>
          <Text style={styles.shinyText}>✦ SHINY ✦</Text>
        </View>
      ) : null}
      <View style={{ width: big, height: big, alignItems: 'center', justifyContent: 'center' }}>
        {special || shiny ? <Burst tint={shiny ? '#E0A800' : rarityColor[entry.rarity]} size={big + 24} /> : null}
        <Animated.View style={[StyleSheet.absoluteFill, styles.center, back]}>
          <Specimen no={s.entry_no} missing size={big} />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, styles.center, front]}>
          <Specimen no={s.entry_no} hex={s.hex} size={big} shiny={shiny} />
        </Animated.View>
        {shiny ? <Twinkles size={big + 20} /> : null}
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
  const [picked, setPicked] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [justRegistered, setJustRegistered] = useState(false);
  const confirmed = useRef(false);
  const { data } = useDbQuery(
    async (db) => {
      const c = await getCatch(db, id);
      const entries = await getAllEntries(db);
      return {
        c,
        names: new Map(entries.map((e) => [e.no, e.name])),
        caught: new Set(entries.filter((e) => e.times_caught > 0).map((e) => e.no)),
      };
    },
    [id],
  );

  const registered = data?.c?.catch.registered === 1;
  const swatches = data?.c?.swatches ?? [];
  const need = Math.min(FAVOURITES_PER_CATCH, swatches.length);

  // Leaving without choosing → register the top colours so the catch is never lost.
  useEffect(() => {
    return () => {
      if (!confirmed.current) registerDefaultsIfPending(id).catch(() => {});
    };
  }, [id]);
  useEffect(() => {
    if (registered) confirmed.current = true;
  }, [registered]);

  // Reveal sound once, right after the user confirmed their favourites.
  const picks = swatches.filter((s) => s.registered === 1);
  const anyShiny = picks.some((s) => s.shiny === 1);
  const anySpecial = picks.some((s) => isSpecialRarity(ENTRIES[s.entry_no - 1].rarity));
  const anyNew = picks.some((s) => s.is_new === 1);
  useEffect(() => {
    if (!justRegistered || !registered) return;
    const t = setTimeout(() => {
      if (anyShiny || anySpecial) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      playSound(anyShiny ? 'shiny' : anySpecial ? 'rare' : anyNew ? 'new' : 'levelup');
    }, 700);
    return () => clearTimeout(t);
  }, [justRegistered, registered, anyShiny, anySpecial, anyNew]);

  if (!data) return <View style={styles.root} />;
  if (!data.c) {
    return (
      <SafeAreaView style={[styles.root, { padding: space[4] }]}>
        <Text style={type.body}>This catch no longer exists.</Text>
        <Button label="Back" onPress={() => router.replace('/')} />
      </SafeAreaView>
    );
  }
  const c = data.c.catch;

  const toggle = (no: number) => {
    Haptics.selectionAsync().catch(() => {});
    setPicked((p) => (p.includes(no) ? p.filter((x) => x !== no) : [...p, no].slice(-need)));
  };
  const confirm = async () => {
    if (saving || picked.length !== need) return;
    setSaving(true);
    confirmed.current = true;
    try {
      await confirmFavourites(id, picked);
      setJustRegistered(true);
    } catch {
      confirmed.current = false;
    } finally {
      setSaving(false);
    }
  };

  const header = (
    <View style={styles.photoWrap}>
      <Image source={{ uri: c.thumb_path }} style={styles.photo} contentFit="cover" accessibilityLabel="Your photo" />
      <DistributionStrip strip={swatches.map((s) => ({ hex: s.hex, pct: s.pct }))} otherPct={c.other_pct} height={8} />
    </View>
  );

  if (!registered) {
    return (
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          {header}
          <Text style={styles.headline} accessibilityRole="header">
            {swatches.length} {swatches.length === 1 ? 'colour' : 'colours'} found
          </Text>
          <Text style={styles.sub}>
            Pick your {need === 1 ? 'favourite' : `${need} favourites`} to add {need === 1 ? 'it' : 'them'} to your FarbeDex. Rare, Legendary and
            Mythical picks might turn out shiny ✦
          </Text>
          {swatches.map((s) => (
            <PickCard
              key={s.entry_no}
              s={s}
              name={displayName(s.entry_no, data.names.get(s.entry_no))}
              inFarbeDex={data.caught.has(s.entry_no)}
              selected={picked.includes(s.entry_no)}
              onToggle={() => toggle(s.entry_no)}
            />
          ))}
          <MinorityColours minority={parseMinority(c.minority)} otherPct={c.other_pct} />
        </ScrollView>
        <View style={styles.actions}>
          <View style={{ flex: 1 }}>
            <Button label="Top colours" variant="secondary" onPress={() => setPicked(defaultFavourites(swatches, need))} />
          </View>
          <View style={{ flex: 1.4 }}>
            <Button
              label={picked.length === need ? `Add ${need} to FarbeDex` : `Pick ${need - picked.length} more`}
              disabled={picked.length !== need || saving}
              onPress={confirm}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const others = swatches.filter((s) => s.registered !== 1);
  const newCount = picks.filter((s) => s.is_new === 1).length;
  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {header}
        <Text style={styles.headline} accessibilityRole="header">
          {anyShiny ? 'Shiny catch!' : `${picks.length} ${picks.length === 1 ? 'colour' : 'colours'} added`}
          {newCount > 0 ? <Text style={styles.accent}> · {newCount} new!</Text> : null}
        </Text>
        {picks.map((s, i) => (
          <RevealCard key={s.entry_no} s={s} index={i} naming={naming} name={displayName(s.entry_no, data.names.get(s.entry_no))} />
        ))}
        {others.length > 0 ? (
          <View style={styles.others}>
            <Text style={styles.othersTitle}>Also in this palette</Text>
            <View style={styles.othersRow}>
              {others.map((s) => (
                <View key={s.entry_no} style={styles.otherChip} accessible accessibilityLabel={`${entryCode(s.entry_no)}, ${s.pct.toFixed(1)} percent, palette only`}>
                  <View style={[styles.otherDot, { backgroundColor: s.hex }]} />
                  <Text style={styles.otherText}>{entryCode(s.entry_no)}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
        <MinorityColours minority={parseMinority(c.minority)} otherPct={c.other_pct} />
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
  center: { alignItems: 'center', justifyContent: 'center' },
  photoWrap: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: color.surface, ...shadow.card },
  photo: { width: '100%', aspectRatio: 4 / 3 },
  headline: { ...type.display, fontSize: 28, color: color.ink, marginTop: space[2] },
  sub: { ...type.body, color: color.inkSoft },
  accent: { color: color.success },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    backgroundColor: color.surface,
    borderRadius: radius.md,
    padding: space[3],
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadow.card,
  },
  cardSelected: { borderColor: color.ink },
  shinyCard: { borderColor: '#E0A800', backgroundColor: '#FFFBEA' },
  shinyBanner: { position: 'absolute', top: -10, right: 12, backgroundColor: '#E0A800', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 2 },
  shinyText: { color: '#FFFFFF', fontFamily: fontFamily.ui600, fontSize: 11, letterSpacing: 1 },
  check: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: color.line, alignItems: 'center', justifyContent: 'center' },
  checkMark: { color: '#FFFFFF', fontFamily: fontFamily.ui600, fontSize: 15 },
  name: { fontSize: 17, fontFamily: fontFamily.ui600, color: color.ink },
  code: { fontSize: 12, fontFamily: fontFamily.mono500, color: color.inkSoft },
  others: { gap: space[2] },
  othersTitle: { fontSize: 15, fontFamily: fontFamily.ui500, color: color.inkSoft },
  othersRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  otherChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: color.surfaceSunken, borderRadius: radius.pill, paddingHorizontal: 10, minHeight: 36 },
  otherDot: { width: 16, height: 16, borderRadius: 8 },
  otherText: { fontSize: 12, fontFamily: fontFamily.mono500, color: color.ink },
  dev: { fontFamily: fontFamily.mono500, fontSize: 10, color: color.inkSoft },
  actions: { flexDirection: 'row', gap: space[3], padding: space[4], paddingTop: space[2] },
});

// Home — docs/UI_DESIGN.md → Home; docs/PRD.md F13.
import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { listCatches } from '../../src/db/catchRepo';
import { getAllEntries } from '../../src/db/entryRepo';
import { ENTRIES } from '../../src/dex/entries.generated';
import { NO_FILTER, filterEntries, type EntryState } from '../../src/dex/filter';
import { FAMILY_HINTS } from '../../src/dex/hints';
import { todaysHunt } from '../../src/dex/todaysHunt';
import { useDbQuery } from '../../src/store/data';
import { FarbeMark } from '../../src/ui/brand';
import { FamilyChip, RarityChip } from '../../src/ui/Chip';
import { Button } from '../../src/ui/controls';
import { DistributionStrip } from '../../src/ui/data';
import { displayName } from '../../src/ui/format';
import { Specimen } from '../../src/ui/Specimen';
import { color, fontFamily, radius, shadow, space, type } from '../../src/ui/tokens';

const TILE_TINTS = ['#E4EEDB', '#E3ECF7', '#F6E9DC', '#EEE4F5'];

function Tile({ label, value, tint, onPress }: { label: string; value?: string; tint: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
      style={({ pressed }) => [styles.tile, { backgroundColor: tint }, pressed && { transform: [{ scale: 0.97 }] }]}
    >
      <View style={styles.tileMark} pointerEvents="none">
        <FarbeMark size={72} mono="#FFFFFF" opacity={0.6} />
      </View>
      <Text style={styles.tileLabel}>{label}</Text>
      {value ? <Text style={styles.tileValue}>{value}</Text> : null}
    </Pressable>
  );
}

export default function Home() {
  const { data } = useDbQuery(async (db) => ({ entries: await getAllEntries(db), catches: await listCatches(db, 1000) }), []);
  const [query, setQuery] = useState('');

  const states = useMemo(() => {
    const m = new Map<number, EntryState & { bestHex: string | null }>();
    for (const r of data?.entries ?? []) m.set(r.no, { timesCaught: r.times_caught, name: r.name, bestHex: r.best_hex });
    return m;
  }, [data]);
  const caught = (data?.entries ?? []).filter((e) => e.times_caught > 0).length;
  const missing = useMemo(() => ENTRIES.filter((e) => (states.get(e.no)?.timesCaught ?? 0) === 0).map((e) => e.no), [states]);
  const huntNo = data ? todaysHunt(missing, new Date()) : null;
  const hunt = huntNo ? ENTRIES[huntNo - 1] : null;
  const results = query.trim() ? filterEntries(ENTRIES, states, { ...NO_FILTER, query }).slice(0, 8) : [];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading} accessibilityRole="header">
          What colour are you{'\n'}hunting today?
        </Text>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search name or number"
          placeholderTextColor={color.inkSoft}
          style={styles.search}
          accessibilityLabel="Search entries"
        />
        {results.length > 0 ? (
          <View style={styles.results}>
            {results.map((e) => {
              const s = states.get(e.no);
              const isCaught = (s?.timesCaught ?? 0) > 0;
              return (
                <Pressable key={e.no} onPress={() => router.push(`/entry/${e.no}`)} style={styles.result} accessibilityRole="button">
                  <Specimen no={e.no} hex={isCaught ? s?.bestHex ?? e.canonical.hex : undefined} missing={!isCaught} size={36} />
                  <Text style={styles.resultName}>{isCaught ? displayName(e.no, s?.name) : '???'}</Text>
                  <Text style={styles.resultNo}>{e.code}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <View style={styles.tiles}>
          <Tile label="FarbeDex" value={`${caught} / 151`} tint={TILE_TINTS[0]} onPress={() => router.push('/dex')} />
          <Tile label="Album" value={`${data?.catches.length ?? 0} catches`} tint={TILE_TINTS[1]} onPress={() => router.push('/album')} />
          <Tile label="Field Notes" tint={TILE_TINTS[2]} onPress={() => router.push('/field-notes')} />
          <Tile label="Rarity Guide" tint={TILE_TINTS[3]} onPress={() => router.push('/rarity')} />
        </View>

        <View style={styles.progressTrack} accessibilityLabel={`${caught} of 151 entries caught`}>
          <View style={[styles.progressFill, { width: `${(caught / 151) * 100}%` }]} />
        </View>

        {hunt ? (
          <View style={styles.hunt}>
            <Text style={type.label}>Today&apos;s hunt</Text>
            <View style={styles.huntRow}>
              <Specimen no={hunt.no} missing size={56} />
              <View style={{ flex: 1, gap: space[2] }}>
                <Text style={styles.huntTitle}>
                  {hunt.code} · {hunt.templateName}
                </Text>
                <View style={styles.chips}>
                  <FamilyChip family={hunt.family} />
                  <RarityChip rarity={hunt.rarity} />
                </View>
              </View>
            </View>
            <Text style={styles.hint}>Look for: {FAMILY_HINTS[hunt.family]}</Text>
            <Button label="Catch it" onPress={() => router.push('/catch')} />
          </View>
        ) : data ? (
          <View style={styles.hunt}>
            <Text style={styles.huntTitle}>All 151 caught. Wonderful.</Text>
          </View>
        ) : null}

        {data && data.catches.length > 0 ? (
          <>
            <Text style={type.label}>Recent catches</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space[2] }}>
              {data.catches.slice(0, 5).map((c) => (
                <Pressable key={c.id} onPress={() => router.push(`/photo/${c.id}`)} accessibilityRole="button" accessibilityLabel="Open catch">
                  <Image source={{ uri: c.thumb_path }} style={styles.recent} contentFit="cover" />
                  <View style={{ marginTop: 4, width: 96 }}>
                    <DistributionStrip strip={c.strip} otherPct={c.other_pct} />
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </>
        ) : null}

        {__DEV__ ? (
          <View style={{ gap: 4 }}>
            <Link href="/dev/ai-spike" style={styles.link}>
              Open AI spike (dev)
            </Link>
            <Link href="/dev/ui" style={styles.link}>
              Open UI kit (dev)
            </Link>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  content: { padding: space[4], gap: space[4], paddingBottom: 120 },
  heading: { ...type.display, color: color.ink },
  search: {
    backgroundColor: color.surfaceSunken,
    borderRadius: radius.pill,
    paddingHorizontal: space[4],
    minHeight: 48,
    fontFamily: fontFamily.ui400,
    fontSize: 15,
    color: color.ink,
  },
  results: { backgroundColor: color.surface, borderRadius: radius.md, padding: space[2], ...shadow.card },
  result: { flexDirection: 'row', alignItems: 'center', gap: space[3], minHeight: 48, paddingHorizontal: space[2] },
  resultName: { flex: 1, fontSize: 15, fontFamily: fontFamily.ui500, color: color.ink },
  resultNo: { fontSize: 13, fontFamily: fontFamily.mono500, color: color.inkSoft },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: space[3] },
  tile: { width: '47.5%', height: 96, borderRadius: radius.lg, padding: space[4], justifyContent: 'flex-end', overflow: 'hidden' },
  tileMark: { position: 'absolute', right: -14, top: -10 },
  tileLabel: { fontSize: 16, fontFamily: fontFamily.ui600, color: color.ink },
  tileValue: { fontSize: 13, fontFamily: fontFamily.mono500, color: color.inkSoft },
  progressTrack: { height: 4, borderRadius: 2, backgroundColor: color.line, overflow: 'hidden' },
  progressFill: { height: 4, backgroundColor: color.ink },
  hunt: { backgroundColor: color.surface, borderRadius: radius.lg, padding: space[4], gap: space[3], ...shadow.card },
  huntRow: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  huntTitle: { fontSize: 17, fontFamily: fontFamily.ui600, color: color.ink },
  chips: { flexDirection: 'row', gap: space[2], flexWrap: 'wrap' },
  hint: { ...type.body, color: color.inkSoft },
  recent: { width: 96, height: 96, borderRadius: radius.md, backgroundColor: color.surfaceSunken },
  link: { ...type.body, color: color.ink, textDecorationLine: 'underline', paddingVertical: 8 },
});
